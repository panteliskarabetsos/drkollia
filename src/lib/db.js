// src/lib/db.js
"use client";

import Dexie from "dexie";

// --- Singleton DB ---
export const db = new Dexie("clinic_offline");

/**
 * v3 schema (kept for forward-compat)
 */
db.version(3).stores({
  // Patients
  patients:
    "id, last_name, first_name, birth_date, gender, created_at, updated_at",
  patientOps: "++id, type, ts, status, entityId",

  // Appointments
  appointments:
    "id, appointment_date, appointment_time, patient_id, status, created_at, updated_at, [patient_id+appointment_date]",
  appointmentOps: "++id, type, ts, status, entityId",
});

/**
 * v4 schema
 * - Add indexes for `amka` and `phone` to support offline duplicate checks.
 *   (Dexie will rebuild indexes; data is preserved.)
 */
db.version(4)
  .stores({
    // NOTE: Adding amka, phone to indexes
    patients:
      "id, last_name, first_name, birth_date, gender, amka, phone, created_at, updated_at",
    patientOps: "++id, type, ts, status, entityId",

    appointments:
      "id, appointment_date, appointment_time, patient_id, status, created_at, updated_at, [patient_id+appointment_date]",
    appointmentOps: "++id, type, ts, status, entityId",

    kv: "&key",
  })
  .upgrade(async (tx) => {
    // Ensure legacy records have the new fields (no-op safe)
    const table = tx.table("patients");
    await table.toCollection().modify((p) => {
      if (typeof p.amka === "undefined") p.amka = null;
      if (typeof p.phone === "undefined") p.phone = null;
    });
  });

/** Local-date-safe YYYY-MM-DD from a date-like input. */
export function isoDateOnly(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Safely open the DB and auto-recover if a legacy/bad schema exists
 * (e.g. old `patients: "*"` caused “Primary key cannot be multiEntry”).
 */
async function safeOpen() {
  try {
    await db.open();
  } catch (e) {
    const msg = String(e?.message || "");
    const isSchemaMismatch = /Schema|KeyPath|Incompatible|multiEntry/i.test(
      msg
    );

    if (isSchemaMismatch) {
      console.warn(
        "[offline-db] Resetting IndexedDB due to schema mismatch:",
        e
      );
      await Dexie.delete("clinic_offline");
      await db.open();
    } else {
      console.error("[offline-db] Failed to open DB:", e);
    }
  }
}

// Kick off opening early in the browser (Dexie is lazy otherwise)
if (typeof window !== "undefined" && "indexedDB" in window) {
  safeOpen();
}
