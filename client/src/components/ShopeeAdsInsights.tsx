import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ShopeeAdsMetrics } from "@/hooks/useShopeeAdsAnalysis";
import { Streamdown } from "streamdown";

interface ShopeeAdsInsightsProps {
  metrics: ShopeeAdsMetrics;
}

export function ShopeeAdsInsights({ metrics }: ShopeeAdsInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trpc/shopeeAdsInsights.generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { metrics },
        }),
        credentials: "include",
      });

      const result = await response.json();
      if (result.result?.data?.insights) {
        setInsights(result.result.data.insights);
      } else {
        setError("Não foi possível gerar insights");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar insights");
    } finally {
      setIsLoading(false);
    }
  };

  if (!insights && !isLoading && !error) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-4">
          <p className="text-gray-600">
            Clique no botão abaixo para gerar uma análise inteligente dos seus anúncios
          </p>
          <Button onClick={generateInsights} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading ? "Gerando..." : "Gerar Análise do Mentor"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={generateInsights}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Reanalisar
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Erro ao gerar insights</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {insights && (
        <Card className="p-6">
          <div className="prose prose-sm max-w-none">
            <Streamdown>{insights}</Streamdown>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-gray-600">Gerando análise do mentor...</p>
          </div>
        </Card>
      )}
    </div>
  );
}
