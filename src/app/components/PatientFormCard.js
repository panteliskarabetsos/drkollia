"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  AlertCircle,
  Mail,
  Phone as PhoneIcon,
  CalendarDays,
  Briefcase,
  IdCard,
  User,
} from "lucide-react";

/**
 * Reusable patient form card (create/edit) – pure Tailwind
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

  const baseFields = useMemo(
    () => ({
      basic: [
        [
          "first_name",
          "Όνομα",
          {
            autoComplete: "given-name",
            icon: <User className="h-4 w-4 text-gray-400" />,
          },
        ],
        [
          "last_name",
          "Επώνυμο",
          {
            autoComplete: "family-name",
            icon: <User className="h-4 w-4 text-gray-400" />,
          },
        ],
        [
          "amka",
          "ΑΜΚΑ",
          {
            inputMode: "numeric",
            maxLength: 11,
            counter: "11",
            icon: <IdCard className="h-4 w-4 text-gray-400" />,
          },
        ],
      ],
      contact: [
        [
          "email",
          "Email",
          {
            type: "email",
            autoComplete: "email",
            icon: <Mail className="h-4 w-4 text-gray-400" />,
          },
        ],
        [
          "phone",
          "Τηλέφωνο",
          {
            inputMode: "tel",
            maxLength: 10,
            counter: "10",
            icon: <PhoneIcon className="h-4 w-4 text-gray-400" />,
          },
        ],
      ],
      demographics: [
        [
          "birth_date",
          "Ημ. Γέννησης",
          {
            type: "date",
            icon: <CalendarDays className="h-4 w-4 text-gray-400" />,
          },
        ],
        ["gender", "Φύλο", { type: "select" }],
        ["marital_status", "Οικογενειακή Κατάσταση", { type: "select" }],
        ["children", "Τέκνα", { type: "select" }],
      ],
      other: [
        [
          "occupation",
          "Επάγγελμα",
          {
            autoComplete: "organization-title",
            icon: <Briefcase className="h-4 w-4 text-gray-400" />,
          },
        ],
        [
          "first_visit_date",
          "Ημ. Πρώτης Επίσκεψης",
          {
            type: "date",
            icon: <CalendarDays className="h-4 w-4 text-gray-400" />,
          },
        ],
      ],
    }),
    []
  );

  return (
    <div className="grid grid-cols-1 gap-6 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
      {/* Section: Βασικά στοιχεία */}
      <SectionHeader
        title="Βασικά στοιχεία"
        subtitle="Υποχρεωτικά πεδία με *"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {baseFields.basic.map(([field, label, extra]) => (
          <Field key={field} field={field} label={label} error={errors[field]}>
            <InputWithIcon
              id={field}
              icon={extra?.icon}
              value={patient?.[field] || ""}
              onChange={(e) =>
                setField(field, maybeTrimNumeric(field, e.target.value))
              }
              placeholder={placeholderFor(field)}
              autoComplete={extra?.autoComplete}
              inputMode={extra?.inputMode}
              maxLength={extra?.maxLength}
              ariaInvalid={!!errors[field]}
            />
            {counterFor(field, patient?.[field], extra?.counter)}
            {field === "amka" && <Hint text="11 ψηφία" />}
          </Field>
        ))}
      </div>

      <Divider />

      {/* Section: Επικοινωνία */}
      <SectionHeader title="Επικοινωνία" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {baseFields.contact.map(([field, label, extra]) => (
          <Field key={field} field={field} label={label} error={errors[field]}>
            <InputWithIcon
              id={field}
              icon={extra?.icon}
              type={extra?.type || "text"}
              value={patient?.[field] || ""}
              onChange={(e) => setField(field, e.target.value)}
              placeholder={placeholderFor(field)}
              autoComplete={extra?.autoComplete}
              inputMode={extra?.inputMode}
              maxLength={extra?.maxLength}
              ariaInvalid={!!errors[field]}
            />
            {counterFor(field, patient?.[field], extra?.counter)}
            {field === "phone" && <Hint text="10 ψηφία, μόνο αριθμοί." />}
          </Field>
        ))}
      </div>

      <Divider />

      {/* Section: Δημογραφικά */}
      <SectionHeader title="Δημογραφικά" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* birth_date */}
        <Field
          field="birth_date"
          label="Ημ. Γέννησης"
          error={errors["birth_date"]}
        >
          <InputWithIcon
            id="birth_date"
            icon={<CalendarDays className="h-4 w-4 text-gray-400" />}
            type="date"
            value={formatDate(patient?.birth_date)}
            onChange={(e) => setField("birth_date", e.target.value)}
            ariaInvalid={!!errors["birth_date"]}
          />
        </Field>

        {/* gender */}
        <Field field="gender" label="Φύλο" error={errors["gender"]}>
          <BaseSelect
            id="gender"
            value={patient?.gender || ""}
            onChange={(e) => setField("gender", e.target.value)}
            ariaInvalid={!!errors["gender"]}
          >
            <option value="">Επιλέξτε</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </BaseSelect>
        </Field>

        {/* marital_status */}
        <Field
          field="marital_status"
          label="Οικογενειακή Κατάσταση"
          error={errors["marital_status"]}
        >
          <BaseSelect
            id="marital_status"
            value={patient?.marital_status || ""}
            onChange={(e) => setField("marital_status", e.target.value)}
            ariaInvalid={!!errors["marital_status"]}
          >
            <option value="">Επιλέξτε</option>
            {MARITAL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </BaseSelect>
        </Field>

        {/* children */}
        <Field field="children" label="Τέκνα" error={errors["children"]}>
          <BaseSelect
            id="children"
            value={patient?.children || ""}
            onChange={(e) => setField("children", e.target.value)}
            ariaInvalid={!!errors["children"]}
          >
            <option value="">Επιλέξτε</option>
            {CHILDREN_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </BaseSelect>
        </Field>
      </div>

      <Divider />

      {/* Section: Λοιπά */}
      <SectionHeader title="Λοιπά" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* occupation */}
        <Field
          field="occupation"
          label="Επάγγελμα"
          error={errors["occupation"]}
        >
          <InputWithIcon
            id="occupation"
            icon={<Briefcase className="h-4 w-4 text-gray-400" />}
            value={patient?.occupation || ""}
            onChange={(e) => setField("occupation", e.target.value)}
            placeholder="Π.χ. Ιδιωτικός υπάλληλος"
            ariaInvalid={!!errors["occupation"]}
          />
        </Field>

        {/* first_visit_date */}
        <Field
          field="first_visit_date"
          label="Ημ. Πρώτης Επίσκεψης"
          error={errors["first_visit_date"]}
        >
          <InputWithIcon
            id="first_visit_date"
            icon={<CalendarDays className="h-4 w-4 text-gray-400" />}
            type="date"
            value={formatDate(patient?.first_visit_date)}
            onChange={(e) => setField("first_visit_date", e.target.value)}
            ariaInvalid={!!errors["first_visit_date"]}
          />
        </Field>
      </div>

      <Divider />

      {/* lifestyle */}
      <SectionHeader title="Συνήθειες" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Smoking */}
        <Field field="smoking" label="Κάπνισμα" error={errors["smoking"]}>
          <BaseSelect
            id="smoking"
            value={
              STD_SMOKING.includes(patient?.smoking)
                ? patient?.smoking
                : "Προσαρμογή"
            }
            onChange={(e) => setField("smoking", e.target.value)}
          >
            <option value="">Επιλέξτε</option>
            {STD_SMOKING.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="Προσαρμογή">Προσαρμογή</option>
          </BaseSelect>
          {patient?.smoking === "Προσαρμογή" && (
            <input
              type="text"
              value={customSmoking}
              onChange={(e) => setCustomSmoking(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
          )}
        </Field>

        {/* Alcohol */}
        <Field field="alcohol" label="Αλκοόλ" error={errors["alcohol"]}>
          <BaseSelect
            id="alcohol"
            value={
              STD_ALCOHOL.includes(patient?.alcohol)
                ? patient?.alcohol
                : "Προσαρμογή"
            }
            onChange={(e) => setField("alcohol", e.target.value)}
          >
            <option value="">Επιλέξτε</option>
            {STD_ALCOHOL.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="Προσαρμογή">Προσαρμογή</option>
          </BaseSelect>
          {patient?.alcohol === "Προσαρμογή" && (
            <input
              type="text"
              value={customAlcohol}
              onChange={(e) => setCustomAlcohol(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
          )}
        </Field>
      </div>

      <Divider />

      {/* Long text fields */}
      <SectionHeader title="Ιστορικό & Σημειώσεις" />
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
          <label className={labelClass()} htmlFor={field}>
            {label}
          </label>
          <textarea
            id={field}
            rows={5}
            value={patient?.[field] || ""}
            onChange={(e) => setField(field, e.target.value)}
            className="w-full px-4 py-3 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8c7c68] resize-y"
            aria-invalid={!!errors[field]}
          />
          {errors[field] && <ErrorText>{errors[field]}</ErrorText>}
        </div>
      ))}

      {/* Duplicate AMKA warning */}
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

/* ---------- small presentational pieces ---------- */

function SectionHeader({ title, subtitle }) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-stone-700">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="md:col-span-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
  );
}

function Field({ field, label, error, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={field} className={labelClass()}>
        {label}
        {["first_name", "last_name"].includes(field) && (
          <span className="ml-1 text-rose-500" title="Υποχρεωτικό">
            *
          </span>
        )}
      </label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function InputWithIcon({
  id,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  ariaInvalid,
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={ariaInvalid}
        className={[
          "w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2",
          ariaInvalid
            ? "border-rose-300 focus:ring-rose-300"
            : "border-gray-200 focus:ring-[#8c7c68]",
          icon ? "pl-9" : "",
        ].join(" ")}
      />
    </div>
  );
}

function BaseSelect({ id, value, onChange, ariaInvalid, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      aria-invalid={ariaInvalid}
      className={[
        "w-full px-4 py-2 bg-[#fdfdfc] border rounded-lg shadow-sm focus:outline-none focus:ring-2",
        ariaInvalid
          ? "border-rose-300 focus:ring-rose-300"
          : "border-gray-200 focus:ring-[#8c7c68]",
      ].join(" ")}
    >
      {children}
    </select>
  );
}

function ErrorText({ children }) {
  return (
    <p className="mt-1 flex items-start gap-1 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 mt-[2px]" />
      {children}
    </p>
  );
}

function Hint({ text }) {
  return <p className="mt-1 text-[11px] text-stone-500">{text}</p>;
}

function labelClass() {
  return "block mb-1 text-sm text-gray-700 font-medium";
}

/* ---------- helpers ---------- */
const STD_SMOKING = ["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"];
const STD_ALCOHOL = ["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"];

function formatDate(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function maybeTrimNumeric(field, val) {
  if (field === "amka") return (val || "").replace(/\D+/g, "").slice(0, 11);
  if (field === "phone") return (val || "").replace(/\D+/g, "").slice(0, 10);
  return val;
}

function counterFor(field, value, totalStr) {
  if (!["amka", "phone"].includes(field)) return null;
  const total = Number(totalStr) || (field === "amka" ? 11 : 10);
  const len = String(value || "").length;
  return (
    <div className="mt-1 text-[11px] text-stone-500 flex items-center justify-end tabular-nums">
      {len}/{total}
    </div>
  );
}
function placeholderFor(field) {
  switch (field) {
    case "first_name":
      return "π.χ. Μαρία";
    case "last_name":
      return "π.χ. Παπαδοπούλου";
    case "amka":
      return "12345678901"; // 11 ψηφία
    case "email":
      return "name@example.com";
    case "phone":
      return "69XXXXXXXX"; // 10 ψηφία
    case "birth_date":
      return "YYYY-MM-DD";
    case "occupation":
      return "π.χ. Ιδιωτικός υπάλληλος";
    case "first_visit_date":
      return "YYYY-MM-DD";
    case "marital_status":
      return "Επιλέξτε";
    case "children":
      return "Επιλέξτε";
    case "gender":
      return "Επιλέξτε";
    default:
      return "";
  }
}
