"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function useAppointmentsRealtime(initialAppointments = []) {
  const supabase = createClientComponentClient();
  const [appointments, setAppointments] = useState(initialAppointments);

  useEffect(() => {
    const ch = supabase
      .channel("rt-appointments")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        (payload) => {
          const row = payload.new;
          setAppointments((prev) =>
            prev.map((a) => (a.id === row.id ? { ...a, ...row } : a))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          const row = payload.new;
          setAppointments((prev) => [row, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "appointments" },
        (payload) => {
          const row = payload.old;
          setAppointments((prev) => prev.filter((a) => a.id !== row.id));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [supabase]);

  return [appointments, setAppointments];
}
