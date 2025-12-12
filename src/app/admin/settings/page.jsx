"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { offlineAuth } from "@/lib/offlineAuth";

// shadcn/ui
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// icons
import {
  Shield,
  Smartphone,
  WifiOff,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  PowerOff,
  Info,
  CheckCircle2,
  XCircle,
  Lock,
  ChevronLeft,
  AlertTriangle,
  Bell,
  CalendarDays,
  HardDrive,
  Trash2,
} from "lucide-react";

import { motion } from "framer-motion";

const MIN_PIN = 6;

// -------------------- local device settings helpers --------------------
const LS_PREFIX = "admin_settings:";
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}
}

// -------------------- pin helpers --------------------
function digitsOnly(str) {
  return (str || "").replace(/\D/g, "");
}
function normalizePin(pin) {
  return digitsOnly(pin).slice(0, 12);
}
function isAllSame(pin) {
  if (!pin) return false;
  return new Set(pin.split("")).size === 1;
}
function isAscendingSequence(pin) {
  if (!pin || pin.length < 4) return false;
  for (let i = 1; i < pin.length; i++) {
    if (Number(pin[i]) !== (Number(pin[i - 1]) + 1) % 10) return false;
  }
  return true;
}
function isDescendingSequence(pin) {
  if (!pin || pin.length < 4) return false;
  for (let i = 1; i < pin.length; i++) {
    if (Number(pin[i]) !== (Number(pin[i - 1]) + 9) % 10) return false;
  }
  return true;
}

// -------------------- clinic_settings helpers (single row id=1) --------------------
const CLINIC_SETTINGS_ID = 1;

