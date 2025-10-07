"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { offlineAuth } from "@/lib/offlineAuth";

export function useRequireAuth() {
  const router = useRouter();
  const redirected = useRef(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data?.session ?? null);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const hasOffline = !!offlineAuth?.isEnabled?.();
    if (!session && !hasOffline && online && !redirected.current) {
      redirected.current = true;
      router.replace("/login");
    }
  }, [ready, session, online, router]);

  const authenticated = !!session || !!offlineAuth?.isEnabled?.();
  return { ready, authenticated, online, session };
}
