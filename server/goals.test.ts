import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("goals router", () => {
  it("goals.get returns null when no goals are saved", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.goals.get();
    expect(result).toBeNull();
  });

  it("goals.save validates input correctly", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.save({
      weeklyRevenue: 500,
      weeklyProfit: 50,
      monthlyRevenue: 2000,
      monthlyProfit: 200,
    });

    expect(result.success).toBe(true);
    expect(result.goals.weeklyRevenue).toBe(500);
    expect(result.goals.weeklyProfit).toBe(50);
    expect(result.goals.monthlyRevenue).toBe(2000);
    expect(result.goals.monthlyProfit).toBe(200);
  });

  it("goals.save rejects negative values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.goals.save({
        weeklyRevenue: -100,
        weeklyProfit: 50,
        monthlyRevenue: 2000,
        monthlyProfit: 200,
      })
    ).rejects.toThrow();
  });

  it("goals.save accepts zero values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.goals.save({
      weeklyRevenue: 0,
      weeklyProfit: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
    });

    expect(result.success).toBe(true);
  });
});
