"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import offlineAuth from "../../../../lib/offlineAuth";
import { FaArrowLeft } from "react-icons/fa";
import { AlertCircle, Users } from "lucide-react";
import { db } from "../../../../lib/db";
import { createPatient } from "../../../../lib/offlinePatients";
/* ---------- helpers ---------- */
const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
const normalizeAMKA = (s) => onlyDigits(s).slice(0, 11);
const normalizePhone = (s) => onlyDigits(s).slice(0, 10);

async function findLocalByAMKA(value) {
  try {
    return await db.patients.where("amka").equals(value).first();
  } catch {
    return null;
  }
}
async function findLocalByPhone(value) {
  try {
    return await db.patients.where("phone").equals(value).first();
  } catch {
    return null;
  }
}
function useDebouncedCallback(fn, delay = 400) {
  const t = useRef(null);
  return (...args) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  };
}

function validate(form) {
  const errors = {};
  if (!form.first_name?.trim())
    errors.first_name = "Το «Όνομα» είναι υποχρεωτικό.";
  if (!form.last_name?.trim())
    errors.last_name = "Το «Επώνυμο» είναι υποχρεωτικό.";
  if (form.amka && form.amka.length !== 11)
    errors.amka = "Ο ΑΜΚΑ πρέπει να έχει ακριβώς 11 ψηφία.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Μη έγκυρο email.";
  if (form.phone && form.phone.length < 10)
    errors.phone = "Το τηλέφωνο πρέπει να έχει 10 ψηφία.";
  return errors;
}

