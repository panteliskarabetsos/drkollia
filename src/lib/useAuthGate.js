"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "./supabaseClient";
import { offlineAuth } from "./offlineAuth";

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

      setMode(session ? "online" : "offline");
      setUser(session?.user || { id: "offline-user" });
      setReady(true);

      if (!offlineEnabled) {
        const sub = supabase.auth.onAuthStateChange((_evt, s) => {
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
