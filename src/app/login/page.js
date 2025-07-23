"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/admin");
      } else {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("Λανθασμένα στοιχεία σύνδεσης.");
        } else {
          setErrorMsg("Σφάλμα κατά τη σύνδεση. Προσπαθήστε ξανά.");
        }
      } else {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Login failed:", err.message);
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
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            className={`w-full bg-[#3b3a36] text-white py-2 rounded-lg transition ${
              submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[#2f2e2a]"
            }`}
            disabled={submitting}
          >
            {submitting ? "Σύνδεση..." : "Σύνδεση"}
          </button>
        </form>
      </div>
    </main>
  );
}
