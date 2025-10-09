// app/admin/offline-shell/page.jsx
"use client";
export const dynamic = "force-static";

import { useEffect, useState } from "react";
import NextDynamic from "next/dynamic"; // avoid name clash

// Lazy-load views (client-only) so they can come from the SW cache
const AdminView = NextDynamic(() => import("../page"), { ssr: false });
const PatientsView = NextDynamic(() => import("../patients/page"), {
  ssr: false,
});
const NewPatientView = NextDynamic(() => import("../patients/new/page"), {
  ssr: false,
});
const AppointmentsView = NextDynamic(() => import("../appointments/page"), {
  ssr: false,
});
// const NewAppointmentView = NextDynamic(() => import("../appointments/new/page"), { ssr:false });

const VIEWS = {
  "/admin": AdminView,
  "/admin/patients": PatientsView,
  "/admin/patients/new": NewPatientView,
  "/admin/appointments": AppointmentsView,
  // "/admin/appointments/new": NewAppointmentView,
};

function pickTarget() {
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("target");
    const path = url.pathname;
    const last = localStorage.getItem("lastAdminPath");
    const candidate = q || path || last || "/admin";
    if (VIEWS[candidate]) return candidate;
    // longest-prefix fallback
    const keys = Object.keys(VIEWS).sort((a, b) => b.length - a.length);
    return keys.find((k) => candidate.startsWith(k)) || "/admin";
  } catch {
    return "/admin";
  }
}

export default function OfflineShell() {
  const [target, setTarget] = useState("/admin");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setTarget(pickTarget());
  }, []);

  const View = VIEWS[target] || AdminView;

  // If the chunk isn’t in cache yet, NextDynamic will throw until SW precache hits.
  // Show a very small fallback; the Admin layout still wraps this route.
  if (failed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f4ee] p-6">
        <div className="max-w-lg rounded-xl border border-[#e5e1d8] bg-white px-6 py-5 shadow">
          <h2 className="text-base font-semibold mb-1">Εκτός σύνδεσης</h2>
          <p className="text-sm text-[#6b675f]">
            Δεν ήταν δυνατή η φόρτωση των αρχείων της εφαρμογής από την μνήμη.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 text-sm rounded-md border border-[#e5e1d8] bg-[#f6f4ef] hover:bg-[#efece6]"
            >
              Δοκιμή ξανά
            </button>
            <button
              onClick={() => (window.location.href = "/admin")}
              className="px-3 py-1.5 text-sm rounded-md border border-[#e5e1d8] bg-white hover:bg-[#f6f4ef]"
            >
              Πίνακας Διαχείρισης
            </button>
          </div>
        </div>
      </main>
    );
  }

  try {
    return <View __fromOfflineShell />;
  } catch {
    setFailed(true);
    return null;
  }
}
