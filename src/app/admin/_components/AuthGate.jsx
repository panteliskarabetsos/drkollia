// app/admin/_components/AuthGate.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import offlineAuth from "@/lib/offlineAuth";

export default function AuthGate({ children, splash = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;

      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.(); // requires PIN unlock

      if (!session && !hasOffline) {
        if (online && !redirected.current) {
          redirected.current = true;
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        if (alive) {
          setAllowed(false);
          setReady(true);
        }
        return;
      }

      if (alive) {
        setAllowed(true);
        setReady(true);
        // remember last page for offline-shell convenience
        if (online) {
          try {
            localStorage.setItem("lastAdminPath", pathname);
          } catch {}
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, pathname]);

  if (!ready) return splash;

  // Offline + not allowed (no active offline session) → show hint instead of redirect
  if (!allowed && typeof navigator !== "undefined" && !navigator.onLine) {
    return (
      <main className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-semibold">Είστε εκτός σύνδεσης</h1>
          <p className="text-stone-600">
            Κάντε μία σύνδεση online και ορίστε PIN για να ενεργοποιηθεί η
            offline πρόσβαση.
          </p>
        </div>
      </main>
    );
  }

  // Online redirect is in flight
  if (!allowed) return null;

  return <>{children}</>;
}
