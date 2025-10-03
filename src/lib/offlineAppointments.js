// src/lib/offlineAppointments.js
"use client";

import { db, isoDateOnly } from "./db";
import { supabase } from "@/app/lib/supabaseClient"; // ✅ correct path

/* ---------------- utils ---------------- */
const nowISO = () => new Date().toISOString();
const randId =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? () => crypto.randomUUID()
    : () =>
        `local-${Date.now().toString(16)}-${Math.random()
          .toString(16)
          .slice(2, 10)}`;

const startOfDayISO = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};
const endOfDayISO = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
};

/* ---------------- mappers ---------------- */
function fromServer(row) {
  const t = row?.appointment_time ? new Date(row.appointment_time) : null;
  return {
    id: row.id,
    patient_id: row.patient_id ?? null,
    reason: row.reason ?? "",
    appointment_time: row.appointment_time, // ISO string
    appointment_date: t ? isoDateOnly(t) : null, // YYYY-MM-DD
    duration_minutes: row.duration_minutes ?? 30,
    status: row.status ?? "scheduled", // DB allows: scheduled/completed/cancelled/approved/rejected
    notes: row.notes ?? "",
    is_exception: !!row.is_exception,
    created_at: row.created_at ?? nowISO(),
    updated_at: row.updated_at ?? row.created_at ?? nowISO(),
    created_by: row.created_by ?? null,
  };
}

function toServer(local) {
  // Let Supabase fill created_by via default (auth.uid())
  return {
    id: local.id,
    patient_id: local.patient_id ?? null,
    reason: local.reason || null,
    appointment_time: local.appointment_time, // ISO string
    duration_minutes: Number(local.duration_minutes ?? 30),
    status: local.status || "scheduled",
    notes: local.notes || null,
    is_exception: !!local.is_exception,
  };
}

/* ---------------- reads (offline-first) ---------------- */

export async function fetchAppointmentsRange({ from, to, patientId, status }) {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;

  // Normalize inputs to strings for local compare
  const fromDay = from ? isoDateOnly(from) : null;
  const toDay = to ? isoDateOnly(to) : null;

  if (online) {
    // Online: query Supabase with full-day bounds (local time)
    let q = supabase
      .from("appointments")
      .select(
        "id, patient_id, reason, appointment_time, duration_minutes, status, notes, is_exception, created_at, updated_at, created_by"
      );

    if (patientId) q = q.eq("patient_id", patientId);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("appointment_time", startOfDayISO(from));
    if (to) q = q.lte("appointment_time", endOfDayISO(to));

    const { data, error } = await q.order("appointment_time", {
      ascending: true,
    });
    if (error) throw error;

    const mapped = (data || []).map(fromServer);

    // Mirror to IndexedDB
    if (mapped.length) {
      await db.appointments.bulkPut(mapped);
    }
    return mapped;
  }

  // Offline: query Dexie
  let coll = db.appointments.orderBy("appointment_date");

  if (fromDay && toDay) {
    coll = db.appointments
      .where("appointment_date")
      .between(fromDay, toDay, true, true);
  } else if (fromDay) {
    coll = db.appointments.where("appointment_date").gte(fromDay);
  } else if (toDay) {
    coll = db.appointments.where("appointment_date").lte(toDay);
  }

  let rows = await coll.toArray();
  if (patientId) rows = rows.filter((a) => a.patient_id === patientId);
  if (status) rows = rows.filter((a) => a.status === status);

  rows.sort(
    (a, b) => new Date(a.appointment_time) - new Date(b.appointment_time)
  );
  return rows;
}

export async function listForDay(dateLike) {
  const d = isoDateOnly(dateLike);
  const rows = await db.appointments
    .where("appointment_date")
    .equals(d)
    .sortBy("appointment_time");
  return rows;
}

export async function getById(id) {
  return db.appointments.get(id);
}

/* ---------------- writes (offline-first) ---------------- */

