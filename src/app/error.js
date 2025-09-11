"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCcw, Home } from "lucide-react";

export default function Error({ error, reset }) {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf6] text-center px-6">
      {/* Big 500 */}
      <h1 className="text-[6rem] font-bold text-red-600 leading-none">500</h1>
      <p className="mt-4 text-lg text-[#3b3a36]">
        Κάτι πήγε στραβά στον διακομιστή.
      </p>

      {error?.message && (
        <p className="mt-2 text-sm text-gray-500 max-w-lg">{error.message}</p>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => reset?.()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e1d8] bg-white hover:bg-[#f6f4ef] transition"
        >
          <RefreshCcw className="w-4 h-4" />
          Δοκιμάστε ξανά
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-transparent bg-[#8c7c68] text-white hover:bg-[#6f6354] transition"
        >
          <Home className="w-4 h-4" />
          Αρχική
        </Link>
      </div>
    </main>
  );
}
