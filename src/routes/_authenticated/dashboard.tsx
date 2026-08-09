import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Clock3, LogOut, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { courseContentSchema, type CourseContent, type CourseStatus } from "@/lib/course-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mano DI kursas | Lopšeliai" },
      {
        name: "description",
        content: "Jūsų personalus DI kursas: moduliai, pamokos, paruoštos užklausos ir progresas.",
      },
      { property: "og:title", content: "Mano DI kursas | Lopšeliai" },
      { property: "og:description", content: "Moduliai, pamokos ir paruoštos užklausos vienoje vietoje." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type CourseRow = {
  id: string;
  title: string;
  status: CourseStatus;
  content: CourseContent | null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const courseQuery = useQuery({
    queryKey: ["course", "latest"],
    queryFn: async (): Promise<CourseRow | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, status, content")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const parsed = courseContentSchema.safeParse(data.content);
      return {
        id: data.id,
        title: data.title,
        status: data.status as CourseStatus,
        content: parsed.success ? parsed.data : null,
      };
    },
  });

  const course = courseQuery.data ?? null;

  const progressQuery = useQuery({
    queryKey: ["progress", course?.id],
    enabled: Boolean(course?.id),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("course_id", course!.id);
      if (error) throw new Error(error.message);
      return data.map((row) => row.lesson_id);
    },
  });

  const completed = useMemo(() => new Set(progressQuery.data ?? []), [progressQuery.data]);

  const lessons = useMemo(
    () => course?.content?.modules.flatMap((module) => module.lessons) ?? [],
    [course],
  );

  useEffect(() => {
    if (courseQuery.isSuccess && course && course.status !== "ready") {
      void navigate({ to: "/loading" });
    }
  }, [courseQuery.isSuccess, course, navigate]);

  const toggleLesson = async (lessonId: string) => {
    if (!course) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    if (completed.has(lessonId)) {
      await supabase
        .from("lesson_progress")
        .delete()
        .eq("course_id", course.id)
        .eq("lesson_id", lessonId);
    } else {
      await supabase
        .from("lesson_progress")
        .upsert(
          { user_id: userId, course_id: course.id, lesson_id: lessonId },
          { onConflict: "user_id,course_id,lesson_id" },
        );
    }
    await queryClient.invalidateQueries({ queryKey: ["progress", course.id] });
  };

  const copyPrompt = async (body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Užklausa nukopijuota");
    } catch {
      toast.error("Nepavyko nukopijuoti");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };

  if (courseQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!course || !course.content) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold">Kurso dar nėra</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Atsakykite į 8 klausimus ir sukursime personalų kursą jūsų darbui.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/onboarding">Sukurti individualų kursą</Link>
          </Button>
        </div>
      </div>
    );
  }

  const total = lessons.length;
  const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-lg font-semibold">
            Lopšeliai
          </Link>
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Atsijungti
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Personalus kursas
        </span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{course.content.title}</h1>
        <p className="mt-3 text-muted-foreground">{course.content.subtitle}</p>

        <div className="surface-card mt-8 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Jūsų progresas</span>
            <span className="text-muted-foreground">
              {done} iš {total} pamokų
            </span>
          </div>
          <Progress value={percent} className="mt-3 h-2" />
        </div>

        <Accordion type="multiple" className="mt-8 space-y-4">
          {course.content.modules.map((module) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="surface-card overflow-hidden border px-5"
            >
              <AccordionTrigger className="py-5 text-left hover:no-underline">
                <div>
                  <h2 className="text-base font-semibold sm:text-lg">{module.title}</h2>
                  <p className="mt-1 text-sm font-normal text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="space-y-4">
                  {module.lessons.map((lesson) => {
                    const isDone = completed.has(lesson.id);
                    return (
                      <article key={lesson.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">{lesson.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock3 className="size-3.5" aria-hidden="true" />
                              {lesson.minutes} min.
                            </span>
                          </div>
                          <Button
                            variant={isDone ? "secondary" : "outline"}
                            size="sm"
                            className="shrink-0"
                            onClick={() => void toggleLesson(lesson.id)}
                          >
                            <Check className="size-4" aria-hidden="true" />
                            {isDone ? "Atlikta" : "Žymėti"}
                          </Button>
                        </div>

                        <ol className="mt-4 space-y-2 text-sm">
                          {lesson.steps.map((step, index) => (
                            <li key={step} className="flex gap-3">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                                {index + 1}
                              </span>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>

                        <div className="mt-4 space-y-3">
                          {lesson.prompts.map((prompt) => (
                            <div key={prompt.title} className="rounded-lg bg-muted p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {prompt.title}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void copyPrompt(prompt.body)}
                                >
                                  <Copy className="size-3.5" aria-hidden="true" />
                                  Kopijuoti
                                </Button>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                                {prompt.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link to="/onboarding">Sukurti naują kursą</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
