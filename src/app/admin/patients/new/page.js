"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import { AlertCircle, Users } from "lucide-react";

/* ---------- helpers ---------- */
const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
const normalizeAMKA = (s) => onlyDigits(s).slice(0, 11);
const normalizePhone = (s) => onlyDigits(s).slice(0, 10);

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

  const [amkaMatches, setAmkaMatches] = useState([]); // [{id, first_name, last_name, amka}]
  const [amkaExists, setAmkaExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  const [loading, setLoading] = useState(true);

  const firstErrorRef = useRef(null);

  // debounced duplicate checks
  const debouncedCheckDuplicate = useDebouncedCallback(async (field, value) => {
    await checkDuplicate(field, value);
  }, 500);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        setLoading(false);
      }
    };
    checkAuth();
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#a3895d]" />
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

    // base validation
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

    // server-side duplicate flags
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

    // Επεξεργασία τιμών smoking/alcohol
    const preparedForm = {
      ...form,
      smoking:
        form.smoking === "Προσαρμογή" ? form.customSmoking : form.smoking,
      alcohol:
        form.alcohol === "Προσαρμογή" ? form.customAlcohol : form.alcohol,
    };
    const { customSmoking, customAlcohol, ...cleanedFormRaw } = preparedForm;

    // Map για φύλο
    const genderMap = { Άνδρας: "male", Γυναίκα: "female", Άλλο: "other" };

    const cleanedForm = {
      ...cleanedFormRaw,
      gender: genderMap[cleanedFormRaw.gender] || cleanedFormRaw.gender || null,
    };

    // Μετατροπή κενών string σε null
    ["birth_date", "first_visit_date", "amka"].forEach((field) => {
      if (cleanedForm[field]?.trim?.() === "") cleanedForm[field] = null;
    });

    const { error } = await supabase.from("patients").insert([cleanedForm]);

    if (error) {
      setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
      console.error(
        "Supabase insert error:",
        error.message,
        error.details,
        error
      );
    } else {
      setMessage({
        type: "success",
        text: "Ο ασθενής καταχωρήθηκε με επιτυχία.",
      });
      setDirty(false);
      router.push("/admin/patients");
    }

    setLoading(false);
  };

  const checkDuplicate = async (field, value) => {
    if (!value?.trim()) return;

    if (field === "amka") {
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
      return;
    }

    if (field === "phone") {
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
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f5f4] py-22 px-4 text-[#3a3a38]">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-3xl p-10 border border-[#cfd8d6]">
        {/* header */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center py-4 px-2 border-b mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#2d2d2b] flex justify-center items-center gap-3">
            <Users className="w-6 h-6 text-[#8c7c68]" />
            Νέος Ασθενής
          </h1>
          <div className="w-5" />
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-14">
          <Section title="🧾 Στοιχεία Ασθενούς">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-md border border-gray-200">
              <InputField
                name="first_name"
                label="Όνομα"
                placeholder="π.χ. Ιωάννης"
                value={form.first_name}
                onChange={handleChange}
                required
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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="space-y-4">
                <SelectField
                  name="smoking"
                  label="Καπνιστής"
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
                  <InputField
                    name="customSmoking"
                    label="Προσαρμοσμένη Τιμή (Καπνιστής)"
                    value={form.customSmoking}
                    onChange={handleChange}
                  />
                )}
              </div>

              <div className="space-y-4">
                <SelectField
                  name="alcohol"
                  label="Κατανάλωση Αλκοόλ"
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
                  <InputField
                    name="customAlcohol"
                    label="Προσαρμοσμένη Τιμή (Αλκοόλ)"
                    value={form.customAlcohol}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-md border border-gray-200">
              <TextAreaField
                name="medications"
                label="Φάρμακα"
                value={form.medications}
                onChange={handleChange}
              />
            </div>
          </Section>

          <Section
            title={
              <div className="flex items-center justify-between">
                <span>📋 Κλινικές Πληροφορίες</span>
                <button
                  type="button"
                  onClick={() => setShowClinical((v) => !v)}
                  className="text-sm text-[#6b675f] underline underline-offset-2"
                >
                  {showClinical ? "Σύμπτυξη" : "Εμφάνιση"}
                </button>
              </div>
            }
          >
            {showClinical && (
              <div className="grid grid-cols-1 gap-6">
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
              className={`mb-6 text-center text-sm font-medium ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-7 py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Αποθήκευση..." : "Καταχώρηση"}
            </button>
          </div> */}

          {/* sticky bottom action bar */}
          <div className="sticky bottom-0 inset-x-0 mt-6 z-20 border-t border-[#e7eceb] bg-white/80 backdrop-blur px-4 py-3 rounded-b-3xl flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/admin/appointments/new")}
                className="text-sm rounded-lg border border-[#cfd8d6] px-4 py-2 hover:bg-[#f7f9f8] transition"
              >
                Αποθήκευση & Νέο Ραντεβού
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-5 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Αποθήκευση..." : "Καταχώρηση"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---------- components ---------- */
const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-[#dce6e4] bg-white/70 px-6 py-8 shadow-sm">
    <h2 className="text-lg font-semibold mb-6 text-[#4a4a48] tracking-tight">
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
  error = false,
  errorMessage = "",
  below,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-[#514f4b] mb-1"
    >
      {label}
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
      className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none transition ${
        error
          ? "border-red-500 focus:ring-2 focus:ring-red-400"
          : "border-[#d6d3cb] focus:ring-2 focus:ring-[#9e9483]"
      }`}
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
    {below && <div className="pt-1">{below}</div>}
  </div>
);

const SelectField = ({ name, label, value, onChange, options }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-[#514f4b] mb-1"
    >
      {label}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
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
        className="block text-sm font-medium text-[#514f4b] mb-1"
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
        className="w-full px-3 py-2 border border-[#d6d3cb] rounded-md text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#9e9483] transition"
      />
      <div className="mt-1 text-xs text-gray-500 text-right">
        {count}/{maxLength}
      </div>
    </div>
  );
};

const ConflictCard = ({ title, items }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800 shadow-sm">
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
