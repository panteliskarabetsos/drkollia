"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";

export default function AdminAccountsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;

      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.();

      // Not authed (no Supabase session) and no offline unlock
      if (!session && !hasOffline) {
        // Redirect only when ONLINE — never offline (prevents SW fallback loops)
        if (online && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace("/login?redirect=" + encodeURIComponent("/admin")); // or use usePathname()
        }
        if (alive) setLoading(false);
        return;
      }

      // We’re allowed: set a user (Supabase user when online, cached user when offline)
      if (session?.user) {
        setSessionUser(session.user);
      } else {
        const cached = await offlineAuth.getUser?.();
        setSessionUser(cached || { id: "offline-user" });
      }

      // Data load: only hit Supabase when ONLINE
      if (online && session) {
        const { data: admins, error } = await supabase
          .from("profiles")
          .select("id, name, email, role, phone")
          .eq("role", "admin");

        if (!error && alive) setAdmins(admins || []);
        else if (error) console.error("Error fetching admins:", error);
      } else {
        // Offline: skip network; optionally read from Dexie/local cache here
        if (alive) setAdmins((prev) => prev ?? []);
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const handleDelete = async (id) => {
    if (id === sessionUser?.id) {
      alert("Δεν μπορείτε να διαγράψετε τον εαυτό σας.");
      return;
    }

    if (!confirm("Σίγουρα θέλετε να διαγράψετε αυτόν τον διαχειριστή;")) return;

    try {
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.error?.message || "Unknown error");

      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Σφάλμα κατά τη διαγραφή: " + err.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#3b3a36] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#3b3a36] font-medium">Φόρτωση...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8f5ef] to-[#fdfaf6] py-16 px-4 text-[#3b3a36]">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg border border-[#e8e2d6] rounded-2xl shadow-xl p-10 space-y-10">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 text-sm text-[#3b3a36] hover:text-[#2f2e2a]"
          >
            <FaArrowLeft size={14} /> Πίσω στο Dashboard
          </button>

          <button
            onClick={() => router.push("/signup")}
            className="inline-flex items-center gap-2 bg-[#3b3a36] text-white px-4 py-2 rounded-full shadow hover:bg-[#2f2e2a] transition"
          >
            <FaPlus size={14} />
            <span className="text-sm">Νέος Διαχειριστής</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center">
          Διαχείριση Διαχειριστών
        </h1>

        {admins.length === 0 ? (
          <p className="text-center text-[#6b6760] italic">
            Δεν υπάρχουν διαχειριστές.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-[#5a5955] uppercase tracking-wide border-b border-[#e4e0d8]">
                  <th className="px-4 py-3">Όνομα</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Τηλέφωνο</th>
                  <th className="px-4 py-3">Ρόλος</th>
                  <th className="px-4 py-3 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr
                    key={admin.id}
                    className="border-b border-[#f0ece5] hover:bg-[#fbf9f5] transition"
                  >
                    <td className="px-4 py-3 font-medium text-[#2f2e2a]">
                      {admin.name || (
                        <span className="text-[#b0aca5] italic">
                          Χωρίς όνομα
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4b4a47]">{admin.email}</td>
                    <td className="px-4 py-3 text-[#4b4a47]">
                      {admin.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#4b4a47] capitalize">
                      {admin.role}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(admin.id)}
                        disabled={admin.id === sessionUser?.id}
                        className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition ${
                          admin.id === sessionUser?.id
                            ? "text-gray-400 cursor-not-allowed bg-transparent"
                            : "text-red-600 hover:bg-red-50 hover:text-red-700"
                        }`}
                      >
                        <FaTrash size={14} />
                        <span>Διαγραφή</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
