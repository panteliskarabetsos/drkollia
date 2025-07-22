"use client";
import { useState } from "react";

export default function BookAppointmentForm() {
  const [form, setForm] = useState({ full_name: "", appointment_time: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // First, create the patient
    const resPatient = await fetch("/api/patients", {
      method: "POST",
      body: JSON.stringify({ full_name: form.full_name }),
    });

    const patient = await resPatient.json();

    // Then, create the appointment
    await fetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patient.id,
        appointment_time: form.appointment_time,
      }),
    });

    alert("Ραντεβού καταχωρήθηκε!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Ονοματεπώνυμο"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <input
        type="datetime-local"
        value={form.appointment_time}
        onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <button type="submit" className="px-6 py-2 bg-[#3b3a36] text-white rounded">
        Καταχώρηση
      </button>
    </form>
  );
}
