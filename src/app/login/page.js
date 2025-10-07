"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import ReCAPTCHA from "react-google-recaptcha";
import { offlineAuth } from "../../lib/offlineAuth";

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

  // Bootstrap failed attempts from localStorage
  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY) || "0");
    setFailedAttempts(saved);
    setShowCaptcha(saved >= 3);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/admin");
      } else {
        // If offline, try local cached user
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          try {
            const cached = await offlineAuth.getUser();
            if (cached) {
              setCanOffline(true);
              setNeedPin(await offlineAuth.hasPin());
              setCheckingAuth(false);
              return;
            }
          } catch {}
        }
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

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
      // Must have provisioned offline access + a valid PIN
      if (!canOffline) {
        setErrorMsg(
          "Η offline πρόσβαση δεν είναι διαθέσιμη σε αυτή τη συσκευή."
        );
        return;
      }
      if (!needPin) {
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

      const ok = await offlineAuth.verifyPin(pin);
      if (!ok) {
        setErrorMsg(
          "Λάθος offline PIN ή έχει ενεργοποιηθεί προσωρινό κλείδωμα."
        );
        return;
      }
      // Mark session as offline (optional)
      try {
        sessionStorage.setItem("offline_mode", "1");
      } catch {}
      // Go to the offline shell so the app renders offline immediately
      router.replace("/admin/offline-shell?target=/admin");
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
    <main className="min-h-screen bg-[#fdfaf6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-[#e8e2d6]">
        <h1 className="text-2xl font-semibold mb-6 text-[#3b3a36] text-center">
          Σύνδεση Διαχειριστή
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Κωδικός</label>
            <input
              type="password"
              className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>

          {/* reCAPTCHA only after 3 failures */}
          {showCaptcha && (
            <div className="space-y-2">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                className="mx-auto"
              />
              <p className="text-[12px] text-gray-500 text-center">
                Για επιπλέον ασφάλεια απαιτείται reCAPTCHA.
              </p>
            </div>
          )}

          {errorMsg && (
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            className={`w-full bg-[#3b3a36] text-white py-2 rounded-lg transition ${
              submitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-[#2f2e2a]"
            }`}
            disabled={submitting}
          >
            {submitting ? "Σύνδεση..." : "Σύνδεση"}
          </button>

          {/* hint about attempts */}
          {failedAttempts > 0 && !showCaptcha && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Αποτυχημένες προσπάθειες: {failedAttempts} / 3
            </p>
          )}
        </form>

        {/* OFFLINE UNLOCK */}
        {canOffline && (
          <div className="mt-6 border-t pt-6">
            <p className="text-sm text-center text-stone-600 mb-3">
              Είστε εκτός σύνδεσης. Μπορείτε να συνδεθείτε σε{" "}
              <strong>offline</strong> λειτουργία.
            </p>
            {needPin ? (
              <div className="mb-3">
                <label className="block text-sm mb-1">Offline PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  minLength={MIN_OFFLINE_PIN}
                  className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={`${MIN_OFFLINE_PIN}+ ψηφία`}
                  disabled={submitting}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ο offline κωδικός πρέπει να έχει τουλάχιστον {MIN_OFFLINE_PIN}{" "}
                  ψηφία.
                </p>
              </div>
            ) : (
              <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Η offline πρόσβαση απαιτεί PIN που ορίζεται όταν είστε online
                (Ρυθμίσεις &rarr; Offline πρόσβαση).
              </p>
            )}
            <button
              onClick={handleOfflineUnlock}
              className={`w-full bg-[#6b665f] text-white py-2 rounded-lg transition ${
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-[#5a564f]"
              }`}
              disabled={
                submitting || (needPin && pin.trim().length < MIN_OFFLINE_PIN)
              }
              type="button"
            >
              Είσοδος εκτός σύνδεσης
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
