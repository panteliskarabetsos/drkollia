"use client";
import { db } from "./db";

// ---- Normalizers (keep shapes consistent) ----
const normalizePatient = (p = {}) => ({
  ...p,
  // ensure strings when present
  first_name: p.first_name ?? "",
  last_name: p.last_name ?? "",
  email: p.email ?? "",
  phone: p.phone ?? "",
  amka: p.amka ?? "",
});

const normalizeAppointment = (a = {}) => ({ ...a });

// ---- Cache writers ----
export async function cachePatients(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  // Upsert
  await db.table("patients").bulkPut(rows.map(normalizePatient));
}

export async function cacheAppointments(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  await db.table("appointments").bulkPut(rows.map(normalizeAppointment));
}

// ---- Readers ----
export async function getAllPatientsOffline() {
  return db.table("patients").toArray();
}

export async function getAllAppointmentsOffline() {
  return db.table("appointments").toArray();
}

// ---- Filtering identical to your UI ----
export function filterPatientsLocal(
  patients,
  { query, gender, minAge, maxAge }
) {
  const q = (query || "").trim().toLowerCase();
  const min = minAge === "" ? null : Number(minAge);
  const max = maxAge === "" ? null : Number(maxAge);

  const ageFromDOB = (dob) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    return age;
  };

  return patients
    .filter((p) => {
      // query across name/phone/email/amka
      if (q) {
        const hay =
          `${p.first_name} ${p.last_name} ${p.phone} ${p.email} ${p.amka}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (gender && gender !== "all" && p.gender !== gender) return false;

      const age = ageFromDOB(p.birth_date);
      if (min !== null && age !== null && age < min) return false;
      if (max !== null && age !== null && age > max) return false;

      return true;
    })
    .sort((a, b) => {
      // same sort as online
      const ln = a.last_name.localeCompare(b.last_name);
      if (ln !== 0) return ln;
      return a.first_name.localeCompare(b.first_name);
    });
}
