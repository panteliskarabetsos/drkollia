"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
  Lock,
  Phone as PhoneIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // ui state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const normalizeGreekPhone = (input) => {
    // keep digits
    const digits = (input || "").replace(/\D/g, "");
    // remove leading 00
    const d = digits.replace(/^00/, "");
    // already includes country code 30?
    if (d.startsWith("30")) return `+${d}`;
    // local starting with 0 or 69x/2xx… -> prefix +30
    if (/^0?\d{9,10}$/.test(d)) {
      const local = d.replace(/^0/, "");
      return `+30${local}`;
    }
    // fallback: if looks like +number already
    if (input?.trim().startsWith("+")) return input.trim();
    return input.trim();
  };

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const pwdOk = (v) =>
    v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // phone is optional
    const phone = phoneRaw.trim() ? normalizeGreekPhone(phoneRaw) : null;

    // base validation
    if (!name.trim()) return setErrorMsg("Συμπληρώστε το όνομα.");
    if (!emailOk(email)) return setErrorMsg("Μη έγκυρο email.");
    if (!pwdOk(password))
      return setErrorMsg(
        "Ο κωδικός πρέπει να έχει 8+ χαρακτήρες, πεζά, κεφαλαία και αριθμό."
      );
    if (password !== confirmPassword)
      return setErrorMsg("Οι κωδικοί δεν ταιριάζουν.");

    // validate phone ONLY if provided
    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      return setErrorMsg("Μη έγκυρο κινητό τηλέφωνο.");
    }

    setLoading(true);
    try {
      // Build user metadata (include phone only if present)
      const userMeta = { name, role: "admin" };
      if (phone) userMeta.phone = phone;

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMeta,
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        },
      });

      if (signupError) {
        if (signupError.message?.toLowerCase().includes("already")) {
          setErrorMsg("Αυτό το email χρησιμοποιείται ήδη.");
        } else {
          setErrorMsg("Σφάλμα δημιουργίας λογαριασμού. Προσπαθήστε ξανά.");
        }
        return;
      }

      const userId = data?.user?.id;
      const userEmail = data?.user?.email;

      // Upsert profile (phone null if not provided)
      if (userId && userEmail) {
        const { error: profileError } = await supabase.from("profiles").upsert([
          {
            id: userId,
            name,
            email: userEmail,
            phone: phone ?? null,
            role: "admin",
          },
        ]);

        if (profileError) {
          console.error("Profile insert error:", profileError);
          setErrorMsg(
            "Ο λογαριασμός δημιουργήθηκε αλλά τα στοιχεία προφίλ δεν αποθηκεύτηκαν."
          );
          return;
        }
      }

      // Avoid leaving this browser logged in as the newly created user
      await supabase.auth.signOut();

      setSuccessMsg(
        "Ο λογαριασμός δημιουργήθηκε. Στάλθηκε email επιβεβαίωσης (αν απαιτείται)."
      );
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMsg("Αποτυχία δημιουργίας λογαριασμού.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#fdfaf6] grid place-items-center">
        <div className="animate-pulse text-[#6b675f]">Φόρτωση…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfaf6] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e2d6] bg-white shadow-sm">
        {/* ambient accents */}
        <div className="pointer-events-none absolute -top-20 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_#efe6d9_0%,transparent_60%)] opacity-70" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(ellipse_at_center,_#f8f3ea_0%,transparent_60%)] opacity-70" />

        {/* header */}
        <div className="relative px-6 pt-6 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#6b675f] hover:text-[#3b3a36] transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Επιστροφή</span>
          </button>

          <div className="inline-flex items-center gap-2 text-[#3b3a36]">
            <ShieldCheck className="w-4 h-4 text-[#8c7c68]" />
            <span className="text-sm font-medium">Διαχειριστές</span>
          </div>
        </div>

        <div className="relative px-6 pb-6">
          <h1 className="text-2xl font-semibold text-center text-[#2f2e2b] mb-1">
            Δημιουργία Λογαριασμού
          </h1>
          <p className="text-center text-xs text-[#6b675f] mb-6">
            Συμπληρώστε τα στοιχεία για νέο διαχειριστή.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#6b675f] mb-1">
                Όνομα
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
                  <UserIcon className="w-4 h-4 text-[#8c7c68]" />
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-9 py-2 outline-none focus:border-[#8c7c68]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ονοματεπώνυμο"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#6b675f] mb-1">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
                  <Mail className="w-4 h-4 text-[#8c7c68]" />
                </span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-9 py-2 outline-none focus:border-[#8c7c68]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-medium text-[#6b675f] mb-1">
                Κινητό Τηλέφωνο
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
                  <PhoneIcon className="w-4 h-4 text-[#8c7c68]" />
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-9 py-2 outline-none focus:border-[#8c7c68]"
                  value={phoneRaw}
                  onChange={(e) => setPhoneRaw(e.target.value)}
                  placeholder="+30 69XXXXXXXX"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8a857b]">
                Μορφή: +3069XXXXXXXX ή 69XXXXXXXX (θα μετατραπεί αυτόματα).
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#6b675f] mb-1">
                Κωδικός
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
                  <Lock className="w-4 h-4 text-[#8c7c68]" />
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-9 py-2 pr-24 outline-none focus:border-[#8c7c68]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 my-1 px-2 rounded-md text-xs text-[#6b675f] border border-[#e5ddcf] bg-white/70 hover:bg-[#f3eee6] transition"
                  tabIndex={-1}
                >
                  {showPwd ? "Κρύψτε" : "Εμφάνιση"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#8a857b]">
                8+ χαρακτήρες, τουλάχιστον 1 πεζό, 1 κεφαλαίο, 1 αριθμός.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-[#6b675f] mb-1">
                Επιβεβαίωση Κωδικού
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-[#ddd2c2] bg-[#fdfaf6] px-4 py-2 outline-none focus:border-[#8c7c68]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Messages */}
            {errorMsg && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#3b3a36] px-4 py-2 text-white shadow-sm transition ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#2f2e2a]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Δημιουργία...
                </>
              ) : (
                "Δημιουργία Λογαριασμού"
              )}
            </button>

            {/* Footnote */}
            <p className="text-[11px] text-center text-[#8a857b]">
              Ο νέος λογαριασμός θα έχει ρόλο{" "}
              <span className="font-medium">admin</span>.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
