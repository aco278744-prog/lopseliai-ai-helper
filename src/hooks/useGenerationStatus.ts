import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CourseStatus } from "@/lib/course-types";

/**
 * Tracks a course's generation status with Realtime plus a polling fallback
 * (Realtime can be blocked by strict networks / proxies).
 */
export function useGenerationStatus(courseId: string | null) {
  const [status, setStatus] = useState<CourseStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    const read = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("status, error_message")
        .eq("id", courseId)
        .maybeSingle();
      if (cancelled || error || !data) return;
      setStatus(data.status as CourseStatus);
      setErrorMessage(data.error_message);
    };

    void read();
    const interval = setInterval(() => void read(), 3000);

    const channel = supabase
      .channel(`course-${courseId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "courses", filter: `id=eq.${courseId}` },
        (payload) => {
          const row = payload.new as { status: CourseStatus; error_message: string | null };
          setStatus(row.status);
          setErrorMessage(row.error_message);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [courseId]);

  return { status, errorMessage };
}
