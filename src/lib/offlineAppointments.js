// lib/offlineAppointments.js
import { db, isoDateOnly } from "./db";
import { supabase } from "./supabaseClient";

// Map server row -> local model (adds appointment_date)
function mapAppt(row) {
  const t = row?.appointment_time ? new Date(row.appointment_time) : null;
  return {
    ...row,
    appointment_date: t ? isoDateOnly(t) : null,
  };
}

/* ---------------- Read ---------------- */

// Load a date range; works offline and online
export async function fetchAppointmentsRange({ from, to, patientId, status }) {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  // Build filters
  const fromISO = from ? isoDateOnly(from) : null;
  const toISO = to ? isoDateOnly(to) : null;

  if (isOnline) {
    // 1) Online -> fetch from Supabase, mirror to Dexie
    let q = supabase
      .from("appointments")
      .select(
        "id, patient_id, reason, appointment_time, duration_minutes, status, notes, created_at, updated_at"
      );
    if (patientId) q = q.eq("patient_id", patientId);
    if (status) q = q.eq("status", status);
    if (fromISO) q = q.gte("appointment_time", fromISO);
    if (toISO) q = q.lte("appointment_time", toISO + "T23:59:59");

    const { data, error } = await q.order("appointment_time", {
      ascending: true,
    });
    if (error) throw error;

    const mapped = (data || []).map(mapAppt);
    // Mirror into Dexie (upsert)
    await db.transaction("rw", db.appointments, async () => {
      for (const a of mapped) await db.appointments.put(a);
    });
    return mapped;
  }

  // 2) Offline -> read from Dexie
  let collection = db.appointments.orderBy("appointment_date");

  // Range filter
  if (fromISO && toISO) {
    collection = db.appointments
      .where("appointment_date")
      .between(fromISO, toISO, true, true);
  } else if (fromISO) {
    collection = db.appointments.where("appointment_date").gte(fromISO);
  } else if (toISO) {
    collection = db.appointments.where("appointment_date").lte(toISO);
  }

  let rows = await collection.toArray();

  // Additional filters
  if (patientId) rows = rows.filter((a) => a.patient_id === patientId);
  if (status) rows = rows.filter((a) => a.status === status);

  // Sort by time
  rows.sort(
    (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)
  );
  return rows;
}

/* ---------------- Create / Update / Delete ---------------- */

export async function createAppointment(payload) {
  const isOnline = navigator.onLine;

  if (isOnline) {
    const { data, error } = await supabase
      .from("appointments")
      .insert([payload])
      .select("*")
      .single();
    if (error) throw error;
    const mapped = mapAppt(data);
    await db.appointments.put(mapped);
    return mapped;
  }

  // Offline: create a local-ONLY record + queue
  const localId = "local-" + crypto.randomUUID();
  const now = new Date().toISOString();

  const localRow = mapAppt({
    ...payload,
    id: localId,
    created_at: payload.created_at || now,
    updated_at: now,
    // Tag for UI
    status: payload.status || "scheduled",
    _local: { pending: true, op: "create" },
  });

  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    await db.appointments.put(localRow);
    await db.appointmentOps.add({
      type: "create",
      status: "pending",
      ts: now,
      entityId: localId,
      payload,
    });
  });

  return localRow;
}

export async function updateAppointment(id, patch) {
  const isOnline = navigator.onLine;
  const now = new Date().toISOString();

  if (isOnline && !String(id).startsWith("local-")) {
    const { error } = await supabase
      .from("appointments")
      .update({ ...patch, updated_at: now })
      .eq("id", id);
    if (error) throw error;

    // Mirror
    const current = await db.appointments.get(id);
    const merged = mapAppt({ ...(current || {}), ...patch, updated_at: now });
    await db.appointments.put(merged);
    return merged;
  }

  // Offline or local id: update Dexie + queue
  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    const current = await db.appointments.get(id);
    const merged = mapAppt({ ...(current || {}), ...patch, updated_at: now });
    merged._local = { pending: true, op: "update" };
    await db.appointments.put(merged);
    await db.appointmentOps.add({
      type: "update",
      status: "pending",
      ts: now,
      entityId: id,
      payload: patch,
    });
  });

  return await db.appointments.get(id);
}

export async function deleteAppointment(id) {
  const isOnline = navigator.onLine;
  if (isOnline && !String(id).startsWith("local-")) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    await db.appointments.delete(id);
    return;
  }

  const now = new Date().toISOString();
  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    // Tombstone locally so UI hides it
    await db.appointments.put({
      id,
      _local: { pending: true, op: "delete", tombstone: true },
    });
    await db.appointmentOps.add({
      type: "delete",
      status: "pending",
      ts: now,
      entityId: id,
    });
  });
}

/* ---------------- Sync queue ---------------- */

export async function syncAppointments() {
  if (!navigator.onLine) return;

  // Push local ops → server
  const ops = await db.appointmentOps
    .where("status")
    .equals("pending")
    .toArray();

  for (const op of ops) {
    try {
      if (op.type === "create") {
        // Create on server
        const { data, error } = await supabase
          .from("appointments")
          .insert([{ ...op.payload }])
          .select("*")
          .single();
        if (error) throw error;

        const serverRow = mapAppt(data);

        // Replace local temp id
        await db.transaction("rw", db.appointments, async () => {
          // Remove temp/local row
          await db.appointments.delete(op.entityId);
          // Insert server one
          await db.appointments.put(serverRow);
        });
      } else if (op.type === "update") {
        const id = op.entityId;
        const { error } = await supabase
          .from("appointments")
          .update({ ...op.payload, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;

        // Mirror locally
        const current = await db.appointments.get(id);
        await db.appointments.put(
          mapAppt({ ...(current || {}), ...op.payload })
        );
      } else if (op.type === "delete") {
        const id = op.entityId;
        // Local-only temp ids don’t exist on server
        if (!String(id).startsWith("local-")) {
          const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", id);
          if (error) throw error;
        }
        await db.appointments.delete(id);
      }

      // Mark op as done
      await db.appointmentOps.update(op.id, { status: "done" });
    } catch (err) {
      // Leave as pending; you can add retry/backoff if you want
      console.error("syncAppointments op failed:", err);
    }
  }

  // Pull latest server data for the next 60 days (example window)
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  let q = supabase
    .from("appointments")
    .select(
      "id, patient_id, reason, appointment_time, duration_minutes, status, notes, created_at, updated_at"
    )
    .gte("appointment_time", isoDateOnly(from))
    .lte("appointment_time", isoDateOnly(to) + "T23:59:59")
    .order("appointment_time", { ascending: true });

  const { data, error } = await q;
  if (!error && data) {
    const mapped = data.map(mapAppt);
    await db.transaction("rw", db.appointments, async () => {
      for (const a of mapped) await db.appointments.put(a);
    });
  }
}
