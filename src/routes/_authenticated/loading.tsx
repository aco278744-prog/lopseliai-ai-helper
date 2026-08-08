import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";
import { FailedGenerationScreen } from "@/components/FailedGenerationScreen";
import { retryCourse } from "@/lib/course.functions";

export const Route = createFileRoute("/_authenticated/loading")({
  head: () => ({
    meta: [
      { title: "Kuriamas jūsų kursas | Lopšeliai" },
      { name: "description", content: "Ruošiame personalų DI kursą pagal jūsų atsakymus." },
      { property: "og:title", content: "Kuriamas jūsų kursas | Lopšeliai" },
      { property: "og:description", content: "Ruošiame personalų DI kursą pagal jūsų atsakymus." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoadingPage,
});

const stages = [
  "Analizuojame jūsų atsakymus",
  "Parenkame temas pagal jūsų vaidmenį",
  "Rašome užklausas ir šablonus",
  "Sudedame kursą į modulius",
];

function LoadingPage() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const { status, error: errorMessage } = useGenerationStatus(courseId);
  const retry = useServerFn(retryCourse);

  useEffect(() => {
    let cancelled = false;
    const findCourse = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.id) setCourseId(data.id);
    };
    void findCourse();
    const interval = setInterval(() => {
      if (!courseId) void findCourse();
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [courseId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((current) => (current < stages.length - 1 ? current + 1 : current));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === "completed") void navigate({ to: "/dashboard" });
  }, [status, navigate]);

  const handleRetry = async () => {
    if (!courseId) return;
    setRetrying(true);
    try {
      await retry({ data: { courseId } });
    } finally {
      setRetrying(false);
    }
  };

  if (status === "failed") {
    return <FailedGenerationScreen message={errorMessage} onRetry={() => void handleRetry()} isRetrying={retrying} />;
  }

  const progress = Math.round(((stage + 1) / stages.length) * 100);

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-5 py-16">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-soft animate-float-soft">
          <Sparkles className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Kuriame jūsų kursą</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tai užtrunka kelias sekundes. Neuždarykite šio lango.
        </p>

        <Progress value={progress} className="mt-8 h-1.5" />

        <ul className="mt-6 space-y-3 text-left">
          {stages.map((label, index) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              {index < stage ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-success">
                  <Check className="size-3 text-success-foreground" aria-hidden="true" />
                </span>
              ) : index === stage ? (
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <span className="size-5 rounded-full border border-border" />
              )}
              <span className={index <= stage ? "text-foreground" : "text-muted-foreground"}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
