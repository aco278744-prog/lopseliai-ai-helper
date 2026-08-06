import { z } from "zod";

export const promptSchema = z.object({
  title: z.string(),
  body: z.string(),
});

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  minutes: z.number(),
  steps: z.array(z.string()),
  prompts: z.array(promptSchema),
});

export const moduleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonSchema),
});

export const courseContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  language: z.string(),
  modules: z.array(moduleSchema),
});

export type CoursePrompt = z.infer<typeof promptSchema>;
export type CourseLesson = z.infer<typeof lessonSchema>;
export type CourseModule = z.infer<typeof moduleSchema>;
export type CourseContent = z.infer<typeof courseContentSchema>;

export type CourseStatus = "pending" | "generating" | "ready" | "failed";
