import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";

function birthDateFromAmka(amka) {
  const dd = parseInt(amka.slice(0, 2), 10);
  const mm = parseInt(amka.slice(2, 4), 10);
  const yy = parseInt(amka.slice(4, 6), 10);
  const currYY = new Date().getFullYear() % 100;
  const fullYear = yy <= currYY ? 2000 + yy : 1900 + yy;

  const d = new Date(fullYear, mm - 1, dd);
  if (
    d.getFullYear() !== fullYear ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  const isoDate = `${fullYear}-${String(mm).padStart(2, "0")}-${String(
    dd
  ).padStart(2, "0")}`;
  return isoDate;
}

function normalizeGreekName(str) {
  if (!str) return "";
  const cleaned = str
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .toLowerCase();

  return cleaned
    .split(" ")
    .map((part) =>
      part
        .split("-")
        .map((seg) =>
          seg ? seg[0].toLocaleUpperCase("el-GR") + seg.slice(1) : seg
        )
        .join("-")
    )
    .join(" ");
}

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  const body = await request.json();

  const {
    newPatientData, // { first_name, last_name, email, phone, amka }
    formData, // { appointment_dateISO, appointment_time, duration_minutes, customDuration, reason, customReason, notes }
  } = body;

  try {
    // 1. Check clinic_settings
    const { data: settingsCheck, error: settingsErr } = await supabase
      .from("clinic_settings")
      .select("accept_new_appointments")
      .eq("id", 1)
      .single();

    if (settingsErr) {
      console.error("clinic_settings error:", settingsErr);
      return NextResponse.json(
        { error: "Σφάλμα κατά τον έλεγχο ρυθμίσεων ιατρείου." },
        { status: 500 }
      );
    }
    if (!settingsCheck?.accept_new_appointments) {
      return NextResponse.json(
        { error: "Προς το παρόν δεν δεχόμαστε νέα ηλεκτρονικά ραντεβού." },
        { status: 400 }
      );
    }

    // 2. Validation (server-side, πιο σύντομα εδώ – μπορείς να το επεκτείνεις)
    const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF\s]+$/;
    const amkaTrim = (newPatientData.amka || "").trim();
    const emailTrim = (newPatientData.email || "").trim();
    const phoneTrim = (newPatientData.phone || "").trim();
    const firstNameRaw = (newPatientData.first_name || "").trim();
    const lastNameRaw = (newPatientData.last_name || "").trim();

    if (
      !firstNameRaw ||
      firstNameRaw.length < 3 ||
      !greekRegex.test(firstNameRaw)
    ) {
      return NextResponse.json(
        { field: "first_name", error: "Μη έγκυρο όνομα." },
        { status: 400 }
      );
    }
    if (
      !lastNameRaw ||
      lastNameRaw.length < 3 ||
      !greekRegex.test(lastNameRaw)
    ) {
      return NextResponse.json(
        { field: "last_name", error: "Μη έγκυρο επώνυμο." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(phoneTrim)) {
      return NextResponse.json(
        {
          field: "phone",
          error: "Ο αριθμός τηλεφώνου πρέπει να είναι 10 ψηφία.",
        },
        { status: 400 }
      );
    }
    if (!emailTrim || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(emailTrim)) {
      return NextResponse.json(
        { field: "email", error: "Παρακαλώ εισάγετε ένα έγκυρο email." },
        { status: 400 }
      );
    }

    let birthISO = null;
    if (amkaTrim) {
      if (!/^\d{11}$/.test(amkaTrim)) {
        return NextResponse.json(
          {
            field: "amka",
            error: "Το ΑΜΚΑ πρέπει να αποτελείται από 11 ψηφία.",
          },
          { status: 400 }
        );
      }
      birthISO = birthDateFromAmka(amkaTrim);
      if (!birthISO) {
        return NextResponse.json(
          { field: "amka", error: "Το ΑΜΚΑ δεν είναι έγκυρο." },
          { status: 400 }
        );
      }
    }

    // 3. Duration & datetime
    const duration =
      formData.duration_minutes === "custom"
        ? parseInt(formData.customDuration || "", 10)
        : parseInt(formData.duration_minutes, 10);

    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: "Η διάρκεια του ραντεβού δεν είναι έγκυρη." },
        { status: 400 }
      );
    }

    if (!formData.appointment_dateISO || !formData.appointment_time) {
      return NextResponse.json(
        { error: "Πρέπει να επιλέξετε ημερομηνία και ώρα." },
        { status: 400 }
      );
    }

    const [hour, minute] = formData.appointment_time.split(":").map(Number);
    const combinedDate = new Date(formData.appointment_dateISO);
    combinedDate.setHours(hour, minute, 0, 0);

    const reason =
      formData.reason === "Προσαρμογή"
        ? formData.customReason
        : formData.reason;

    // 4. Business rule: max 2 "Ιατρικός Επισκέπτης" per month
    if (reason === "Ιατρικός Επισκέπτης") {
      const startOfMonthDate = new Date(
        combinedDate.getFullYear(),
        combinedDate.getMonth(),
        1
      );
      const endOfMonthDate = new Date(
        combinedDate.getFullYear(),
        combinedDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      const { count, error: visitorError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("reason", "Ιατρικός Επισκέπτης")
        .gte("appointment_time", startOfMonthDate.toISOString())
        .lte("appointment_time", endOfMonthDate.toISOString());

      if (visitorError) {
        console.error("visitorError", visitorError);
        return NextResponse.json(
          { error: "Σφάλμα κατά τον έλεγχο επισκέψεων." },
          { status: 500 }
        );
      }
      if ((count || 0) >= 2) {
        return NextResponse.json(
          {
            error:
              "Έχουν ήδη καταχωρηθεί 2 επισκέψεις ιατρικών επισκεπτών για τον τρέχοντα μήνα.",
          },
          { status: 400 }
        );
      }
    }

    // 5. Find or create patient
    let patientId = null;
    const filters = [];
    if (phoneTrim) filters.push(`phone.eq.${phoneTrim}`);
    if (amkaTrim) filters.push(`amka.eq.${amkaTrim}`);

    let existingPatient = null;
    if (filters.length) {
      const { data: existing, error: existingError } = await supabase
        .from("patients")
        .select("id")
        .or(filters.join(","))
        .limit(1)
        .single();

      if (!existingError && existing) {
        existingPatient = existing;
      }
    }

    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const firstName = normalizeGreekName(firstNameRaw);
      const lastName = normalizeGreekName(lastNameRaw);

      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            phone: phoneTrim,
            email: emailTrim || null,
            amka: amkaTrim || null,
            birth_date: birthISO || null,
            gender: "other",
          },
        ])
        .select()
        .single();

      if (patientError || !newPatient) {
        console.error("patientError", patientError);
        return NextResponse.json(
          { error: "Σφάλμα κατά την καταχώρηση ασθενούς." },
          { status: 500 }
        );
      }
      patientId = newPatient.id;
    }

    // 6. Check if same-day appointment exists for patient
    const startOfDay = new Date(combinedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(combinedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: sameDayAppointments, error: sameDayError } = await supabase
      .from("appointments")
      .select("id")
      .eq("patient_id", patientId)
      .gte("appointment_time", startOfDay.toISOString())
      .lte("appointment_time", endOfDay.toISOString())
      .in("status", ["pending", "approved", "completed"]);

    if (sameDayError) {
      console.error("sameDayError", sameDayError);
      return NextResponse.json(
        { error: "Προέκυψε σφάλμα κατά τον έλεγχο ραντεβού." },
        { status: 500 }
      );
    }
    if ((sameDayAppointments || []).length > 0) {
      return NextResponse.json(
        { error: "Έχετε ήδη ραντεβού για την επιλεγμένη ημέρα." },
        { status: 400 }
      );
    }

    // 7. Insert appointment
    const { data: appt, error: insertError } = await supabase
      .from("appointments")
      .insert([
        {
          patient_id: patientId,
          appointment_time: combinedDate.toISOString(),
          duration_minutes: duration,
          reason: reason,
          notes: formData.notes || null,
          status: "approved",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("insertError", insertError);
      return NextResponse.json(
        {
          error: `Σφάλμα κατά την καταχώρηση ραντεβού: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    // 8. (Προαιρετικά) εδώ μπορείς να στείλεις το email επιβεβαίωσης από server
    // ή να το κρατήσεις στο /api/send-confirmation όπως ήδη έχεις.

    return NextResponse.json(
      {
        success: true,
        appointment: appt,
        redirectUrl: `/appointments/success?ref=ok&name=${encodeURIComponent(
          newPatientData.first_name
        )}&date=${combinedDate.toISOString()}&reason=${encodeURIComponent(
          reason
        )}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("API /api/appointments error:", err);
    return NextResponse.json({ error: "Προέκυψε σφάλμα." }, { status: 500 });
  }
}
