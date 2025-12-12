"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { offlineAuth } from "@/app/lib/offlineAuth"; // άλλαξε path αν το έχεις στο /lib

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, AlertTriangle } from "lucide-react";

export default function OfflineGate({ children }) {
  const router = useRouter();

  const [locked, setLocked] = useState(() => offlineAuth.isLocked?.() ?? true);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // state από record+policy (tries/remaining/cooldown/autoLock)
  const attemptState = useMemo(
    () => offlineAuth.getAttemptState?.() ?? null,
    [locked, msg]
  );

  // countdown refresh
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      // force rerender for countdown
      setMsg((m) => (m ? { ...m } : m));
    }, 500);
    return () => clearInterval(t);
  }, [locked]);

  // όταν ξεκλειδώσει (offline session ενεργό), ξεκίνα auto-lock timer
  useEffect(() => {
    if (locked) return;
    const stop = offlineAuth.startAutoLockTimer?.(() => {
      setLocked(true);
      setMsg({ type: "info", text: "Κλείδωσε λόγω αδράνειας (auto-lock)." });
    });
    return () => stop?.();
  }, [locked]);

  // αν ήδη υπάρχει ενεργό offline session και δεν είναι locked -> μπες μέσα
  useEffect(() => {
    if (
      offlineAuth.hasActiveSession?.() &&
      !(offlineAuth.isLocked?.() ?? true)
    ) {
      setLocked(false);
    }
  }, []);

  const lockRemaining = offlineAuth.getLockRemainingSeconds?.() ?? 0;
  const disabled = busy || lockRemaining > 0;

  const handleUnlock = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await offlineAuth.verifyPinDetailed(pin);

      if (res.ok) {
        setPin("");
        setLocked(false);
        setMsg(null);

        // προαιρετικό: refresh για να ξανατρέξουν guards
        router.refresh();
        return;
      }

      if (res.reason === "cooldown" || res.reason === "locked_out") {
        setMsg({
          type: "warn",
          text: `Πολλές προσπάθειες. Δοκίμασε ξανά σε ${res.remainingSeconds}s.`,
        });
        return;
      }

      if (res.reason === "wrong_pin") {
        setMsg({
          type: "warn",
          text: `Λάθος PIN. Απομένουν ${res.attemptsLeft} προσπάθειες.`,
        });
        return;
      }

      setMsg({
        type: "warn",
        text: "Δεν μπορεί να γίνει offline unlock (δεν έχει οριστεί PIN).",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!offlineAuth.isEnabled?.()) {
    // Αν δεν έχει provisioning, μην δείξεις gate (θα σε στείλει login ο guard)
    return null;
  }

  if (!locked) return children;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-2xl shadow-sm bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Offline πρόσβαση
          </CardTitle>
          <CardDescription>
            Βάλτε PIN για να ανοίξει το admin όταν δεν υπάρχει σύνδεση /
            session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lockRemaining > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cooldown</AlertTitle>
              <AlertDescription>
                Προσπάθησε ξανά σε <b>{lockRemaining}s</b>.
              </AlertDescription>
            </Alert>
          ) : null}

          {msg ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Μήνυμα</AlertTitle>
              <AlertDescription>{msg.text}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Input
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 12))
              }
              placeholder="PIN"
              inputMode="numeric"
              type="password"
              disabled={disabled}
              className="tracking-widest text-center"
            />
            {attemptState && lockRemaining === 0 ? (
              <p className="text-xs text-muted-foreground">
                Προσπάθειες:{" "}
                {attemptState.maxAttempts - attemptState.attemptsLeft}/
                {attemptState.maxAttempts}
                {" · "}Auto-lock: {attemptState.autoLockMinutes}’{" · "}
                Cooldown: {attemptState.cooldownSeconds}s
              </p>
            ) : null}
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={handleUnlock}
            disabled={disabled || pin.length < 6}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Ξεκλείδωμα
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
