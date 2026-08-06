import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  message?: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function FailedGenerationScreen({ message, onRetry, isRetrying = false }: Props) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft">
          <AlertTriangle className="size-7 text-accent-foreground" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Kurso sugeneruoti nepavyko</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Įvyko techninė klaida ruošiant jūsų personalų kursą. Jūsų atsakymai išsaugoti — pabandykite
          dar kartą, tai užtruks vos kelias sekundes.
        </p>
        {message ? (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Klaidos kodas: {message}
          </p>
        ) : null}
        <Button className="mt-6 w-full" size="lg" onClick={onRetry} disabled={isRetrying}>
          <RotateCcw className={isRetrying ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
          {isRetrying ? "Bandoma iš naujo..." : "Bandyti dar kartą"}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Jei klaida kartojasi, parašykite mums — padėsime rankiniu būdu.
        </p>
      </div>
    </div>
  );
}
