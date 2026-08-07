import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold">Prisijungti nepavyko</h1>
          <p className="mt-3 text-sm text-muted-foreground">{restoreError}</p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/auth">Gauti naują nuorodą</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Patvirtiname prisijungimą…</p>
    </div>
  );
}

