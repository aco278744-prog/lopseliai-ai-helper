import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { onboardingSchema } from "@/lib/onboarding";
import { buildMockCourse, buildCourseKey } from "@/lib/course-generator";
import { courseContentSchema } from "@/lib/course-types";

/**
 * Creates a course row. Uses the shared `course_templates` cache keyed by
 * `${role}_${main_pain}_${ai_experience}` — cache hits are instant.
 */
export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    onboardingSchema.parse((input as { onboarding: unknown }).onboarding),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const courseKey = buildCourseKey(data);

    const { data: created, error: insertError } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        status: "generating",
        onboarding: data,
        course_key: courseKey,
        title: "Personalus kursas",
      })
      .select("id")
      .single();

    if (insertError || !created) {
      console.error("[generateCourse] insert failed", insertError);
      throw new Error(insertError?.message ?? "Nepavyko sukurti kurso");
    }

    const courseId = created.id;

    try {
      const { data: cached } = await supabase
        .from("course_templates")
        .select("title, content")
        .eq("course_key", courseKey)
        .maybeSingle();

      const parsedCache = cached ? courseContentSchema.safeParse(cached.content) : null;
      const content = parsedCache?.success ? parsedCache.data : buildMockCourse(data);

      if (!parsedCache?.success) {
        const { error: cacheError } = await supabase
          .from("course_templates")
          .insert({ course_key: courseKey, title: content.title, content });
        if (cacheError) console.error("[generateCourse] cache write failed", cacheError);
      }

      const { error: updateError } = await supabase
        .from("courses")
        .update({ status: "ready", title: content.title, content, error_message: null })
        .eq("id", courseId);

      if (updateError) throw new Error(updateError.message);
    } catch (error) {
      console.error("[generateCourse] generation failed", error);
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

    if (error || !course) {
      console.error("[retryCourse] course not found", error);
      throw new Error("Kursas nerastas");
    }

    const parsed = onboardingSchema.safeParse(course.onboarding);
    if (!parsed.success) {
      console.error("[retryCourse] invalid onboarding", parsed.error);
      throw new Error("Neteisingi apklausos duomenys");
    }

    await supabase
      .from("courses")
      .update({ status: "generating", error_message: null })
      .eq("id", course.id);

    const content = buildMockCourse(parsed.data);

    const { error: updateError } = await supabase
      .from("courses")
      .update({ status: "ready", title: content.title, content, error_message: null })
      .eq("id", course.id);

    if (updateError) {
      console.error("[retryCourse] update failed", updateError);
      await supabase
        .from("courses")
        .update({ status: "failed", error_message: updateError.message })
        .eq("id", course.id);
      return { courseId: course.id, status: "failed" as const };
    }

    return { courseId: course.id, status: "ready" as const };
  });
