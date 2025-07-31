"use client";

import dynamic from "next/dynamic";

const AppointmentSuccessClient = dynamic(
  () => import("../../components/AppointmentSuccessClient"),
  {
    ssr: false,
  }
);

export default function AppointmentSuccessPage() {
  return <AppointmentSuccessClient />;
}
