// app/admin/offline-shell/page.jsx
"use client";
export const dynamic = "force-static";

import { useEffect, useState } from "react";
import NextDynamic from "next/dynamic"; // ← renamed to avoid clash
import AuthGate from "../_components/AuthGate";

// Lazy-load views on client only (prevents prerender errors)
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
// Optional:
// const NewAppointmentView = NextDynamic(() => import("../appointments/new/page"), { ssr: false });

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

  useEffect(() => {
    setTarget(pickTarget());
  }, []);

  const View = VIEWS[target] || AdminView;

  return (
    <AuthGate>
      <View __fromOfflineShell />
    </AuthGate>
  );
}
