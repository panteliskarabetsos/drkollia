// app/admin/offline-shell/page.jsx
"use client";

// Make this page cacheable (no redirects) so the SW can precache it.
export const dynamic = "force-static";

// Import the real admin views you want available offline.
// (They should already be offline-aware and not redirect when offline.)
import AdminPage from "../page";
import PatientsPage from "../patients/page";
import AppointmentsPage from "../appointments/page";

// Map allowed targets to components
const VIEWS = {
  "/admin": AdminPage,
  "/admin/patients": PatientsPage,
  "/admin/appointments": AppointmentsPage,
};

function pickTarget() {
  if (typeof window === "undefined") return "/admin";
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("target");
  const fromStorage = localStorage.getItem("lastAdminPath");
  const candidate = fromQuery || fromStorage || "/admin";
  return Object.prototype.hasOwnProperty.call(VIEWS, candidate)
    ? candidate
    : "/admin";
}

export default function OfflineShell() {
  // Pick once on mount; no need to re-render. Keep it simple for offline.
  const target = typeof window === "undefined" ? "/admin" : pickTarget();
  const View = VIEWS[target] || AdminPage;

  // Render the actual page (dashboard/patients/appointments)
  // Pages can optionally check __fromOfflineShell if they need to tweak behavior.
  return <View __fromOfflineShell />;
}
