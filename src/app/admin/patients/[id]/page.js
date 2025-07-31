"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { FaArrowLeft } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";
import { IdCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPatientPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customAlcohol, setCustomAlcohol] = useState("");
  const [customSmoking, setCustomSmoking] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login"); // αν δεν είναι συνδεδεμένος, redirect στο login
      } else {
        fetchPatient();
      }
    };

    checkAuth();
  }, [id]);

  const fetchPatient = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      setPatient(data);
      if (!["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"].includes(data.alcohol)) {
        setCustomAlcohol(data.alcohol);
      }
      if (
        !["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"].includes(
          data.smoking
        )
      ) {
        setCustomSmoking(data.smoking);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        fetchPatient(); // ✅ Τώρα λειτουργεί
      }
    };
    checkAuth();
  }, [id]);

  const handleChange = (field, value) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    setSaving(true);
    const alcoholValue =
      patient.alcohol === "Προσαρμογή" ? customAlcohol : patient.alcohol;
    const smokingValue =
      patient.smoking === "Προσαρμογή" ? customSmoking : patient.smoking;
    const { error } = await supabase
      .from("patients")
      .update({
        ...patient,
        alcohol: alcoholValue,
        smoking: smokingValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) router.push("/admin/patients");
    setSaving(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-[#3b3a36]">
        <ImSpinner2 className="animate-spin text-3xl text-[#8c7c68]" />
      </div>
    );

  const dateFields = ["birth_date", "first_visit_date"];

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 bg-[#f9f8f6] text-[#3b3a36] font-serif">
      <div
        className="mb-6 flex items-center gap-3 text-sm text-gray-500 hover:text-[#8c7c68] cursor-pointer"
        onClick={() => router.back()}
      >
        <FaArrowLeft className="text-xs" />
        <span>Επιστροφή</span>
      </div>

      <h1 className="text-3xl font-semibold mb-10 text-center text-[#2e2d2c] flex justify-center items-center gap-3">
        <IdCard className="w-6 h-6 text-[#8c7c68]" />
        Επεξεργασία Καρτέλας Ασθενούς
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        {[
          ["first_name", "Όνομα"],
          ["last_name", "Επώνυμο"],
          ["amka", "ΑΜΚΑ"],
          ["email", "Email"],
          ["phone", "Τηλέφωνο"],
          ["birth_date", "Ημ. Γέννησης"],
          ["gender", "Φύλο"],
          ["occupation", "Επάγγελμα"],
          ["first_visit_date", "Ημ. Πρώτης Επίσκεψης"],
          ["marital_status", "Οικογενειακή Κατάσταση"],
          ["children", "Τέκνα"],
        ].map(([field, label]) => (
          <div key={field}>
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              {label}
            </label>
            {field === "gender" ? (
              <select
                value={patient[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              >
                <option value="">Επιλέξτε</option>
                <option value="male">Άνδρας</option>
                <option value="female">Γυναίκα</option>
                <option value="other">Άλλο</option>
              </select>
            ) : field === "children" ? (
              <select
                value={patient[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              >
                <option value="">Επιλέξτε</option>
                <option value="κανένα">Κανένα</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4+">4+</option>
              </select>
            ) : field === "marital_status" ? (
              <select
                value={patient[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              >
                <option value="">Επιλέξτε</option>
                <option value="Άγαμος/η">Άγαμος/η</option>
                <option value="Έγγαμος/η">Έγγαμος/η</option>
                <option value="Διαζευγμένος/η">Διαζευγμένος/η</option>
                <option value="Χήρος/α">Χήρος/α</option>
              </select>
            ) : dateFields.includes(field) ? (
              <input
                type="date"
                value={formatDate(patient[field])}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              />
            ) : (
              <input
                type="text"
                value={patient[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              />
            )}
          </div>
        ))}

        <div>
          <label className="block mb-1 text-sm text-gray-700 font-medium">
            Κάπνισμα
          </label>
          <select
            value={
              ["Όχι", "Περιστασιακά", "Καθημερινά", "Πρώην καπνιστής"].includes(
                patient.smoking
              )
                ? patient.smoking
                : "Προσαρμογή"
            }
            onChange={(e) => handleChange("smoking", e.target.value)}
            className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
          >
            <option value="">Επιλέξτε</option>
            <option value="Όχι">Όχι</option>
            <option value="Περιστασιακά">Περιστασιακά</option>
            <option value="Καθημερινά">Καθημερινά</option>
            <option value="Πρώην καπνιστής">Πρώην καπνιστής</option>
            <option value="Προσαρμογή">Προσαρμογή</option>
          </select>
          {patient.smoking === "Προσαρμογή" && (
            <input
              type="text"
              value={customSmoking}
              onChange={(e) => setCustomSmoking(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-700 font-medium">
            Αλκοόλ
          </label>
          <select
            value={
              ["Όχι", "Σπάνια", "Συχνά", "Καθημερινά"].includes(patient.alcohol)
                ? patient.alcohol
                : "Προσαρμογή"
            }
            onChange={(e) => handleChange("alcohol", e.target.value)}
            className="w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
          >
            <option value="">Επιλέξτε</option>
            <option value="Όχι">Όχι</option>
            <option value="Σπάνια">Σπάνια</option>
            <option value="Συχνά">Συχνά</option>
            <option value="Καθημερινά">Καθημερινά</option>
            <option value="Προσαρμογή">Προσαρμογή</option>
          </select>
          {patient.alcohol === "Προσαρμογή" && (
            <input
              type="text"
              vvalue={customAlcohol || ""}
              onChange={(e) => setCustomAlcohol(e.target.value)}
              className="mt-2 w-full px-4 py-2 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
              placeholder="Εισάγετε τιμή..."
            />
            //
          )}
        </div>
        {[
          ["medications", "Φάρμακα"],
          ["gynecological_history", "Γυναικολογικό Ιστορικό"],
          ["hereditary_history", "Κληρονομικό Ιστορικό"],
          ["current_disease", "Παρούσα Νόσος"],
          ["physical_exam", "Αντικειμενική Εξέταση"],
          ["preclinical_screening", "Πάρακλινικός Έλεγχος"],
          ["notes", "Σημειώσεις"],
        ].map(([field, label]) => (
          <div key={field} className="md:col-span-2">
            <label className="block mb-1 text-sm text-gray-700 font-medium">
              {label}
            </label>
            <textarea
              rows={4}
              value={patient[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full px-4 py-3 bg-[#fdfdfc] border border-gray-200 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8c7c68]"
            />
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-5 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Άκυρο
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-[#8c7c68] text-white rounded-lg hover:bg-[#6f6253] disabled:opacity-50 transition flex items-center gap-2"
        >
          {saving && <ImSpinner2 className="animate-spin w-4 h-4" />}
          Αποθήκευση
        </button>
      </div>
    </main>
  );
}
