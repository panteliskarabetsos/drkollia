// src/app/lib/offlinePatients.js
"use client";

import { db } from "./db";
import { supabase } from "./supabaseClient";

/* ---------------- Utils ---------------- */

export const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || "")
  );

const isLocalId = (id) => String(id || "").startsWith("local-");
const isOnline = () =>
  typeof navigator === "undefined" ? true : Boolean(navigator.onLine);

const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const norm = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Prefer AMKA; else (last+first)+birth_date(+phone)
function fingerprint(p) {
  const amka = onlyDigits(p.amka);
  if (amka) return `amka:${amka}`;
  const name = `${norm(p.last_name)}|${norm(p.first_name)}`;
  const dob = p.birth_date
    ? new Date(p.birth_date).toISOString().slice(0, 10)
    : "";
  const phone = onlyDigits(p.phone);
  return `nf:${name}|${dob}|${phone}`;
}

function pickPreferred(a, b) {
  // Prefer server row over local; else newer updated_at
  const aIsServer = !isLocalId(a.id);
  const bIsServer = !isLocalId(b.id);
  if (aIsServer !== bIsServer) return aIsServer ? a : b;
  const at = new Date(a.updated_at || a.created_at || 0).getTime();
  const bt = new Date(b.updated_at || b.created_at || 0).getTime();
  return bt > at ? b : a;
}

function dedupeRows(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = fingerprint(r);
    const prev = map.get(key);
    map.set(key, prev ? pickPreferred(prev, r) : r);
  }
  return Array.from(map.values());
}

async function ensureDbOpen() {
  if (!db.isOpen()) {
    try {
      await db.open();
    } catch {
      // ignore – db will just behave as empty
    }
  }
}

