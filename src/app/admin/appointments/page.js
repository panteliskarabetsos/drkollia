"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, set } from "date-fns";
import * as XLSX from "xlsx";
import LiveClock from "../../components/LiveClock";
import {
  fetchAppointmentsRange,
  syncAppointments,
} from "../../../lib/offlineAppointments";
import { db } from "../../../lib/db";
import { useAuthGate } from "../../../lib/useAuthGate";
import {
  Plus,
  ArrowLeft,
  UserCircle,
  Trash2,
  StickyNote,
  Check,
  X,
  Ban,
  AlertTriangle,
  IdCard,
  FileDown,
  Printer,
  History,
} from "lucide-react";
import { el } from "date-fns/locale";

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { ready, mode, user, isOnline } = useAuthGate();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setTimeout(() => {
          router.push("/login"); // αποφυγή scroll reset λόγω immediate redirect
        }, 0);
      } else {
        setSessionExists(true);
      }
      setSessionChecked(true);
    };

    checkAuth();
  }, []);
  const normalize = (text) =>
    text
      ?.normalize("NFD") // διαχωρίζει γράμμα και τόνο
      .replace(/\p{Diacritic}/gu, "") // αφαιρεί τους τόνους
      .toLowerCase();

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notifyCancelEmail, setNotifyCancelEmail] = useState(true);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  // const [selectedAppointmentNote, setSelectedAppointmentNote] = useState(null);
  const [appointmentNoteModalOpen, setAppointmentNoteModalOpen] =
    useState(false);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editingNote, setEditingNote] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // 'day', 'week', 'month'
  const [dateRange, setDateRange] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedAppointmentNote, setSelectedAppointmentNote] = useState("");
  const [editMounted, setEditMounted] = useState(false);
  const editDialogRef = useRef(null);
  const editCloseBtnRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const greekLocale = {
    ...el,
    options: {
      ...el.options,
      weekStartsOn: 1, // Ξεκινά η εβδομάδα από Δευτέρα
    },
  };

  // status filter: 'all' | 'scheduled' | 'approved' | 'cancelled' | 'rejected' | 'completed'
  const [statusFilter, setStatusFilter] = useState("all");

  const statusPills = [
    { key: "all", label: "Όλα" },
    // { key: "scheduled", label: "Σε αναμονή" },
    { key: "approved", label: "Εγκεκριμένα" },
    { key: "cancelled", label: "Ακυρωμένα" },
    // { key: "rejected", label: "Απορρίφθηκαν" },
    { key: "completed", label: "Ολοκληρωμένα" },
  ];

  const effectiveStatus = (appt) =>
    appt.status === "approved" && new Date(appt.appointment_time) < new Date()
      ? "completed"
      : appt.status;

  const statusStyles = {
    scheduled: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
    approved: "bg-green-100 text-green-800 ring-1 ring-green-200",
    cancelled: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    rejected: "bg-red-100 text-red-800 ring-1 ring-red-200",
    completed: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  };

  const statusLabel = {
    scheduled: "scheduled",
    approved: "approved",
    cancelled: "cancelled",
    rejected: "rejected",
    completed: "completed",
  };

  const normalizeText = (text) =>
    text
      ?.normalize("NFD") // διαχωρίζει γράμμα και τόνο
      .replace(/\p{Diacritic}/gu, "") // αφαιρεί τόνους
      .toLowerCase(); // πεζά γράμματα

  const patientSearchActive = searchQuery.trim() !== "";

  const filteredAppointments = (appointments ?? []).filter((appt) => {
    const apptDate = new Date(appt.appointment_time);

    // --- Search (patient-first) ---
    if (patientSearchActive) {
      const q = normalizeText(searchQuery);

      const fullName = normalizeText(
        `${appt.patients?.first_name ?? ""} ${appt.patients?.last_name ?? ""}`
      );
      const phone = normalizeText(appt.patients?.phone ?? "");
      const amka = normalizeText(appt.patients?.amka ?? "");
      const reason = normalizeText(appt.reason ?? "");

      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        amka.includes(q) ||
        reason.includes(q)
      );
    }

    // --- No search: apply your date filter as before ---
    let isInRange = false;
    if (dateRange?.from && dateRange?.to) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      isInRange = apptDate >= from && apptDate <= to;
    } else {
      isInRange = isSameDay(apptDate, selectedDate);
    }
    const eff = effectiveStatus(appt);
    if (statusFilter !== "all" && eff !== statusFilter) return false;
    return isInRange;
  });

  const patientAppointmentDates = useMemo(() => {
    if (!patientSearchActive) return [];
    const set = new Set();
    (appointments ?? [])
      .filter((a) => {
        const q = normalizeText(searchQuery);
        const name = normalizeText(
          `${a.patients?.first_name ?? ""} ${a.patients?.last_name ?? ""}`
        );
        const phone = normalizeText(a.patients?.phone ?? "");
        const amka = normalizeText(a.patients?.amka ?? "");
        return name.includes(q) || phone.includes(q) || amka.includes(q);
      })
      .forEach((a) =>
        set.add(new Date(a.appointment_time).toISOString().slice(0, 10))
      );
    return Array.from(set).sort();
  }, [appointments, searchQuery, patientSearchActive]);

  const groupedAppointments = filteredAppointments.reduce((groups, appt) => {
    const dateKey = new Date(appt.appointment_time).toLocaleDateString(
      "el-GR",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(appt);
    return groups;
  }, {});

  const handleDeleteAppointment = async () => {
    console.log("Deleting ID:", deleteTargetId);
    const { data, error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      console.error("Error deleting appointment:", error);
      alert("Σφάλμα κατά τη διαγραφή.");
    } else {
      console.log("Appointment deleted:", data);
      setAppointments((prev) => prev.filter((a) => a.id !== deleteTargetId));
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  useEffect(() => {
    if (!sessionExists) return;

    let unsubscribe = () => {};
    let channel;

    const attachLocalJoins = async (rows) => {
      // When offline, rows in Dexie may not have nested patients/creator.
      return Promise.all(
        rows.map(async (r) => {
          if (r.patients) return r;
          const p = await db.patients.get(r.patient_id).catch(() => null);
          return {
            ...r,
            patients: p
              ? {
                  id: p.id,
                  first_name: p.first_name,
                  last_name: p.last_name,
                  email: p.email,
                  phone: p.phone,
                  amka: p.amka,
                }
              : null,
          };
        })
      );
    };

    const putManyIntoDexie = async (rows) => {
      await db.transaction("rw", db.appointments, async () => {
        for (const row of rows) {
          await db.appointments.put({
            ...row,
            // quick index for day queries; safe even if undefined
            appointment_date: row.appointment_time
              ? row.appointment_time.slice(0, 10)
              : null,
          });
        }
      });
    };

    const refresh = async () => {
      setLoading(true);
      setIsLoading(true);
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("appointments")
            .select(
              `
            id,
            appointment_time,
            reason,
            status,
            notes,
            duration_minutes,
            is_exception,
            created_at,
            patients:patient_id (
              id,
              first_name,
              last_name,
              email,
              phone,
              amka
            ),
            creator:profiles!appointments_created_by_fkey (
              id, name, email
            )
          `
            )
            .order("appointment_time", { ascending: true });

          if (error) throw error;

          setAppointments(data || []);
          await putManyIntoDexie(data || []);
        } else {
          // Offline: read from Dexie and enrich with patient info (if missing)
          const local = await db.appointments
            .orderBy("appointment_time")
            .toArray();
          const withJoins = await attachLocalJoins(local);
          // Sort to be safe
          withJoins.sort(
            (a, b) =>
              new Date(a.appointment_time) - new Date(b.appointment_time)
          );
          setAppointments(withJoins);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    refresh();

    // Realtime only when online
    if (navigator.onLine) {
      channel = supabase
        .channel("appointments-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments" },
          async (payload) => {
            try {
              if (payload.eventType === "DELETE") {
                const delId = payload.old?.id;
                setAppointments((prev) => prev.filter((a) => a.id !== delId));
                await db.appointments.delete(delId);
                return;
              }

              // INSERT or UPDATE → refetch the single row with joins
              const { data, error } = await supabase
                .from("appointments")
                .select(
                  `
                id,
                appointment_time,
                reason,
                status,
                notes,
                duration_minutes,
                is_exception,
                created_at,
                patients:patient_id (
                  id,
                  first_name,
                  last_name,
                  email,
                  phone,
                  amka
                ),
                creator:profiles!appointments_created_by_fkey (
                  id, name, email
                )
              `
                )
                .eq("id", payload.new.id)
                .single();

              if (error || !data) return;

              setAppointments((prev) => {
                const idx = prev.findIndex((a) => a.id === data.id);
                if (idx === -1) {
                  const next = [...prev, data];
                  next.sort(
                    (a, b) =>
                      new Date(a.appointment_time) -
                      new Date(b.appointment_time)
                  );
                  return next;
                }
                const next = prev.slice();
                next[idx] = { ...next[idx], ...data };
                next.sort(
                  (a, b) =>
                    new Date(a.appointment_time) - new Date(b.appointment_time)
                );
                return next;
              });

              await db.appointments.put({
                ...data,
                appointment_date: data.appointment_time
                  ? data.appointment_time.slice(0, 10)
                  : null,
              });
            } catch (e) {
              console.error(e);
            }
          }
        )
        .subscribe();

      unsubscribe = () => supabase.removeChannel(channel);
    }

    // Refresh when coming back online
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      unsubscribe();
    };
  }, [sessionExists]);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const safeUpdateStatus = (id, status) => {
    if (!isOnline) return;
    updateStatus(id, status);
  };

  useEffect(() => {
    if (!editNoteModalOpen) return;
    setEditMounted(true);
    // Focus close button for keyboard users
    editCloseBtnRef.current?.focus();

    // focus trap + ESC
    const el = editDialogRef.current;
    const sel =
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(el?.querySelectorAll(sel) || []).filter(
        (n) => !n.hasAttribute("disabled")
      );

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditNoteModalOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const f = getFocusable();
        if (!f.length) return;
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      setEditMounted(false);
    };
  }, [editNoteModalOpen]);

  const formatDateTimeEl = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  function formatDate(date) {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: el });
    } catch {
      return "—";
    }
  }

  // sendEmail comes from the modal checkbox (true/false)
  const updateStatus = async (id, status, sendEmail = false) => {
    const appointment = appointments.find((app) => app.id === id);
    if (!appointment) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Σφάλμα κατά την ενημέρωση.");
      return;
    }

    // update local state
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );

    // email only if requested AND we have an email
    if (status === "cancelled" && sendEmail && appointment.patients?.email) {
      try {
        await fetch("/api/send-cancellation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: appointment.patients.email,
            name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
            date: appointment.appointment_time,
            reason: appointment.reason,
          }),
        });
      } catch (err) {
        console.error("❌ Σφάλμα αποστολής email ακύρωσης:", err);
      }
    }
  };

  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center">
        Έλεγχος σύνδεσης…
      </main>
    );
  }
  if (!sessionExists) return null;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Φόρτωση...
      </main>
    );
  }

  const handleDownloadExcel = (appointments) => {
    if (!Array.isArray(appointments)) {
      console.error("appointments is not an array:", appointments);
      return;
    }

    const groupedByDate = appointments.reduce((acc, appt) => {
      const date = new Date(appt.appointment_time)
        .toLocaleDateString("el-GR")
        .replace(/\//g, "-");
      if (!acc[date]) acc[date] = [];
      acc[date].push(appt);
      return acc;
    }, {});

    const workbook = XLSX.utils.book_new();

    // Συλλογή όλων των ημερομηνιών
    const allDates = Object.keys(groupedByDate).sort((a, b) => {
      const [d1, m1, y1] = a.split("-").map(Number);
      const [d2, m2, y2] = b.split("-").map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    for (const date of allDates) {
      const data = groupedByDate[date].map((appt) => ({
        Ασθενής: `${appt.patients?.last_name ?? ""} ${
          appt.patients?.first_name ?? ""
        }`,
        Τηλέφωνο: appt.patients?.phone ?? "",
        ΑΜΚΑ: appt.patients?.amka ?? "",
        Ημερομηνία: new Date(appt.appointment_time).toLocaleDateString("el-GR"),
        Ώρα: new Date(appt.appointment_time).toLocaleTimeString("el-GR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        "Διάρκεια (λεπτά)": appt.duration_minutes,
        Κατάσταση: appt.status,
        "Λόγος Επίσκεψης": appt.reason ?? "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-width
      const maxColWidths = data.reduce((widths, row) => {
        Object.values(row).forEach((val, i) => {
          const len = String(val).length;
          widths[i] = Math.max(widths[i] || 10, len);
        });
        return widths;
      }, []);
      worksheet["!cols"] = maxColWidths.map((w) => ({ wch: w + 5 }));
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

      XLSX.utils.book_append_sheet(workbook, worksheet, date);
    }

    // Τίτλος αρχείου με εύρος ημερομηνιών
    const filename =
      allDates.length === 1
        ? `appointments_${allDates[0]}.xlsx`
        : `appointments_${allDates[0]}_${allDates[allDates.length - 1]}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const handlePrint = () => {
    const originalContent = document.getElementById("printable-content");
    if (!originalContent) return;

    // Clone the content so we can safely modify it
    const clonedContent = originalContent.cloneNode(true);

    // Remove elements with class "no-print" or "print:hidden"
    const elementsToRemove = clonedContent.querySelectorAll(
      ".no-print, .print\\:hidden"
    );
    elementsToRemove.forEach((el) => el.remove());

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
    <html lang="el">
    <head>
      <title>Εκτύπωση Ραντεβού</title>
      <style>
        body {
          font-family: "Noto Serif", serif;
          padding: 20px;
          color: #333;
        }
        h2 {
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: left;
          font-size: 14px;
        }
        th {
          background-color: #f0ede7;
        }
      </style>
    </head>
    <body>
      <h2>Λίστα Ραντεβού</h2>
      ${clonedContent.innerHTML}
    </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  function calculateAge(birthDateStr) {
    if (!birthDateStr) return "-";
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  function openCancelDialog(id) {
    const appt = appointments.find((a) => a.id === id);
    setCancelTargetId(id);
    // Προεπιλογή: τσεκαρισμένο μόνο αν υπάρχει email
    setNotifyCancelEmail(!!appt?.patients?.email);
    setCancelDialogOpen(true);
  }

  function openAppointmentNoteModal(appt) {
    setSelectedAppointmentId(appt.id);
    setSelectedAppointmentNote(appt.notes || "");
    setAppointmentNoteModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-[#f9f9f9] text-[#3b3a36] py-22 px-4 relative">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 relative">
        {cancelDialogOpen &&
          (() => {
            const currentAppt = appointments.find(
              (a) => a.id === cancelTargetId
            );
            const hasEmail = !!currentAppt?.patients?.email;

            return (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Επιβεβαίωση Ακύρωσης
                    </h2>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">
                    Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτό το ραντεβού;
                  </p>

                  {/* Checkbox ενημέρωσης */}
                  <div className="mb-5 flex items-center gap-2">
                    <input
                      id="notifyCancelEmail"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={notifyCancelEmail}
                      onChange={(e) => setNotifyCancelEmail(e.target.checked)}
                      disabled={!hasEmail}
                    />
                    <label
                      htmlFor="notifyCancelEmail"
                      className="text-sm text-gray-700"
                    >
                      Ενημέρωση ασθενούς με email
                      {!hasEmail && (
                        <span className="ml-1 text-gray-500">
                          (δεν υπάρχει email)
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setCancelDialogOpen(false)}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Άκυρο
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(
                          cancelTargetId,
                          "cancelled",
                          notifyCancelEmail && hasEmail
                        );
                        setCancelDialogOpen(false);
                      }}
                      className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500"
                    >
                      Ναι, ακύρωση
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        <button
          onClick={() => router.push("/admin")}
          className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
          title="Επιστροφή στο Dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => router.push("/admin/appointments/new")}
          className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-md transition"
          title="Καταχώρηση Ραντεβού"
        >
          <Plus size={20} />
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          {/* Αριστερά - Τίτλος */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-semibold">Λίστα Ραντεβού</h1>
            <p className="text-sm text-gray-500">
              Επιλέξτε ημερομηνία για προβολή
            </p>
          </div>

          {/* Κέντρο - Ώρα */}
          <div className="flex-1 flex justify-center">
            <LiveClock className="text-6xl font-extralight text-gray-700 tracking-widest" />
          </div>

          {/* Δεξιά - Calendar */}
          <Calendar
            mode="range"
            locale={greekLocale}
            selected={dateRange}
            onSelect={setDateRange}
            disabled={{ before: new Date() }}
            modifiers={{
              weekend: (date) => [0, 6].includes(date.getDay()), // Κυριακή = 0, Σάββατο = 6
              patientDays: patientAppointmentDates.map((k) => new Date(k)),
            }}
            modifiersClassNames={{
              weekend: "text-gray-400 opacity-60", // πιο "faded"
              patientDays: "bg-amber-200 text-amber-900 rounded-full",
            }}
            className="rounded-md border border-gray-200 shadow"
          />
        </div>

        {/* search bar  */}
        <div className="mb-8 flex flex-col md:flex-row justify-between gap-4 w-full">
          {/* Search bar */}
          <div className="relative w-full md:max-w-sm">
            <input
              type="text"
              placeholder="Αναζήτηση ασθενούς..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68] focus:border-transparent text-sm text-gray-700 placeholder-gray-400 transition"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
              />
            </svg>
          </div>
          {/* Status pills */}
          <div className="mt-2 flex flex-wrap gap-2">
            {statusPills.map((p) => {
              const active = statusFilter === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setStatusFilter(p.key)}
                  className={`px-3 py-1.5 text-xs rounded-full transition 
          ${
            active
              ? "bg-[#2f2e2b] text-white shadow-sm"
              : "bg-white text-[#3b3a36] border border-gray-200 hover:bg-gray-50"
          }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* History button */}
          <div className="flex gap-3 justify-end items-center mb-6">
            <button
              onClick={() => router.push("/admin/past-appointments")}
              className="group relative flex items-center gap-2 pl-3 pr-1 py-2 rounded-full border border-[#c8bfae] bg-white/70 backdrop-blur-md text-[#4c3f2c] shadow-sm hover:bg-[#f3899ea3] hover:shadow-md transition-all duration-300"
              title="Ιστορικό Ραντεβού"
            >
              <div className="flex items-center justify-center w-6 h-6">
                <History
                  size={18}
                  className="text-[#7b6a55] group-hover:text-[#4c3f2c] transition-colors duration-200"
                />
              </div>
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 text-sm font-medium tracking-wide">
                Ιστορικό Ραντεβού
              </span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={() => handleDownloadExcel(filteredAppointments)}
              className="group relative flex items-center gap-2 pl-3 pr-1 py-2 rounded-full border border-[#c8bfae] bg-white/70 backdrop-blur-md text-[#4c3f2c] shadow-sm hover:bg-[#86fcae87] hover:shadow-md transition-all duration-300"
              title="Εξαγωγή σε Excel"
              disabled={
                !filteredAppointments || filteredAppointments.length === 0
              }
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FileDown
                  size={18}
                  className="text-[#7b6a55] group-hover:text-[#4c3f2c] transition-colors duration-200"
                />
              </div>
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 text-sm font-medium tracking-wide">
                Εξαγωγή σε Excel
              </span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="group relative flex items-center gap-2 pl-3 pr-1 py-2 rounded-full border border-[#c8bfae] bg-white/70 backdrop-blur-md text-[#4c3f2c] shadow-sm hover:bg-[#74dcf9b6] hover:shadow-md transition-all duration-300"
              title="Εκτύπωση"
            >
              <div className="flex items-center justify-center w-6 h-6">
                <Printer
                  size={18}
                  className="text-[#7b6a55] group-hover:text-[#4c3f2c] transition-colors duration-200"
                />
              </div>
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 text-sm font-medium tracking-wide">
                Εκτύπωση
              </span>
            </button>
          </div>
        </div>

        <div id="printable-content">
          {Object.keys(groupedAppointments).length === 0 ? (
            <p className="text-center text-gray-500">
              Δεν υπάρχουν ραντεβού για την επιλεγμένη{" "}
              {dateRange?.from && dateRange?.to ? "περίοδο." : "ημερομηνία."}
            </p>
          ) : (
            Object.entries(groupedAppointments).map(([date, appts]) => (
              <div key={date} className="mb-10">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  {date}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-t border-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3">Όνομα</th>
                        <th className="px-4 py-3">Τηλέφωνο</th>
                        <th className="px-4 py-3">ΑΜΚΑ</th>
                        <th className="px-4 py-3">Λόγος Επίσκεψης</th>
                        <th className="px-4 py-3">Ώρα</th>
                        <th className="px-4 py-3">Διάρκεια</th>
                        <th className="px-4 py-3">Κατάσταση</th>
                        <th className="px-4 py-3 text-right no-print">
                          Ενέργειες
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appts.map((appt, i) => {
                        const time = new Date(
                          appt.appointment_time
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const statusColor =
                          {
                            approved: "bg-green-200 text-green-800",
                            rejected: "bg-red-100 text-red-800",
                            scheduled: "bg-yellow-100 text-yellow-800",
                            completed: "bg-blue-100 text-blue-800",
                          }[
                            appt.status === "approved" &&
                            new Date(appt.appointment_time) < new Date()
                              ? "completed"
                              : appt.status
                          ] || "bg-gray-100 text-gray-700";

                        return (
                          <tr
                            key={appt.id}
                            className={
                              appt.is_exception
                                ? "bg-red-100"
                                : i % 2
                                ? "bg-gray-50 hover:bg-gray-100 animate-bg-transition"
                                : "bg-white hover:bg-gray-100 animate-bg-transition"
                            }
                          >
                            <td className="px-4 py-2">
                              <strong>
                                {appt.patients
                                  ? `${appt.patients.last_name} ${appt.patients.first_name}`
                                  : "-"}
                              </strong>

                              {appt.patients?.id && (
                                <button
                                  onClick={async () => {
                                    const { data, error } = await supabase
                                      .from("patients")
                                      .select("*")
                                      .eq("id", appt.patients.id)
                                      .single();
                                    if (!error) {
                                      setSelectedPatient(data);
                                      setNotesModalOpen(true);
                                    }
                                  }}
                                  title="Προβολή καρτέλας ασθενούς"
                                  className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-full transition-colors duration-200 no-print print:hidden"
                                >
                                  <IdCard className="w-4 h-4 text-blue-600 no-print print:hidden" />
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {appt.patients?.phone || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {appt.patients?.amka || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {appt.reason?.trim() || "-"}
                            </td>
                            <td className="px-4 py-3">{time}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {appt.duration_minutes
                                ? `${appt.duration_minutes} λεπτά`
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge appt={appt} />
                            </td>

                            <td className="px-4 py-3 text-right no-print">
                              <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                                {/* Σχόλια (επιτρέπεται και offline) */}
                                <button
                                  onClick={() => openAppointmentNoteModal(appt)}
                                  className={`p-1.5 rounded-full border transition ${
                                    appt.notes?.trim()
                                      ? "text-blue-700 border-blue-300 hover:bg-blue-50"
                                      : "text-gray-400 border-gray-200 hover:bg-gray-50"
                                  }`}
                                  title="Προβολή σημειώσεων"
                                >
                                  <StickyNote className="w-4 h-4 no-print" />
                                </button>

                                {/* Οι υπόλοιπες ενέργειες μόνο αν ΔΕΝ είναι completed / past-approved */}
                                {!(
                                  appt.status === "completed" ||
                                  (appt.status === "approved" &&
                                    new Date(appt.appointment_time) <
                                      new Date())
                                ) && (
                                  <>
                                    {/* Έγκριση */}
                                    {appt.status === "scheduled" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isOnline) return;
                                          updateStatus(appt.id, "approved");
                                        }}
                                        disabled={!isOnline}
                                        aria-disabled={!isOnline}
                                        title={
                                          isOnline
                                            ? "Έγκριση"
                                            : "Απαιτείται σύνδεση"
                                        }
                                        className="p-1.5 rounded-full border border-green-300 text-green-700 hover:bg-green-50 transition
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Απόρριψη */}
                                    {appt.status === "scheduled" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isOnline) return;
                                          updateStatus(appt.id, "rejected");
                                        }}
                                        disabled={!isOnline}
                                        aria-disabled={!isOnline}
                                        title={
                                          isOnline
                                            ? "Απόρριψη"
                                            : "Απαιτείται σύνδεση"
                                        }
                                        className="p-1.5 rounded-full border border-red-300 text-red-700 hover:bg-red-50 transition
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Ακύρωση */}
                                    {appt.status === "approved" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isOnline) return;
                                          setCancelTargetId(appt.id);
                                          setCancelDialogOpen(true);
                                        }}
                                        disabled={!isOnline}
                                        aria-disabled={!isOnline}
                                        title={
                                          isOnline
                                            ? "Ακύρωση"
                                            : "Απαιτείται σύνδεση"
                                        }
                                        className="p-1.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                      >
                                        <Ban className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Διαγραφή */}
                                    {appt.status === "cancelled" && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isOnline) return;
                                          setDeleteTargetId(appt.id);
                                          setDeleteDialogOpen(true);
                                        }}
                                        disabled={!isOnline}
                                        aria-disabled={!isOnline}
                                        title={
                                          isOnline
                                            ? "Διαγραφή"
                                            : "Απαιτείται σύνδεση"
                                        }
                                        className="p-1.5 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {appointmentNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-note-title"
          onKeyDown={(e) =>
            e.key === "Escape" && setAppointmentNoteModalOpen(false)
          }
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setAppointmentNoteModalOpen(false)}
          />

          {/* Card */}
          <div className="relative w-full max-w-lg rounded-2xl border border-[#e5e1d8] bg-white/90 shadow-[0_10px_40px_rgba(60,50,30,0.18)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e7e1d6] bg-white text-xs text-[#6b675f]">
                  <StickyNote className="w-4 h-4" />
                </span>
                <h2
                  id="appointment-note-title"
                  className="text-base font-semibold tracking-tight text-[#2f2e2b]"
                >
                  Σημειώσεις Ραντεβού
                </h2>
              </div>
              <button
                onClick={() => setAppointmentNoteModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[#6b675f] hover:bg-[#f3f0ea]"
                aria-label="Κλείσιμο"
              >
                ✕
              </button>
            </div>

            {/* Meta */}
            <div className="px-6 pt-3">
              {(() => {
                const appt = appointments.find(
                  (a) => a.id === selectedAppointmentId
                );
                const creatorName = appt?.creator?.name || "Άγνωστος";
                const createdAtStr = formatDateTimeEl(appt?.created_at);

                return (
                  <p className="text-xs text-[#8c887f]">
                    Καταχωρήθηκε από{" "}
                    <span className="font-medium text-[#5a574f]">
                      {creatorName}
                    </span>{" "}
                    στις{" "}
                    <span className="font-medium text-[#5a574f]">
                      {createdAtStr}
                    </span>
                  </p>
                );
              })()}
            </div>

            {/* Divider */}
            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#ece7de] to-transparent" />

            {/* Content (scrollable) */}
            <div className="px-6 py-4 max-h-[60vh] overflow-auto">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[#3b3a36]">
                {selectedAppointmentNote?.trim() || "Δεν υπάρχουν σημειώσεις."}
              </p>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-[#eee7db] bg-white/70 px-6 py-4 backdrop-blur">
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(selectedAppointmentNote || "")
                }
                className="text-xs text-[#6b675f] underline underline-offset-4 hover:text-black"
              >
                Αντιγραφή σημειώσεων
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAppointmentNoteModalOpen(false)}
                  className="rounded-xl border border-[#e5e1d8] bg-white px-4 py-2 text-sm text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee]"
                >
                  Κλείσιμο
                </button>
                <button
                  onClick={() => {
                    if (!selectedAppointmentId) return;
                    setEditNoteModalOpen(true);
                    setEditingAppointmentId(selectedAppointmentId);
                    setEditingNote(selectedAppointmentNote || "");
                    setAppointmentNoteModalOpen(false);
                  }}
                  className="no-print rounded-xl bg-[#2f2e2b] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-black"
                >
                  Επεξεργασία
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notesModalOpen && selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-card-title"
        >
          {/* Overlay */}
          <button
            aria-label="Κλείσιμο"
            onClick={() => setNotesModalOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />

          {/* Patient Card */}
          <div className="relative w-full max-w-5xl rounded-2xl border border-[#e5e1d8] bg-gradient-to-b from-white/95 to-[#fdfcf9]/90 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-[#eee7db] bg-white/80 px-6 sm:px-8 py-4 backdrop-blur">
              <h2
                id="patient-card-title"
                className="flex items-center gap-2 text-lg sm:text-xl font-semibold tracking-tight text-[#2f2e2b]"
              >
                <UserCircle className="h-6 w-6 text-[#8c7c68]" />
                Καρτέλα Ασθενούς
              </h2>
              <button
                onClick={() => setNotesModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[#6b675f] hover:bg-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[75vh] overflow-auto px-6 sm:px-8 py-6 space-y-8">
              {/* Contact Info */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                  <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                  Στοιχεία Ασθενούς
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  {[
                    [
                      "Ονοματεπώνυμο",
                      `${selectedPatient.first_name} ${selectedPatient.last_name}`,
                    ],
                    ["ΑΜΚΑ", selectedPatient.amka],
                    ["Email", selectedPatient.email],
                    ["Τηλέφωνο", selectedPatient.phone],
                    ["Ημ. Γέννησης", formatDate(selectedPatient.birth_date)],
                    ["Ηλικία", calculateAge(selectedPatient.birth_date)],
                    ["Φύλο", selectedPatient.gender],
                    ["Επάγγελμα", selectedPatient.occupation],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* History */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                  <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                  Ιστορικό & Συνήθειες
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  {[
                    [
                      "Πρώτη Επίσκεψη",
                      formatDate(selectedPatient.first_visit_date),
                    ],
                    ["Οικ. Κατάσταση", selectedPatient.marital_status],
                    ["Τέκνα", selectedPatient.children],
                    ["Κάπνισμα", selectedPatient.smoking],
                    ["Αλκοόλ", selectedPatient.alcohol],
                    ["Φάρμακα", selectedPatient.medications],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Clinical */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5f5b54]">
                  <span className="w-1.5 h-1.5 bg-[#8c7c68] rounded-full" />
                  Κλινικές Πληροφορίες
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  {[
                    [
                      "Γυναικολογικό Ιστορικό",
                      selectedPatient.gynecological_history,
                    ],
                    [
                      "Κληρονομικό Ιστορικό",
                      selectedPatient.hereditary_history,
                    ],
                    ["Παρούσα Νόσος", selectedPatient.current_disease],
                    ["Αντικειμενική Εξέταση", selectedPatient.physical_exam],
                    [
                      "Παρακλινικός Έλεγχος",
                      selectedPatient.preclinical_screening,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eee7db] bg-white px-3 py-2 shadow-sm"
                    >
                      <dt className="text-xs text-[#8c887f]">{label}</dt>
                      <dd className="font-medium text-[#2f2e2b]">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* Notes */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#5f5b54]">
                  Σημειώσεις
                </h3>
                <div className="rounded-xl border border-[#eee7db] bg-[#fcfaf6] px-4 py-3 shadow-sm text-sm text-[#3b3a36]">
                  {selectedPatient.notes?.trim() || "Δεν υπάρχουν σημειώσεις."}
                </div>
              </section>

              {/* Updated At */}
              <p className="text-right text-xs text-[#8c887f]">
                Τελευταία ενημέρωση:{" "}
                {selectedPatient.updated_at
                  ? new Date(selectedPatient.updated_at).toLocaleString("el-GR")
                  : "—"}
              </p>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#eee7db] bg-white/80 px-6 sm:px-8 py-4 backdrop-blur">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-[#e5e1d8] bg-white px-4 py-2 text-sm text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee]"
              >
                Κλείσιμο
              </button>
              <button
                onClick={() => {
                  setNotesModalOpen(false);
                  router.push(`/admin/patients/${selectedPatient.id}`);
                }}
                className="w-full sm:w-auto rounded-xl bg-[#8c7c68] px-4 py-2 text-sm text-white shadow-sm transition hover:bg-[#6f6253]"
              >
                Επεξεργασία
              </button>
            </div>
          </div>
        </div>
      )}

      {editNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-note-title"
        >
          {/* Backdrop */}
          <button
            aria-label="Κλείσιμο"
            onClick={() => setEditNoteModalOpen(false)}
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
              editMounted ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Card */}
          <div
            ref={editDialogRef}
            className={`relative w-full max-w-lg rounded-2xl border border-[#e5e1d8] bg-white/90 shadow-[0_10px_40px_rgba(60,50,30,0.18)] backdrop-blur-xl transition-all duration-200 ease-out transform-gpu ${
              editMounted
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-3 scale-[.98]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5">
              <h2
                id="edit-note-title"
                className="text-base font-semibold tracking-tight text-[#2f2e2b]"
              >
                Επεξεργασία Σημειώσεων Ραντεβού
              </h2>
              <button
                ref={editCloseBtnRef}
                onClick={() => setEditNoteModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[#6b675f] hover:bg-[#f3f0ea] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-3 pb-2">
              <label htmlFor="note-textarea" className="sr-only">
                Σημειώσεις
              </label>
              <textarea
                id="note-textarea"
                rows={6}
                className="w-full resize-y rounded-xl border border-[#e5e1d8] bg-white/80 px-3 py-2.5 text-sm leading-6 text-[#3b3a36] shadow-sm outline-none transition placeholder:text-[#b7b2a9] focus:border-[#cfc7bb] focus:ring-4 focus:ring-[#d7cfc2]/50"
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder="Προσθέστε ή επεξεργαστείτε σημειώσεις..."
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#8c887f]">
                  {editingNote?.length || 0} χαρακτήρες
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(editingNote || "")
                  }
                  className="text-xs text-[#6b675f] underline underline-offset-4 hover:text-black"
                >
                  Αντιγραφή
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[#eee7db] bg-white/70 px-6 py-4 backdrop-blur">
              <button
                onClick={() => setEditNoteModalOpen(false)}
                className="rounded-xl border border-[#e5e1d8] bg-white px-4 py-2 text-sm text-[#3b3a36] shadow-sm hover:bg-[#f6f3ee] focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70"
              >
                Άκυρο
              </button>
              <button
                onClick={async () => {
                  if (!editingAppointmentId) {
                    alert("Δεν βρέθηκε ραντεβού για επεξεργασία.");
                    return;
                  }
                  try {
                    setIsSaving(true);
                    const { error } = await supabase
                      .from("appointments")
                      .update({ notes: editingNote })
                      .eq("id", editingAppointmentId);
                    if (error) throw error;

                    // Optimistic update
                    setAppointments((prev) =>
                      prev.map((appt) =>
                        appt.id === editingAppointmentId
                          ? { ...appt, notes: editingNote }
                          : appt
                      )
                    );
                    if (selectedAppointmentId === editingAppointmentId) {
                      setSelectedAppointmentNote(editingNote);
                    }
                    setEditNoteModalOpen(false);
                  } catch (err) {
                    console.error(err);
                    alert("Σφάλμα κατά την αποθήκευση σημειώσεων.");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className={`inline-flex items-center justify-center rounded-xl bg-[#2f2e2b] px-4 py-2 text-sm text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#d7cfc2]/70 ${
                  isSaving ? "opacity-60 cursor-wait" : "hover:bg-black"
                }`}
              >
                {isSaving ? "Αποθήκευση..." : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            {/* Icon + Τίτλος */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 text-red-600 p-2 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Επιβεβαίωση Διαγραφής
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Θέλετε σίγουρα να διαγράψετε αυτό το ραντεβού; Η ενέργεια δεν
              μπορεί να αναιρεθεί.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Άκυρο
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

<style jsx global>{`
  @media print {
    .no-print {
      display: none !important;
    }
  }
`}</style>;

function StatusBadge({ appt }) {
  const eff =
    appt?.status === "approved" &&
    appt?.appointment_time &&
    new Date(appt.appointment_time) < new Date()
      ? "completed"
      : appt?.status;

  const styles = {
    scheduled: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
    approved: "bg-green-100 text-green-800 ring-1 ring-green-200",
    cancelled: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    rejected: "bg-red-100 text-red-800 ring-1 ring-red-200",
    completed: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
        styles[eff] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
      }`}
    >
      {eff || "—"}
      {appt?.is_exception && (
        <span className="ml-1 text-amber-700">(εξαίρεση)</span>
      )}
    </span>
  );
}
