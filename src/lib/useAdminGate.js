// src/app/lib/useAdminGate.js
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";
import { offlineAuth } from "./offlineAuth";

export function useAdminGate() {
  const router = useRouter();
  const [state, setState] = useState({
    loading: true,
    mode: "online", // "online" | "offline"
    user: null,
    isAdmin: false,
  });
  const redirected = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      const offlineEnabled = !!offlineAuth?.isEnabled?.();

      // ---- OFFLINE PATH ----
      if (offline) {
        if (offlineEnabled) {
          const user = offlineAuth.getUser?.() || { id: "offline-user" };
          const isAdmin =
            offlineAuth.getRole?.() === "admin" ||
            offlineAuth.getIsAdmin?.() === true;
          if (mounted)
            setState({ loading: false, mode: "offline", user, isAdmin });
          return;
        }
        if (!redirected.current) {
          redirected.current = true;
          router.replace("/login?offline=1");
        }
        return;
      }

      // ---- ONLINE PATH ----
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) {
        if (!redirected.current) {
          redirected.current = true;
          router.replace("/login");
        }
        return;
      }

      // Verify admin (prefer cached claim, fall back to profiles)
      let isAdmin = session.user?.app_metadata?.role === "admin";
      if (!isAdmin) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        isAdmin = prof?.role === "admin";
      }
      if (!isAdmin) {
        if (!redirected.current) {
          redirected.current = true;
          router.replace("/login?norights=1");
        }
        return;
      }

      if (mounted) {
        setState({
          loading: false,
          mode: "online",
          user: session.user,
          isAdmin: true,
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return state; // { loading, mode, user, isAdmin }
}
