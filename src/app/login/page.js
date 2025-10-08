"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import ReCAPTCHA from "react-google-recaptcha";
import { offlineAuth } from "../../lib/offlineAuth";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Shield,
} from "lucide-react";

const STORAGE_KEY = "loginFailedAttempts";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [canOffline, setCanOffline] = useState(false);
  const [needPin, setNeedPin] = useState(false);
  const [pin, setPin] = useState("");
  const MIN_OFFLINE_PIN = 6;
  // reCAPTCHA
  const recaptchaRef = useRef(null);
  const [captchaValue, setCaptchaValue] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleCaptchaChange = (value) => setCaptchaValue(value || "");

  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Bootstrap failed attempts from localStorage
  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY) || "0");
    setFailedAttempts(saved);
    setShowCaptcha(saved >= 3);
  }, []);

  const checkUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Already online-authed → go straight in
    if (user) {
      router.replace("/admin");
      return;
    }

    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    // Active offline session → skip screen
    if (offline && offlineAuth.hasActiveSession()) {
      const redirect =
        (typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("redirect")) ||
        "/admin";
      router.replace(redirect);
      return;
    }

    // Show/hide offline unlock UI depending on state
    if (offline) {
      try {
        const cached = await offlineAuth.getUser();
        setCanOffline(Boolean(cached));
        setNeedPin(Boolean(cached) && offlineAuth.hasPin());
      } catch {
        setCanOffline(false);
        setNeedPin(false);
      }
    } else {
      setCanOffline(false);
      setNeedPin(false);
    }

    setCheckingAuth(false);
  }, [router]);

  // run once on mount
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // keep `online` in sync and re-check on flips
  useEffect(() => {
    const onChange = () => setOnline(navigator.onLine);
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);

  useEffect(() => {
    // optional: clear transient UI on state flip
    setErrorMsg("");
    setSubmitting(false);
    checkUser();
  }, [online, checkUser]);

  const incrementFailures = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    if (next >= 3) setShowCaptcha(true);
  };

  const resetFailures = () => {
    setFailedAttempts(0);
    localStorage.removeItem(STORAGE_KEY);
    setShowCaptcha(false);
    setCaptchaValue("");
    recaptchaRef.current?.reset?.();
  };

  const handleOfflineUnlock = async (e) => {
    e.preventDefault?.();
    setSubmitting(true);
    setErrorMsg("");

    try {
      if (!canOffline) {
        setErrorMsg(
          "Η offline πρόσβαση δεν είναι διαθέσιμη σε αυτή τη συσκευή."
        );
        return;
      }
      if (!offlineAuth.hasPin()) {
        setErrorMsg(
          "Η offline πρόσβαση απαιτεί PIN που ορίζεται όταν είστε online."
        );
        return;
      }
      if ((pin || "").trim().length < MIN_OFFLINE_PIN) {
        setErrorMsg(
          `Ο offline κωδικός πρέπει να έχει τουλάχιστον ${MIN_OFFLINE_PIN} ψηφία.`
        );
        return;
      }

      const ok = await offlineAuth.verifyPin(pin); // ← this now starts a persistent TTL session
      if (!ok) {
        setErrorMsg(
          "Λάθος offline PIN ή έχει ενεργοποιηθεί προσωρινό κλείδωμα."
        );
        return;
      }

      const redirect =
        new URLSearchParams(window.location.search).get("redirect") || "/admin";
      router.replace(redirect);
    } catch (err) {
      console.error("Offline unlock failed:", err);
      setErrorMsg("Αποτυχία offline σύνδεσης.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      // If captcha is enabled, require it and verify server-side
      if (showCaptcha) {
        if (!captchaValue) {
          setErrorMsg("Παρακαλώ επιβεβαιώστε ότι δεν είστε ρομπότ.");
          return;
        }
        const captchaRes = await fetch("/api/verify-recaptcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaValue }),
        });
        const { success } = await captchaRes.json();
        if (!success) {
          setErrorMsg("Η επαλήθευση reCAPTCHA απέτυχε. Προσπαθήστε ξανά.");
          recaptchaRef.current?.reset?.();
          setCaptchaValue("");
          return;
        }
      }

      // Try Supabase login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Count a failure and maybe turn captcha on next time
        incrementFailures();

        // If captcha is visible, reset it for the next attempt
        if (showCaptcha) {
          recaptchaRef.current?.reset?.();
          setCaptchaValue("");
        }

        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg(
            failedAttempts + 1 >= 3
              ? "Λανθασμένα στοιχεία. Συμπληρώστε και το reCAPTCHA."
              : "Λανθασμένα στοιχεία σύνδεσης."
          );
        } else {
          setErrorMsg("Σφάλμα κατά τη σύνδεση. Προσπαθήστε ξανά.");
        }
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const usr = sessionData?.session?.user;
        if (usr) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name, role")
            .eq("id", usr.id)
            .single();
          await offlineAuth.saveUser({
            id: usr.id,
            email: usr.email,
            name: prof?.name ?? null,
            role: prof?.role ?? null,
          });
        }
      } catch (e) {
        console.warn("Could not cache offline user:", e);
      }

      // Success → reset failures and go to admin
      resetFailures();
      router.push("/admin");
    } catch (err) {
      if (showCaptcha) {
        recaptchaRef.current?.reset?.();
        setCaptchaValue("");
      }
      console.error("Login failed:", err);
      setErrorMsg("Σφάλμα κατά τη σύνδεση. Προσπαθήστε ξανά.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <p className="text-[#3b3a36] text-lg">Φόρτωση...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-stone-50 via-[#fdfaf6] to-white">
      {/* subtle background accents */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_20%,transparent_70%)] bg-[radial-gradient(1200px_500px_at_10%_-10%,#f1efe8_25%,transparent),radial-gradient(1200px_500px_at_90%_-20%,#ece9e0_25%,transparent)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-[#e8e2d6] bg-white/90 shadow-xl backdrop-blur p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#3b3a36]">
              Σύνδεση Διαχειριστή
            </h1>
            <div className="flex justify-center">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1",
                  online
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200",
                ].join(" ")}
                title={online ? "Συνδεδεμένο" : "Εκτός σύνδεσης"}
              >
                {online ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {online ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Online login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm text-stone-600">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-10 py-2 outline-none focus:ring-2 focus:ring-[#c7b9a3]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting || !online}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-stone-600">Κωδικός</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-10 py-2 pr-12 outline-none focus:ring-2 focus:ring-[#c7b9a3]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting || !online}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-stone-500 hover:bg-stone-100 transition"
                  aria-label={showPwd ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
                  disabled={submitting || !online}
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* reCAPTCHA only after 3 failures */}
            {showCaptcha && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  className="mx-auto"
                />
                <p className="text-[12px] text-amber-800 text-center">
                  Για επιπλέον ασφάλεια απαιτείται reCAPTCHA.
                </p>
              </div>
            )}

            {errorMsg && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
                aria-live="polite"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className={[
                "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#3b3a36] px-4 py-2.5 text-white transition",
                submitting || !online
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-[#2f2e2a]",
              ].join(" ")}
              disabled={submitting || !online}
            >
              {submitting ? (
                "Σύνδεση..."
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Σύνδεση
                </>
              )}
            </button>

            {/* hint about attempts */}
            {failedAttempts > 0 && !showCaptcha && (
              <p className="mt-1 text-xs text-gray-500 text-center">
                Αποτυχημένες προσπάθειες: {failedAttempts} / 3
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[11px] uppercase tracking-wider text-stone-400">
              ή
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* OFFLINE UNLOCK */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Offline λειτουργία</span>
            </div>

            {canOffline ? (
              <>
                {needPin ? (
                  <div className="space-y-1">
                    <label className="block text-sm text-stone-600">
                      Offline PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      minLength={MIN_OFFLINE_PIN}
                      className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-4 py-2 outline-none focus:ring-2 focus:ring-[#c7b9a3]"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder={`${MIN_OFFLINE_PIN}+ ψηφία`}
                      disabled={submitting || online}
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      Ο offline κωδικός πρέπει να έχει τουλάχιστον{" "}
                      {MIN_OFFLINE_PIN} ψηφία.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    Η offline πρόσβαση απαιτεί PIN που ορίζεται όταν είστε
                    online (Ρυθμίσεις → Offline πρόσβαση).
                  </p>
                )}

                <button
                  onClick={handleOfflineUnlock}
                  type="button"
                  className={[
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#6b665f] px-4 py-2.5 text-white transition",
                    submitting ||
                    online ||
                    (needPin && pin.trim().length < MIN_OFFLINE_PIN)
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#5a564f]",
                  ].join(" ")}
                  disabled={
                    submitting ||
                    online ||
                    (needPin && pin.trim().length < MIN_OFFLINE_PIN)
                  }
                >
                  <Shield className="h-4 w-4" />
                  Είσοδος εκτός σύνδεσης
                </button>
              </>
            ) : (
              <p className="text-center text-xs text-stone-500">
                Δεν υπάρχει αποθηκευμένος λογαριασμός για offline χρήση σε αυτή
                τη συσκευή.
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-stone-400">
          Προστατεύουμε τα δεδομένα σας με ισχυρή κρυπτογράφηση.{" "}
          <span className="hidden sm:inline">
            Χρησιμοποιήστε ισχυρό κωδικό.
          </span>
        </p>
      </div>
    </main>
  );
}
