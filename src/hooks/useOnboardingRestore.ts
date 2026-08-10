import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "@/lib/storage";
import {
  ONBOARDING_STORAGE_KEY,
  onboardingSchema,
  type OnboardingData,
} from "@/lib/onboarding";
import { generateCourse } from "@/lib/course.functions";

const RESTORE_TIMEOUT_MS = 30000;
const STORAGE_KEY_QUIZ_DATA = ONBOARDING_STORAGE_KEY;
const STORAGE_KEY_PENDING = "pending_course_generation";
const STORAGE_KEY_GENERATED_COURSE_ID = "generated_course_id";

export type OnboardingQuizData = OnboardingData;
export const QuizDataSchema = onboardingSchema;

interface UseOnboardingRestoreReturn {
  restoredQuizData: OnboardingQuizData | null;
  isRestoring: boolean;
  restoreError: string | null;
  generatedCourseId: string | null;
  clearRestoration: () => void;
}

export function useOnboardingRestore(): UseOnboardingRestoreReturn {
  const [restoredQuizData, setRestoredQuizData] = useState<OnboardingQuizData | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);

  const navigate = useNavigate();
  const startGeneration = useServerFn(generateCourse);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const startedRef = useRef(false);

  const clearRestoration = useCallback(() => {
    safeStorage.remove(STORAGE_KEY_QUIZ_DATA);
    safeStorage.remove(STORAGE_KEY_PENDING);
    safeStorage.remove(STORAGE_KEY_GENERATED_COURSE_ID);
    setRestoredQuizData(null);
    setGeneratedCourseId(null);
  }, []);

  const setError = useCallback((message: string) => {
    if (isMountedRef.current) {
      setRestoreError(message);
      setIsRestoring(false);
    }
  }, []);

  const setSuccess = useCallback((courseId: string) => {
    if (isMountedRef.current) {
      setGeneratedCourseId(courseId);
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (startedRef.current) return;
    startedRef.current = true;

    const restore = async () => {
      try {
        const savedQuizDataStr = safeStorage.get(STORAGE_KEY_QUIZ_DATA);

        // Verify a real user exists (Magic Link must be completed first).
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user ?? null;
        if (userError) console.error("[onboarding-restore] auth.getUser failed", userError);

        if (!user) {
          setError("Prisijungimo nuoroda gali būti pasibaigusi. Bandykite dar kartą.");
          return;
        }

        const handoffToken = new URLSearchParams(window.location.search).get("handoff");
        let pendingQuery = supabase
          .from("pending_onboarding")
          .select("id, onboarding")
          .is("consumed_at", null)
          .order("created_at", { ascending: false })
          .limit(1);
        if (handoffToken) pendingQuery = pendingQuery.eq("handoff_token", handoffToken);
        const { data: pending, error: pendingError } = await pendingQuery.maybeSingle();
        if (pendingError) console.error("[onboarding-restore] pending lookup failed", pendingError);

        let quizData: OnboardingQuizData | null = null;
        let pendingOnboardingId: string | null = null;
        if (pending) {
          const parsedPending = QuizDataSchema.safeParse(pending.onboarding);
          if (parsedPending.success) {
            quizData = parsedPending.data;
            pendingOnboardingId = pending.id;
          } else {
            console.error("[onboarding-restore] invalid server-side answers", parsedPending.error);
          }
        }
        if (!quizData && savedQuizDataStr) {
          const parsedLocal = QuizDataSchema.safeParse(JSON.parse(savedQuizDataStr));
          if (parsedLocal.success) quizData = parsedLocal.data;
        }

        if (!quizData) {
          const { data: latestCourse } = await supabase
            .from("courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "ready")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latestCourse) {
            safeStorage.set(STORAGE_KEY_GENERATED_COURSE_ID, latestCourse.id);
            void navigate({ to: "/dashboard" });
            return;
          }
          setError("Išsaugotų apklausos atsakymų neradome. Prašome pradėti iš naujo.");
          return;
        }

        if (isMountedRef.current) setRestoredQuizData(quizData);

        // Server function persists the course row and runs generation (RLS-scoped).
        const result = await startGeneration({
          data: { onboarding: quizData, pendingOnboardingId },
        }).catch(
          (generationError: unknown) => {
            console.error("[onboarding-restore] generateCourse failed", generationError);
            return null;
          },
        );

        if (!result?.courseId) {
          setError("Nepavyko pradėti kurso generavimo");
          return;
        }

        if (result.status === "failed") {
          setError("Kurso sukurti nepavyko. Bandykite dar kartą.");
          return;
        }

        safeStorage.set(STORAGE_KEY_GENERATED_COURSE_ID, result.courseId);
        safeStorage.remove(STORAGE_KEY_PENDING);
        safeStorage.remove(STORAGE_KEY_QUIZ_DATA);
        if (pendingOnboardingId) {
          const { error: consumeError } = await supabase
            .from("pending_onboarding")
            .update({ consumed_at: new Date().toISOString() })
            .eq("id", pendingOnboardingId);
          if (consumeError) console.error("[onboarding-restore] consume failed", consumeError);
        }

        setSuccess(result.courseId);
      } catch (err) {
        console.error("[onboarding-restore] unexpected error", err);
        const errorMsg = err instanceof Error ? err.message : "Nežinoma klaida";
        setError(`Klaida: ${errorMsg}`);
      }
    };

    void restore();

    timeoutIdRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setRestoreError((prev) => prev ?? "Prisijungimas užtruko per ilgai. Bandykite dar kartą.");
        setIsRestoring(false);
      }
    }, RESTORE_TIMEOUT_MS);

    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [setError, setSuccess, navigate, startGeneration]);

  return { restoredQuizData, isRestoring, restoreError, generatedCourseId, clearRestoration };
}

export function saveOnboardingBeforeAuth(quizData: OnboardingQuizData): void {
  try {
    QuizDataSchema.parse(quizData);
    const success = safeStorage.set(STORAGE_KEY_QUIZ_DATA, JSON.stringify(quizData));
    if (success) safeStorage.set(STORAGE_KEY_PENDING, "true");
  } catch (err) {
    console.error("[OnboardingStorage] Error:", err);
  }
}

export function getSavedGeneratedCourseId(): string | null {
  return safeStorage.get(STORAGE_KEY_GENERATED_COURSE_ID);
}

export function clearOnboardingStorage(): void {
  safeStorage.remove(STORAGE_KEY_QUIZ_DATA);
  safeStorage.remove(STORAGE_KEY_PENDING);
  safeStorage.remove(STORAGE_KEY_GENERATED_COURSE_ID);
}

export default useOnboardingRestore;
