"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
import PatientFormCard from "../../components/PatientFormCard";
import PatientDetailsCard from "../../components/PatientDetailsCard";

import { ScrollArea } from "@/components/ui/scroll-area";
// shadcn/ui
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// icons
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  User as UserIcon,
  Phone,
  Mail,
  IdCard,
  Trash2,
  Pencil,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const PAGE_SIZE = 12;

export default function PatientsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  // data
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);

  // ui state
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("all"); // 'male' | 'female' | 'other' | 'all'
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // row actions
  const [selected, setSelected] = useState(null); // patient object for Sheet
  const [confirmDelete, setConfirmDelete] = useState(null); // patient object to delete
  const [upcomingCheck, setUpcomingCheck] = useState({
    loading: false,
    count: 0,
    items: [],
  });

  // --- helpers ---
  const totalPages = useMemo(() => Math.ceil(total / PAGE_SIZE) || 1, [total]);
  const openView = async (p) => {
    setSelected({ ...p, _loading: true });
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", p.id)
      .single();
    if (!error && data) setSelected({ ...data, _loading: false });
    else setSelected({ ...p, _loading: false });
  };

  const loadPatients = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      // guard: minAge cannot be greater than maxAge
      if (minAge !== "" && maxAge !== "" && Number(minAge) > Number(maxAge)) {
        setError(
          "Η ελάχιστη ηλικία δεν μπορεί να είναι μεγαλύτερη από τη μέγιστη."
        );
        setBusy(false);
        setLoading(false);
        return;
      }

      // local helpers
      const ymd = (d) => d.toISOString().split("T")[0];
      const addYears = (date, years) => {
        const d = new Date(date);
        d.setFullYear(d.getFullYear() + years);
        return d;
      };

      let q = supabase
        .from("patients")
        .select(
          [
            "id",
            "first_name",
            "last_name",
            "phone",
            "email",
            "amka",
            "birth_date",
            "gender",
            "created_at",
            "medications",
            "gynecological_history",
            "hereditary_history",
            "current_disease",
            "physical_exam",
            "preclinical_screening",
            "notes",
          ].join(", "),
          { count: "exact" }
        );

      if (query?.trim()) {
        const qstr = query.trim();
        q = q.or(
          `first_name.ilike.%${qstr}%,last_name.ilike.%${qstr}%,phone.ilike.%${qstr}%,email.ilike.%${qstr}%,amka.ilike.%${qstr}%`
        );
      }

      if (gender !== "all") q = q.eq("gender", gender);

      // --- Age filters -> birth_date bounds ---
      const today = new Date();

      // minAge: age >= minAge  => birth_date <= today - minAge years
      if (minAge !== "" && !Number.isNaN(Number(minAge))) {
        const latestDOB = addYears(today, -Number(minAge));
        q = q.lte("birth_date", ymd(latestDOB));
      }

      // maxAge: age <= maxAge  => birth_date >= (today - (maxAge+1) years + 1 day)
      if (maxAge !== "" && !Number.isNaN(Number(maxAge))) {
        const earliestDOB = addYears(today, -(Number(maxAge) + 1));
        earliestDOB.setDate(earliestDOB.getDate() + 1);
        q = q.gte("birth_date", ymd(earliestDOB));
      }

      q = q
        .order("last_name", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, count, error } = await q;
      if (error) throw error;

      setPatients(data ?? []);
      setTotal(count ?? 0);
    } catch (e) {
      console.error(e);
      setError("Αποτυχία φόρτωσης ασθενών");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, [page, query, gender, minAge, maxAge]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      await loadPatients();
    })();
  }, [router, loadPatients]);

  useEffect(() => {
    if (!confirmDelete?.id) {
      setUpcomingCheck({ loading: false, count: 0, items: [] });
      return;
    }

    (async () => {
      setUpcomingCheck({ loading: true, count: 0, items: [] });
      const nowISO = new Date().toISOString();

      const { data, count, error } = await supabase
        .from("appointments")
        .select("id, appointment_time, status", { count: "exact" })
        .eq("patient_id", confirmDelete.id)
        .eq("status", "approved")
        .gte("appointment_time", nowISO)
        .order("appointment_time", { ascending: true })
        .limit(3);

      if (error) {
        console.error("check upcoming appts error", error);
        setUpcomingCheck({ loading: false, count: 0, items: [] });
        return;
      }

      setUpcomingCheck({
        loading: false,
        count: count ?? 0,
        items: data ?? [],
      });
    })();
  }, [confirmDelete]);

  // --- actions ---
  const removePatient = async (id) => {
    try {
      setBusy(true);
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      setConfirmDelete(null);
      // if deleting the last row on last page, step back
      if (patients.length === 1 && page > 0) setPage((p) => p - 1);
      else await loadPatients();
    } catch (e) {
      console.error(e);
      setError("Αποτυχία διαγραφής");
    } finally {
      setBusy(false);
    }
  };

  const exportExcel = async () => {
    // lazy-load to keep bundle small
    const XLSX = await import("xlsx");
    const { utils, writeFile } = XLSX;

    const headers = [
      "Ονοματεπώνυμο",
      "ΑΜΚΑ",
      "Τηλέφωνο",
      "Email",
      "Ηλικία",
      "Φύλο",
    ];

    const rows = patients.map((p) => [
      fullName(p),
      p.amka ?? "",
      p.phone ?? "",
      p.email ?? "",
      String(ageFromDOB(p.birth_date) ?? ""),
      genderLabel(p.gender),
    ]);

    const aoa = [headers, ...rows];

    // Sheet
    const ws = utils.aoa_to_sheet(aoa);

    // Optional: nicer column widths
    ws["!cols"] = [
      { wch: 24 }, // Ονοματεπώνυμο
      { wch: 14 }, // ΑΜΚΑ
      { wch: 14 }, // Τηλέφωνο
      { wch: 28 }, // Email
      { wch: 8 }, // Ηλικία
      { wch: 10 }, // Φύλο
    ];

    // Workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ασθενείς");

    // Filename with date
    const filename = `patients_${new Date().toISOString().slice(0, 10)}.xlsx`;
    writeFile(wb, filename);
  };

  // --- render ---
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-gradient-to-b from-stone-50/70 via-white to-white text-stone-800">
        {/* Header */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_20%,transparent_70%)] bg-[radial-gradient(1200px_500px_at_10%_-10%,#f1efe8_20%,transparent),radial-gradient(1000px_400px_at_90%_-20%,#ece9e0_20%,transparent)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
            {/* Back button */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Επιστροφή
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Ασθενείς
                </h1>
                <p className="mt-1 text-stone-600">
                  Διαχείριση αρχείου ασθενών
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={exportExcel}
                      variant="outline"
                      className="gap-2"
                    >
                      <DownloadIcon /> Εξαγωγή σε Excel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Εξαγωγή της τρέχουσας λίστας</TooltipContent>
                </Tooltip>
                <Button asChild className="gap-2">
                  <Link href="/admin/patients/new">
                    <Plus className="h-4 w-4" /> Νέος Ασθενής
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <Separator />
        </section>

        {/* Filters */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Φίλτρα</CardTitle>
              <CardDescription>
                Αναζήτηση και φιλτράρισμα λίστας
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setPage(0);
                      setQuery(e.target.value);
                    }}
                    placeholder="Αναζήτηση με όνομα, τηλέφωνο, email ή ΑΜΚΑ"
                    className="pl-8"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[140px] justify-between"
                    >
                      Φύλο: {genderLabel(gender)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setPage(0);
                        setGender("all");
                      }}
                    >
                      Όλα
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPage(0);
                        setGender("male");
                      }}
                    >
                      Άνδρας
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPage(0);
                        setGender("female");
                      }}
                    >
                      Γυναίκα
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPage(0);
                        setGender("other");
                      }}
                    >
                      Άλλο
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Age filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-600">Ηλικία:</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={minAge}
                      onChange={(e) => {
                        setPage(0);
                        setMinAge(e.target.value.replace(/[^\d]/g, ""));
                      }}
                      placeholder="ελάχ."
                      className="w-20 px-3 py-2 text-sm border rounded-md"
                    />
                    <span className="text-stone-400">–</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={maxAge}
                      onChange={(e) => {
                        setPage(0);
                        setMaxAge(e.target.value.replace(/[^\d]/g, ""));
                      }}
                      placeholder="μέγ."
                      className="w-20 px-3 py-2 text-sm border rounded-md"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMinAge("");
                        setMaxAge("");
                        setPage(0);
                      }}
                      className="text-stone-600"
                      title="Καθαρισμός ηλικίας"
                    >
                      Καθαρισμός
                    </Button>
                  </div>

                  {/* Quick presets */}
                  <div className="flex items-center gap-1">
                    <Preset
                      onClick={() => {
                        setMinAge(18);
                        setMaxAge(39);
                        setPage(0);
                      }}
                    >
                      18–39
                    </Preset>
                    <Preset
                      onClick={() => {
                        setMinAge(40);
                        setMaxAge(64);
                        setPage(0);
                      }}
                    >
                      40–64
                    </Preset>
                    <Preset
                      onClick={() => {
                        setMinAge(65);
                        setMaxAge("");
                        setPage(0);
                      }}
                    >
                      65+
                    </Preset>
                  </div>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => loadPatients()}
                      disabled={busy}
                      variant="default"
                      className="gap-2"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Εφαρμογή
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Εκτέλεση αναζήτησης</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Λίστα ασθενών</CardTitle>
              <CardDescription>
                {busy ? "Φόρτωση…" : `${total.toLocaleString("el-GR")} σύνολο`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : patients.length === 0 ? (
                <EmptyState
                  onCreate={() => router.push("/admin/patients/new")}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[960px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ονοματεπώνυμο</TableHead>
                        <TableHead>ΑΜΚΑ</TableHead>
                        <TableHead>Τηλέφωνο</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Ηλικία</TableHead>
                        <TableHead className="text-right">Ενέργειες</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((p) => (
                        <TableRow key={p.id} className="hover:bg-stone-50/60">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/*
                              AVATAR
                               <div className="h-8 w-8 rounded-full bg-stone-100 grid place-items-center text-[11px] font-medium">
                                {initials(fullName(p))}
                              </div> */}
                              <div>
                                <div className="font-medium">{fullName(p)}</div>
                                <div className="text-xs text-stone-500 flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {genderLabel(p.gender)}
                                  </Badge>
                                  <span className="hidden sm:inline">
                                    {new Date(p.created_at).toLocaleDateString(
                                      "el-GR"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  title={p.amka ?? ""}
                                  className="whitespace-nowrap"
                                >
                                  {p.amka ?? "—"}
                                </span>
                              </TooltipTrigger>
                              {p.amka && (
                                <TooltipContent>{p.amka}</TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-4 w-4 text-stone-500" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    title={p.phone ?? ""}
                                    className="whitespace-nowrap"
                                  >
                                    {p.phone ?? "—"}
                                  </span>
                                </TooltipTrigger>
                                {p.phone && (
                                  <TooltipContent>{p.phone}</TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-4 w-4 text-stone-500" />
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {/* ch-based width scales better; allow wraps */}
                                  <span
                                    className="inline-block align-bottom max-w-[28ch] md:max-w-[40ch] break-words"
                                    title={p.email ?? ""}
                                  >
                                    {p.email ?? "—"}
                                  </span>
                                </TooltipTrigger>
                                {p.email && (
                                  <TooltipContent className="max-w-xs break-words">
                                    {p.email}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {ageFromDOB(p.birth_date) ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <RowActions
                              onView={() => openView(p)}
                              onEdit={() =>
                                router.push(`/admin/patients/${p.id}`)
                              }
                              onDelete={() => setConfirmDelete(p)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {patients.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-stone-600">
                    Σελίδα {page + 1} από {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || busy}
                    >
                      <ArrowLeft className="h-4 w-4" /> Προηγούμενη
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1 || busy}
                    >
                      Επόμενη <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>
        </section>

        {/* View drawer */}
        <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <SheetContent
            side="right"
            className="w-screen sm:max-w-[860px] lg:max-w-[1000px] p-0"
          >
            <div className="h-full flex flex-col">
              <div className="px-6 pt-6 pb-3 border-b">
                <SheetHeader>
                  <SheetTitle>Στοιχεία ασθενούς</SheetTitle>
                </SheetHeader>
              </div>
              {selected ? (
                <ScrollArea className="px-6 py-4 h-[calc(100vh-6rem)]">
                  {/* Read-only προβολή της καρτέλας */}

                  <PatientDetailsCard patient={selected} />

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() =>
                        router.push(`/admin/patients/${selected.id}`)
                      }
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" /> Επεξεργασία
                    </Button>
                    <Button variant="outline" onClick={() => setSelected(null)}>
                      Κλείσιμο
                    </Button>
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-6">
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete dialog */}
        <Dialog
          open={!!confirmDelete}
          onOpenChange={(o) => !o && setConfirmDelete(null)}
        >
          <DialogContent>
            <DialogTitle>Διαγραφή ασθενούς</DialogTitle>
            <DialogDescription>
              Θα διαγραφεί ο/η{" "}
              <strong>{confirmDelete ? fullName(confirmDelete) : ""}</strong>. Η
              ενέργεια δεν μπορεί να αναιρεθεί.
            </DialogDescription>

            {/* Warning about upcoming approved appointments */}
            {upcomingCheck.loading ? (
              <div className="mt-2 text-sm text-stone-600 inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Έλεγχος επερχόμενων ραντεβού…
              </div>
            ) : upcomingCheck.count > 0 ? (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>
                  <div className="space-y-1">
                    <p>
                      <strong>Προσοχή:</strong> Ο ασθενής έχει{" "}
                      <strong>{upcomingCheck.count}</strong> εγκεκριμένο/α
                      επερχόμενο/α ραντεβού.
                    </p>
                    {upcomingCheck.items.length > 0 && (
                      <ul className="list-disc pl-5 text-sm">
                        {upcomingCheck.items.map((a) => (
                          <li key={a.id}>
                            {new Date(a.appointment_time).toLocaleString(
                              "el-GR",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs opacity-80">
                      Με την διαγραφή ασθενούς το επερχόμενο ραντεβού του θα
                      ακυρωθεί σιωπηρά. Προτείνεται να ενημερώσετε τον ασθενή
                      πριν προχωρήσετε.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter className="mt-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Άκυρο
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete && removePatient(confirmDelete.id)}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Διαγραφή
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}

// ------------- small components -------------
function RowActions({ onView, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label="Ενέργειες"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>Προβολή</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Επεξεργασία</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          Διαγραφή
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-stone-100 text-stone-700">
        <UserIcon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium">Δεν βρέθηκαν ασθενείς</h3>
      <p className="mt-1 text-stone-600">
        Δοκιμάστε διαφορετικά φίλτρα ή δημιουργήστε νέο ασθενή.
      </p>
      <div className="mt-4">
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Νέος Ασθενής
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="grid grid-cols-[140px,1fr] items-center gap-2">
      <div className="text-stone-500 text-xs flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// ------------- utils -------------
function fullName(p) {
  return `${p?.last_name ?? ""} ${p?.first_name ?? ""}`.trim() || "—";
}
function initials(name) {
  return (
    (name || "—")
      .split(" ")
      .map((s) => s?.[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
function ageFromDOB(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
function genderLabel(g) {
  if (!g || g === "all") return "Όλα";
  if (g === "male") return "Άνδρας";
  if (g === "female") return "Γυναίκα";
  return "Άλλο";
}
function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function DownloadIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5M20 21H4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ymd(d) {
  return d.toISOString().split("T")[0];
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function Preset({ onClick, children }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8"
    >
      {children}
    </Button>
  );
}
