import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Prisijungimas | Lopšeliai" },
      {
        name: "description",
        content: "Prisijunkite prie savo personalaus DI kurso naudodami saugią nuorodą el. paštu.",
      },
      { property: "og:title", content: "Prisijungimas | Lopšeliai" },
      { property: "og:description", content: "Prisijunkite prie savo personalaus DI kurso." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed) || trimmed.length > 255) {
      toast.error("Įveskite teisingą el. pašto adresą");
      return;
    }
    setSending(true);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-5 py-16">
      <div className="surface-card w-full max-w-md p-8">
        <Link to="/" className="font-display text-lg font-semibold">
          Lopšeliai
        </Link>

        {sent ? (
          <div className="mt-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft">
              <Mail className="size-7 text-primary" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold">Patikrinkite el. paštą</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Nuorodą išsiuntėme adresu <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-semibold">Prisijunkite</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Įveskite el. paštą — atsiųsime saugią prisijungimo nuorodą.
            </p>
            <div className="mt-6 space-y-2">
              <Label htmlFor="login-email">El. paštas</Label>
              <Input
                id="login-email"
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
            <Button className="mt-6 h-12 w-full text-base" onClick={() => void send()} disabled={sending}>
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="size-4" aria-hidden="true" />
              )}
              Gauti nuorodą
            </Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Dar neturite kurso?{" "}
              <Link to="/onboarding" className="font-medium text-primary underline-offset-4 hover:underline">
                Sukurkite jį čia
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
