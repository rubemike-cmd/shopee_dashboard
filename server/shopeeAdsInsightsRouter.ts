import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { shopeeAdsUploads, shopeeAdsData } from "../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

export const shopeeAdsInsightsRouter = router({
  generate: publicProcedure
    .input(
      z.object({
          totalAds: z.number(),
          activeAds: z.number(),
          pausedAds: z.number(),
          totalImpressions: z.number(),
          totalClicks: z.number(),
          avgCTR: z.number(),
          totalConversions: z.number(),
          totalDirectConversions: z.number(),
          avgConversionRate: z.number(),
          totalSpend: z.number(),
          totalGMV: z.number(),
          totalDirectRevenue: z.number(),
          avgROAS: z.number(),
          avgDirectROAS: z.number(),
          avgACOS: z.number(),
          avgDirectACOS: z.number(),
          totalItemsSold: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const metrics = input;

      const prompt = `Você é um especialista em marketing digital e gestão de campanhas de anúncios em marketplaces como Shopee. Analise os seguintes dados de desempenho de anúncios e forneça insights profissionais e acionáveis.

**Dados de Performance:**
- Total de Anúncios: ${metrics.totalAds} (${metrics.activeAds} ativos, ${metrics.pausedAds} pausados)
- Impressões: ${metrics.totalImpressions.toLocaleString()}
- Cliques: ${metrics.totalClicks.toLocaleString()}
- CTR Médio: ${metrics.avgCTR.toFixed(2)}%
- Conversões: ${metrics.totalConversions} (${metrics.totalDirectConversions} diretas)
- Taxa de Conversão: ${metrics.avgConversionRate.toFixed(2)}%
- Gasto Total: R$ ${metrics.totalSpend.toFixed(2)}
- GMV Total: R$ ${metrics.totalGMV.toFixed(2)}
- Receita Direta: R$ ${metrics.totalDirectRevenue.toFixed(2)}
- ROAS Médio: ${metrics.avgROAS.toFixed(2)}x (Direto: ${metrics.avgDirectROAS.toFixed(2)}x)
- ACOS Médio: ${metrics.avgACOS.toFixed(1)}% (Direto: ${metrics.avgDirectACOS.toFixed(1)}%)
- Itens Vendidos: ${metrics.totalItemsSold}

**Sua análise deve incluir:**

1. **Resumo Executivo** (2-3 linhas): Avaliação geral do desempenho das campanhas.

2. **Pontos Fortes** (3-4 itens): Identifique os principais sucessos e oportunidades bem exploradas.

3. **Alertas** (2-3 itens com severidade): Problemas que precisam de atenção imediata, categorizados como CRÍTICO, ALTO ou MÉDIO.

4. **Oportunidades** (2-3 itens): Áreas de melhoria e potencial de crescimento.

5. **Recomendação Principal**: Uma ação específica e mensurável que pode gerar o maior impacto.

6. **Nota Pessoal**: Uma mensagem motivacional e profissional.

Forneça a análise em formato estruturado e direto, com linguagem clara e profissional.`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Você é um mentor experiente em marketing digital e otimização de campanhas de anúncios. Fornece análises profundas, acionáveis e orientadas por dados.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content =
          response.choices[0]?.message.content || "Análise indisponível";

        return {
          success: true,
          insights: content,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Error generating Shopee Ads insights:", error);
        return {
          success: false,
          insights:
            "Não foi possível gerar insights no momento. Tente novamente mais tarde.",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  getUploadHistory: publicProcedure
    .query(async () => {
      try {
        const database = await getDb();
        if (!database) {
          console.warn("Database not available");
          return [];
        }

        // Get the last 30 uploads
        const uploads = await database
          .select({
            id: shopeeAdsUploads.id,
            uploadedAt: shopeeAdsUploads.uploadedAt,
            totalAds: shopeeAdsUploads.totalAds,
          })
          .from(shopeeAdsUploads)
          .orderBy(desc(shopeeAdsUploads.uploadedAt))
          .limit(30);

        // For each upload, calculate metrics from shopeeAdsData
        const enrichedUploads = await Promise.all(
          uploads.map(async (upload) => {
            const data = await database
              .select({
                totalImpressions: sql<number>`SUM(CAST(${shopeeAdsData.impressions} AS UNSIGNED))`,
                totalClicks: sql<number>`SUM(CAST(${shopeeAdsData.clicks} AS UNSIGNED))`,
                avgROAS: sql<number>`AVG(CAST(${shopeeAdsData.roas} AS DECIMAL(10,2)))`,
                avgACOS: sql<number>`AVG(CAST(${shopeeAdsData.acos} AS DECIMAL(10,2)))`,
              })
              .from(shopeeAdsData)
              .where(eq(shopeeAdsData.uploadId, upload.id));

            const metrics = data[0] || {
              totalImpressions: 0,
              totalClicks: 0,
              avgROAS: 0,
              avgACOS: 0,
            };

            return {
              id: upload.id,
              uploadedAt: upload.uploadedAt,
              totalAds: upload.totalAds,
              totalImpressions: Number(metrics.totalImpressions) || 0,
              totalClicks: Number(metrics.totalClicks) || 0,
              avgROAS: Number(metrics.avgROAS) || 0,
              avgACOS: Number(metrics.avgACOS) || 0,
            };
          })
        );

        return enrichedUploads;
      } catch (error) {
        console.error("Error fetching upload history:", error);
        return [];
      }
    }),
});
