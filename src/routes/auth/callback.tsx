import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { FailedGenerationScreen } from "@/components/FailedGenerationScreen";
import { useOnboardingRestore } from "@/hooks/useOnboardingRestore";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jungiamės… | Lopšeliai" },
      { name: "description", content: "Patvirtinamas prisijungimas ir pradedamas kurso kūrimas." },
      { property: "og:title", content: "Jungiamės… | Lopšeliai" },
      { property: "og:description", content: "Patvirtinamas prisijungimas prie Lopšeliai." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isRestoring, restoreError, generatedCourseId, restoredQuizData } = useOnboardingRestore();

  useEffect(() => {
    if (restoredQuizData && isRestoring) {
      // Generation started — the loading page tracks the row via Realtime + polling.
      void navigate({ to: "/loading" });
      return;
    }
    if (!isRestoring && !restoreError) {
      void navigate({ to: generatedCourseId ? "/loading" : "/dashboard" });
    }
  }, [isRestoring, restoreError, generatedCourseId, restoredQuizData, navigate]);

  if (restoreError) {
    console.error("[auth/callback] restore error:", restoreError);
    return (
      <FailedGenerationScreen
        errorMessage={restoreError}
        onRetry={() => void navigate({ to: "/onboarding" })}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Patvirtiname prisijungimą…</p>
    </div>
  );
}

