// app/admin/loading.js
export default function AdminLoading() {
  return (
    <main className="min-h-screen w-full bg-[#fdfaf6] flex items-center justify-center p-6">
      <div className="rounded-2xl border border-[#e5e1d8] bg-white/85 backdrop-blur-xl shadow-xl px-6 py-5 flex items-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-[#e5e1d8] border-t-[#8c7c68] animate-spin" />
        <p className="text-sm text-[#3b3a36] font-medium">
          Φόρτωση στοιχείων διαχείρισης…
        </p>
      </div>
    </main>
  );
}
