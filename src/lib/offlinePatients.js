// src/app/lib/offlinePatients.js
"use client";

import { db } from "./db";
import { supabase } from "./supabaseClient";

const isUUID = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || "")
  );

// Create patient (works online/offline). Returns the created row.
export async function createPatient(payload) {
  const now = new Date().toISOString();
  const cleaned = {
    ...payload,
    created_at: payload.created_at ?? now,
    updated_at: now,
  };

  // ONLINE → write to Supabase, mirror to Dexie
  if (typeof navigator === "undefined" || navigator.onLine) {
    const { data, error } = await supabase
      .from("patients")
      .insert([cleaned])
      .select("*")
      .single();
    if (error) throw error;

    await db.patients.put(data); // cache
    return data;
  }

  // OFFLINE → local temp id + queue op
  const localId = `local-${crypto.randomUUID()}`;
  const localRow = { ...cleaned, id: localId, _local: { pending: true } };

  await db.transaction("rw", [db.patients, db.patientOps], async () => {
    await db.patients.put(localRow);
    await db.patientOps.add({
      type: "create",
      status: "pending",
      ts: now,
      entityId: localId,
      payload: cleaned,
    });
  });

  return localRow;
}

// Optional helpers if you need them later
export async function updatePatient(id, patch) {
  const now = new Date().toISOString();
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  if (isOnline && isUUID(id)) {
    const { error } = await supabase
      .from("patients")
      .update({ ...patch, updated_at: now })
      .eq("id", id);
    if (error) throw error;

    const cur = await db.patients.get(id);
    await db.patients.put({ ...(cur || {}), ...patch, updated_at: now });
    return await db.patients.get(id);
  }

  // offline or local id
  await db.transaction("rw", [db.patients, db.patientOps], async () => {
    const cur = await db.patients.get(id);
    await db.patients.put({
      ...(cur || {}),
      ...patch,
      updated_at: now,
      _local: { pending: true },
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

export async function syncPatients() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  // Push queue → server
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

        // replace local temp id with server id
        const serverRow = data;
        await db.transaction("rw", [db.patients, db.appointments], async () => {
          // remap any local appointments pointing to the temp id
          await db.appointments
            .where("patient_id")
            .equals(op.entityId)
            .modify({ patient_id: serverRow.id });

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
      // keep pending; retry next time
    }
  }
}