export async function createAppointment(input) {
  const online = navigator.onLine;
  const id = input.id || randId();
  const local = fromServer({
    ...input,
    id,
    appointment_time: input.appointment_time, // must be ISO string
    status: input.status || "scheduled",
    created_at: nowISO(),
    updated_at: nowISO(),
  });

  if (online && !String(id).startsWith("local-")) {
    const { data, error } = await supabase
      .from("appointments")
      .insert([toServer(local)])
      .select("*")
      .single();
    if (error) throw error;

    const serverRow = fromServer(data);
    await db.appointments.put(serverRow);
    return serverRow;
  }

  // Offline: write local & queue op
  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    await db.appointments.put(local);
    await db.appointmentOps.add({
      type: "create",
      status: "pending",
      ts: Date.now(),
      entityId: id,
      payload: toServer(local),
    });
  });

  return local;
}

export async function updateAppointment(id, patch) {
  const online = navigator.onLine;
  const current = await db.appointments.get(id);
  if (!current) throw new Error("Appointment not found");

  const merged = fromServer({
    ...current,
    ...patch,
    appointment_time: patch.appointment_time ?? current.appointment_time, // keep ISO
    updated_at: nowISO(),
  });

  if (online && !String(id).startsWith("local-")) {
    const { error } = await supabase
      .from("appointments")
      .update(toServer(merged))
      .eq("id", id);
    if (error) throw error;
    await db.appointments.put(merged);
    return merged;
  }

  // Offline queue
  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    await db.appointments.put(merged);
    await db.appointmentOps.add({
      type: "update",
      status: "pending",
      ts: Date.now(),
      entityId: id,
      payload: toServer(merged),
    });
  });

  return merged;
}

export async function deleteAppointment(id) {
  const online = navigator.onLine;

  if (online && !String(id).startsWith("local-")) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    await db.appointments.delete(id);
    return;
  }

  // Offline: remove locally and queue delete
  await db.transaction("rw", [db.appointments, db.appointmentOps], async () => {
    await db.appointments.delete(id);
    await db.appointmentOps.add({
      type: "delete",
      status: "pending",
      ts: Date.now(),
      entityId: id,
    });
  });
}

/* ---------------- sync (push outbox + pull latest) ---------------- */

export async function syncAppointments() {
  if (!navigator.onLine) return;

  // 1) Push outbox
  const ops = await db.appointmentOps
    .where("status")
    .equals("pending")
    .sortBy("ts");

  for (const op of ops) {
    try {
      if (op.type === "create") {
        const { data, error } = await supabase
          .from("appointments")
          .insert([op.payload])
          .select("*")
          .single();
        if (error) throw error;

        const serverRow = fromServer(data);

        // Replace local temp id with server id
        await db.transaction("rw", db.appointments, async () => {
          await db.appointments.delete(op.entityId);
          await db.appointments.put(serverRow);
        });
      } else if (op.type === "update") {
        const { error } = await supabase
          .from("appointments")
          .update(op.payload)
          .eq("id", op.entityId);
        if (error) throw error;

        const cur = await db.appointments.get(op.entityId);
        await db.appointments.put(
          fromServer({ ...(cur || {}), ...op.payload })
        );
      } else if (op.type === "delete") {
        if (!String(op.entityId).startsWith("local-")) {
          const { error } = await supabase
            .from("appointments")
            .delete()
            .eq("id", op.entityId);
          if (error) throw error;
        }
        await db.appointments.delete(op.entityId);
      }

      await db.appointmentOps.update(op.id, { status: "done" });
    } catch (err) {
      console.warn("syncAppointments op failed:", err);
      // keep pending for retry
    }
  }

  // 2) Pull window (past 14d → next 60d)
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, patient_id, reason, appointment_time, duration_minutes, status, notes, is_exception, created_at, updated_at, created_by"
    )
    .gte("appointment_time", startOfDayISO(from))
    .lte("appointment_time", endOfDayISO(to))
    .order("appointment_time", { ascending: true });

  if (!error && data) {
    const mapped = data.map(fromServer);
    await db.appointments.bulkPut(mapped);
  }
}

// Auto-flush when back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncAppointments().catch(() => {});
  });
}
