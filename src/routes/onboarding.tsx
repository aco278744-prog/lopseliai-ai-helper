import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "@/lib/storage";
import {
  ONBOARDING_STORAGE_KEY,
  onboardingSchema,
  roleOptions,
  ageGroupOptions,
  mainPainOptions,
  aiExperienceOptions,
  outputFormatOptions,
  timeBudgetOptions,
  languageStyleOptions,
  type OnboardingData,
  type Option,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Apklausa — sukurkite personalų DI kursą | Lopšeliai" },
      {
        name: "description",
        content:
          "7 klausimai apie jūsų vaidmenį darželyje, amžiaus grupes ir darbo iššūkius — pagal juos sukursime personalų DI kursą.",
      },
      { property: "og:title", content: "Apklausa — sukurkite personalų DI kursą" },
      {
        property: "og:description",
        content: "Atsakykite į 7 klausimus ir gaukite kursą, pritaikytą jūsų darbui darželyje.",
      },
    ],
  }),
  component: OnboardingPage,
});

type Draft = Partial<OnboardingData>;

const stepsMeta = [
  { key: "role", title: "Koks jūsų vaidmuo įstaigoje?", hint: "Pasirinkite vieną" },
  { key: "age_groups", title: "Su kokiomis amžiaus grupėmis dirbate?", hint: "Galima pasirinkti kelias" },
  { key: "main_pain", title: "Kas atima daugiausia laiko?", hint: "Pasirinkite vieną" },
  { key: "ai_experience", title: "Kokia jūsų DI patirtis?", hint: "Pasirinkite vieną" },
  { key: "output_format", title: "Kokio formato medžiagos norite?", hint: "Pasirinkite vieną" },
  { key: "time_budget", title: "Kiek laiko galite skirti mokymuisi?", hint: "Pasirinkite vieną" },
  { key: "language_style", title: "Kokia kalba rengti turinį?", hint: "Pasirinkite vieną" },
] as const;

const TOTAL_STEPS = stepsMeta.length + 1;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ age_groups: [] });
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isEmailStep = step === stepsMeta.length;
  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  const goNext = () => setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const pickSingle = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    window.setTimeout(goNext, 160);
  };

  const toggleAgeGroup = (value: OnboardingData["age_groups"][number]) => {
    setDraft((current) => {
      const groups = current.age_groups ?? [];
      return {
        ...current,
        age_groups: groups.includes(value)
          ? groups.filter((group) => group !== value)
          : [...groups, value],
      };
    });
  };

  const sendMagicLink = async () => {
    const parsed = onboardingSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Atsakykite į visus klausimus");
      setStep(0);
      return;
    }
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed) || trimmed.length > 255) {
      toast.error("Įveskite teisingą el. pašto adresą");
      return;
    }

    setSending(true);
    safeStorage.setJSON(ONBOARDING_STORAGE_KEY, parsed.data);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setSending(false);
    if (error) {
      toast.error("Nepavyko išsiųsti nuorodos. Bandykite dar kartą.");
      return;
    }
    setSent(true);
  };

  const meta = stepsMeta[Math.min(step, stepsMeta.length - 1)]!;

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-lg font-semibold">
          Lopšeliai
        </Link>
        <span className="text-sm text-muted-foreground">
          {Math.min(step + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pb-20">
        <Progress value={progress} className="h-1.5" />

        <div className="surface-card mt-8 p-6 sm:p-8">
          {!isEmailStep ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {meta.hint}
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{meta.title}</h1>

              <div className="mt-6 space-y-3 pb-[80px]">
                {step === 0 &&
                  renderSingle(roleOptions, draft.role, (value) => pickSingle("role", value))}
                {step === 1 &&
                  ageGroupOptions.map((option) => (
                    <OptionButton
                      key={option.value}
                      option={option}
                      selected={(draft.age_groups ?? []).includes(option.value)}
                      onClick={() => toggleAgeGroup(option.value)}
                    />
                  ))}
                {step === 2 &&
                  renderSingle(mainPainOptions, draft.main_pain, (value) =>
                    pickSingle("main_pain", value),
                  )}
                {step === 3 &&
                  renderSingle(aiExperienceOptions, draft.ai_experience, (value) =>
                    pickSingle("ai_experience", value),
                  )}
                {step === 4 &&
                  renderSingle(outputFormatOptions, draft.output_format, (value) =>
                    pickSingle("output_format", value),
                  )}
                {step === 5 &&
                  renderSingle(timeBudgetOptions, draft.time_budget, (value) =>
                    pickSingle("time_budget", value),
                  )}
                {step === 6 &&
                  renderSingle(languageStyleOptions, draft.language_style, (value) =>
                    pickSingle("language_style", value),
                  )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={goBack} disabled={step === 0}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Atgal
                </Button>
                {step === 1 ? (
                  <Button onClick={goNext} disabled={(draft.age_groups ?? []).length === 0}>
                    Toliau
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </>
          ) : sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft">
                <Mail className="size-7 text-primary" aria-hidden="true" />
              </div>
              <h1 className="mt-6 text-2xl font-semibold">Patikrinkite el. paštą</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Adresu <span className="font-medium text-foreground">{email}</span> išsiuntėme
                prisijungimo nuorodą. Paspaudę ją, iš karto pradėsime kurti jūsų kursą.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Nematote laiško? Patikrinkite šlamšto (spam) aplanką.
              </p>
              <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>
                Keisti el. paštą
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Paskutinis žingsnis
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Kur atsiųsti jūsų kursą?</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Prisijungimas be slaptažodžio — atsiųsime saugią nuorodą.
              </p>

              <div className="mt-6 space-y-2">
                <Label htmlFor="email">El. paštas</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={255}
                  placeholder="vardas@darzelis.lt"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12"
                />
              </div>

              <Button
                className="mt-6 h-12 w-full text-base"
                onClick={() => void sendMagicLink()}
                disabled={sending}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Mail className="size-4" aria-hidden="true" />
                )}
                Gauti prisijungimo nuorodą
              </Button>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Atgal
                </Button>
                <Button variant="ghost" onClick={() => void navigate({ to: "/" })}>
                  Atšaukti
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function renderSingle<T extends string>(
  options: Option<T>[],
  selected: T | undefined,
  onSelect: (value: T) => void,
) {
  return options.map((option) => (
    <OptionButton
      key={option.value}
      option={option}
      selected={selected === option.value}
      onClick={() => onSelect(option.value)}
    />
  ));
}

function OptionButton<T extends string>({
  option,
  selected,
  onClick,
}: {
  option: Option<T>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary-soft"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected ? <Check className="size-3 text-primary-foreground" aria-hidden="true" /> : null}
      </span>
      <span>
        <span className="block text-sm font-semibold">{option.label}</span>
        {option.description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
    </button>
  );
}
