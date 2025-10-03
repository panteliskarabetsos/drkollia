"use client";
import Dexie from "dexie";

// Singleton DB
export const db = new Dexie("clinic_offline");

db.version(3).stores({
  // Patients (already added earlier)
  patients:
    "id, last_name, first_name, birth_date, gender, created_at, updated_at",
  patientOps: "++id, type, ts, status, entityId",

  // NEW: Appointments
  // appointment_date is YYYY-MM-DD (derived from appointment_time) for fast day/week queries
  appointments:
    "id, patient_id, appointment_time, appointment_date, status, created_at, updated_at, [patient_id+appointment_date]",
  appointmentOps: "++id, type, ts, status, entityId", // {type:'create|update|delete', entityId: local/server id, payload}
});

export function isoDateOnly(dateLike) {
  const d = new Date(dateLike);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
