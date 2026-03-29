import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { dashboardGoals } from "../drizzle/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { insightsRouter } from "./insightsRouter";
import { shopeeAdsRouter } from "./shopeeAdsRouter";
import { shopeeAdsInsightsRouter } from "./shopeeAdsInsightsRouter";
import { shopeeAdsRouterV2 } from "./shopeeAdsRouterV2";

const GOALS_ROW_ID = 1; // Single-row config pattern

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  insights: insightsRouter,
  shopeeAds: shopeeAdsRouter,
  shopeeAdsInsights: shopeeAdsInsightsRouter,
  shopeeAdsV2: shopeeAdsRouterV2,

  goals: router({
    /**
     * Busca as metas salvas. Retorna null se ainda não foram definidas.
     */
    get: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(dashboardGoals).where(eq(dashboardGoals.id, GOALS_ROW_ID)).limit(1);
      return rows[0] ?? null;
    }),

    /**
     * Salva (upsert) as metas personalizadas do dashboard.
     */
    save: publicProcedure
      .input(
        z.object({
          weeklyRevenue: z.number().min(0),
          weeklyProfit: z.number().min(0),
          monthlyRevenue: z.number().min(0),
          monthlyProfit: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível");

        await db
          .insert(dashboardGoals)
          .values({ id: GOALS_ROW_ID, ...input })
          .onDuplicateKeyUpdate({ set: input });

        return { success: true, goals: input };
      }),
  }),
});

export type AppRouter = typeof appRouter;
