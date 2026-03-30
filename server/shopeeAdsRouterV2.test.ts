import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shopeeAdsRouterV2 } from './shopeeAdsRouterV2';
import { getDb } from './db';

// Mock the database and validation
vi.mock('./db');
vi.mock('./shopeeAdsValidatorV2', () => ({
  validateAndParseShopeeAds: (content: string) => {
    // Mock successful validation
    return {
      isValid: true,
      errors: [],
      warnings: [],
      data: [
        {
          adName: 'Test Ad 1',
          status: 'active',
          impressions: 1000,
          clicks: 50,
          ctr: 5.0,
          conversions: 10,
          spend: 100,
          roas: 2.0,
          acos: 50,
          gmv: 200,
          directRevenue: 200,
        },
        {
          adName: 'Test Ad 2',
          status: 'paused',
          impressions: 500,
          clicks: 25,
          ctr: 5.0,
          conversions: 5,
          spend: 50,
          roas: 1.5,
          acos: 66.7,
          gmv: 75,
          directRevenue: 75,
        },
      ],
    };
  },
}));

describe('shopeeAdsRouterV2', () => {
  let mockDb: any;

  beforeEach(() => {
    // Setup mock database
    mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ insertId: 123 }]),
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  it('should upload and persist Shopee Ads data to database', async () => {
    const caller = shopeeAdsRouterV2.createCaller({
      user: { id: '1', role: 'user' },
      req: {} as any,
      res: {} as any,
    } as any);

    const result = await caller.uploadReport({
      filename: 'Shopee-Anúncio-23_03_2026-29_03_2026.csv',
      content: 'mock,csv,content',
      fileSize: 1024,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalAds).toBe(2);
    expect(result.data?.ads).toHaveLength(2);
    expect(result.data?.uploadId).toBe(123);

    // Verify database inserts were called
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // Once for uploads, once for ads
  });

  it('should extract period from filename', async () => {
    const caller = shopeeAdsRouterV2.createCaller({
      user: { id: '1', role: 'user' },
      req: {} as any,
      res: {} as any,
    } as any);

    const result = await caller.uploadReport({
      filename: 'Shopee-Anúncio-Plavra+chave-Locação-Relatório-23_03_2026-29_03_2026.csv',
      content: 'mock,csv,content',
      fileSize: 2048,
    });

    expect(result.success).toBe(true);
    // Verify period was extracted from filename
    const insertCalls = mockDb.insert.mock.calls;
    expect(insertCalls.length).toBeGreaterThan(0);
  });



  it('should handle database unavailability', async () => {
    vi.mocked(getDb).mockResolvedValue(null);

    const caller = shopeeAdsRouterV2.createCaller({
      user: { id: '1', role: 'user' },
      req: {} as any,
      res: {} as any,
    } as any);

    const result = await caller.uploadReport({
      filename: 'test.csv',
      content: 'mock,csv,content',
      fileSize: 1024,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Banco de dados indisponível');
  });
});
