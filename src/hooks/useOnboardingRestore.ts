import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "@/lib/storage";
import { ONBOARDING_STORAGE_KEY, onboardingSchema, type OnboardingData } from "@/lib/onboarding";

export type RestoreStatus = "waiting" | "restored" | "missing" | "invalid" | "timeout";

const TIMEOUT_MS = 30_000;

/**
 * After a Magic Link login the app returns on a fresh page load.
 * This hook waits for the Supabase session (max 30s) and restores + validates
 * the quiz answers that were stashed in sessionStorage before the redirect.
 */
export function useOnboardingRestore() {
  const [status, setStatus] = useState<RestoreStatus>("waiting");
  const [data, setData] = useState<OnboardingData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const settled = useRef(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const settle = (next: RestoreStatus, payload?: OnboardingData) => {
      if (settled.current) return;
      settled.current = true;
      if (payload) setData(payload);
      setStatus(next);
    };

    const restoreWithSession = (sessionUserId: string) => {
      setUserId(sessionUserId);
      const raw = safeStorage.getJSON<unknown>(ONBOARDING_STORAGE_KEY);
      if (raw === null) {
        settle("missing");
        return;
      }
      const parsed = onboardingSchema.safeParse(raw);
      if (!parsed.success) {
        safeStorage.remove(ONBOARDING_STORAGE_KEY);
        settle("invalid");
        return;
      }
      settle("restored", parsed.data);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) restoreWithSession(session.user.id);
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session?.user) restoreWithSession(sessionData.session.user.id);
    });

    timeoutId = setTimeout(() => settle("timeout"), TIMEOUT_MS);

    return () => {
      listener.subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const clear = () => safeStorage.remove(ONBOARDING_STORAGE_KEY);

  return { status, data, userId, clear };
}
