"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// reusable card
import PatientFormCard from "../../../components/PatientFormCard";

// icons
import {
  ArrowLeft,
  IdCard,
  Loader2,
  CalendarDays,
  Users,
  AlertCircle,
  Save,
  Plus,
  Copy,
  Check,
  Trash2,
  Phone as PhoneIcon,
  IdCard as IdCardIcon,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

/* ---------- helpers ---------- */
const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
const normalizeAMKA = (s) => onlyDigits(s).slice(0, 11);
const normalizePhone = (s) => onlyDigits(s).slice(0, 10);

const calcAge = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
};

const GENDER_OPTIONS = [
  { label: "Άνδρας", value: "male" },
  { label: "Γυναίκα", value: "female" },
  { label: "Άλλο", value: "other" },
];

const MARITAL_OPTIONS = ["Άγαμος/η", "Έγγαμος/η", "Διαζευγμένος/η", "Χήρος/α"];
const CHILDREN_OPTIONS = ["Κανένα", "1", "2", "3", "4+"];

function validate(p) {
  const errs = {};
  if (!p?.first_name?.trim()) errs.first_name = "Το «Όνομα» είναι υποχρεωτικό.";
  if (!p?.last_name?.trim()) errs.last_name = "Το «Επώνυμο» είναι υποχρεωτικό.";
  if (p?.amka && String(p.amka).length !== 11)
    errs.amka = "Ο ΑΜΚΑ πρέπει να έχει 11 ψηφία.";
  if (p?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    errs.email = "Μη έγκυρο email.";
  if (p?.phone && String(p.phone).length < 10)
    errs.phone = "Το τηλέφωνο πρέπει να έχει 10 ψηφία.";
  return errs;
}

// Only update allowed columns (avoid id/created_at etc.)
const UPDATABLE_FIELDS = [
  "first_name",
  "last_name",
  "amka",
  "email",
  "phone",
  "birth_date",
  "gender",
  "occupation",
  "first_visit_date",
  "notes",
  "marital_status",
  "children",
  "smoking",
  "alcohol",
  "medications",
  "gynecological_history",
  "hereditary_history",
  "current_disease",
  "physical_exam",
  "preclinical_screening",
];

function pickUpdatable(patient) {
  const out = {};
  for (const k of UPDATABLE_FIELDS) out[k] = patient?.[k] ?? null;
  // normalize empties
  out.birth_date = out.birth_date ? out.birth_date : null;
  out.first_visit_date = out.first_visit_date ? out.first_visit_date : null;
  out.amka = out.amka ? normalizeAMKA(out.amka) : null;
  out.phone = out.phone ? normalizePhone(out.phone) : null;
  return out;
}

function shallowEqual(a, b) {
  const ak = Object.keys(a || {});
  const bk = Object.keys(b || {});
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

export default function EditPatientPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patient, setPatient] = useState(null);
  const [original, setOriginal] = useState(null);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // {type:'error'|'success', text:string}
  const [dirty, setDirty] = useState(false);

  // duplicates
  const [checkingAmka, setCheckingAmka] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [amkaExists, setAmkaExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [amkaMatches, setAmkaMatches] = useState([]);

  const [copied, setCopied] = useState(""); // 'amka' | 'phone' | ''
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  // debounce timers
  const amkaTimerRef = useRef(null);
  const phoneTimerRef = useRef(null);

  // race safety
  const amkaReqRef = useRef(0);
  const phoneReqRef = useRef(0);

  // store original compare snapshot
  const originalComparableRef = useRef(null);

  const setDirtyFrom = useCallback((nextPatient) => {
    const nextComparable = pickUpdatable(nextPatient || {});
    const origComparable = originalComparableRef.current || {};
    setDirty(!shallowEqual(nextComparable, origComparable));
  }, []);

  const showError = useCallback(
    (text) => setMessage({ type: "error", text }),
    []
  );
  const showSuccess = useCallback(
    (text) => setMessage({ type: "success", text }),
    []
  );

  const confirmIfDirty = useCallback(
    (action) => {
      if (!dirty) return action();
      const ok = window.confirm("Υπάρχουν μη αποθηκευμένες αλλαγές. Συνέχεια;");
      if (ok) action();
    },
    [dirty]
  );

  // -------- Auth + fetch once --------
  const fetchPatient = useCallback(async () => {
    setMessage(null);
    setErrors({});
    setLoading(true);

    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) {
      showError("Σφάλμα αυθεντικοποίησης.");
      setLoading(false);
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      showError("Δεν βρέθηκε ασθενής ή δεν έχετε δικαιώματα πρόσβασης.");
      setPatient(null);
      setOriginal(null);
      originalComparableRef.current = null;
      setLoading(false);
      return;
    }

    const normalized = {
      ...data,
      amka: normalizeAMKA(data.amka),
      phone: normalizePhone(data.phone),
    };

    setPatient(normalized);
    setOriginal(normalized);

    originalComparableRef.current = pickUpdatable(normalized);
    setDirty(false);

    setLoading(false);
  }, [id, router, showError]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // -------- unsaved changes guard (tab close / refresh) --------
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
  const saveRef = useRef(null);
  saveRef.current = async () => {
    await handleSave();
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current?.();
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "Escape") {
        e.preventDefault();
        confirmIfDirty(() => router.back());
      }
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (e.key === "?" || (e.key === "/" && e.shiftKey))
      ) {
        e.preventDefault();
        confirmIfDirty(() => router.push("/admin/help"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, confirmIfDirty]);

  // -------- debounced duplicate checks --------
  const checkDuplicate = useCallback(
    async (field, value) => {
      if (!value) return;

      if (field === "amka") {
        const reqId = ++amkaReqRef.current;
        setCheckingAmka(true);
        const { data, error } = await supabase
          .from("patients")
          .select("id, first_name, last_name, amka")
          .eq("amka", value)
          .neq("id", id)
          .limit(5);

        if (reqId !== amkaReqRef.current) return; // ignore stale
        setCheckingAmka(false);

        if (!error) {
          setAmkaExists((data?.length ?? 0) > 0);
          setAmkaMatches(data || []);
        }
        return;
      }

      if (field === "phone") {
        const reqId = ++phoneReqRef.current;
        setCheckingPhone(true);
        const { data, error } = await supabase
          .from("patients")
          .select("id")
          .eq("phone", value)
          .neq("id", id)
          .limit(1);

        if (reqId !== phoneReqRef.current) return; // ignore stale
        setCheckingPhone(false);

        if (!error) setPhoneExists((data?.length ?? 0) > 0);
      }
    },
    [id]
  );

  // robust setter
  const setField = useCallback(
    (field, value) => {
      if (field === "amka") value = normalizeAMKA(value);
      if (field === "phone") value = normalizePhone(value);

      setPatient((prev) => {
        const next = { ...(prev ?? {}), [field]: value };
        setMessage(null);

        // update dirty
        setDirtyFrom(next);

        // clear field error as user edits
        setErrors((p) => {
          if (!p?.[field]) return p;
          const clone = { ...p };
          delete clone[field];
          return clone;
        });

        // debounce duplicates
        if (field === "amka") {
          if (amkaTimerRef.current) clearTimeout(amkaTimerRef.current);

          if (value?.length === 11) {
            amkaTimerRef.current = setTimeout(
              () => checkDuplicate("amka", value),
              350
            );
          } else {
            setAmkaExists(false);
            setAmkaMatches([]);
            setCheckingAmka(false);
          }
        }

        if (field === "phone") {
          if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);

          if (value?.length === 10) {
            phoneTimerRef.current = setTimeout(
              () => checkDuplicate("phone", value),
              350
            );
          } else {
            setPhoneExists(false);
            setCheckingPhone(false);
          }
        }

        return next;
      });
    },
    [checkDuplicate, setDirtyFrom]
  );

  const scrollToFirstError = useCallback((v) => {
    const firstKey = Object.keys(v || {})[0];
    if (!firstKey) return;
    const el = document.getElementById(firstKey);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus?.(), 150);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!patient || saving) return;

    const v = validate(patient);
    setErrors(v);

    if (Object.keys(v).length) {
      showError("Ελέγξτε τα πεδία της φόρμας.");
      scrollToFirstError(v);
      return;
    }

    if (checkingAmka || checkingPhone) {
      showError("Περιμένετε να ολοκληρωθεί ο έλεγχος διπλοτύπων…");
      return;
    }

    if (amkaExists) {
      showError("Υπάρχει ήδη ασθενής με αυτόν τον ΑΜΚΑ.");
      return;
    }

    if (phoneExists) {
      showError("Υπάρχει ήδη ασθενής με αυτό το τηλέφωνο.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      ...pickUpdatable(patient),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      showError(
        error?.message ||
          "Σφάλμα κατά την αποθήκευση. Ελέγξτε δικαιώματα (RLS) ή constraints."
      );
      setSaving(false);
      return;
    }

    // Update originals & dirty
    const nextOriginal = { ...patient, ...payload };
    setOriginal(nextOriginal);
    originalComparableRef.current = pickUpdatable(nextOriginal);
    setDirty(false);

    showSuccess("Οι αλλαγές αποθηκεύτηκαν.");
    setSaving(false);
  }, [
    patient,
    saving,
    id,
    amkaExists,
    phoneExists,
    checkingAmka,
    checkingPhone,
    showError,
    showSuccess,
    scrollToFirstError,
  ]);

  const handleReset = useCallback(() => {
    if (!original) return;
    confirmIfDirty(() => {
      setPatient(original);
      setErrors({});
      setMessage(null);
      setAmkaExists(false);
      setPhoneExists(false);
      setAmkaMatches([]);
      setCheckingAmka(false);
      setCheckingPhone(false);
      setDirty(false);
    });
  }, [original, confirmIfDirty]);

  const handleCopy = useCallback(async (key, value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(key);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      // ignore
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteText !== "DELETE") return;

    const { error } = await supabase.from("patients").delete().eq("id", id);

    if (error) {
      showError(
        "Αποτυχία διαγραφής. Υπάρχουν συνδεδεμένα ραντεβού/σημειώσεις ή δεν έχετε δικαιώματα."
      );
      return;
    }

    router.push("/admin/patients");
  }, [deleteText, id, router, showError]);

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <main className="min-h-[60vh] grid place-items-center bg-[#fbfaf7]">
        <div className="inline-flex items-center gap-2 text-stone-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Φόρτωση…</span>
        </div>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Δεν βρέθηκε ασθενής.</AlertDescription>
        </Alert>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/patients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Επιστροφή
          </Button>
          <Button variant="outline" onClick={fetchPatient} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Επανάληψη
          </Button>
        </div>
      </main>
    );
  }

  const createdAt = patient?.created_at ? new Date(patient.created_at) : null;
  const updatedAt = patient?.updated_at ? new Date(patient.updated_at) : null;
  const age = calcAge(patient?.birth_date);

  return (
    <main className="relative max-w-7xl mx-auto px-4 py-10">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#e9e2d7] blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-[#efe8dd] blur-3xl opacity-70" />
        <div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-[#f2eee6] blur-3xl opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),transparent_55%)]" />
      </div>

      {/* top bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => confirmIfDirty(() => router.back())}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Επιστροφή
        </Button>

        {/* desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              confirmIfDirty(() =>
                router.push(`/admin/appointments/new?patient_id=${id}`)
              )
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Νέο Ραντεβού
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Αποθήκευση
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* header hero */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-stone-200 bg-white/80 backdrop-blur shadow-sm">
            <IdCard className="h-6 w-6 text-stone-700" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-[#2f2e2b]">
              Επεξεργασία Καρτέλας Ασθενούς
            </h1>
            <p className="text-sm text-stone-600">
              {patient.last_name} {patient.first_name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={dirty ? "secondary" : "outline"}
            className={
              dirty ? "bg-amber-50 text-amber-700 border-amber-200" : ""
            }
          >
            {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
          </Badge>

          {(checkingAmka || checkingPhone) && (
            <Badge variant="outline" className="gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Έλεγχος…
            </Badge>
          )}

          {createdAt && (
            <div className="text-xs text-stone-500 flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Δημιουργία: {createdAt.toLocaleDateString("el-GR")}
            </div>
          )}
          {updatedAt && (
            <div className="text-xs text-stone-500 flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Τελ. αλλαγή: {updatedAt.toLocaleDateString("el-GR")}
            </div>
          )}
        </div>
      </div>

      {/* key chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <KeyChip
          icon={<IdCardIcon className="h-3.5 w-3.5" />}
          label="ΑΜΚΑ"
          value={patient.amka || "—"}
          onCopy={() => handleCopy("amka", patient.amka)}
          copied={copied === "amka"}
        />
        <KeyChip
          icon={<PhoneIcon className="h-3.5 w-3.5" />}
          label="Τηλέφωνο"
          value={patient.phone || "—"}
          onCopy={() => handleCopy("phone", patient.phone)}
          copied={copied === "phone"}
        />
        <KeyChip label="Ηλικία" value={age ?? "—"} />
        <Badge variant="outline" className="capitalize">
          {patient.gender === "male"
            ? "Άνδρας"
            : patient.gender === "female"
            ? "Γυναίκα"
            : "Άλλο"}
        </Badge>
      </div>

      {message && (
        <Alert
          className={`mt-6 ${
            message.type === "error"
              ? "border-rose-200 bg-rose-50/60"
              : "border-emerald-200 bg-emerald-50/60"
          }`}
        >
          <AlertDescription
            className={`text-sm ${
              message.type === "error" ? "text-rose-800" : "text-emerald-800"
            }`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* content grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* form */}
        <Card className="lg:col-span-2 bg-white/70 backdrop-blur border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Στοιχεία ασθενούς</CardTitle>
            <CardDescription>
              Ενημερώστε τα στοιχεία και αποθηκεύστε.{" "}
              <span className="text-stone-500">
                (Ctrl/⌘ + S για αποθήκευση)
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <PatientFormCard
              patient={patient || {}}
              errors={errors}
              setField={setField}
              amkaExists={amkaExists}
              amkaMatches={amkaMatches}
              dateFields={["birth_date", "first_visit_date"]}
              genderOptions={GENDER_OPTIONS}
              maritalOptions={MARITAL_OPTIONS}
              childrenOptions={CHILDREN_OPTIONS}
            />

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={handleReset}>
                Επαναφορά αλλαγών
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchPatient}
                  className="gap-2"
                  title="Ανανέωση από βάση"
                >
                  <RefreshCw className="h-4 w-4" />
                  Ανανέωση
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Αποθήκευση
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* side panels */}
        <div className="space-y-6">
          <Card className="bg-white/70 backdrop-blur border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Έλεγχοι</CardTitle>
              <CardDescription>Διπλότυπα & κατάσταση</CardDescription>
            </CardHeader>

            <CardContent className="text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Μη αποθηκευμένες αλλαγές</span>
                <span
                  className={`font-medium ${
                    dirty ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {dirty ? "Ναι" : "Όχι"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600">Έλεγχος ΑΜΚΑ</span>
                <span className="text-stone-700">
                  {checkingAmka ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Έλεγχος…
                    </span>
                  ) : amkaExists ? (
                    <span className="text-rose-700 font-medium">
                      Διπλότυπος
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium">ΟΚ</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-600">Έλεγχος τηλεφώνου</span>
                <span className="text-stone-700">
                  {checkingPhone ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Έλεγχος…
                    </span>
                  ) : phoneExists ? (
                    <span className="text-rose-700 font-medium">Διπλότυπο</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">ΟΚ</span>
                  )}
                </span>
              </div>

              {amkaExists && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                  <div className="flex items-center gap-2 font-medium text-rose-800">
                    <Users className="h-4 w-4" />
                    Διπλότυπος ΑΜΚΑ
                  </div>
                  <ul className="mt-2 space-y-1 text-rose-800">
                    {amkaMatches.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="underline"
                        >
                          {p.last_name} {p.first_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phoneExists && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Το τηλέφωνο υπάρχει ήδη σε άλλο προφίλ.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-rose-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Προσοχή
              </CardTitle>
              <CardDescription>Οριστικές ενέργειες</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium text-rose-800">
                      Διαγραφή ασθενούς
                    </div>
                    <div className="text-rose-700/90">
                      Η ενέργεια δεν μπορεί να αναιρεθεί.
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => {
                      setDeleteText("");
                      setShowDelete(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Διαγραφή
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* sticky actions (mobile only) */}
      <div className="md:hidden sticky bottom-0 inset-x-0 z-20 mt-8 border-t bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-600">
            {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                confirmIfDirty(() =>
                  router.push(`/admin/appointments/new?patient_id=${id}`)
                )
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Νέο
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Διαγραφή ασθενούς</DialogTitle>
            <DialogDescription>
              Θα διαγραφεί ο/η{" "}
              <strong>
                {patient.last_name} {patient.first_name}
              </strong>
              . Αν υπάρχουν συνδεδεμένα ραντεβού/σημειώσεις, η διαγραφή θα
              αποτύχει.
              <span className="mt-3 block text-sm text-stone-600">
                Πληκτρολογήστε <strong>DELETE</strong> για επιβεβαίωση.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Άκυρο
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteText !== "DELETE"}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Διαγραφή
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* --------- small UI helpers --------- */
function KeyChip({ icon, label, value, onCopy, copied }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 backdrop-blur px-3 py-1 text-xs shadow-sm">
      {icon ? <span className="text-stone-600">{icon}</span> : null}
      <span className="text-stone-500">{label}:</span>
      <span className="font-medium text-stone-800">{String(value ?? "—")}</span>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="ml-1 rounded-full p-1 hover:bg-stone-100 transition"
          title="Αντιγραφή"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-stone-600" />
          )}
        </button>
      )}
    </div>
  );
}
