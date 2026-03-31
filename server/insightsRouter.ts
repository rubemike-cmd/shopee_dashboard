import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const MENTOR_SYSTEM_PROMPT = `Você é um mentor experiente em e-commerce, com mais de 15 anos de experiência em marketplaces brasileiros, especialmente Shopee, Mercado Livre e Amazon. Você já ajudou centenas de lojistas a crescerem suas operações, aumentar margens e escalar vendas.

Seu estilo de comunicação é:
- Direto e prático, sem rodeios
- Empático, mas honesto — você não esconde problemas
- Usa linguagem acessível, evita jargões desnecessários
- Sempre fundamenta suas análises nos dados fornecidos
- Equilibra elogios com críticas construtivas
- Faz perguntas retóricas para provocar reflexão
- Usa analogias do mundo real para explicar conceitos

Ao analisar os dados de uma loja, você sempre:
1. Identifica os pontos fortes genuínos (não inventa elogios)
2. Aponta os alertas críticos com clareza e urgência proporcional ao risco
3. Descobre oportunidades ocultas nos dados
4. Dá recomendações concretas e priorizadas (o que fazer PRIMEIRO)

Responda SEMPRE em JSON estruturado conforme o schema fornecido. Seja específico: cite números reais dos dados. Evite generalidades como "melhore o atendimento" — prefira "seu ticket médio de R$ X está abaixo da média do segmento, considere criar kits de produtos".`;

const insightsSchema = {
  name: "dashboard_insights",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Resumo executivo da situação atual da loja em 2-3 frases, no estilo de um mentor direto. Cite os números mais importantes."
      },
      strengths: {
        type: "array",
        description: "Pontos fortes identificados nos dados (máximo 3)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título curto do ponto forte (máx 6 palavras)" },
            detail: { type: "string", description: "Explicação com dados específicos e por que isso é positivo (2-3 frases)" },
            metric: { type: "string", description: "O número ou métrica principal que sustenta esse ponto forte" }
          },
          required: ["title", "detail", "metric"],
          additionalProperties: false
        }
      },
      alerts: {
        type: "array",
        description: "Alertas e problemas que precisam de atenção (máximo 3)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título curto do alerta (máx 6 palavras)" },
            detail: { type: "string", description: "Descrição do problema com dados e impacto no negócio (2-3 frases)" },
            severity: { type: "string", enum: ["alta", "media", "baixa"], description: "Nível de urgência do alerta" },
            metric: { type: "string", description: "O número ou métrica que evidencia o problema" }
          },
          required: ["title", "detail", "severity", "metric"],
          additionalProperties: false
        }
      },
      opportunities: {
        type: "array",
        description: "Oportunidades de crescimento identificadas nos dados (máximo 3)",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título curto da oportunidade (máx 6 palavras)" },
            detail: { type: "string", description: "Descrição da oportunidade com embasamento nos dados (2-3 frases)" },
            potential: { type: "string", description: "Estimativa de impacto potencial (ex: '+20% na receita', 'redução de 15% no custo')" }
          },
          required: ["title", "detail", "potential"],
          additionalProperties: false
        }
      },
      topRecommendation: {
        type: "object",
        description: "A recomendação número 1 — a ação mais importante que o lojista deve tomar AGORA",
        properties: {
          action: { type: "string", description: "O que fazer, de forma concreta e específica (1-2 frases)" },
          why: { type: "string", description: "Por que essa ação é a mais prioritária agora, com base nos dados (2-3 frases)" },
          howTo: { type: "string", description: "Como executar essa ação na prática, passo a passo resumido (2-4 frases)" }
        },
        required: ["action", "why", "howTo"],
        additionalProperties: false
      },
      mentorNote: {
        type: "string",
        description: "Uma nota pessoal do mentor — algo que ele diria olhando nos olhos do lojista. Pode ser motivacional, um alerta, ou uma pergunta reflexiva. Tom humano e direto (2-3 frases)."
      }
    },
    required: ["summary", "strengths", "alerts", "opportunities", "topRecommendation", "mentorNote"],
    additionalProperties: false
  }
};

