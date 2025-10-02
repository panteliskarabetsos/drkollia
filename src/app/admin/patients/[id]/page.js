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

// our reusable card
import PatientFormCard from "../../../components/PatientFormCard";

// icons (lucide)
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

  const [amkaExists, setAmkaExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [amkaMatches, setAmkaMatches] = useState([]);

  const [copied, setCopied] = useState(""); // 'amka' | 'phone' | ''
  const [showDelete, setShowDelete] = useState(false);

  // -------- Auth + fetch once --------
  useEffect(() => {
    (async () => {
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
      if (!error && data) {
        const normalized = {
          ...data,
          amka: normalizeAMKA(data.amka),
          phone: normalizePhone(data.phone),
        };
        setPatient(normalized);
        setOriginal(normalized);
      }
      setLoading(false);
    })();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, patient, dirty]);

  // robust setter
  const setField = useCallback(
    (field, value) => {
      if (field === "amka") value = normalizeAMKA(value);
      if (field === "phone") value = normalizePhone(value);
      setPatient((prev) => {
        const next = { ...(prev ?? {}), [field]: value };
        setDirty(JSON.stringify(next) !== JSON.stringify(original));
        setMessage(null);
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
        return next;
      });
    },
    [original]
  );

  const checkDuplicate = async (field, value) => {
    if (!value) return;
    if (field === "amka") {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, amka")
        .eq("amka", value)
        .neq("id", id)
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

    const v = validate(patient);
    setErrors(v);
    if (Object.keys(v).length) {
      setMessage({ type: "error", text: "Ελέγξτε τα πεδία της φόρμας." });
      const firstKey = Object.keys(v)[0];
      const el = document.getElementById(firstKey);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 150);
      }
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

    const payload = {
      ...patient,
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
      console.error("Supabase update error:", error);
      setMessage({ type: "error", text: "Σφάλμα κατά την αποθήκευση." });
      setSaving(false);
      return;
    }

    setMessage({ type: "success", text: "Οι αλλαγές αποθηκεύτηκαν." });
    setOriginal(payload);
    setDirty(false);
    setSaving(false);
    router.push("/admin/patients");
  };

  const handleReset = () => {
    if (!original) return;
    setPatient(original);
    setErrors({});
    setDirty(false);
    setMessage(null);
  };

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(key);
      setTimeout(() => setCopied(""), 1200);
    } catch (_) {}
  };

  const handleDelete = async () => {
    // Simple delete with error surfacing; FKs may block if not cascaded
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      setMessage({
        type: "error",
        text: "Αποτυχία διαγραφής. Υπάρχουν συνδεδεμένα ραντεβού ή ελλιπή δικαιώματα.",
      });
      return;
    }
    router.push("/admin/patients");
  };

  /* ---------- UI ---------- */

  if (loading) {
    return (
      <main className="min-h-[60vh] grid place-items-center bg-gradient-to-b from-stone-50/70 via-white to-white">
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
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/patients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Επιστροφή
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
      {/* soft background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(55%_60%_at_50%_-5%,#000_0%,transparent_70%)] bg-[radial-gradient(1100px_450px_at_10%_-10%,#f1efe8_25%,transparent),radial-gradient(1000px_400px_at_90%_-20%,#ece9e0_20%,transparent)]" />

      {/* top bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Επιστροφή
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/appointments/new?patient_id=${id}`)
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
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-stone-200 bg-white shadow-sm">
            <IdCard className="h-6 w-6 text-stone-700" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
              Επεξεργασία Καρτέλας Ασθενούς
            </h1>
            <p className="text-sm text-stone-600">
              {patient.last_name} {patient.first_name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dirty status chip */}
          <Badge
            variant={dirty ? "secondary" : "outline"}
            className={
              dirty ? "bg-amber-50 text-amber-700 border-amber-200" : ""
            }
            title="Κατάσταση φόρμας"
          >
            {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
          </Badge>
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
        <div
          className={`mt-6 ${
            message.type === "error" ? "text-red-600" : "text-green-700"
          } text-sm`}
        >
          {message.text}
        </div>
      )}

      {/* content grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* form (2 cols on desktop) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Στοιχεία ασθενούς</CardTitle>
            <CardDescription>
              Ενημερώστε τα στοιχεία και αποθηκεύστε.
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

            {/* form footer actions */}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" onClick={handleReset}>
                Επαναφορά αλλαγών
              </Button>
              <div className="text-xs text-stone-500">
                Συντόμευση:{" "}
                <kbd className="px-1.5 py-0.5 rounded border">Ctrl/⌘ + S</kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* side panels */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Κατάσταση</CardTitle>
              <CardDescription>Σύνοψη ενεργειών</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Αποθηκευμένες αλλαγές</span>
                <span
                  className={`font-medium ${
                    dirty ? "text-amber-700" : "text-green-700"
                  }`}
                >
                  {dirty ? "Εκκρεμούν" : "ΟΚ"}
                </span>
              </div>
              {amkaExists && (
                <div className="rounded-md border border-rose-200 bg-rose-50/70 p-2">
                  <div className="flex items-center gap-2 font-medium text-rose-800">
                    <Users className="h-4 w-4" />
                    Διπλότυπος ΑΜΚΑ
                  </div>
                  <ul className="mt-1 text-rose-800">
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
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Το τηλέφωνο υπάρχει ήδη σε άλλο προφίλ.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-rose-700">Προσοχή</CardTitle>
              <CardDescription>Οριστικές ενέργειες</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/60 p-3">
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
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Διαγραφή
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* sticky actions */}
      <div className="sticky bottom-0 inset-x-0 z-20 mt-8 border-t bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-stone-600">
            {dirty ? "Μη αποθηκευμένες αλλαγές" : "Όλα αποθηκευμένα"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/admin/appointments/new?patient_id=${id}`)
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
              . Η ενέργεια δεν μπορεί να αναιρεθεί. Αν υπάρχουν συνδεδεμένα
              ραντεβού, η διαγραφή θα αποτύχει.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Άκυρο
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
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
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs shadow-sm">
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
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-stone-600" />
          )}
        </button>
      )}
    </div>
  );
}
