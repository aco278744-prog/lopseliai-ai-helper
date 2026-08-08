import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FailedGenerationScreenProps {
  errorMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function FailedGenerationScreen({
  errorMessage,
  onRetry,
  isRetrying = false,
}: FailedGenerationScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Klaida generuojant kursą
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Deja, nepavyko sugeneruoti jūsų personalaus kurso. Prašome bandyti dar
          kartą.
        </p>

        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Klaida:</strong> {errorMessage}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isRetrying ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Bandau dar kartą...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Bandyti dar kartą
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Grįžti į pradžią
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Jei klaida tęsis, susisiekite su mūsų pagalbos komanda.
        </p>
      </div>
    </div>
  );
}

export default FailedGenerationScreen;
