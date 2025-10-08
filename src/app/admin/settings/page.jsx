"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
} from "lucide-react";

import { motion } from "framer-motion";

const MIN_PIN = 6;

export default function OfflineSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // status
  const [enabled, setEnabled] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // forms
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  // feedback
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        // Only reachable when online & authed
        router.replace("/login?redirect=/admin/settings/offline");
        return;
      }
      setUser(session.user);
      setEnabled(!!offlineAuth?.isEnabled?.());
      setHasPin(!!offlineAuth?.hasPin?.());
      setLoading(false);
    })();
  }, [router]);

  // ---- UI helpers ----
  const StatusBadge = (
    <Badge
      variant={enabled ? "default" : "secondary"}
      className="rounded-full px-3 py-1 text-xs"
    >
      {enabled ? "Ενεργό" : "Ανενεργό"}
    </Badge>
  );

  const Hint = ({ children }) => (
    <p className="text-xs text-muted-foreground">{children}</p>
  );

  const pinStrength = useMemo(() => {
    // Very simple meter for digits-only pins: length + variety of digits
    if (!newPin) return 0;
    const unique = new Set(newPin.split("")).size;
    const lenScore = Math.min(newPin.length / (MIN_PIN + 2), 1);
    const uniqScore = Math.min(unique / 6, 1);
    return Math.round((lenScore * 0.6 + uniqScore * 0.4) * 100);
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

  const PinField = ({
    id,
    label,
    value,
    onChange,
    autoComplete,
    autoFocus,
  }) => {
    const ref = useRef(null);

    const handleChange = (e) => {
      const next = (e.target.value || "").replace(/\D/g, "");
      onChange(next);
    };

    useEffect(() => {
      if (autoFocus && ref.current) {
        ref.current.focus({ preventScroll: true });
      }
      // run once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={MIN_PIN}
            autoComplete={autoComplete ?? "off"} // see note #4
            className="tracking-widest text-center"
            value={value}
            onChange={handleChange}
            autoFocus={false} // let the effect handle it
            name={id}
          />
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // don’t steal focus
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center px-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPin ? "Απόκρυψη PIN" : "Εμφάνιση PIN"}
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{showPin ? "Απόκρυψη" : "Εμφάνιση"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Hint>Τουλάχιστον {MIN_PIN} ψηφία.</Hint>
      </div>
    );
  };

  // ---- Actions ----
  const handleSetPin = async () => {
    setMsg(null);
    if (newPin.length < MIN_PIN || newPin !== confirmPin) {
      setMsg({
        type: "error",
        text: `Ο PIN πρέπει να έχει τουλάχιστον ${MIN_PIN} ψηφία και να ταιριάζει.`,
      });
      return;
    }
    setBusy(true);
    try {
      await offlineAuth.enable(user.id, newPin); // provision on THIS device
      setEnabled(true);
      setHasPin(true);
      setNewPin("");
      setConfirmPin("");
      setMsg({
        type: "success",
        text: "Ο offline PIN ορίστηκε για αυτή τη συσκευή.",
      });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία ορισμού PIN." });
    } finally {
      setBusy(false);
    }
  };

  const handleChangePin = async () => {
    setMsg(null);
    if (!oldPin) {
      setMsg({ type: "error", text: "Εισάγετε τον τρέχοντα PIN." });
      return;
    }
    if (newPin.length < MIN_PIN || newPin !== confirmPin) {
      setMsg({
        type: "error",
        text: `Ο νέος PIN πρέπει να έχει τουλάχιστον ${MIN_PIN} ψηφία και να ταιριάζει.`,
      });
      return;
    }
    setBusy(true);
    try {
      const ok = await offlineAuth.changePin(oldPin, newPin);
      if (!ok) {
        setMsg({ type: "error", text: "Λάθος τρέχων PIN." });
        return;
      }
      setNewPin("");
      setConfirmPin("");
      setOldPin("");
      setMsg({ type: "success", text: "Ο PIN άλλαξε επιτυχώς." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία αλλαγής PIN." });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await offlineAuth.disable();
      setEnabled(false);
      setHasPin(false);
      setMsg({
        type: "info",
        text: "Η offline πρόσβαση απενεργοποιήθηκε για αυτή τη συσκευή.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="relative max-w-3xl mx-auto px-6 py-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-50 to-white" />
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <Skeleton className="h-7 w-48" />
            </div>
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative max-w-3xl mx-auto px-6 py-10" aria-busy={busy}>
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-stone-50 to-transparent" />
        <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 blur-3xl opacity-60" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between mb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Lock className="h-7 w-7" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-stone-900 to-stone-600">
              Offline πρόσβαση
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Ορίστε έναν <strong>προσωπικό PIN</strong> για να ξεκλειδώνετε την
            εφαρμογή σε αυτή τη συσκευή όταν είστε εκτός σύνδεσης.
          </p>
        </div>
        {StatusBadge}
      </motion.div>

      {/* Info callout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Σχετικά με την offline πρόσβαση</AlertTitle>
          <AlertDescription className="text-sm">
            <span className="inline-flex items-center gap-1">
              <WifiOff className="h-4 w-4" /> Εκτός σύνδεσης
            </span>{" "}
            &rarr;
            <span className="inline-flex items-center gap-1 ml-1">
              <Smartphone className="h-4 w-4" /> Ξεκλείδωμα με PIN
            </span>
            . Ο PIN ισχύει μόνο για αυτή τη συσκευή.
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5" /> Διαχείριση PIN
            </CardTitle>
            <CardDescription>
              {!enabled || !hasPin
                ? "Ορίστε PIN για ενεργοποίηση offline πρόσβασης."
                : "Αλλάξτε τον PIN ή απενεργοποιήστε την offline πρόσβαση σε αυτή τη συσκευή."}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-6 space-y-6">
            {!enabled || !hasPin ? (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <PinField
                    id="new-pin"
                    label="Νέος PIN"
                    value={newPin}
                    onChange={setNewPin}
                    autoComplete="new-password"
                  />
                  <PinField
                    id="confirm-pin"
                    label="Επιβεβαίωση PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    autoComplete="new-password"
                  />
                </div>

                {/* Strength/requirements */}
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
                      Όχι επαναλαμβανόμενοι ίδιοι αριθμοί
                    </Requirement>
                  </div>
                </div>

                <div>
                  <Button
                    size="sm"
                    className="inline-flex items-center gap-2"
                    disabled={busy}
                    onClick={handleSetPin}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Ορισμός PIN στη συσκευή
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
                    onChange={setOldPin}
                    autoComplete="current-password"
                  />
                  <PinField
                    id="new-pin"
                    label="Νέος PIN"
                    value={newPin}
                    onChange={setNewPin}
                    autoComplete="new-password"
                  />
                  <PinField
                    id="confirm-pin"
                    label="Επιβεβαίωση νέου PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    autoComplete="new-password"
                  />
                </div>

                {/* Strength/requirements for new PIN */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Ισχύς νέου PIN
                    </span>
                    <span>{pinStrength}%</span>
                  </div>
                  <Progress value={pinStrength} className="h-2" />
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    <Requirement ok={newPin.length >= MIN_PIN}>
                      Τουλάχιστον {MIN_PIN} ψηφία
                    </Requirement>
                    <Requirement ok={new Set(newPin).size >= 4}>
                      Όχι επαναλαμβανόμενοι ίδιοι αριθμοι
                    </Requirement>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="inline-flex items-center gap-2"
                    disabled={busy}
                    onClick={handleChangePin}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Αλλαγή PIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="inline-flex items-center gap-2"
                    disabled={busy}
                    onClick={handleDisable}
                  >
                    <PowerOff className="h-4 w-4" />
                    Απενεργοποίηση σε αυτή τη συσκευή
                  </Button>
                </div>
              </div>
            )}

            {msg && (
              <Alert
                variant={msg.type === "error" ? "destructive" : "default"}
                className="mt-2"
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
