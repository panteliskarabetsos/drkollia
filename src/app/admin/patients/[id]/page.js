"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { IdCard, ArrowLeft, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

/* ---------- helpers ---------- */
const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
const normalizeAMKA = (s) => onlyDigits(s).slice(0, 11);
const normalizePhone = (s) => onlyDigits(s).slice(0, 10);

const GENDER_OPTIONS = [
  { label: "Άνδρας", value: "male" },
  { label: "Γυναίκα", value: "female" },
  { label: "Άλλο", value: "other" },
];

const MARITAL_OPTIONS = ["Άγαμος/η", "Έγγαμος/η", "Διαζευγμένος/η", "Χήρος/α"];
const CHILDREN_OPTIONS = ["Κανένα", "1", "2", "3", "4+"];

function validate(p) {
  const errs = {};
  if (!p.first_name?.trim()) errs.first_name = "Το «Όνομα» είναι υποχρεωτικό.";
  if (!p.last_name?.trim()) errs.last_name = "Το «Επώνυμο» είναι υποχρεωτικό.";
  if (p.amka && p.amka.length !== 11)
    errs.amka = "Ο ΑΜΚΑ πρέπει να έχει 11 ψηφία.";
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    errs.email = "Μη έγκυρο email.";
  if (p.phone && p.phone.length < 10)
    errs.phone = "Το τηλέφωνο πρέπει να έχει 10 ψηφία.";
  return errs;
}

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export default function EditPatientPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [dirty, setDirty] = useState(false);

  // custom values for select=Προσαρμογή
  const [customAlcohol, setCustomAlcohol] = useState("");
  const [customSmoking, setCustomSmoking] = useState("");

  const [amkaExists, setAmkaExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [amkaMatches, setAmkaMatches] = useState([]);

  const firstErrorRef = useRef(null);

  // -------- Auth + fetch once --------
  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        // normalize digits for AMKA/phone for consistent UI
        const normalized = {
          ...data,
          amka: normalizeAMKA(data.amka),
          phone: normalizePhone(data.phone),
        };
        setPatient(normalized);
        setOriginal(normalized);
        if (!["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"].includes(data.alcohol)) {
          setCustomAlcohol(data.alcohol || "");
        }
        if (
          !["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"].includes(
            data.smoking
          )
        ) {
          setCustomSmoking(data.smoking || "");
        }
      }
      setLoading(false);
    };
    run();
  }, [id, router]);

  // -------- unsaved changes guard --------
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // -------- shortcuts --------
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
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
  }, [router, patient, dirty]); // eslint-disable-line

  const setField = (field, value) => {
    if (!patient) return;
    // normalize
    if (field === "amka") value = normalizeAMKA(value);
    if (field === "phone") value = normalizePhone(value);
    const next = { ...patient, [field]: value };
    setPatient(next);
    setDirty(JSON.stringify(next) !== JSON.stringify(original));
    setMessage(null);

    // soft duplicate checks if user edited those
    if (field === "amka") {
      if (value?.length === 11) checkDuplicate("amka", value);
      else {
        setAmkaExists(false);
        setAmkaMatches([]);
      }
    }
    if (field === "phone") {
      if (value?.length === 10) checkDuplicate("phone", value);
      else setPhoneExists(false);
    }
  };

  const checkDuplicate = async (field, value) => {
    if (!value) return;
    if (field === "amka") {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, amka")
        .eq("amka", value)
        .neq("id", id) // exclude self
        .limit(5);
      if (!error) {
        setAmkaExists((data?.length ?? 0) > 0);
        setAmkaMatches(data || []);
      }
      return;
    }
    if (field === "phone") {
      const { data, error } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", value)
        .neq("id", id);
      if (!error) setPhoneExists((data?.length ?? 0) > 0);
    }
  };

  const handleSave = async () => {
    if (!patient) return;

    // validate
    const v = validate(patient);
    setErrors(v);
    if (Object.keys(v).length) {
      const firstKey = Object.keys(v)[0];
      const el = document.getElementById(firstKey);
      firstErrorRef.current = el;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 150);
      }
      setMessage({ type: "error", text: "Ελέγξτε τα πεδία της φόρμας." });
      return;
    }
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

    setSaving(true);

    // apply custom values
    const alcoholValue =
      patient.alcohol === "Προσαρμογή" ? customAlcohol : patient.alcohol;
    const smokingValue =
      patient.smoking === "Προσαρμογή" ? customSmoking : patient.smoking;

    // clean nullables for dates
    const payload = {
      ...patient,
      alcohol: alcoholValue,
      smoking: smokingValue,
      updated_at: new Date().toISOString(),
      birth_date: patient.birth_date ? patient.birth_date : null,
      first_visit_date: patient.first_visit_date
        ? patient.first_visit_date
        : null,
    };

    const { error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", id);

    if (error) {
      setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
      console.error("Supabase update error:", error);
      setSaving(false);
      return;
    }

    setMessage({ type: "success", text: "Οι αλλαγές αποθηκεύτηκαν." });
    setOriginal(payload);
    setDirty(false);
    setSaving(false);
    router.push("/admin/patients");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-[#3b3a36]">
        <ImSpinner2 className="animate-spin text-3xl text-[#8c7c68]" />
      </div>
    );
  }

  if (!patient) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <p>Δεν βρέθηκε ασθενής.</p>
      </main>
    );
  }

  const dateFields = ["birth_date", "first_visit_date"];

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 bg-[#f9f8f6] text-[#3b3a36] font-serif">
      <div
        className="mb-6 flex items-center gap-3 text-sm text-gray-500 hover:text-[#8c7c68] cursor-pointer"
        onClick={() => router.back()}
      >
        <FaArrowLeft className="text-xs" />
        <span>Επιστροφή</span>
      </div>

      <h1 className="text-3xl font-semibold mb-10 text-center text-[#2e2d2c] flex justify-center items-center gap-3">
        <IdCard className="w-6 h-6 text-[#8c7c68]" />
        Επεξεργασία Καρτέλας Ασθενούς
      </h1>

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
                      setTimeout(() => el.focus(), 150);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        {[
          ["first_name", "Όνομα"],
          ["last_name", "Επώνυμο"],
          ["amka", "ΑΜΚΑ"],
          ["email", "Email"],
          ["phone", "Τηλέφωνο"],
          ["birth_date", "Ημ. Γέννησης"],
          ["gender", "Φύλο"],
          ["occupation", "Επάγγελμα"],
          ["first_visit_date", "Ημ. Πρώτης Επίσκεψης"],
          ["marital_status", "Οικογενειακή Κατάσταση"],
          ["children", "Τέκνα"],
        ].map(([field, label]) => (
          <div key={field}>
            <label
              htmlFor={field}
              className="block mb-1 text-sm text-gray-700 font-medium"
            >
              {label}
            </label>

            {field === "gender" ? (
              <select
                id={field}
                value={patient[field] || ""}
                onChange={(e) => setField(field, e.target.value)}
                className={`w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? "border-rose-300 focus:ring-rose-300"
                    : "border-gray-200 focus:ring-[#8c7c68]"
                }`}
              >
                <option value="">Επιλέξτε</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field === "children" ? (
              <select
                id={field}
                value={patient[field] || ""}
                onChange={(e) => setField(field, e.target.value)}
                className={`w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? "border-rose-300 focus:ring-rose-300"
                    : "border-gray-200 focus:ring-[#8c7c68]"
                }`}
              >
                <option value="">Επιλέξτε</option>
                {CHILDREN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field === "marital_status" ? (
              <select
                id={field}
                value={patient[field] || ""}
                onChange={(e) => setField(field, e.target.value)}
                className={`w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? "border-rose-300 focus:ring-rose-300"
                    : "border-gray-200 focus:ring-[#8c7c68]"
                }`}
              >
                <option value="">Επιλέξτε</option>
                {MARITAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : dateFields.includes(field) ? (
              <input
                id={field}
                type="date"
                value={formatDate(patient[field])}
                onChange={(e) => setField(field, e.target.value)}
                className={`w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? "border-rose-300 focus:ring-rose-300"
                    : "border-gray-200 focus:ring-[#8c7c68]"
                }`}
              />
            ) : (
              <input
                id={field}
                type="text"
                value={patient[field] || ""}
                onChange={(e) => setField(field, e.target.value)}
                className={`w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors[field]
                    ? "border-rose-300 focus:ring-rose-300"
                    : "border-gray-200 focus:ring-[#8c7c68]"
                }`}
              />
            )}

            {errors[field] && (
              <p className="mt-1 flex items-start gap-1 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 mt-[2px]" />
                {errors[field]}
              </p>
            )}
          </div>
        ))}

        {/* Smoking */}
        <div>
          <label className="block mb-1 text-sm text-gray-700 font-medium">
            Κάπνισμα
          </label>
          <select
            value={
              ["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"].includes(
                patient.smoking
              )
                ? patient.smoking
                : "Προσαρμογή"
            }
            onChange={(e) => setField("smoking", e.target.value)}
            className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
          >
            <option value="">Επιλέξτε</option>
            <option value="Όχι">Όχι</option>
            <option value="Περιστασιακά">Περιστασιακά</option>
            <option value="Καθημερινά">Καθημερινά</option>
            <option value="Πρώην καπνιστής">Πρώην καπνιστής</option>
            <option value="Προσαρμογή">Προσαρμογή</option>
          </select>
          {patient.smoking === "Προσαρμογή" && (
            <input
              type="text"
              value={customSmoking}
              onChange={(e) => setCustomSmoking(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
          )}
        </div>

        {/* Alcohol */}
        <div>
          <label className="block mb-1 text-sm text-gray-700 font-medium">
            Αλκοόλ
          </label>
          <select
            value={
              ["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"].includes(patient.alcohol)
                ? patient.alcohol
                : "Προσαρμογή"
            }
            onChange={(e) => setField("alcohol", e.target.value)}
            className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
          >
            <option value="">Επιλέξτε</option>
            <option value="Όχι">Όχι</option>
            <option value="Σπάνια">Σπάνια</option>
            <option value="Συχνά">Συχνά</option>
            <option value="Καθημερινά">Καθημερινά</option>
            <option value="Προσαρμογή">Προσαρμογή</option>
          </select>
          {patient.alcohol === "Προσαρμογή" && (
            <input
              type="text"
              value={customAlcohol || ""}
              onChange={(e) => setCustomAlcohol(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
          )}
        </div>

        {/* Long text fields */}
        {[
          ["medications", "Φάρμακα"],
          ["gynecological_history", "Γυναικολογικό Ιστορικό"],
          ["hereditary_history", "Κληρονομικό Ιστορικό"],
          ["current_disease", "Παρούσα Νόσος"],
          ["physical_exam", "Αντικειμενική Εξέταση"],
          ["preclinical_screening", "Πάρακλινικός Έλεγχος"],
          ["notes", "Σημειώσεις"],
        ].map(([field, label]) => (
          <div key={field} className="md:col-span-2">
            <label
              className="block mb-1 text-sm text-gray-700 font-medium"
              htmlFor={field}
            >
              {label}
            </label>
            <textarea
              id={field}
              rows={4}
              value={patient[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              className="w-full px-4 py-3 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
            />
          </div>
        ))}

        {/* If AMKA duplicate, show matches */}
        {amkaExists && amkaMatches?.length > 0 && (
          <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800 shadow-sm">
            <div className="flex items-center gap-2 font-medium mb-1.5">
              <Users className="h-4 w-4" />
              <span>Υπάρχοντες ασθενείς με αυτόν τον ΑΜΚΑ</span>
              <span className="ml-auto text-xs bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
                {amkaMatches.length}
              </span>
            </div>
            <ul className="space-y-1">
              {amkaMatches.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                  <Link
                    href={`/admin/patients/${p.id}`}
                    className="hover:underline"
                  >
                    {p.last_name} {p.first_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* feedback */}
      {message && (
        <div
          className={`mt-4 text-center text-sm font-medium ${
            message.type === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* actions */}
      <div className="mt-10 flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-5 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Άκυρο
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="px-5 py-2 text-sm bg-[#8c7c68] text-white rounded-lg hover:bg-[#6f6253] disabled:opacity-50 transition flex items-center gap-2"
        >
          {saving && <ImSpinner2 className="animate-spin w-4 h-4" />}
          Αποθήκευση
        </button>
      </div>

      {/* sticky bottom bar */}
      <div className="sticky bottom-0 inset-x-0 mt-6 z-20 border-t border-[#e7eceb] bg-white/80 backdrop-blur px-4 py-3 rounded-b-3xl flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(`/admin/appointments/new?patient_id=${id}`)
            }
            className="text-sm rounded-lg border border-[#cfd8d6] px-4 py-2 hover:bg-[#f7f9f8] transition"
          >
            Νέο Ραντεβού
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="bg-[#2e2c28] hover:bg-[#1f1e1b] text-white px-5 py-2 rounded-lg text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {saving ? "Αποθήκευση..." : "Αποθήκευση"}
          </button>
        </div>
      </div>
    </main>
  );
}