const normalize = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const calcAge = (birth_date) => {
  if (!birth_date) return null;
  const b = new Date(birth_date);
  if (Number.isNaN(b.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
};

const ymd = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
const yearsAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(d.getFullYear() - n);
  return d;
};

/* ---------------- Create / Update / Delete ---------------- */

/** Create patient (works online/offline). Returns created row (server or local-*) */
export async function createPatient(payload) {
  await ensureDbOpen();
  const now = new Date().toISOString();
  const cleaned = {
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
  };

  if (isOnline()) {
    const { data, error } = await supabase
      .from("patients")
      .insert([cleaned])
      .select("*")
      .single();
    if (error) throw error;

    await db.patients.put(data); // mirror/cache
    return data;
  }

  // OFFLINE → avoid duplicates by merging into an existing match
  const existing = (await db.patients.toArray()).find(
    (r) => fingerprint(r) === fingerprint(cleaned)
  );

  if (existing) {
    const now = new Date().toISOString();
    await db.transaction("rw", [db.patients, db.patientOps], async () => {
      const merged = {
        ...existing,
        ...cleaned,
        updated_at: now,
        _local: { pending: true, op: "update" },
      };
      await db.patients.put(merged);
      await db.patientOps.add({
        type: "update",
        status: "pending",
        ts: now,
        entityId: existing.id, // local-* or server UUID
        payload: cleaned,
      });
    });
    return await db.patients.get(existing.id);
  }

  // No match → create new local temp row + outbox
  const localId = `local-${crypto.randomUUID()}`;
  const localRow = {
    ...cleaned,
    id: localId,
    _local: { pending: true, op: "create" },
  };

  await db.transaction("rw", [db.patients, db.patientOps], async () => {
    await db.patients.put(localRow);
    await db.patientOps.add({
      type: "create",
      status: "pending",
      ts: cleaned.updated_at,
      entityId: localId,
      payload: cleaned,
    });
  });

  return localRow;
}

/** Update patient (works online/offline). Returns merged local row */
export async function updatePatient(id, patch) {
  await ensureDbOpen();
  const now = new Date().toISOString();

  if (isOnline() && isUUID(id)) {
    const { error } = await supabase
      .from("patients")
      .update({ ...patch, updated_at: now })
      .eq("id", id);
    if (error) throw error;

    const cur = await db.patients.get(id);
    await db.patients.put({ ...(cur || {}), ...patch, updated_at: now });
    return await db.patients.get(id);
  }

  // offline or local id → queue update
  await db.transaction("rw", [db.patients, db.patientOps], async () => {
    const cur = await db.patients.get(id);
    await db.patients.put({
      ...(cur || {}),
      ...patch,
      updated_at: now,
      _local: { pending: true, op: "update" },
    });
    await db.patientOps.add({
      type: "update",
      status: "pending",
      ts: now,
      entityId: id,
      payload: patch,
    });
  });

  return await db.patients.get(id);
}

/** Delete patient — ONLINE ONLY by design (your requirement). */
export async function deletePatient(id) {
  await ensureDbOpen();

  if (!isOnline()) {
    const err = new Error("Απαιτείται σύνδεση για διαγραφή ασθενούς.");
    err.code = "OFFLINE_DELETE_BLOCKED";
    throw err;
  }

  if (isLocalId(id)) {
    // never existed on server
    await db.patients.delete(id);
    return;
  }

  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;

  // keep cache consistent so it won’t reappear offline
  await db.patients.delete(id);
}

/* ---------------- Sync (push outbox + pull fresh) ---------------- */

/**
 * Pushes pending patient ops to Supabase, remaps local-* IDs to server IDs,
 * then pulls a fresh copy of all server patients into Dexie and prunes stale.
 */
export async function syncPatients() {
  await ensureDbOpen();
  if (!isOnline()) return;

  // Push & reconcile
  const ops = await db.patientOps.where("status").equals("pending").toArray();
  for (const op of ops) {
    try {
      if (op.type === "create") {
        const { data, error } = await supabase
          .from("patients")
          .insert([op.payload])
          .select("*")
          .single();
        if (error) throw error;

        const serverRow = data;

        await db.transaction("rw", [db.patients, db.appointments], async () => {
          // remap any local appointments pointing to the temp id
          await db.appointments
            .where("patient_id")
            .equals(op.entityId)
            .modify({ patient_id: serverRow.id });

          // replace temp patient with server row
          await db.patients.delete(op.entityId);
          await db.patients.put(serverRow);
        });
      } else if (op.type === "update") {
        const id = op.entityId;
        if (isUUID(id)) {
          const { error } = await supabase
            .from("patients")
            .update({ ...op.payload, updated_at: new Date().toISOString() })
            .eq("id", id);
          if (error) throw error;
        }
        const cur = await db.patients.get(id);
        await db.patients.put({ ...(cur || {}), ...op.payload });
      } else if (op.type === "delete") {
        const id = op.entityId;
        if (isUUID(id)) {
          const { error } = await supabase
            .from("patients")
            .delete()
            .eq("id", id);
          if (error) throw error;
        }
        await db.patients.delete(id);
      }

      await db.patientOps.update(op.id, { status: "done" });
    } catch (e) {
      console.error("syncPatients op failed:", e);
      // keep pending; retry later
    }
  }

  // Pull a fresh copy to keep Dexie aligned with the server
  await refreshPatientsCacheFromServer();
}

/**
 * Refresh local Dexie cache from server:
 * - downloads all patients paginated,
 * - prunes any cached server-backed rows not present on server,
 * - upserts the latest data,
 * - leaves `local-*` rows untouched.
 */
export async function refreshPatientsCacheFromServer() {
  await ensureDbOpen();
  if (!isOnline()) return;

  const PAGE = 1000;
  let from = 0;
  let all = [];

  // paginate until no more rows
  while (true) {
    const { data, error } = await supabase
      .from("patients")
      .select(
        [
          "id",
          "first_name",
          "last_name",
          "phone",
          "email",
          "amka",
          "birth_date",
          "gender",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const serverIds = new Set(all.map((r) => r.id));

  await db.transaction("rw", db.patients, async () => {
    // remove stale server-backed rows
    const existing = await db.patients.toArray();
    for (const row of existing) {
      if (!isLocalId(row.id) && !serverIds.has(row.id)) {
        await db.patients.delete(row.id);
      }
    }
    // upsert latest server rows
    for (const row of all) {
      await db.patients.put(row);
    }
  });
}

/* ---------------- High-level page helper ---------------- */

/**
 * Unified fetch for a Patients page.
 * Returns { rows, total } merged from server (when online) + local unsynced.
 * Falls back to Dexie-only when offline/error.
 */
export async function getPatientsPage({
  page = 0,
  pageSize = 12,
  text = "",
  gender = "all",
  minAge = null, // number or null
  maxAge = null, // number or null
}) {
  await ensureDbOpen();

  // --------- helpers (scoped) ---------
  const isLocalId = (id) => String(id || "").startsWith("local-");
  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
  const fp = (p) => {
    const amka = onlyDigits(p.amka);
    if (amka) return `amka:${amka}`;
    const name = `${normalize(p.last_name)}|${normalize(p.first_name)}`;
    const dob = p.birth_date
      ? new Date(p.birth_date).toISOString().slice(0, 10)
      : "";
    const phone = onlyDigits(p.phone);
    return `nf:${name}|${dob}|${phone}`;
  };
  const prefer = (a, b) => {
    // prefer server-backed, else newer updated_at
    const aSrv = !isLocalId(a.id);
    const bSrv = !isLocalId(b.id);
    if (aSrv !== bSrv) return aSrv ? a : b;
    const at = new Date(a.updated_at || a.created_at || 0).getTime();
    const bt = new Date(b.updated_at || b.created_at || 0).getTime();
    return bt > at ? b : a;
  };
  const dedupe = (rows) => {
    const map = new Map();
    for (const r of rows) {
      const key = fp(r);
      const prev = map.get(key);
      map.set(key, prev ? prefer(prev, r) : r);
    }
    return Array.from(map.values());
  };

  // --------- common filters & sort ---------
  const textNorm = normalize(text.trim());
  const localFilter = (p) => {
    const matchesText =
      !textNorm ||
      normalize(p.first_name).includes(textNorm) ||
      normalize(p.last_name).includes(textNorm) ||
      normalize(p.phone).includes(textNorm) ||
      normalize(p.email).includes(textNorm) ||
      normalize(p.amka).includes(textNorm);

    const genderOk = gender === "all" || p.gender === gender;

    const age = calcAge(p.birth_date);
    const minOk = minAge === null || (age !== null && age >= Number(minAge));
    const maxOk = maxAge === null || (age !== null && age <= Number(maxAge));

    return matchesText && genderOk && minOk && maxOk;
  };

  const sortByName = (a, b) => {
    const ln = normalize(a.last_name).localeCompare(normalize(b.last_name));
    return ln !== 0
      ? ln
      : normalize(a.first_name).localeCompare(normalize(b.first_name));
  };

  // Dexie-only path (also used as fallback)
  const fromDexie = async () => {
    const all = await db.patients.toArray(); // cached server + local-*
    const deduped = dedupe(all); // <-- avoid duplicates offline
    const filtered = deduped.filter(localFilter).sort(sortByName);
    const total = filtered.length;
    const start = page * pageSize;
    const end = start + pageSize;
    return { rows: filtered.slice(start, end), total };
  };

  // --------- ONLINE: server + local unsynced merge ---------
  if (isOnline()) {
    try {
      let q = supabase
        .from("patients")
        .select(
          [
            "id",
            "first_name",
            "last_name",
            "phone",
            "email",
            "amka",
            "birth_date",
            "gender",
            "created_at",
            "updated_at",
          ].join(", "),
          { count: "exact" }
        )
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (textNorm) {
        q = q.or(
          `first_name.ilike.%${text}%,last_name.ilike.%${text}%,phone.ilike.%${text}%,email.ilike.%${text}%,amka.ilike.%${text}%`
        );
      }
      if (gender !== "all") q = q.eq("gender", gender);
      if (minAge !== null)
        q = q.lte("birth_date", ymd(yearsAgo(Number(minAge))));
      if (maxAge !== null)
        q = q.gte("birth_date", ymd(yearsAgo(Number(maxAge))));

      q = q.range(page * pageSize, page * pageSize + pageSize - 1);

      const { data: serverRows, count, error } = await q;
      if (error) throw error;

      // cache this page for offline
      if (serverRows?.length) {
        await db.transaction("rw", db.patients, async () => {
          for (const row of serverRows) await db.patients.put(row);
        });
      }

      // local unsynced that match current filters
      let localRows = await db.patients
        .where("id")
        .startsWith("local-")
        .toArray();
      localRows = localRows.filter(localFilter);

      // merge + dedupe, then keep your existing “append locals” behavior
      const merged = dedupe([...(serverRows ?? []), ...localRows]).sort(
        sortByName
      );

      // total = all server matches (count) + local unsynced that match filters
      // (local-* don't exist on server, so safe to add)
      const total = (count ?? 0) + localRows.length;

      return { rows: merged, total };
    } catch (e) {
      console.warn("getPatientsPage: falling back to Dexie:", e);
      return await fromDexie();
    }
  }

  // --------- OFFLINE ---------
  return await fromDexie();
}
