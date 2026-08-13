import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { onboardingSchema } from "@/lib/onboarding";
import { buildMockCourse, buildCourseKey } from "@/lib/course-generator";
import { courseContentSchema, type CourseContent } from "@/lib/course-types";

const anthropicCourseSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    modules: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string(),
        lessons: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            duration_min: z.number().min(5).max(30),
            goal: z.string(),
            steps: z.array(z.string()),
            prompt_template: z.object({
              title: z.string(),
              text: z.string(),
            }),
          }),
        ),
      }),
    ),
  })
  .strict();

async function generateCourseWithAnthropicAPI(quizData: any) {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  // Lazy-load the Anthropic SDK inside the server handler to keep the
  // createServerFn module edge-safe and out of the client bundle.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  const anthropic = new Anthropic({ apiKey });
  const profileJson = JSON.stringify({
    role: quizData.role,
    main_pain: quizData.main_pain,
    age_groups: quizData.age_groups || [],
    ai_experience: quizData.ai_experience || "beginner",
    output_format: quizData.output_format || "ready_prompts",
    time_budget: quizData.time_budget || "15_min",
  });

  const systemPrompt = `Tu esi ekspertas, kuris kuria personalizuotus mikro-mokymosi kursus Lietuvos ikimokyklinio ugdymo įstaigų (lopšelių-darželių) darbuotojams.

Griežtos taisyklės:
- NIEKADA "personalus" → "personalizuotas" arba "individualus"
- NIEKADA "skausmo taškas" → "iššūkis", "problema" arba "didžiausias iššūkis"
- Užklausose: "Parašyk", "Paruošk", "Pateik", "Sukurk" (ne "Parenk")
- Derink giminę ir linksnius pagal vaidmenį
- Venk kanceliarinio stiliaus

Sugeneruok JSON be „source" ir „model" laukų (jie bus pridėti serveryje):
{
  "title": "...",
  "subtitle": "...",
  "modules": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "lessons": [
        {
          "id": "1.1",
          "title": "...",
          "duration_min": 5-9,
          "goal": "...",
          "steps": ["1. ...", "2. ...", "3. ..."],
          "prompt_template": {
            "title": "...",
            "text": "..."
          }
        }
      ]
    }
  ]
}

Visada įtrauk pamoką apie duomenų saugą (GDPR) ir kokybės patikrą.
Atsakyk TIK validžiu JSON. Jokio markdown.`;

  let lastError: Error | null = null;

  try {
    const message = await anthropic.messages.create(
      {
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Vartotojo duomenys:\n${profileJson}\n\nSugeneruok personalizuotą kursą.`,
          },
        ],
      },
      { timeout: 12_000 },
    );

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const validated = anthropicCourseSchema.parse(JSON.parse(cleanJson));

    return { ...validated, source: "anthropic", model: "claude-3-5-haiku-20241022" };
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.error("First attempt failed:", lastError.message);

    try {
      const zodMsg =
        lastError instanceof z.ZodError
          ? lastError.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
          : lastError.message;

      const retry = await anthropic.messages.create(
        {
          model: "claude-3-5-haiku-20241022",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Vartotojo duomenys:\n${profileJson}\n\nSugeneruok personalizuotą kursą.`,
            },
            { role: "assistant", content: "Supratau." },
            {
              role: "user",
              content: `Klaida: ${zodMsg}. Ištaisyk ir grąžink TIK validų JSON.`,
            },
          ],
        },
        { timeout: 12_000 },
      );

      const retryText = retry.content[0].type === "text" ? retry.content[0].text : "";
      const cleanRetryJson = retryText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const retryValidated = anthropicCourseSchema.parse(JSON.parse(cleanRetryJson));

      return { ...retryValidated, source: "anthropic", model: "claude-3-5-haiku-20241022" };
    } catch (retryError) {
      console.error("Retry failed:", retryError);
      throw new Error("API failed twice. Fallback to mock.");
    }
  }
}

function mapAnthropicToCourseContent(result: z.infer<typeof anthropicCourseSchema>): CourseContent {
  return {
    title: result.title,
    subtitle: result.subtitle,
    language: "lt",
    modules: result.modules.map((m) => ({
      id: String(m.id),
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        summary: l.goal,
        minutes: l.duration_min,
        steps: l.steps,
        prompts: [
          {
            title: l.prompt_template.title,
            body: l.prompt_template.text,
          },
        ],
      })),
    })),
  };
}

async function buildCourseContent(onboarding: any): Promise<CourseContent> {
  const aiProvider = process.env["AI_PROVIDER"] || "mock";

  try {
    if (aiProvider === "anthropic") {
      const generated = await generateCourseWithAnthropicAPI(onboarding);
      return mapAnthropicToCourseContent(generated);
    }
    return buildMockCourse(onboarding);
  } catch (error) {
    console.error("Generation error:", error);
    console.warn("Fallback to mock");
    return buildMockCourse(onboarding);
  }
}

export const savePendingOnboarding = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const candidate = input as { email?: unknown; onboarding?: unknown };
    const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
      throw new Error("Neteisingas el. pašto adresas");
    }
    return { email, onboarding: onboardingSchema.parse(candidate.onboarding) };
  })
  .handler(async ({ data }) => {
    const handoffToken = crypto.randomUUID();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("pending_onboarding").insert({
      email: data.email,
      handoff_token: handoffToken,
      onboarding: data.onboarding,
    });
    if (error) {
      console.error("[savePendingOnboarding] insert failed", error);
      throw new Error("Nepavyko išsaugoti apklausos atsakymų");
    }
    return { handoffToken };
  });

/**
 * Creates a course row. Uses the shared `course_templates` cache keyed by
 * `${role}_${main_pain}_${ai_experience}` — cache hits are instant.
 */
export const generateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const candidate = input as { onboarding?: unknown; pendingOnboardingId?: unknown };
    const pendingOnboardingId =
      typeof candidate.pendingOnboardingId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        candidate.pendingOnboardingId,
      )
        ? candidate.pendingOnboardingId
        : null;
    return { onboarding: onboardingSchema.parse(candidate.onboarding), pendingOnboardingId };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const courseKey = buildCourseKey(data.onboarding);

    if (data.pendingOnboardingId) {
      const { data: existing } = await supabase
        .from("courses")
        .select("id, status")
        .eq("pending_onboarding_id", data.pendingOnboardingId)
        .maybeSingle();
      if (existing) return { courseId: existing.id, status: existing.status as "ready" | "failed" };
    }

    const { data: created, error: insertError } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        status: "generating",
        onboarding: data.onboarding,
        pending_onboarding_id: data.pendingOnboardingId,
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
      const content = parsedCache?.success
        ? parsedCache.data
        : await buildCourseContent(data.onboarding);

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

    const content = await buildCourseContent(parsed.data);

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
