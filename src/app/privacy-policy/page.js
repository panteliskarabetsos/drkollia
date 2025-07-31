"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white py-26 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Πίσω */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Πίσω
        </button>

        {/* Τίτλος */}
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">
          Πολιτική Απορρήτου
        </h1>

        {/* 1. Γενικά */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          1. Γενικές Πληροφορίες
        </h2>
        <p className="text-slate-700 mb-4">
          Η παρούσα Πολιτική Απορρήτου περιγράφει τον τρόπο με τον οποίο η
          Ιατρός Δρ. Κόλλια Γεωργία (εφεξής «Ιατρός») συλλέγει, χρησιμοποιεί και
          προστατεύει τα προσωπικά δεδομένα που παρέχετε μέσω της ιστοσελίδας
          της.
        </p>

        {/* 2. Ποια δεδομένα συλλέγουμε */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          2. Ποια Δεδομένα Συλλέγουμε
        </h2>
        <ul className="list-disc list-inside text-slate-700 mb-4">
          <li>Ονοματεπώνυμο</li>
          <li>Αριθμός τηλεφώνου</li>
          <li>Διεύθυνση email</li>
          <li>ΑΜΚΑ</li>
          <li>Ημερομηνία και ώρα ραντεβού</li>
          <li>Περιεχόμενο από επισκέψεις ή σημειώσεις ραντεβού</li>
          <li>Διεύθυνση IP και τεχνικά δεδομένα (μέσω cookies ή reCAPTCHA)</li>
        </ul>

        {/* 3. Σκοποί επεξεργασίας */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          3. Σκοποί Επεξεργασίας
        </h2>
        <p className="text-slate-700 mb-4">
          Τα δεδομένα σας χρησιμοποιούνται για:
        </p>
        <ul className="list-disc list-inside text-slate-700 mb-4">
          <li>Προγραμματισμό και διαχείριση ιατρικών ραντεβού</li>
          <li>Επικοινωνία με τον χρήστη</li>
          <li>Συμμόρφωση με νομικές υποχρεώσεις</li>
          <li>Προστασία της ιστοσελίδας από καταχρηστική χρήση</li>
        </ul>

        {/* 4. Νομική Βάση */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          4. Νομική Βάση Επεξεργασίας
        </h2>
        <p className="text-slate-700 mb-4">Η επεξεργασία βασίζεται:</p>
        <ul className="list-disc list-inside text-slate-700 mb-4">
          <li>στη συγκατάθεσή σας</li>
          <li>στην εκπλήρωση υποχρεώσεων πριν ή μετά από ραντεβού</li>
          <li>στην συμμόρφωση με νομικές υποχρεώσεις</li>
          <li>
            στο έννομο συμφέρον της Ιατρού για την προστασία της υπηρεσίας
          </li>
        </ul>

        {/* 5. Διατήρηση Δεδομένων */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          5. Διάρκεια Διατήρησης
        </h2>
        <p className="text-slate-700 mb-4">
          Τα δεδομένα σας διατηρούνται για όσο χρόνο απαιτείται για την
          εκπλήρωση των σκοπών συλλογής ή σύμφωνα με τις εκάστοτε νομικές
          υποχρεώσεις (π.χ. τήρηση ιατρικού αρχείου).
        </p>

        {/* 6. Κοινοποίηση σε Τρίτους */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          6. Κοινοποίηση σε Τρίτους
        </h2>
        <p className="text-slate-700 mb-4">
          Τα δεδομένα σας δεν κοινοποιούνται σε τρίτους, εκτός αν απαιτείται από
          τον νόμο ή εάν είναι απολύτως απαραίτητο για την παροχή της υπηρεσίας
          (π.χ. πάροχοι φιλοξενίας ή email).
        </p>

        {/* 7. Δικαιώματα */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          7. Τα Δικαιώματά σας
        </h2>
        <ul className="list-disc list-inside text-slate-700 mb-4">
          <li>Πρόσβαση στα δεδομένα σας</li>
          <li>Διόρθωση ή διαγραφή</li>
          <li>Περιορισμός ή αντίρρηση στην επεξεργασία</li>
          <li>Φορητότητα των δεδομένων</li>
        </ul>

        {/* 8. Cookies */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          8. Χρήση Cookies
        </h2>
        <p className="text-slate-700 mb-4">
          Η ιστοσελίδα χρησιμοποιεί cookies για τη βελτίωση της εμπειρίας χρήσης
          και για τεχνικούς σκοπούς. Μπορείτε να ρυθμίσετε τον browser σας ώστε
          να απορρίπτει cookies, ωστόσο αυτό μπορεί να επηρεάσει τη
          λειτουργικότητα της σελίδας.
        </p>

        {/* 9. Ασφάλεια */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          9. Μέτρα Ασφάλειας
        </h2>
        <p className="text-slate-700 mb-4">
          Η Ιατρός εφαρμόζει τεχνικά και οργανωτικά μέτρα προστασίας, όπως χρήση
          HTTPS, περιορισμένη πρόσβαση σε ευαίσθητες πληροφορίες και τακτικά
          αντίγραφα ασφαλείας.
        </p>

        {/* 10. Τροποποιήσεις */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          10. Τροποποιήσεις Πολιτικής
        </h2>
        <p className="text-slate-700 mb-4">
          Η παρούσα Πολιτική μπορεί να ενημερώνεται περιοδικά. Η τελευταία
          έκδοση δημοσιεύεται πάντα στην παρούσα σελίδα.
        </p>

        {/* 11. Google reCAPTCHA */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          11. Χρήση Google reCAPTCHA
        </h2>
        <p className="text-slate-700 mb-4">
          Χρησιμοποιούμε το Google reCAPTCHA για την προστασία της ιστοσελίδας
          από κακόβουλες καταχωρήσεις. Η υπηρεσία αυτή μπορεί να συλλέγει
          δεδομένα όπως διεύθυνση IP, κινήσεις του ποντικιού και άλλα τεχνικά
          στοιχεία.
        </p>
        <p className="text-slate-700 mb-4">
          Η χρήση του reCAPTCHA διέπεται από την{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Πολιτική Απορρήτου
          </a>{" "}
          και τους{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Όρους Χρήσης
          </a>{" "}
          της Google.
        </p>

        {/* Επικοινωνία */}
        <h2 className="text-xl font-medium text-slate-800 mt-8 mb-2">
          12. Επικοινωνία
        </h2>
        <p className="text-slate-700 mb-4">
          Για οποιοδήποτε ζήτημα σχετικό με την Πολιτική Απορρήτου ή για την
          άσκηση των δικαιωμάτων σας, μπορείτε να επικοινωνήσετε στο{" "}
          <a
            href="mailto:gokollia@gmail.com"
            className="text-blue-600 hover:underline"
          >
            gokollia@gmail.com
          </a>
          .
        </p>

        <p className="text-sm text-slate-500 mt-12">
          Τελευταία ενημέρωση: Ιούλιος 2025
        </p>
      </div>
    </main>
  );
}
