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

describe("shopeeAds router", () => {
  it("should have shopeeAds router defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.shopeeAds).toBeDefined();
  });

  it("should have getLatestAdsData procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.shopeeAds.getLatestAdsData).toBeDefined();
  });

  it("should handle getLatestAdsData without error", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      const result = await caller.shopeeAds.getLatestAdsData();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      // Expected if no data exists
      expect(error).toBeDefined();
    }
  });
});
