import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingRestore } from "@/hooks/useOnboardingRestore";
import { generateCourse } from "@/lib/course.functions";

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
  const { status, data, clear } = useOnboardingRestore();
  const startGeneration = useServerFn(generateCourse);
  const started = useRef(false);

  useEffect(() => {
    if (status === "waiting" || started.current) return;

    if (status === "restored" && data) {
      started.current = true;
      clear();
      // Fire and forget — the loading page tracks the row via Realtime + polling.
      void startGeneration({ data: { onboarding: data } }).catch(() => undefined);
      void navigate({ to: "/loading" });
      return;
    }

    if (status === "missing" || status === "invalid") {
      started.current = true;
      void navigate({ to: "/dashboard" });
    }
  }, [status, data, clear, navigate, startGeneration]);

  if (status === "timeout") {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold">Prisijungti nepavyko</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Nuoroda galėjo pasenti arba jau buvo panaudota. Paprašykite naujos prisijungimo nuorodos.
          </p>
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
