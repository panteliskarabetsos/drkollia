"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";

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
      <main className="max-w-2xl mx-auto px-6 py-10">
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
        <Card>
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

  const PinField = ({ id, label, value, onChange, autoComplete }) => {
    const ref = useRef(null);

    const handleChange = (e) => {
      const next = (e.target.value || "").replace(/\D/g, ""); // keep only digits
      onChange(next);
      // ensure focus stays on this field even if it re-mounts
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.focus({ preventScroll: true });
          try {
            const end = ref.current.value.length;
            ref.current.setSelectionRange(end, end);
          } catch (_) {}
        }
      });
    };

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
            autoComplete={autoComplete}
            className="tracking-widest text-center"
            value={value}
            onChange={handleChange}
          />
          <button
            type="button"
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
        </div>
        <Hint>Τουλάχιστον {MIN_PIN} ψηφία.</Hint>
      </div>
    );
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-10" aria-busy={busy}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" /> Offline πρόσβαση
          </h1>
          <p className="text-sm text-muted-foreground">
            Ορίστε έναν <strong>προσωπικό PIN</strong> για να ξεκλειδώνετε την
            εφαρμογή σε αυτή τη συσκευή όταν είστε εκτός σύνδεσης.
          </p>
        </div>
        {StatusBadge}
      </div>

      {/* Info callout */}
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

      <Card>
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
            <div className="space-y-4">
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
            <div className="space-y-4">
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
    </main>
  );
}