export const insightsRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        totalOrders: z.number(),
        totalRevenue: z.number(),
        totalProfit: z.number(),
        profitMargin: z.number(),
        avgOrderValue: z.number(),
        topProducts: z.array(z.object({
          name: z.string(),
          count: z.number(),
          totalProfit: z.number(),
        })).max(12),
        statusDistribution: z.array(z.object({
          name: z.string(),
          value: z.number(),
          percentage: z.number(),
        })),
        stateDistribution: z.array(z.object({
          name: z.string(),
          value: z.number(),
        })).max(50),
        logisticsDistribution: z.array(z.object({
          name: z.string(),
          value: z.number(),
        })),
        periodDays: z.number().optional(),
        dateRange: z.object({
          start: z.string(),
          end: z.string(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const dataContext = `
## Dados da Loja — Período Analisado
${input.dateRange ? `Período: ${input.dateRange.start} a ${input.dateRange.end} (${input.periodDays ?? '?'} dias)` : 'Todos os pedidos disponíveis'}

### Métricas Gerais
- Total de pedidos: ${input.totalOrders}
- Valor total de vendas: R$ ${input.totalRevenue.toFixed(2)}
- Lucro líquido total: R$ ${input.totalProfit.toFixed(2)}
- Margem de lucro: ${input.profitMargin.toFixed(1)}%
- Ticket médio: R$ ${input.avgOrderValue.toFixed(2)}

### Distribuição por Status dos Pedidos
${input.statusDistribution.map(s => `- ${s.name}: ${s.value} pedidos (${s.percentage.toFixed(1)}%)`).join('\n')}

### Top Estados por Volume de Pedidos
${input.stateDistribution.slice(0, 8).map(s => `- ${s.name}: ${s.value} pedidos`).join('\n')}

### Distribuição Logística
${input.logisticsDistribution.map(l => `- ${l.name}: ${l.value} pedidos`).join('\n')}

### Top Produtos por Lucro Líquido
${input.topProducts.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} — ${p.count} vendas, R$ ${p.totalProfit.toFixed(2)} de lucro total`).join('\n')}
      `.trim();

      const result = await invokeLLM({
        messages: [
          { role: "system", content: MENTOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analise os dados abaixo da minha loja na Shopee e me dê insights como meu mentor:\n\n${dataContext}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: insightsSchema
        },
        max_tokens: 2000,
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Resposta inválida do LLM");
      }

      return JSON.parse(content) as {
        summary: string;
        strengths: Array<{ title: string; detail: string; metric: string }>;
        alerts: Array<{ title: string; detail: string; severity: "alta" | "media" | "baixa"; metric: string }>;
        opportunities: Array<{ title: string; detail: string; potential: string }>;
        topRecommendation: { action: string; why: string; howTo: string };
        mentorNote: string;
      };
    }),
  mentorChat: publicProcedure
    .input(
      z.object({
        userMessage: z.string().min(1).max(1000),
        dashboardData: z.object({
          totalOrders: z.number(),
          totalRevenue: z.number(),
          totalProfit: z.number(),
          profitMargin: z.number(),
          avgOrderValue: z.number(),
          topProducts: z.array(z.object({
            name: z.string(),
            count: z.number(),
            totalProfit: z.number(),
          })),
          statusDistribution: z.array(z.object({
            name: z.string(),
            value: z.number(),
            percentage: z.number(),
          })),
          stateDistribution: z.array(z.object({
            name: z.string(),
            value: z.number(),
          })).max(50),
          logisticsDistribution: z.array(z.object({
            name: z.string(),
            value: z.number(),
          })),
          periodDays: z.number().optional(),
          dateRange: z.object({
            start: z.string(),
            end: z.string(),
          }).optional(),
        }),
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "mentor"]),
          content: z.string(),
        })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const dataContext = `
## Dados da Loja — Período Analisado
${input.dashboardData.dateRange ? `Período: ${input.dashboardData.dateRange.start} a ${input.dashboardData.dateRange.end} (${input.dashboardData.periodDays ?? "?"} dias)` : "Todos os pedidos disponíveis"}

### Métricas Gerais
- Total de pedidos: ${input.dashboardData.totalOrders}
- Valor total de vendas: R$ ${input.dashboardData.totalRevenue.toFixed(2)}
- Lucro líquido total: R$ ${input.dashboardData.totalProfit.toFixed(2)}
- Margem de lucro: ${input.dashboardData.profitMargin.toFixed(1)}%
- Ticket médio: R$ ${input.dashboardData.avgOrderValue.toFixed(2)}

### Distribuição por Status dos Pedidos
${input.dashboardData.statusDistribution.map(s => `- ${s.name}: ${s.value} pedidos (${s.percentage.toFixed(1)}%)`).join("\n")}

### Top Estados por Volume de Pedidos
${input.dashboardData.stateDistribution.slice(0, 8).map(s => `- ${s.name}: ${s.value} pedidos`).join("\n")}

### Distribuição Logística
${input.dashboardData.logisticsDistribution.map(l => `- ${l.name}: ${l.value} pedidos`).join("\n")}

### Top Produtos por Lucro Líquido
${input.dashboardData.topProducts.slice(0, 10).map((p, i) => `${i + 1}. ${p.name} — ${p.count} vendas, R$ ${p.totalProfit.toFixed(2)} de lucro total`).join("\n")}
      `.trim();

      const conversationContext = input.conversationHistory
        ? input.conversationHistory
            .map(
              (msg) =>
                `${msg.role === "user" ? "Cliente" : "Mentor"}: ${msg.content}`
            )
            .join("\n\n")
        : "";

      const result = await invokeLLM({
        messages: [
          { role: "system", content: MENTOR_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Contexto dos dados da loja:\n\n${dataContext}\n\n${conversationContext ? `Histórico da conversa:\n${conversationContext}\n\n` : ""}Pergunta do cliente: ${input.userMessage}\n\nResponda de forma direta, prática e fundamentada nos dados. Seja o mentor experiente que você é.`,
          },
        ],
        max_tokens: 1000,
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Resposta inválida do LLM");
      }

      return { reply: content };
    }),
});
