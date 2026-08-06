import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Clock3, ShieldCheck, FileText, MessageSquareHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-teacher.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lopšeliai — personalus DI kursas darželio komandai" },
      {
        name: "description",
        content:
          "Per 3 minutes atsakykite į 7 klausimus ir gaukite personalų dirbtinio intelekto kursą su paruoštomis užklausomis lopšelio-darželio darbui.",
      },
      { property: "og:title", content: "Lopšeliai — personalus DI kursas darželio komandai" },
      {
        property: "og:description",
        content:
          "Personalus DI kursas Lietuvos ikimokyklinio ugdymo įstaigoms: užklausos, šablonai ir žingsnis po žingsnio vadovai.",
      },
    ],
  }),
  component: LandingPage,
});

const benefits = [
  {
    icon: MessageSquareHeart,
    title: "Bendravimas su tėvais",
    text: "Paruošti laiškai, skelbimai ir atsakymai sudėtingose situacijose — mandagiai ir aiškiai.",
  },
  {
    icon: FileText,
    title: "Dokumentai ir ataskaitos",
    text: "Įsakymai, veiklos planai ir ataskaitos savivaldybei parengiami kelis kartus greičiau.",
  },
  {
    icon: ShieldCheck,
    title: "Saugu ir atsakinga",
    text: "Aiškios taisyklės, kokių duomenų niekada negalima įvesti į DI įrankius.",
  },
];

const steps = [
  { number: "01", title: "Atsakykite į 7 klausimus", text: "Vaidmuo, grupės, skaudžiausia sritis ir laisvas laikas." },
  { number: "02", title: "Gaukite prisijungimo nuorodą", text: "Be slaptažodžių — tiesiog patvirtinkite el. paštą." },
  { number: "03", title: "Mokykitės savo tempu", text: "Moduliai, pamokos ir paruoštos užklausos vienoje vietoje." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-semibold tracking-tight">Lopšeliai</span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Prisijungti</Link>
        </Button>
      </header>

      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 md:pb-24 md:pt-14 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-primary shadow-soft">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Sukurta Lietuvos darželiams
            </span>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              Dirbtinis intelektas, pritaikytas jūsų darželio kasdienybei
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Atsakykite į 7 klausimus ir per kelias sekundes gausite personalų kursą su paruoštomis
              užklausomis, šablonais ir žingsnis po žingsnio vadovais — būtent jūsų vaidmeniui.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/onboarding">
                  Sukurti personalų kursą
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <span className="inline-flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" />
                Užtruks apie 3 minutes
              </span>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Darželio mokytoja prie nešiojamojo kompiuterio šviesioje grupėje"
              width={1280}
              height={960}
              className="w-full rounded-3xl object-cover shadow-lift"
            />
            <div className="surface-card absolute -bottom-6 left-4 hidden max-w-[15rem] p-4 md:block animate-float-soft">
              <p className="text-sm font-medium">„Savaitės planą parengiu per 12 minučių.“</p>
              <p className="mt-1 text-xs text-muted-foreground">Pavaduotoja ugdymui, Kaunas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2 className="text-3xl font-semibold sm:text-4xl">Kur DI padeda iš karto</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="surface-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft">
                <benefit.icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/60">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="text-3xl font-semibold sm:text-4xl">Kaip tai veikia</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number}>
                <span className="font-display text-3xl font-semibold text-accent">{step.number}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
        <h2 className="text-3xl font-semibold sm:text-4xl">Pradėkite šiandien</h2>
        <p className="mt-4 text-muted-foreground">
          Kursas kuriamas pagal jūsų atsakymus — lietuvių arba rusų kalba.
        </p>
        <Button asChild size="lg" className="mt-8 h-12 px-8 text-base">
          <Link to="/onboarding">
            Sukurti personalų kursą
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Lopšeliai</span>
          <span>DI mokymai ikimokyklinio ugdymo įstaigoms</span>
        </div>
      </footer>
    </div>
  );
}
