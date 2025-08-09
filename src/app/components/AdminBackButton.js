// components/AdminBackButton.js
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AdminBackButton({
  to = "/admin",
  title = "Επιστροφή στο Dashboard",
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(to)}
      className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200"
      title={title}
    >
      <ArrowLeft size={20} />
    </button>
  );
}
