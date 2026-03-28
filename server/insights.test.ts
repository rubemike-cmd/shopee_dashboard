import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM to avoid real API calls in tests
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          summary: "Sua loja tem 49 pedidos com R$ 2.019,32 em vendas e margem de 7,2%.",
          strengths: [
            { title: "Volume consistente de pedidos", detail: "49 pedidos em curto período.", metric: "49 pedidos" }
          ],
          alerts: [
            { title: "Margem de lucro baixa", detail: "7,2% está abaixo do ideal.", severity: "alta", metric: "7,2%" }
          ],
          opportunities: [
            { title: "Expansão geográfica", detail: "SP concentra 32% dos pedidos.", potential: "+20% receita" }
          ],
          topRecommendation: {
            action: "Revise os custos dos produtos com menor margem.",
            why: "A margem de 7,2% é crítica para sustentabilidade.",
            howTo: "Liste os 5 produtos com menor margem e negocie com fornecedores."
          },
          mentorNote: "Você está vendendo bem, mas precisa melhorar a margem urgentemente."
        })
      }
    }]
  })
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("insights.generate", () => {
  const validInput = {
    totalOrders: 49,
    totalRevenue: 2019.32,
    totalProfit: 145.27,
    profitMargin: 7.2,
    avgOrderValue: 41.21,
    topProducts: [
      { name: "Produto A", count: 10, totalProfit: 50.0 },
      { name: "Produto B", count: 8, totalProfit: 30.0 },
    ],
    statusDistribution: [
      { name: "shipped", value: 38, percentage: 77.6 },
      { name: "wms", value: 11, percentage: 22.4 },
    ],
    stateDistribution: [
      { name: "SP", value: 16 },
      { name: "SC", value: 8 },
    ],
    logisticsDistribution: [
      { name: "Correios", value: 30 },
      { name: "Shopee Xpress", value: 19 },
    ],
  };

  it("retorna insights estruturados com todos os campos obrigatórios", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.insights.generate(validInput);

    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("alerts");
    expect(result).toHaveProperty("opportunities");
    expect(result).toHaveProperty("topRecommendation");
    expect(result).toHaveProperty("mentorNote");
  });

  it("retorna arrays de strengths, alerts e opportunities", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.insights.generate(validInput);

    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.alerts)).toBe(true);
    expect(Array.isArray(result.opportunities)).toBe(true);
  });

  it("topRecommendation tem action, why e howTo", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.insights.generate(validInput);

    expect(result.topRecommendation).toHaveProperty("action");
    expect(result.topRecommendation).toHaveProperty("why");
    expect(result.topRecommendation).toHaveProperty("howTo");
  });

  it("rejeita input com mais de 12 topProducts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.insights.generate({
        ...validInput,
        topProducts: Array.from({ length: 13 }, (_, i) => ({
          name: `Produto ${i}`, count: 1, totalProfit: 10
        }))
      })
    ).rejects.toThrow();
  });

  it("aceita input com dateRange opcional", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.insights.generate({
      ...validInput,
      dateRange: { start: "2026-03-01", end: "2026-03-28" },
      periodDays: 28,
    });

    expect(result).toHaveProperty("summary");
  });
});
