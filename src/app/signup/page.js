"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

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
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Οι κωδικοί δεν ταιριάζουν.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (signupError) {
        if (signupError.message.includes("already registered")) {
          setErrorMsg("Αυτό το email χρησιμοποιείται ήδη.");
        } else {
          setErrorMsg("Σφάλμα δημιουργίας λογαριασμού. Προσπαθήστε ξανά.");
        }
        return;
      }

      const userId = data?.user?.id;
      const userEmail = data?.user?.email; // ✅ use this instead of local state

      if (!userId || !userEmail) {
        alert(
          "Ο λογαριασμός δημιουργήθηκε. Ελέγξτε το email σας για επιβεβαίωση."
        );
        router.push("/login");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: userId,
          name,
          email: userEmail, // ✅ store the email from Supabase
          role: "admin",
        },
      ]);

      await supabase.auth.signOut(); // ✅ log out the created user immediately

      if (profileError) {
        console.error("Profile insert error:", profileError);
        setErrorMsg(
          "Ο λογαριασμός δημιουργήθηκε αλλά δεν αποθηκεύτηκαν τα στοιχεία προφίλ."
        );
        return;
      }

      alert("Ο λογαριασμός δημιουργήθηκε με επιτυχία.");
      router.push("/login");
    } catch (error) {
      console.error("Signup error:", error.message);
      setErrorMsg("Αποτυχία δημιουργίας λογαριασμού.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdfaf6] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-[#e8e2d6]">
        <h1 className="text-2xl font-semibold mb-6 text-[#3b3a36] text-center">
          Δημιουργία Λογαριασμού
        </h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Όνομα</label>
            <input
              type="text"
              className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Επιβεβαίωση Κωδικού</label>
            <input
              type="password"
              className="w-full border border-[#ddd2c2] rounded-lg px-4 py-2 bg-[#fdfaf6] focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            className={`w-full bg-[#3b3a36] text-white py-2 rounded-lg transition ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#2f2e2a]"
            }`}
            disabled={loading}
          >
            {loading ? "Δημιουργία..." : "Δημιουργία Λογαριασμού"}
          </button>
        </form>
      </div>
    </main>
  );
}
