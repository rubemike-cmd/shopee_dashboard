import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { spreadsheetUploads } from "../drizzle/schema";
import { sql } from "drizzle-orm";

export const productsRouter = router({
  /**
   * Busca os produtos mais vendidos com base nos pedidos
   */
  getTopProducts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Buscar produtos agrupados por nome
      // Por enquanto, retornar dados simulados
      // Em produção, isso viria de uma tabela de pedidos/produtos
      const products = [
        { name: 'Frigideira Nanocerâmico Granito 20CM', quantity: 11, revenue: 1100, profit: 126 },
        { name: 'Balança Digital de Medição por Bioimpedância', quantity: 11, revenue: 1100, profit: 157 },
        { name: 'Jogo de Panelas Vanilla', quantity: 8, revenue: 800, profit: 168 },
        { name: 'Chaleira Elétrica Inox', quantity: 7, revenue: 700, profit: 105 },
        { name: 'Aplicador Para Fita Adesiva Com Suporte', quantity: 1, revenue: 100, profit: 23 },
      ];

      return products.map((p) => ({
        name: p.name || "Sem nome",
        quantity: Number(p.quantity) || 0,
        revenue: Number(p.revenue) || 0,
        profit: Number(p.profit) || 0,
      }));
    }),

  /**
   * Busca estatísticas gerais de produtos
   */
  getProductStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

      // Dados simulados por enquanto
      const stats = [{
        totalProducts: 5,
        totalQuantity: 49,
        totalRevenue: 2019.32,
        totalProfit: 145.27,
      }];

    const row = stats[0];
    return {
      totalProducts: Number(row.totalProducts) || 0,
      totalQuantity: Number(row.totalQuantity) || 0,
      totalRevenue: Number(row.totalRevenue) || 0,
      totalProfit: Number(row.totalProfit) || 0,
      avgMargin: Number(row.totalRevenue) > 0 ? (Number(row.totalProfit) / Number(row.totalRevenue)) * 100 : 0,
    };
  }),

  /**
   * Busca produtos com baixa margem de lucro (alertas)
   */
  getLowMarginProducts: publicProcedure
    .input(
      z.object({
        marginThreshold: z.number().min(0).max(100).default(10),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Dados simulados por enquanto
      const products = [
        { name: 'Produto com Baixa Margem', quantity: 5, revenue: 500, profit: 25 },
        { name: 'Outro Produto Crítico', quantity: 3, revenue: 300, profit: 15 },
      ];

      return products
        .map((p) => {
          const revenue = Number(p.revenue) || 0;
          const profit = Number(p.profit) || 0;
          const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
          return {
            name: p.name || "Sem nome",
            quantity: Number(p.quantity) || 0,
            revenue,
            profit,
            margin,
          };
        })
        .filter((p) => p.margin < input.marginThreshold);
    }),
});
