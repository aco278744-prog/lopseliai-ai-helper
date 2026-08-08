import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GenerationStatus = "processing" | "completed" | "failed";

interface UseGenerationStatusReturn {
  status: GenerationStatus | null;
  error: string | null;
  isLoading: boolean;
}

const POLLING_TIMEOUT = 120000;
const INITIAL_POLLING_DELAY = 1000;
const MAX_POLLING_DELAY = 10000;
const REALTIME_TIMEOUT = 3000;

/** Maps the `courses.status` column to the hook's coarse status. */
function mapStatus(raw: string | null | undefined): GenerationStatus {
  if (raw === "ready") return "completed";
  if (raw === "failed") return "failed";
  return "processing";
}

export function useGenerationStatus(courseId: string | null): UseGenerationStatusReturn {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!courseId);

  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(!!courseId);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingDelayRef = useRef(INITIAL_POLLING_DELAY);
  const pollingStartTimeRef = useRef<number | null>(null);

  const stopLoading = useCallback(() => {
    isLoadingRef.current = false;
    setIsLoading(false);
  }, []);

  const cleanup = useCallback(() => {
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    pollingDelayRef.current = INITIAL_POLLING_DELAY;
    pollingStartTimeRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    pollingStartTimeRef.current = Date.now();

    const scheduleNextPoll = () => {
      pollingDelayRef.current = Math.min(pollingDelayRef.current * 1.5, MAX_POLLING_DELAY);
      pollingTimeoutRef.current = setTimeout(() => void poll(), pollingDelayRef.current);
    };

    const poll = async () => {
      if (!isMountedRef.current) return;

      if (
        pollingStartTimeRef.current &&
        Date.now() - pollingStartTimeRef.current > POLLING_TIMEOUT
      ) {
        setError("Užklausa truko per ilgai. Bandykite dar kartą.");
        stopLoading();
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("courses")
          .select("status, error_message")
          .eq("id", courseId!)
          .maybeSingle();

        if (!isMountedRef.current) return;

        if (queryError) {
          scheduleNextPoll();
          return;
        }

        if (!data) {
          setError("Kursas nerastas");
          stopLoading();
          return;
        }

        const newStatus = mapStatus(data.status);
        setStatus(newStatus);
        setError(data.error_message || null);

        if (newStatus === "completed" || newStatus === "failed") {
          stopLoading();
          return;
        }

        scheduleNextPoll();
      } catch {
        scheduleNextPoll();
      }
    };

    void poll();
  }, [courseId, stopLoading]);

  const subscribeToRealtime = useCallback(() => {
    if (!courseId) return;

    const channel = supabase
      .channel(`course_${courseId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "courses",
          filter: `id=eq.${courseId}`,
        },
        (payload) => {
          if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
          if (!isMountedRef.current) return;

          const row = payload.new as { status: string; error_message: string | null };
          const newStatus = mapStatus(row.status);
          setStatus(newStatus);
          setError(row.error_message || null);

          if (newStatus === "completed" || newStatus === "failed") {
            stopLoading();
            cleanup();
          }
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          // Realtime can be blocked by proxies — fall back to polling if nothing arrives.
          realtimeTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && isLoadingRef.current) {
              if (channelRef.current) {
                void supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
              startPolling();
            }
          }, REALTIME_TIMEOUT);
        } else if (channelStatus === "CHANNEL_ERROR" || channelStatus === "CLOSED") {
          if (channelRef.current) {
            void supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
          if (isMountedRef.current && isLoadingRef.current) startPolling();
        }
      });

    channelRef.current = channel;
  }, [courseId, startPolling, cleanup, stopLoading]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!courseId) {
      setStatus(null);
      setError(null);
      isLoadingRef.current = false;
      setIsLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    subscribeToRealtime();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [courseId, subscribeToRealtime, cleanup]);

  return { status, error, isLoading };
}

export default useGenerationStatus;