export default function NewPatientPage() {
  const [session, setSession] = useState(null);
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    amka: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    occupation: "",
    first_visit_date: "",
    marital_status: "",
    children: "",
    smoking: "",
    alcohol: "",
    medications: "",
    gynecological_history: "",
    hereditary_history: "",
    current_disease: "",
    physical_exam: "",
    preclinical_screening: "",
    notes: "",
    customSmoking: "",
    customAlcohol: "",
  });

  const [message, setMessage] = useState(null);
  const [fullNameError, setFullNameError] = useState(false);
  const [amkaError, setAmkaError] = useState(false);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [showClinical, setShowClinical] = useState(false);

  const [amkaMatches, setAmkaMatches] = useState([]);
  const [amkaExists, setAmkaExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitIntent, setSubmitIntent] = useState("save");
  const firstErrorRef = useRef(null);
  const online = useOnline();
  // debounced duplicate checks
  const debouncedCheckDuplicate = useDebouncedCallback(async (field, value) => {
    await checkDuplicate(field, value);
  }, 500);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data?.session || null;
      const hasOffline = !!offlineAuth?.isEnabled?.();
      const online = typeof navigator === "undefined" ? true : navigator.onLine;

      if (!s && !hasOffline) {
        // redirect ONLY when online (prevents offline loop)
        if (online && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace("/login?redirect=/admin/patients/new");
        }
        setLoading(false);
        return;
      }
      // allow form offline if offline-unlock is enabled
      setSession(s || { id: "offline-user" });
      setLoading(false);
    })();
  }, [router]);

  // warn when leaving with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // shortcuts: Ctrl/⌘+S submit, Esc back, ? help
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const formEl = document.querySelector("form");
        formEl?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (e.key === "?" || (e.key === "/" && e.shiftKey))
      ) {
        e.preventDefault();
        router.push("/admin/help");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const requiredCount = useMemo(
    () => ["first_name", "last_name"].filter((k) => !!form[k]?.trim()).length,
    [form]
  );
  const progress = Math.round((requiredCount / 2) * 100);

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-[#8c7c68]" />
      </div>
    );

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // normalize specific fields
    if (name === "amka") value = normalizeAMKA(value);
    if (name === "phone") value = normalizePhone(value);

    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);

    // live validations
    if (name === "amka") {
      setAmkaError(value !== "" && value.length !== 11);
      if (value.length === 11) debouncedCheckDuplicate("amka", value);
      else {
        setAmkaExists(false);
        setAmkaMatches([]);
      }
    }
    if (name === "phone") {
      if (value.length === 10) debouncedCheckDuplicate("phone", value);
      else setPhoneExists(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnline =
      typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
        ? navigator.onLine
        : true;
    const v = validate(form);
    setErrors(v);
    setFullNameError(!!(v.first_name || v.last_name));
    setAmkaError(!!v.amka);

    if (Object.keys(v).length) {
      const firstKey = Object.keys(v)[0];
      const el = document.getElementById(firstKey);
      firstErrorRef.current = el;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 200);
      }
      setMessage({ type: "error", text: "Ελέγξτε τα πεδία της φόρμας." });
      return;
    }

    // If previous async checks flagged duplicates, stop.
    if (amkaExists) {
      setMessage({
        type: "error",
        text: "Υπάρχει ήδη ασθενής με αυτόν τον ΑΜΚΑ.",
      });
      return;
    }
    if (phoneExists) {
      setMessage({
        type: "error",
        text: "Υπάρχει ήδη ασθενής με αυτό το τηλέφωνο.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // apply custom smoking/alcohol
      const preparedForm = {
        ...form,
        smoking:
          form.smoking === "Προσαρμογή" ? form.customSmoking : form.smoking,
        alcohol:
          form.alcohol === "Προσαρμογή" ? form.customAlcohol : form.alcohol,
      };
      const { customSmoking, customAlcohol, ...cleanedFormRaw } = preparedForm;

      // normalize gender values to schema
      const genderMap = { Άνδρας: "male", Γυναίκα: "female", Άλλο: "other" };
      const cleanedForm = {
        ...cleanedFormRaw,
        gender:
          genderMap[cleanedFormRaw.gender] || cleanedFormRaw.gender || null,
      };

      // empty strings → null
      ["birth_date", "first_visit_date", "amka"].forEach((field) => {
        if (cleanedForm[field]?.trim?.() === "") cleanedForm[field] = null;
      });

      const nowISO = new Date().toISOString();
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      let newId;
      if (online) {
        // ---- ONLINE: save to Supabase and mirror to Dexie ----
        const { data, error } = await supabase
          .from("patients")
          .insert([{ ...cleanedForm, created_at: nowISO, updated_at: nowISO }])
          .select("id")
          .single();
        newId = data.id;
        if (error) {
          console.error("Supabase insert error:", error);
          setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
          return;
        }

        // Mirror to Dexie for offline use
        try {
          await db.patients.put({
            id: data.id,
            ...cleanedForm,
            created_at: nowISO,
            updated_at: nowISO,
          });
        } catch (dexErr) {
          console.warn("[offline] Failed to mirror patient locally:", dexErr);
        }

        setMessage({
          type: "success",
          text: "Ο/η ασθενής καταχωρήθηκε με επιτυχία.",
        });
        setDirty(false);

        if (submitIntent === "save_and_new_appt" && data?.id) {
          router.push(`/admin/appointments/new?patient_id=${data.id}`);
        } else {
          router.push("/admin/patients");
        }
        return;
      } else {
        // ---- OFFLINE: duplicate checks first ----
        if (cleanedForm.amka) {
          const existsLocalAmka = await findLocalByAMKA(cleanedForm.amka);
          if (existsLocalAmka) {
            setMessage({
              type: "error",
              text: "Υπάρχει ήδη τοπικά ασθενής με αυτόν τον ΑΜΚΑ.",
            });
            setLoading(false);
            return;
          }
        }
        if (cleanedForm.phone) {
          const existsLocalPhone = await findLocalByPhone(cleanedForm.phone);
          if (existsLocalPhone) {
            setMessage({
              type: "error",
              text: "Υπάρχει ήδη τοπικά ασθενής με αυτό το τηλέφωνο.",
            });
            setLoading(false);
            return;
          }
        }

        // ---- OFFLINE: write once via helper (stores in Dexie + queues op) ----
        const created = await createPatient({
          ...cleanedForm,
          created_at: nowISO,
          updated_at: nowISO,
        });
        newId = created?.id;
      }

      setMessage({
        type: "success",
        text: "Αποθηκεύτηκε τοπικά (εκτός σύνδεσης). Θα συγχρονιστεί αυτόματα όταν επανέλθει το internet.",
      });
      setDirty(false);

      if (submitIntent === "save_and_new_appt") {
        const param =
          online && newId && !String(newId).startsWith("local-")
            ? `patient_id=${newId}`
            : `patient_local_id=${newId}`;
        router.push(`/admin/appointments/new?${param}`);
      } else {
        router.push("/admin/patients");
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicate = async (field, value) => {
    if (!value?.trim()) return;

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (field === "amka") {
      if (isOnline) {
        const { data, error } = await supabase
          .from("patients")
          .select("id, first_name, last_name, amka")
          .eq("amka", value)
          .limit(5);
        if (error) {
          console.error("Error checking AMKA duplicates:", error);
          return;
        }
        setAmkaExists((data?.length ?? 0) > 0);
        setAmkaMatches(data || []);
      } else {
        const local = await findLocalByAMKA(value);
        setAmkaExists(!!local);
        setAmkaMatches(local ? [local] : []);
      }
      return;
    }

    if (field === "phone") {
      if (isOnline) {
        const { data, error } = await supabase
          .from("patients")
          .select("id")
          .eq("phone", value)
          .limit(1);
        if (error) {
          console.error("Error checking phone duplicates:", error);
          return;
        }
        setPhoneExists((data?.length ?? 0) > 0);
      } else {
        const local = await findLocalByPhone(value);
        setPhoneExists(!!local);
      }
    }
  };

  return (
    <main className="py-8 min-h-screen text-stone-800 bg-[radial-gradient(1200px_500px_at_10%_-10%,#f3f1ea_25%,transparent),radial-gradient(1000px_400px_at_90%_-20%,#f1eee6_25%,transparent)]">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm rounded-lg border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
            title="Επιστροφή"
          >
            <FaArrowLeft className="opacity-70" />
            Επιστροφή
          </button>

          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Νέος Ασθενής
            </h1>
            <p className="text-xs text-stone-600">
              Συμπληρώστε τα βασικά στοιχεία και (προαιρετικά) κλινικές
              πληροφορίες.
            </p>
          </div>

          {/* progress pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="text-stone-500">Πρόοδος</span>
            <span className="font-semibold">{progress}%</span>
            <span
              className="ml-2 h-1.5 w-20 rounded-full bg-stone-200 overflow-hidden"
              aria-hidden
            >
              <span
                className="block h-full bg-[#8c7c68]"
                style={{ width: `${progress}%` }}
              />
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* error summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-medium mb-1">Υπάρχουν εκκρεμότητες στη φόρμα:</p>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(errors).map(([k, msg]) => (
                <li key={k}>
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => {
                      const el = document.getElementById(k);
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        setTimeout(() => el.focus(), 200);
                      }
                    }}
                  >
                    {msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form
          id="new-patient-form"
          onSubmit={handleSubmit}
          className="space-y-10"
        >
          {/* ——— Section: Basics ——— */}
          <Section title="🧾 Στοιχεία Ασθενούς">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white/70 p-6 rounded-2xl shadow-sm border border-stone-200">
              <InputField
                name="first_name"
                label="Όνομα"
                placeholder="π.χ. Ιωάννης"
                value={form.first_name}
                onChange={handleChange}
                required
                hint="Υποχρεωτικό"
                error={!!(fullNameError || errors.first_name)}
                errorMessage={errors.first_name}
              />
              <InputField
                name="last_name"
                label="Επώνυμο"
                placeholder="π.χ. Παπαδόπουλος"
                value={form.last_name}
                onChange={handleChange}
                required
                hint="Υποχρεωτικό"
                error={!!(fullNameError || errors.last_name)}
                errorMessage={errors.last_name}
              />
              <InputField
                name="amka"
                label="ΑΜΚΑ"
                placeholder="π.χ. 01019999999"
                value={form.amka}
                onChange={handleChange}
                onBlur={() => {
                  if (/^\d{11}$/.test(form.amka))
                    checkDuplicate("amka", form.amka);
                }}
                hint="11 ψηφία"
                error={amkaExists || !!(amkaError || errors.amka)}
                errorMessage={
                  errors.amka ||
                  (amkaExists ? "Υπάρχει ήδη ασθενής με αυτόν τον ΑΜΚΑ." : "")
                }
                below={
                  amkaExists && amkaMatches?.length > 0 ? (
                    <ConflictCard
                      title="Υπάρχοντες ασθενείς με αυτόν τον ΑΜΚΑ"
                      items={amkaMatches}
                    />
                  ) : null
                }
              />

              <InputField
                name="email"
                label="Email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                errorMessage={errors.email}
              />
              <InputField
                name="phone"
                label="Τηλέφωνο"
                placeholder="π.χ. 6981234567"
                value={form.phone}
                onChange={handleChange}
                onBlur={() => {
                  if (form.phone?.length === 10)
                    checkDuplicate("phone", form.phone);
                }}
                hint="10 ψηφία"
                error={!!(errors.phone || phoneExists)}
                errorMessage={
                  errors.phone ||
                  (phoneExists
                    ? "Υπάρχει ήδη ασθενής με αυτό το τηλέφωνο."
                    : "")
                }
              />
              <InputField
                name="birth_date"
                label="Ημ. Γέννησης"
                type="date"
                value={form.birth_date}
                onChange={handleChange}
              />
              <SelectField
                name="gender"
                label="Φύλο"
                value={form.gender}
                onChange={handleChange}
                options={[
                  { label: "Άνδρας", value: "male" },
                  { label: "Γυναίκα", value: "female" },
                  { label: "Άλλο", value: "other" },
                ]}
              />
              <InputField
                name="occupation"
                label="Επάγγελμα"
                value={form.occupation}
                onChange={handleChange}
              />
              <InputField
                name="first_visit_date"
                label="Ημ. Πρώτης Επίσκεψης"
                type="date"
                value={form.first_visit_date ?? ""}
                onChange={handleChange}
              />
              <SelectField
                name="children"
                label="Τέκνα"
                value={form.children}
                onChange={handleChange}
                options={["Κανένα", "1 παιδί", "2 παιδιά", "3+ παιδιά"]}
              />
              <SelectField
                name="marital_status"
                label="Οικογενειακή Κατάσταση"
                value={form.marital_status}
                onChange={handleChange}
                options={["Άγαμος/η", "Έγγαμος/η", "Διαζευγμένος/η", "Χήρος/α"]}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 p-6 rounded-2xl shadow-sm border border-stone-200">
                <SelectField
                  name="smoking"
                  label="Κάπνισμα"
                  value={form.smoking}
                  onChange={handleChange}
                  options={[
                    "Όχι",
                    "Περιστασιακά",
                    "Καθημερινά",
                    "Πρώην καπνιστής",
                    "Προσαρμογή",
                  ]}
                />
                {form.smoking === "Προσαρμογή" && (
                  <div className="mt-3">
                    <InputField
                      name="customSmoking"
                      label="Προσαρμοσμένη τιμή"
                      placeholder="περιγράψτε..."
                      value={form.customSmoking}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white/70 p-6 rounded-2xl shadow-sm border border-stone-200">
                <SelectField
                  name="alcohol"
                  label="Αλκοόλ"
                  value={form.alcohol}
                  onChange={handleChange}
                  options={[
                    "Όχι",
                    "Σπάνια",
                    "Συχνά",
                    "Καθημερινά",
                    "Προσαρμογή",
                  ]}
                />
                {form.alcohol === "Προσαρμογή" && (
                  <div className="mt-3">
                    <InputField
                      name="customAlcohol"
                      label="Προσαρμοσμένη τιμή"
                      placeholder="περιγράψτε..."
                      value={form.customAlcohol}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-white/70 p-6 rounded-2xl shadow-sm border border-stone-200">
              <TextAreaField
                name="medications"
                label="Φάρμακα"
                value={form.medications}
                onChange={handleChange}
              />
            </div>
          </Section>

          {/* ——— Section: Clinical ——— */}
          <Section
            title={
              <div className="flex items-center justify-between">
                <span>📋 Κλινικές Πληροφορίες</span>
                <button
                  type="button"
                  onClick={() => setShowClinical((v) => !v)}
                  className="text-sm rounded-full border border-stone-300 px-3 py-1 hover:bg-stone-50"
                >
                  {showClinical ? "Σύμπτυξη" : "Εμφάνιση"}
                </button>
              </div>
            }
          >
            {showClinical && (
              <div className="grid grid-cols-1 gap-6 bg-white/70 p-6 rounded-2xl shadow-sm border border-stone-200">
                <TextAreaField
                  name="gynecological_history"
                  label="Γυναικολογικό Ιστορικό"
                  value={form.gynecological_history}
                  onChange={handleChange}
                />
                <TextAreaField
                  name="hereditary_history"
                  label="Κληρονομικό Ιστορικό"
                  value={form.hereditary_history}
                  onChange={handleChange}
                />
                <TextAreaField
                  name="current_disease"
                  label="Παρούσα Νόσος"
                  value={form.current_disease}
                  onChange={handleChange}
                />
                <TextAreaField
                  name="physical_exam"
                  label="Αντικειμενική Εξέταση"
                  value={form.physical_exam}
                  onChange={handleChange}
                />
                <TextAreaField
                  name="preclinical_screening"
                  label="Πάρακλινικός Έλεγχος"
                  value={form.preclinical_screening}
                  onChange={handleChange}
                />
                <TextAreaField
                  name="notes"
                  label="Σημειώσεις"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            )}
          </Section>

          {message && (
            <div
              className={`mt-2 text-center text-sm font-medium ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Sticky actions */}
          <div className="sticky bottom-0 inset-x-0 z-20 mt-6 border-t bg-white/80 backdrop-blur">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-stone-600">
                {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
              </span>
              {!online && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
                  Είστε εκτός σύνδεσης. Τα νέα στοιχεία θα αποθηκευτούν τοπικά
                  και θα συγχρονιστούν αυτόματα μόλις συνδεθείτε.
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitIntent("save_and_new_appt");
                    document
                      .getElementById("new-patient-form")
                      ?.requestSubmit();
                  }}
                  disabled={loading}
                  className="text-sm rounded-lg border border-stone-300 px-4 py-2 hover:bg-stone-50 transition disabled:opacity-50"
                >
                  Αποθήκευση & Νέο Ραντεβού
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitIntent("save")}
                  disabled={loading}
                  className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-5 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Αποθήκευση..." : "Καταχώρηση"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---------- components ---------- */
const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-stone-200 bg-white/60 px-6 py-8 shadow-sm">
    <h2 className="text-lg font-semibold mb-6 text-stone-700 tracking-tight">
      {title}
    </h2>
    {children}
  </section>
);

const InputField = ({
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  hint,
  error = false,
  errorMessage = "",
  below,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-stone-700 mb-1"
    >
      {label}
      {required && <span className="ml-1 text-rose-500">*</span>}
      {hint && (
        <span className="ml-2 text-xs text-stone-500 font-normal">{hint}</span>
      )}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={onChange}
      aria-invalid={error ? "true" : "false"}
      aria-describedby={error ? `${name}-error` : undefined}
      className={[
        "w-full px-3 py-2 rounded-lg text-sm bg-white transition",
        "border focus:outline-none focus:ring-2",
        error
          ? "border-rose-400 focus:ring-rose-300"
          : "border-stone-300 focus:ring-[#9e9483]",
      ].join(" ")}
      autoComplete="off"
    />
    {error && (
      <div
        id={`${name}-error`}
        className="mt-1 flex items-start gap-2 text-sm text-rose-700"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle className="mt-[2px] h-4 w-4" />
        <p>{errorMessage}</p>
      </div>
    )}
    {below && <div className="pt-2">{below}</div>}
  </div>
);

const SelectField = ({ name, label, value, onChange, options = [] }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-stone-700 mb-1"
    >
      {label}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
    >
      <option value="">Επιλέξτε</option>
      {options.map((opt) =>
        typeof opt === "string" ? (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ) : opt?.value ? (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ) : null
      )}
    </select>
  </div>
);

const TextAreaField = ({
  name,
  label,
  value = "",
  onChange,
  maxLength = 1500,
}) => {
  const count = value?.length ?? 0;
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-stone-700 mb-1"
      >
        {label}
      </label>
      <textarea
        name={name}
        id={name}
        rows={4}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
      />
      <div className="mt-1 text-xs text-stone-500 text-right">
        {count}/{maxLength}
      </div>
    </div>
  );
};

const ConflictCard = ({ title, items }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 shadow-sm">
    <div className="flex items-center gap-2 font-medium mb-1.5">
      <Users className="h-4 w-4" />
      <span>{title}</span>
      <span className="ml-auto text-xs bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
        {items.length}
      </span>
    </div>
    <ul className="space-y-1">
      {items.map((p) => (
        <li key={p.id} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
          <span className="leading-tight">
            {p.last_name} {p.first_name}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () =>
      setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    update(); // set initial value after mount
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