async function fetchClinicSettings() {
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("id", CLINIC_SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;

  // seed row if missing
  if (!data) {
    const { data: inserted, error: insErr } = await supabase
      .from("clinic_settings")
      .upsert({ id: CLINIC_SETTINGS_ID }, { onConflict: "id" })
      .select("*")
      .single();

    if (insErr) throw insErr;
    return inserted;
  }

  return data;
}

async function updateClinicSettings(patch) {
  const { data, error } = await supabase
    .from("clinic_settings")
    .update(patch)
    .eq("id", CLINIC_SETTINGS_ID)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export default function AdminSettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // offline status
  const [enabled, setEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // offline pin fields
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [show, setShow] = useState({ old: false, next: false, confirm: false });

  // device/offline policy (local)
  const [deviceLabel, setDeviceLabel] = useState("");
  const [autoLockMinutes, setAutoLockMinutes] = useState(10);
  const [maxAttempts, setMaxAttempts] = useState(6);
  const [cooldownSeconds, setCooldownSeconds] = useState(30);

  // online appointments (server via clinic_settings + local fallback if columns missing)
  const [acceptingAppointments, setAcceptingAppointments] = useState(true);
  const [closedMessage, setClosedMessage] = useState(
    "Αυτή τη στιγμή δεν δεχόμαστε νέα online ραντεβού. Καλέστε στο τηλέφωνο για εξυπηρέτηση."
  );
  const [clinicPhone, setClinicPhone] = useState("");

  // notifications (server via clinic_settings if you add columns, otherwise local fallback)
  const [sendConfirmationEmails, setSendConfirmationEmails] = useState(true);
  const [sendAdminNotifications, setSendAdminNotifications] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState(null);

  // ui feedback
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [errors, setErrors] = useState({
    oldPin: null,
    newPin: null,
    confirmPin: null,
  });

  const newPinRef = useRef(null);

  const refreshOffline = useCallback(() => {
    setEnabled(!!offlineAuth?.isEnabled?.());
    setHasPin(!!offlineAuth?.hasPin?.());
  }, []);

  const loadAllSettings = useCallback(async () => {
    // ---- local first
    setDeviceLabel(lsGet("deviceLabel", ""));
    setAutoLockMinutes(lsGet("autoLockMinutes", 10));
    setMaxAttempts(lsGet("maxAttempts", 6));
    setCooldownSeconds(lsGet("cooldownSeconds", 30));

    // local fallbacks for clinic settings (in case your table has only accept_new_appointments)
    const localClinicPhone = lsGet("clinicPhone", "");
    const localClosedMsg = lsGet(
      "closedMessage",
      "Αυτή τη στιγμή δεν δεχόμαστε νέα online ραντεβού. Καλέστε στο τηλέφωνο για εξυπηρέτηση."
    );
    const localCE = lsGet("sendConfirmationEmails", true);
    const localAN = lsGet("sendAdminNotifications", false);
    const localAE = lsGet("adminEmail", "");

    // ---- server settings (clinic_settings row id=1)
    const s = await fetchClinicSettings();

    setAcceptingAppointments(
      s?.accept_new_appointments === undefined
        ? true
        : !!s.accept_new_appointments
    );

    // if you later add these columns, they will load from server automatically:
    setClinicPhone(
      Object.prototype.hasOwnProperty.call(s, "clinic_phone")
        ? String(s.clinic_phone ?? "")
        : String(localClinicPhone ?? "")
    );

    setClosedMessage(
      Object.prototype.hasOwnProperty.call(s, "closed_message")
        ? String(
            (typeof s.closed_message === "string" && s.closed_message.trim()
              ? s.closed_message
              : localClosedMsg) ?? localClosedMsg
          )
        : String(localClosedMsg ?? "")
    );

    setSendConfirmationEmails(
      Object.prototype.hasOwnProperty.call(s, "send_confirmation_emails")
        ? !!s.send_confirmation_emails
        : !!localCE
    );

    setSendAdminNotifications(
      Object.prototype.hasOwnProperty.call(s, "send_admin_notifications")
        ? !!s.send_admin_notifications
        : !!localAN
    );

    setAdminEmail(
      Object.prototype.hasOwnProperty.call(s, "admin_email")
        ? String(s.admin_email ?? "")
        : String(localAE ?? "")
    );

    setSettingsUpdatedAt(s?.updated_at ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.replace("/login?redirect=/admin/settings");
        return;
      }
      setUser(session.user);
      refreshOffline();

      try {
        await loadAllSettings();
      } catch (e) {
        console.error(e);
        setMsg({
          type: "error",
          text: "Δεν μπόρεσα να φορτώσω ρυθμίσεις από clinic_settings (RLS/πίνακας/στήλες).",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refreshOffline, loadAllSettings]);

  // persist local changes (device)
  useEffect(() => lsSet("deviceLabel", deviceLabel), [deviceLabel]);
  useEffect(() => lsSet("autoLockMinutes", autoLockMinutes), [autoLockMinutes]);
  useEffect(() => lsSet("maxAttempts", maxAttempts), [maxAttempts]);
  useEffect(() => lsSet("cooldownSeconds", cooldownSeconds), [cooldownSeconds]);

  // persist local fallbacks (clinic settings extras)
  useEffect(() => lsSet("clinicPhone", clinicPhone), [clinicPhone]);
  useEffect(() => lsSet("closedMessage", closedMessage), [closedMessage]);
  useEffect(
    () => lsSet("sendConfirmationEmails", sendConfirmationEmails),
    [sendConfirmationEmails]
  );
  useEffect(
    () => lsSet("sendAdminNotifications", sendAdminNotifications),
    [sendAdminNotifications]
  );
  useEffect(() => lsSet("adminEmail", adminEmail), [adminEmail]);

  // sync offline status across tabs if storage used
  useEffect(() => {
    const onStorage = () => refreshOffline();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshOffline]);

  const isActive = enabled && hasPin;

  const pinStrength = useMemo(() => {
    if (!newPin) return 0;

    const unique = new Set(newPin.split("")).size;
    const lenScore = Math.min(newPin.length / (MIN_PIN + 2), 1);
    const uniqScore = Math.min(unique / 6, 1);

    const penalties =
      (isAllSame(newPin) ? 0.35 : 0) +
      (isAscendingSequence(newPin) ? 0.35 : 0) +
      (isDescendingSequence(newPin) ? 0.35 : 0);

    const raw = lenScore * 0.6 + uniqScore * 0.4;
    const final = Math.max(0, raw - penalties);
    return Math.round(final * 100);
  }, [newPin]);

  const Requirement = ({ ok, children }) => (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </div>
  );

  const clearFeedback = () => {
    setMsg(null);
    setErrors({ oldPin: null, newPin: null, confirmPin: null });
  };

  const validatePin = useCallback(
    (pin, confirm, old) => {
      const e = { oldPin: null, newPin: null, confirmPin: null };

      if (isActive && !old) e.oldPin = "Εισάγετε τον τρέχοντα PIN.";
      if (!pin) e.newPin = "Εισάγετε νέο PIN.";
      else if (pin.length < MIN_PIN) e.newPin = `Τουλάχιστον ${MIN_PIN} ψηφία.`;
      else if (isAllSame(pin)) e.newPin = "Αποφύγετε ίδιο ψηφίο παντού.";
      else if (isAscendingSequence(pin) || isDescendingSequence(pin))
        e.newPin = "Αποφύγετε απλές ακολουθίες (π.χ. 123456).";
      else if (isActive && old && pin === old)
        e.newPin = "Ο νέος PIN πρέπει να διαφέρει.";

      if (!confirm) e.confirmPin = "Επιβεβαιώστε τον νέο PIN.";
      else if (pin && confirm && pin !== confirm)
        e.confirmPin = "Δεν ταιριάζει.";

      return e;
    },
    [isActive]
  );

  const PinField = ({
    id,
    label,
    value,
    onChange,
    autoComplete,
    showKey,
    inputRef,
    error,
  }) => {
    const handleChange = (e) => onChange(normalizePin(e.target.value));
    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {error ? (
            <span className="text-xs text-destructive">{error}</span>
          ) : null}
        </div>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            name={id}
            type={show[showKey] ? "text" : "password"}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={autoComplete ?? "off"}
            className={[
              "tracking-widest text-center pr-11",
              error
                ? "border-destructive focus-visible:ring-destructive/30"
                : "",
            ].join(" ")}
            value={value}
            onChange={handleChange}
            aria-invalid={!!error}
          />
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    setShow((s) => ({ ...s, [showKey]: !s[showKey] }))
                  }
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-muted-foreground hover:text-foreground"
                  aria-label={show[showKey] ? "Απόκρυψη PIN" : "Εμφάνιση PIN"}
                >
                  {show[showKey] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{show[showKey] ? "Απόκρυψη" : "Εμφάνιση"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground">
          Τουλάχιστον {MIN_PIN} ψηφία. Μόνο αριθμοί.
        </p>
      </div>
    );
  };

  const canSubmitSet = useMemo(() => {
    const e = validatePin(newPin, confirmPin, null);
    return !e.newPin && !e.confirmPin;
  }, [newPin, confirmPin, validatePin]);

  const canSubmitChange = useMemo(() => {
    const e = validatePin(newPin, confirmPin, oldPin);
    return !e.oldPin && !e.newPin && !e.confirmPin;
  }, [newPin, confirmPin, oldPin, validatePin]);

  // -------------------- offline actions --------------------
  const handleSetPin = async () => {
    clearFeedback();
    const e = validatePin(newPin, confirmPin, null);
    setErrors(e);
    if (e.newPin || e.confirmPin) return;

    setBusy(true);
    try {
      await offlineAuth.enable(user.id, newPin);

      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setShow({ old: false, next: false, confirm: false });

      refreshOffline();
      setMsg({
        type: "success",
        text: "Ο offline PIN ορίστηκε για αυτή τη συσκευή.",
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Αποτυχία ορισμού PIN." });
    } finally {
      setBusy(false);
    }
  };

  const handleChangePin = async () => {
    clearFeedback();
    const e = validatePin(newPin, confirmPin, oldPin);
    setErrors(e);
    if (e.oldPin || e.newPin || e.confirmPin) return;

    setBusy(true);
    try {
      const ok = await offlineAuth.changePin(oldPin, newPin);
      if (!ok) {
        setErrors((prev) => ({ ...prev, oldPin: "Λάθος τρέχων PIN." }));
        return;
      }

      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setShow({ old: false, next: false, confirm: false });

      refreshOffline();
      setMsg({ type: "success", text: "Ο PIN άλλαξε επιτυχώς." });
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Αποτυχία αλλαγής PIN." });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    clearFeedback();
    setBusy(true);
    try {
      await offlineAuth.disable();
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setShow({ old: false, next: false, confirm: false });

      refreshOffline();
      setMsg({
        type: "info",
        text: "Η offline πρόσβαση απενεργοποιήθηκε για αυτή τη συσκευή.",
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Αποτυχία απενεργοποίησης." });
    } finally {
      setBusy(false);
    }
  };

  const handleLockNow = async () => {
    clearFeedback();
    try {
      if (typeof offlineAuth?.lock === "function") {
        await offlineAuth.lock();
        setMsg({
          type: "info",
          text: "Κλείδωσε η offline πρόσβαση (lock now).",
        });
      } else {
        localStorage.setItem("offlineAuth:locked", "1");
        setMsg({
          type: "info",
          text: "Έγινε lock flag στη συσκευή (offlineAuth:locked).",
        });
      }
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία lock." });
    }
  };

  const handleClearOfflineData = async () => {
    clearFeedback();
    setBusy(true);
    try {
      if (typeof offlineAuth?.clearDevice === "function") {
        await offlineAuth.clearDevice();
      } else {
        localStorage.removeItem("offlineAuth:locked");
        Object.keys(localStorage)
          .filter(
            (k) => k.startsWith("offlineAuth") || k.startsWith("offline_auth")
          )
          .forEach((k) => localStorage.removeItem(k));
      }
      refreshOffline();
      setMsg({
        type: "info",
        text: "Καθαρίστηκαν offline δεδομένα στη συσκευή.",
      });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία καθαρισμού offline δεδομένων." });
    } finally {
      setBusy(false);
    }
  };

  // -------------------- server settings save (clinic_settings) --------------------
  const saveAppointmentsSettings = async () => {
    clearFeedback();
    setBusy(true);
    try {
      const current = await fetchClinicSettings();

      // always save accept_new_appointments to clinic_settings
      const patch = {
        accept_new_appointments: !!acceptingAppointments,
      };

      // only save extra fields if the columns exist in the table
      if (Object.prototype.hasOwnProperty.call(current, "clinic_phone")) {
        patch.clinic_phone = String(clinicPhone || "");
      }
      if (Object.prototype.hasOwnProperty.call(current, "closed_message")) {
        patch.closed_message = String(closedMessage || "");
      }

      const s = await updateClinicSettings(patch);
      setSettingsUpdatedAt(s?.updated_at ?? null);

      // extras always saved locally (fallback), but success message stays simple
      setMsg({ type: "success", text: "Αποθηκεύτηκαν οι ρυθμίσεις ραντεβού." });
    } catch (e) {
      console.error(e);
      setMsg({
        type: "error",
        text: "Αποτυχία αποθήκευσης. Ελέγξτε RLS/πίνακα clinic_settings.",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveNotificationSettings = async () => {
    clearFeedback();
    setBusy(true);
    try {
      const current = await fetchClinicSettings();

      const patch = {};
      if (
        Object.prototype.hasOwnProperty.call(
          current,
          "send_confirmation_emails"
        )
      ) {
        patch.send_confirmation_emails = !!sendConfirmationEmails;
      }
      if (
        Object.prototype.hasOwnProperty.call(
          current,
          "send_admin_notifications"
        )
      ) {
        patch.send_admin_notifications = !!sendAdminNotifications;
      }
      if (Object.prototype.hasOwnProperty.call(current, "admin_email")) {
        patch.admin_email = String(adminEmail || "");
      }

      // if your table doesn't have these columns yet, we just keep local storage
      if (Object.keys(patch).length > 0) {
        const s = await updateClinicSettings(patch);
        setSettingsUpdatedAt(s?.updated_at ?? null);
        setMsg({
          type: "success",
          text: "Αποθηκεύτηκαν οι ρυθμίσεις ειδοποιήσεων.",
        });
      } else {
        setMsg({
          type: "info",
          text: "Οι ρυθμίσεις ειδοποιήσεων αποθηκεύτηκαν τοπικά (η clinic_settings δεν έχει ακόμα τις αντίστοιχες στήλες).",
        });
      }
    } catch (e) {
      console.error(e);
      setMsg({
        type: "error",
        text: "Αποτυχία αποθήκευσης ειδοποιήσεων. Ελέγξτε RLS/στήλες.",
      });
    } finally {
      setBusy(false);
    }
  };

  // autofocus
  useEffect(() => {
    if (!loading && !isActive && newPinRef.current) {
      newPinRef.current.focus({ preventScroll: true });
    }
  }, [loading, isActive]);

  const statusBadge = (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className="rounded-full px-3 py-1 text-xs"
    >
      {isActive ? "Offline ενεργό" : "Offline ανενεργό"}
    </Badge>
  );

  if (loading) {
    return (
      <main className="relative max-w-4xl mx-auto px-6 py-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-50 to-white" />
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-56" />
            </div>
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-44" />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative max-w-4xl mx-auto px-6 py-10" aria-busy={busy}>
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-stone-50 to-transparent" />
        <div className="absolute -top-12 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 blur-3xl opacity-60" />
        <div className="absolute top-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 blur-3xl opacity-35" />
      </div>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between gap-4 mb-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.back()}
              aria-label="Πίσω"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              <Lock className="h-7 w-7" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-stone-900 to-stone-600">
                Ρυθμίσεις
              </span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Διαχειριστείτε ρυθμίσεις εφαρμογής, ραντεβού, ειδοποιήσεων και
            offline πρόσβασης.
          </p>
          {settingsUpdatedAt ? (
            <p className="text-xs text-muted-foreground">
              Τελευταία ενημέρωση:{" "}
              {new Date(settingsUpdatedAt).toLocaleString("el-GR")}
            </p>
          ) : null}
        </div>
        {statusBadge}
      </motion.div>

      {/* global msg */}
      {msg ? (
        <Alert
          variant={msg.type === "error" ? "destructive" : "default"}
          className="mb-6"
          role="status"
          aria-live="polite"
        >
          {msg.type === "error" ? (
            <Shield className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
          <AlertTitle>
            {msg.type === "error"
              ? "Σφάλμα"
              : msg.type === "success"
              ? "Επιτυχία"
              : "Ενημέρωση"}
          </AlertTitle>
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Ραντεβού
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Ειδοποιήσεις
          </TabsTrigger>
          <TabsTrigger value="offline" className="gap-2">
            <KeyRound className="h-4 w-4" /> Offline / PIN
          </TabsTrigger>
          <TabsTrigger value="device" className="gap-2">
            <HardDrive className="h-4 w-4" /> Συσκευή
          </TabsTrigger>
        </TabsList>

        {/* -------------------- appointments -------------------- */}
        <TabsContent value="appointments" className="mt-6">
          <Card className="shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Online ραντεβού
              </CardTitle>
              <CardDescription>
                Ανοίξτε/κλείστε την online φόρμα και ορίστε το μήνυμα όταν είναι
                κλειστή.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Αποδοχή νέων online ραντεβού
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Αν απενεργοποιηθεί, η φόρμα δείχνει μήνυμα και προτείνει
                    τηλεφωνική επικοινωνία.
                  </p>
                </div>
                <Switch
                  checked={acceptingAppointments}
                  onCheckedChange={(v) => {
                    setMsg(null);
                    setAcceptingAppointments(!!v);
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label>Τηλέφωνο Ιατρείου</Label>
                <Input
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="π.χ. 2101234567"
                />
                <p className="text-xs text-muted-foreground">
                  Θα εμφανίζεται στο μήνυμα όταν τα online ραντεβού είναι
                  κλειστά.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Μήνυμα όταν τα online ραντεβού είναι κλειστά</Label>
                <Textarea
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="inline-flex items-center gap-2"
                  disabled={busy}
                  onClick={saveAppointmentsSettings}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Αποθήκευση
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMsg(null);
                    try {
                      await loadAllSettings();
                      setMsg({
                        type: "info",
                        text: "Έγινε επαναφόρτωση ρυθμίσεων από το server.",
                      });
                    } catch (e) {
                      console.error(e);
                      setMsg({
                        type: "error",
                        text: "Αποτυχία επαναφόρτωσης.",
                      });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Επαναφόρτωση
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- notifications -------------------- */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" /> Ειδοποιήσεις
              </CardTitle>
              <CardDescription>
                Ελέγξτε αποστολές email (επιβεβαιώσεις, admin alerts).
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Email επιβεβαίωσης προς ασθενή
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Αν το API `/api/send-confirmation` σέβεται το setting, θα
                    στέλνει/δεν θα στέλνει.
                  </p>
                </div>
                <Switch
                  checked={sendConfirmationEmails}
                  onCheckedChange={(v) => {
                    setMsg(null);
                    setSendConfirmationEmails(!!v);
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Admin ειδοποιήσεις</p>
                  <p className="text-xs text-muted-foreground">
                    Στέλνει email στη γραμματεία/ιατρό όταν γίνεται νέο online
                    ραντεβού.
                  </p>
                </div>
                <Switch
                  checked={sendAdminNotifications}
                  onCheckedChange={(v) => {
                    setMsg(null);
                    setSendAdminNotifications(!!v);
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label>Admin email</Label>
                <Input
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="π.χ. clinic@example.com"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="inline-flex items-center gap-2"
                  disabled={busy}
                  onClick={saveNotificationSettings}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Αποθήκευση
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- offline -------------------- */}
        <TabsContent value="offline" className="mt-6">
          <Card className="shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5" /> Offline πρόσβαση / PIN
              </CardTitle>
              <CardDescription>
                PIN ανά συσκευή για ξεκλείδωμα όταν δεν υπάρχει σύνδεση.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Πώς δουλεύει</AlertTitle>
                <AlertDescription className="text-sm">
                  <span className="inline-flex items-center gap-1">
                    <WifiOff className="h-4 w-4" /> Offline
                  </span>{" "}
                  →{" "}
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-4 w-4" /> PIN
                  </span>
                  . Το PIN ισχύει μόνο για αυτή τη συσκευή.
                </AlertDescription>
              </Alert>

              {!isActive ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PinField
                      id="new-pin"
                      label="Νέος PIN"
                      value={newPin}
                      onChange={(v) => {
                        clearFeedback();
                        setNewPin(v);
                      }}
                      autoComplete="new-password"
                      showKey="next"
                      inputRef={newPinRef}
                      error={errors.newPin}
                    />
                    <PinField
                      id="confirm-pin"
                      label="Επιβεβαίωση PIN"
                      value={confirmPin}
                      onChange={(v) => {
                        clearFeedback();
                        setConfirmPin(v);
                      }}
                      autoComplete="new-password"
                      showKey="confirm"
                      error={errors.confirmPin}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ισχύς PIN</span>
                      <span>{pinStrength}%</span>
                    </div>
                    <Progress value={pinStrength} className="h-2" />
                    <div className="mt-2 grid sm:grid-cols-2 gap-2">
                      <Requirement ok={newPin.length >= MIN_PIN}>
                        Τουλάχιστον {MIN_PIN} ψηφία
                      </Requirement>
                      <Requirement ok={new Set(newPin).size >= 4}>
                        ≥ 4 διαφορετικά ψηφία
                      </Requirement>
                      <Requirement ok={!isAllSame(newPin)}>
                        Όχι ίδιο ψηφίο παντού
                      </Requirement>
                      <Requirement
                        ok={
                          !isAscendingSequence(newPin) &&
                          !isDescendingSequence(newPin)
                        }
                      >
                        Όχι απλές ακολουθίες
                      </Requirement>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="inline-flex items-center gap-2"
                      disabled={busy || !canSubmitSet}
                      onClick={handleSetPin}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      Ενεργοποίηση offline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        clearFeedback();
                        setNewPin("");
                        setConfirmPin("");
                        setShow({ old: false, next: false, confirm: false });
                      }}
                    >
                      Καθαρισμός
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted/50 border p-3 text-sm text-muted-foreground">
                    Αυτή η συσκευή είναι έτοιμη για offline πρόσβαση.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <PinField
                      id="old-pin"
                      label="Τρέχων PIN"
                      value={oldPin}
                      onChange={(v) => {
                        clearFeedback();
                        setOldPin(v);
                      }}
                      autoComplete="current-password"
                      showKey="old"
                      error={errors.oldPin}
                    />
                    <PinField
                      id="new-pin"
                      label="Νέος PIN"
                      value={newPin}
                      onChange={(v) => {
                        clearFeedback();
                        setNewPin(v);
                      }}
                      autoComplete="new-password"
                      showKey="next"
                      error={errors.newPin}
                    />
                    <PinField
                      id="confirm-pin"
                      label="Επιβεβαίωση"
                      value={confirmPin}
                      onChange={(v) => {
                        clearFeedback();
                        setConfirmPin(v);
                      }}
                      autoComplete="new-password"
                      showKey="confirm"
                      error={errors.confirmPin}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="inline-flex items-center gap-2"
                      disabled={busy || !canSubmitChange}
                      onClick={handleChangePin}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Αλλαγή PIN
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          className="inline-flex items-center gap-2"
                        >
                          <PowerOff className="h-4 w-4" />
                          Απενεργοποίηση offline
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Απενεργοποίηση offline πρόσβασης;
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Θα αφαιρεθεί ο PIN από αυτή τη συσκευή.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={busy}>
                            Άκυρο
                          </AlertDialogCancel>
                          <AlertDialogAction
                            disabled={busy}
                            onClick={handleDisable}
                          >
                            Απενεργοποίηση
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={handleLockNow}
                      className="inline-flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Lock τώρα
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          className="inline-flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Καθαρισμός offline δεδομένων
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Καθαρισμός offline δεδομένων;
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Θα γίνει best-effort διαγραφή offline keys/flags στη
                            συσκευή.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={busy}>
                            Άκυρο
                          </AlertDialogCancel>
                          <AlertDialogAction
                            disabled={busy}
                            onClick={handleClearOfflineData}
                          >
                            Καθαρισμός
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- device -------------------- */}
        <TabsContent value="device" className="mt-6">
          <Card className="shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" /> Συσκευή & πολιτικές offline
              </CardTitle>
              <CardDescription>
                Αυτές οι ρυθμίσεις αποθηκεύονται τοπικά (ανά browser/συσκευή).
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-2">
                <Label>Όνομα συσκευής</Label>
                <Input
                  value={deviceLabel}
                  onChange={(e) => setDeviceLabel(e.target.value)}
                  placeholder="π.χ. Γραμματεία - PC"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Auto-lock (λεπτά)</Label>
                  <Input
                    inputMode="numeric"
                    value={autoLockMinutes}
                    onChange={(e) =>
                      setAutoLockMinutes(
                        Number(digitsOnly(e.target.value || "0")) || 0
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Πόσο γρήγορα να κλειδώνει offline.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Max προσπάθειες</Label>
                  <Input
                    inputMode="numeric"
                    value={maxAttempts}
                    onChange={(e) =>
                      setMaxAttempts(
                        Number(digitsOnly(e.target.value || "0")) || 0
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Μετά εφαρμόζεται cooldown.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Cooldown (sec)</Label>
                  <Input
                    inputMode="numeric"
                    value={cooldownSeconds}
                    onChange={(e) =>
                      setCooldownSeconds(
                        Number(digitsOnly(e.target.value || "0")) || 0
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Χρόνος αναμονής μετά από αποτυχίες.
                  </p>
                </div>
              </div>

              <Alert className="bg-white/60">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Σημείωση</AlertTitle>
                <AlertDescription className="text-sm">
                  Για να εφαρμοστούν πλήρως τα παραπάνω (auto-lock/attempts), το
                  offline gate/logic πρέπει να τα διαβάζει από localStorage
                  keys:{" "}
                  <code className="px-1">admin_settings:autoLockMinutes</code>,{" "}
                  <code className="px-1">admin_settings:maxAttempts</code>,{" "}
                  <code className="px-1">admin_settings:cooldownSeconds</code>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
