// app/admin/_components/AuthGate.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
// ⬅️ adjust this path to where your offlineAuth actually lives
import offlineAuth from "../../../lib/offlineAuth";

export default function AuthGate({ children, splash = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const redirected = useRef(false);

  // track connectivity to re-run checks on flips
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const hasOffline = !!offlineAuth?.hasActiveSession?.(); // requires PIN unlock

      // Online + no session + no offline session -> redirect ONCE
      if (isOnline && !session && !hasOffline) {
        if (!redirected.current) {
          redirected.current = true;
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
        if (alive) {
          setAllowed(false);
          setReady(true);
        }
        return;
      }

      // Allowed (either online+session or offline+active offline session)
      if (alive) {
        setAllowed(Boolean(session) || (!isOnline && hasOffline));
        setReady(true);

        // remember last admin path (helps offline shell choose a view)
        if (isOnline) {
          try {
            localStorage.setItem("lastAdminPath", pathname);
          } catch {}
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, pathname, isOnline]);

  if (!ready) return splash;

  // Offline + not allowed (no active offline unlock) → show hint (no redirect)
  if (!allowed && !isOnline) {
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
