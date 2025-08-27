"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  CalendarDays,
  User,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  LifeBuoy,
  LogOut,
  BarChart3,
  Hourglass,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loadingButton, setLoadingButton] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextAppt, setNextAppt] = useState(null);
  const [nextApptErr, setNextApptErr] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const today = new Date();
      const start = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate()
        )
      );
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      const [
        { count: todayCount },
        { count: pendingCount },
        { count: patientsCount },
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("appointment_time", start.toISOString())
          .lt("appointment_time", end.toISOString()),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase.from("patients").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        today: todayCount ?? 0,
        pending: pendingCount ?? 0,
        patients: patientsCount ?? 0,
      });
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };

    if (user) loadProfile();
  }, [user]);

  useEffect(() => {
    const loadNextAppointment = async () => {
      setNextApptErr(null);
      try {
        const nowISO = new Date().toISOString();

        // 1) Πάρε το πρώτο επερχόμενο (αποφεύγουμε cancelled/completed)
        const { data, error } = await supabase
          .from("appointments")
          .select(
            "id, appointment_time, status, duration_minutes, reason, patient_id"
          )
          .gte("appointment_time", nowISO)
          .not("status", "in", "(cancelled,completed)")
          .order("appointment_time", { ascending: true })
          .limit(1);

        if (error) throw error;

        const appt = data?.[0] ?? null;
        if (!appt) return setNextAppt(null);

        // 2) Προαιρετικά: φέρε το όνομα ασθενή σε 2ο query (για να μη σπάει από RLS στο join)
        if (appt.patient_id) {
          const { data: p } = await supabase
            .from("patients")
            .select("first_name, last_name")
            .eq("id", appt.patient_id)
            .single();

          appt.patient_name = p
            ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
            : null;
        }

        setNextAppt(appt);
      } catch (e) {
        console.error("loadNextAppointment error", e);
        setNextApptErr("Αδυναμία φόρτωσης επόμενου ραντεβού");
        setNextAppt(null);
      }
    };

    loadNextAppointment();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fafafa] text-[#333]">
        <p className="text-sm text-gray-500">Έλεγχος σύνδεσης...</p>
      </main>
    );
  }

  const items = [
    {
      title: "Ραντεβού",
      description: "Διαχείριση προγραμματισμένων ραντεβού.",
      href: "/admin/appointments",
      icon: <CalendarDays className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Ασθενείς",
      description: "Προβολή και επεξεργασία αρχείου ασθενών.",
      href: "/admin/patients",
      icon: <User className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόγραμμα",
      description: "Διαχείριση προγράμματος λειτουργίας και εξαιρέσεων.",
      href: "/admin/schedule",
      icon: <Clock className="w-5 h-5 text-[#3a3a38]" />,
    },
    {
      title: "Πρόσβαση",
      description: "Διαχείριση και δημιουργία λογαριασμών διαχειριστών.",
      href: "/admin/accounts",
      icon: <ShieldCheck className="w-5 h-5 text-[#3a3a38]" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#333] font-sans relative">
      <section className="py-22 px-4 max-w-6xl mx-auto">
        <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-start">
          <div className="flex items-center gap-3">
            {/* User Circle Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
              {profile?.name?.[0]?.toUpperCase() ??
                user?.email?.[0]?.toUpperCase() ??
                "U"}
            </div>

            {/* Name + Email */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {profile?.name ?? "Χρήστης"}
              </span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>

            {/* Logout Icon Button */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="ml-4 p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600 hover:text-gray-900" />
            </button>
          </div>
        </header>

        <h1 className="text-3xl font-medium text-center mb-12 tracking-tight">
          Πίνακας Διαχείρισης
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200 hover:scale-[1.01] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-3">
                {item.icon}
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">{item.description}</p>
              <button
                onClick={() => {
                  setLoadingButton(idx);
                  router.push(item.href);
                }}
                className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-[#3a3a38] hover:text-white transition font-medium shadow-sm disabled:opacity-60"
                disabled={loadingButton !== null}
              >
                {loadingButton === idx ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Φόρτωση...
                  </>
                ) : (
                  <>
                    Μετάβαση
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
          {/* --- Extra Card with Stats --- */}
          <div className="border border-gray-200 bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-[#3a3a38]" />
              <h2 className="text-lg font-semibold">Σύνοψη</h2>
            </div>
            {stats ? (
              <div className="text-sm text-gray-700 space-y-2 mb-6">
                <p>
                  <span className="font-medium">
                    Επερχόμενα Ραντεβού σήμερα:
                  </span>{" "}
                  {stats.today}
                </p>
                <p>
                  <span className="font-medium">Εγκεκριμένα:</span>{" "}
                  {stats.pending}
                </p>
                <p>
                  <span className="font-medium">Σύνολο ασθενών:</span>{" "}
                  {stats.patients}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">Φόρτωση...</p>
            )}

            <button
              onClick={() => router.push("/admin/reports")}
              className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-[#3a3a38] hover:text-white transition font-medium shadow-sm"
            >
              Προβολή αναφορών
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* --- Next Appointment Card --- */}
          <div className="group border border-[#e5e1d8] bg-white/90 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-300 flex flex-col justify-between backdrop-blur">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Hourglass className="w-5 h-5 text-[#8c7c68] animate-pulse" />
              <h2 className="text-lg font-semibold text-[#2f2e2b]">
                Επόμενο Ραντεβού
              </h2>
            </div>

            {/* Content */}
            {nextApptErr ? (
              <p className="text-sm text-red-600 mb-6">{nextApptErr}</p>
            ) : nextAppt ? (
              <div className="text-sm text-[#3b3a36] space-y-2 mb-6">
                <p>
                  <span className="font-medium text-[#6b675f]">Ώρα:</span>{" "}
                  {new Date(nextAppt.appointment_time).toLocaleString("el-GR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
                <p>
                  <span className="font-medium text-[#6b675f]">Ασθενής:</span>{" "}
                  {nextAppt.patient_name ?? "—"}
                </p>
                <p className="truncate">
                  <span className="font-medium text-[#6b675f]">Λόγος:</span>{" "}
                  {nextAppt.reason || "—"}
                </p>
                <div className="flex items-center gap-2">
                  <p>
                    <span className="font-medium text-[#6b675f]">
                      Διάρκεια:
                    </span>{" "}
                    {nextAppt.duration_minutes ?? 30}′
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border ${
                      nextAppt.status === "approved"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : nextAppt.status === "pending"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    {nextAppt.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">
                Δεν υπάρχει επόμενο ραντεβού.
              </p>
            )}

            {/* CTA */}
            <button
              onClick={() =>
                router.push(
                  nextAppt?.id
                    ? `/admin/appointments?focus=${nextAppt.id}`
                    : "/admin/appointments"
                )
              }
              className="inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#e5e1d8] text-[#3b3a36] bg-white hover:bg-[#8c7c68] hover:text-white transition font-medium shadow-sm"
            >
              Προβολή
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Floating Help Button with Hover Text */}
      <div className="fixed bottom-6 right-6 flex items-center space-x-2 group">
        {/* Hover text */}
        <span className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-white text-gray-700 text-sm px-3 py-1 rounded-lg shadow-md">
          Χρειάζεστε βοήθεια?
        </span>

        {/* Icon button */}
        <button
          onClick={() => router.push("/help")}
          aria-label="Need help?"
          className="p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <LifeBuoy className="w-8 h-8" />
        </button>
      </div>
    </main>
  );
}
