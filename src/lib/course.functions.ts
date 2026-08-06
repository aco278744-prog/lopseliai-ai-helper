import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { onboardingSchema } from "@/lib/onboarding";
import { buildMockCourse } from "@/lib/course-generator";

/**
 * Creates a course row and runs the (currently mocked) generation.
 * Swap `buildMockCourse` for a real Anthropic call later — the contract stays.
 */
export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    onboardingSchema.extend({}).parse((input as { onboarding: unknown }).onboarding),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: created, error: insertError } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        status: "generating",
        onboarding: data,
        title: "Personalus kursas",
      })
      .select("id")
      .single();

    if (insertError || !created) {
      throw new Error(insertError?.message ?? "Nepavyko sukurti kurso");
    }

    const courseId = created.id;

    try {
      // Mock latency: 2–5 seconds.
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));
      const content = buildMockCourse(data);

      const { error: updateError } = await supabase
        .from("courses")
        .update({ status: "ready", title: content.title, content, error_message: null })
        .eq("id", courseId);

      if (updateError) throw new Error(updateError.message);
    } catch (error) {
      await supabase
        .from("courses")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Nežinoma klaida",
        })
        .eq("id", courseId);
      return { courseId, status: "failed" as const };
    }

    return { courseId, status: "ready" as const };
  });

export const retryCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { courseId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: course, error } = await supabase
      .from("courses")
      .select("id, onboarding")
      .eq("id", data.courseId)
      .single();

    if (error || !course) throw new Error("Kursas nerastas");

    const parsed = onboardingSchema.safeParse(course.onboarding);
    if (!parsed.success) throw new Error("Neteisingi apklausos duomenys");

    await supabase
      .from("courses")
      .update({ status: "generating", error_message: null })
      .eq("id", course.id);

    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));
    const content = buildMockCourse(parsed.data);

    await supabase
      .from("courses")
      .update({ status: "ready", title: content.title, content, error_message: null })
      .eq("id", course.id);

    return { courseId: course.id, status: "ready" as const };
  });
