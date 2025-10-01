"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, AlertCircle } from "lucide-react";

/**
 * components/PatientFormCard/page.js
 *
 * Επαναχρησιμοποιήσιμη κάρτα φόρμας ασθενούς (Create/Edit) σε καθαρό Tailwind.
 * Δεν εξαρτάται από shadcn/ui. Συμβατή με App Router.
 *
 * Props:
 *  - patient: αντικείμενο με τα πεδία του πίνακα patients
 *  - errors?: { [field]: string }
 *  - setField: (key, value) => void
 *  - amkaExists?: boolean
 *  - amkaMatches?: Array<{ id, first_name, last_name }>
 *  - dateFields?: string[] (default: ['birth_date', 'first_visit_date'])
 *  - genderOptions?: Array<{ value, label }>
 *  - maritalOptions?: string[]
 *  - childrenOptions?: string[]
 */
export default function PatientFormCard({
  patient = {},
  errors = {},
  setField,
  amkaExists = false,
  amkaMatches = [],
  dateFields: dateFieldsProp,
  genderOptions: genderOptionsProp,
  maritalOptions: maritalOptionsProp,
  childrenOptions: childrenOptionsProp,
}) {
  const dateFields = dateFieldsProp ?? ["birth_date", "first_visit_date"];

  const GENDER_OPTIONS = genderOptionsProp ?? [
    { value: "male", label: "Άνδρας" },
    { value: "female", label: "Γυναίκα" },
    { value: "other", label: "Άλλο" },
  ];
  const MARITAL_OPTIONS = maritalOptionsProp ?? [
    "Άγαμος/η",
    "Έγγαμος/η",
    "Διαζευγμένος/η",
    "Χήρος/α",
  ];
  const CHILDREN_OPTIONS = childrenOptionsProp ?? [
    "Κανένα",
    "1",
    "2",
    "3",
    "4+",
  ];

  const [customSmoking, setCustomSmoking] = useState(
    !STD_SMOKING.includes(patient?.smoking ?? "") ? patient?.smoking ?? "" : ""
  );
  const [customAlcohol, setCustomAlcohol] = useState(
    !STD_ALCOHOL.includes(patient?.alcohol ?? "") ? patient?.alcohol ?? "" : ""
  );

  useEffect(() => {
    if ((patient?.smoking ?? "") === "Προσαρμογή")
      setField("smoking", customSmoking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customSmoking]);

  useEffect(() => {
    if ((patient?.alcohol ?? "") === "Προσαρμογή")
      setField("alcohol", customAlcohol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customAlcohol]);

  const fields = useMemo(
    () => [
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
    ],
    []
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
      {fields.map(([field, label]) => (
        <div key={field} className="min-w-0">
          <label
            htmlFor={field}
            className="block mb-1 text-sm text-gray-700 font-medium"
          >
            {label}
            {["first_name", "last_name"].includes(field) && (
              <span className="ml-1 text-rose-500" title="Υποχρεωτικό">
                *
              </span>
            )}
          </label>

          {field === "gender" ? (
            <select
              id={field}
              value={patient?.[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              className={selectClass(errors[field])}
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
              value={patient?.[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              className={selectClass(errors[field])}
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
              value={patient?.[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              className={selectClass(errors[field])}
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
              value={formatDate(patient?.[field])}
              onChange={(e) => setField(field, e.target.value)}
              className={inputClass(errors[field])}
            />
          ) : (
            <input
              id={field}
              type="text"
              value={patient?.[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              className={inputClass(errors[field])}
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

      {/* Κάπνισμα */}
      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Κάπνισμα
        </label>
        <select
          value={
            STD_SMOKING.includes(patient?.smoking)
              ? patient?.smoking
              : "Προσαρμογή"
          }
          onChange={(e) => setField("smoking", e.target.value)}
          className={selectClass()}
        >
          <option value="">Επιλέξτε</option>
          {STD_SMOKING.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
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

      {/* Αλκοόλ */}
      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Αλκοόλ
        </label>
        <select
          value={
            STD_ALCOHOL.includes(patient?.alcohol)
              ? patient?.alcohol
              : "Προσαρμογή"
          }
          onChange={(e) => setField("alcohol", e.target.value)}
          className={selectClass()}
        >
          <option value="">Επιλέξτε</option>
          {STD_ALCOHOL.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
          <option value="Προσαρμογή">Προσαρμογή</option>
        </select>
        {patient.alcohol === "Προσαρμογή" && (
          <input
            type="text"
            value={customAlcohol}
            onChange={(e) => setCustomAlcohol(e.target.value)}
            className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
            placeholder="Εισάγετε τιμή..."
          />
        )}
      </div>

      {/* Μεγάλα πεδία κειμένου */}
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
            value={patient?.[field] || ""}
            onChange={(e) => setField(field, e.target.value)}
            className="w-full px-4 py-3 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
          />
          {errors[field] && (
            <p className="mt-1 flex items-start gap-1 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-[2px]" />
              {errors[field]}
            </p>
          )}
        </div>
      ))}

      {/* Προειδοποίηση διπλοτύπων ΑΜΚΑ */}
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
                  {(p.last_name ?? "") + " " + (p.first_name ?? "")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------- helpers ----------------
const STD_SMOKING = ["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"];
const STD_ALCOHOL = ["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"];

function formatDate(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val; // already YYYY-MM-DD
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  // Use UTC parts to avoid timezone off-by-one
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function inputClass(hasError) {
  return [
    "w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 focus:ring-rose-300"
      : "border-gray-200 focus:ring-[#8c7c68]",
  ].join(" ");
}

function selectClass(hasError) {
  return [
    "w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 focus:ring-rose-300"
      : "border-gray-200 focus:ring-[#8c7c68]",
  ].join(" ");
}
