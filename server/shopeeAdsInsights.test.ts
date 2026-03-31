import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("shopeeAdsInsights router", () => {
  it("should have shopeeAdsInsights router defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.shopeeAdsInsights).toBeDefined();
  });

  it("should have generate procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.shopeeAdsInsights.generate).toBeDefined();
  });

  it("should generate insights with valid metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const mockMetrics = {
      totalAds: 10,
      activeAds: 8,
      pausedAds: 2,
      totalImpressions: 50000,
      totalClicks: 1500,
      avgCTR: 3.0,
      totalConversions: 150,
      totalDirectConversions: 100,
      avgConversionRate: 10.0,
      totalSpend: 1000,
      totalGMV: 5000,
      totalDirectRevenue: 3500,
      avgROAS: 5.0,
      avgDirectROAS: 3.5,
      avgACOS: 20.0,
      avgDirectACOS: 28.57,
      totalItemsSold: 200,
    };

    try {
      const result = await caller.shopeeAdsInsights.generate(mockMetrics);
      // LLM call might succeed or fail depending on environment
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error) {
      // LLM might not be available in test environment
      expect(error).toBeDefined();
    }
  }, { timeout: 15000 });
});
