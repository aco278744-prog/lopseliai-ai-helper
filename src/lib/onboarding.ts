import { z } from "zod";

export const ONBOARDING_STORAGE_KEY = "lopseliai_onboarding_v1";

export const roleValues = [
  "director",
  "deputy_education",
  "deputy_facility",
  "accountant",
  "teacher",
  "specialist",
] as const;

export const ageGroupValues = ["nursery", "preschool", "prekindergarten"] as const;

export const mainPainValues = [
  "parent_communications",
  "education_plans",
  "events_celebrations",
  "reports_municipality",
  "internal_orders",
] as const;

export const aiExperienceValues = ["beginner", "intermediate", "advanced"] as const;

export const outputFormatValues = [
  "ready_prompts",
  "step-by-step_guides",
  "document_templates",
] as const;

export const timeBudgetValues = ["5_min", "15_min", "30_min"] as const;

export const onboardingSchema = z.object({
  role: z.enum(roleValues),
  age_groups: z.array(z.enum(ageGroupValues)).min(1),
  main_pain: z.enum(mainPainValues),
  ai_experience: z.enum(aiExperienceValues),
  output_format: z.enum(outputFormatValues),
  time_budget: z.enum(timeBudgetValues),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export const roleOptions: Option<(typeof roleValues)[number]>[] = [
  { value: "director", label: "Direktorė / direktorius", description: "Įstaigos vadovas" },
  {
    value: "deputy_education",
    label: "Direktoriaus pavaduotoja ugdymui",
    description: "Ugdymo proceso priežiūra",
  },
  {
    value: "deputy_facility",
    label: "Direktoriaus pavaduotoja ūkio reikalams",
    description: "Ūkis, viešieji pirkimai, sauga",
  },
  {
    value: "accountant",
    label: "Buhalterė",
    description: "Finansai, ataskaitos, buhalterija",
  },
  { value: "teacher", label: "Auklėtoja / mokytoja", description: "Darbas su grupe kasdien" },
  {
    value: "specialist",
    label: "Specialistė (logopedė, psichologė)",
    description: "Pagalba vaikui ir šeimai",
  },
];

export const ageGroupOptions: Option<(typeof ageGroupValues)[number]>[] = [
  { value: "nursery", label: "Lopšelis", description: "1–3 metų vaikai" },
  { value: "preschool", label: "Darželis", description: "3–5 metų vaikai" },
  { value: "prekindergarten", label: "Priešmokyklinis", description: "5–6 metų vaikai" },
];

export const mainPainOptions: Option<(typeof mainPainValues)[number]>[] = [
  {
    value: "parent_communications",
    label: "Bendravimas su tėvais",
    description: "Laiškai, skelbimai, sudėtingi pokalbiai",
  },
  {
    value: "education_plans",
    label: "Ugdymo planai",
    description: "Savaitės planai, veiklų idėjos, vertinimai",
  },
  {
    value: "events_celebrations",
    label: "Renginiai ir šventės",
    description: "Scenarijai, pasiruošimas, madingos idėjos",
  },
  {
    value: "reports_municipality",
    label: "Ataskaitos savivaldybei",
    description: "Statistika, veiklos ataskaitos, raštai",
  },
  {
    value: "internal_orders",
    label: "Vidaus tvarkos ir įsakymai",
    description: "Įsakymai, aprašai, protokolai",
  },
];

export const aiExperienceOptions: Option<(typeof aiExperienceValues)[number]>[] = [
  { value: "beginner", label: "Pradedančioji", description: "Dar beveik nenaudojau DI" },
  { value: "intermediate", label: "Vidutinė", description: "Kartais naudoju, bet nesistemingai" },
  { value: "advanced", label: "Pažengusi", description: "Naudoju reguliariai, noriu gilintis" },
];

export const outputFormatOptions: Option<(typeof outputFormatValues)[number]>[] = [
  {
    value: "ready_prompts",
    label: "Paruošti užklausų šablonai",
    description: "Nukopijuok ir naudok iš karto",
  },
  {
    value: "step-by-step_guides",
    label: "Žingsnis po žingsnio vadovai",
    description: "Detalūs paaiškinimai su pavyzdžiais",
  },
  {
    value: "document_templates",
    label: "Dokumentų šablonai",
    description: "Raštų, planų ir ataskaitų ruošiniai",
  },
];

export const timeBudgetOptions: Option<(typeof timeBudgetValues)[number]>[] = [
  { value: "5_min", label: "5 minutės per dieną", description: "Trumpi mikro-žingsniai" },
  { value: "15_min", label: "15 minučių per dieną", description: "Subalansuotas tempas" },
  { value: "30_min", label: "30 minučių per dieną", description: "Greitas progresas" },
];

export function labelFor<T extends string>(options: Option<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
