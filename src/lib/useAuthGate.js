"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";
import { offlineAuth } from "./offlineAuth";

/**
 * Returns: { ready, mode, user, isOnline }
 * mode: 'online' | 'offline' | 'guest' (guest = must login)
 */
export function useAuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("checking"); // online | offline | guest
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    (async () => {
      const offlineEnabled = !!offlineAuth?.isEnabled?.();
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;

      // No session and no offline mode → send to login (once)
      if (!session && !offlineEnabled) {
        setMode("guest");
        setUser(null);
        setReady(true);

        if (pathname !== "/login" && !redirectingRef.current) {
          redirectingRef.current = true;
          router.replace("/login");
        }
        return;
      }

      // Allow offline mode to pass
      setMode(session ? "online" : "offline");
      setUser(session?.user || { id: "offline-user" });
      setReady(true);

      // Only watch auth changes when NOT in offline mode
      if (!offlineEnabled) {
        const sub = supabase.auth.onAuthStateChange((_event, s) => {
          if (!s && !offlineAuth.isEnabled()) {
            if (pathname !== "/login" && !redirectingRef.current) {
              redirectingRef.current = true;
              router.replace("/login");
            }
          }
        });
        unsubscribe = () => sub?.data?.subscription?.unsubscribe?.();
      }
    })();

    return () => unsubscribe();
  }, [router, pathname]);

  return { ready, mode, user, isOnline: mode === "online" };
}
