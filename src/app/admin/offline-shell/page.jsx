// app/admin/offline-shell/page.jsx
"use client";
export const dynamic = "force-static";

// Import the real views (they should already be offline-safe)
import AdminPage from "../page";
import PatientsPage from "../patients/page";
import AppointmentsPage from "../appointments/page";
// import NewPatientPage from "../patients/new/page";
// import NewAppointmentPage from "../appointments/new/page";
// import SchedulePage from '../schedule/page';

const VIEWS = {
  "/admin": AdminPage,
  "/admin/patients": PatientsPage,
  //   "/admin/patients/new": NewPatientPage,
  "/admin/appointments": AppointmentsPage,
  //   "/admin/appointments/new": NewAppointmentPage,
  // '/admin/schedule': SchedulePage,
};
function resolveTarget() {
  if (typeof window === "undefined") return "/admin";
  const url = new URL(window.location.href);
  const qTarget = url.searchParams.get("target");
  const path = url.pathname; // ← current path (works offline)
  const last = localStorage.getItem("lastAdminPath");

  const candidate = qTarget || path || last || "/admin";
  return Object.prototype.hasOwnProperty.call(VIEWS, candidate)
    ? candidate
    : "/admin";
}

export default function OfflineShell() {
  const target = resolveTarget();
  const View = VIEWS[target] || AdminPage;
  return <View __fromOfflineShell />;
}
