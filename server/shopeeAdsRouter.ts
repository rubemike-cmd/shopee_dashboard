import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { shopeeAdsData, shopeeAdsUploads, InsertShopeeAdsData } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { parseShopeeAdsRow, validateShopeeAdsHeaders } from "./shopeeAdsValidator";
import Papa from "papaparse";

export const shopeeAdsRouter = router({
  /**
   * Upload e processamento de arquivo CSV de Shopee Ads
   */
  uploadReport: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(), // CSV content as string
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Remove metadata lines from Shopee CSV (lines before actual headers)
        const lines = input.content.split('\n');
        let dataStartIndex = 0;
        
        // Find the line with actual headers (contains '#' column)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('#') && lines[i].includes('Nome do Anúncio')) {
            dataStartIndex = i;
            break;
          }
        }
        
        const csvContent = lines.slice(dataStartIndex).join('\n');
        
        // Parse CSV
        const parseResult = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
        });

        if (parseResult.errors.length > 0) {
          throw new Error(`CSV parsing error: ${parseResult.errors[0]?.message}`);
        }

        const rows = parseResult.data as Record<string, string>[];
        if (rows.length === 0) {
          throw new Error("CSV file is empty");
        }

        // Validate headers
        const headers = Object.keys(rows[0] || {});
        const validation = validateShopeeAdsHeaders(headers);

        if (!validation.isValid) {
          return {
            success: false,
            validation,
            data: null,
          };
        }

        // Extract period from filename or first row
        let periodStart = '';
        let periodEnd = '';
        const periodMatch = input.filename.match(/(\d{2}_\d{2}_\d{4})-(\d{2}_\d{2}_\d{4})/);
        if (periodMatch) {
          periodStart = periodMatch[1].replace(/_/g, '/');
          periodEnd = periodMatch[2].replace(/_/g, '/');
        }

        // Insert upload record
        const uploadResult = await db.insert(shopeeAdsUploads).values({
          filename: input.filename,
          fileKey: `shopee-ads/${Date.now()}-${input.filename}`,
          fileUrl: `s3://shopee-ads/${Date.now()}-${input.filename}`,
          fileSize: input.fileSize,
          totalAds: rows.length,
          periodStart,
          periodEnd,
        });

        const uploadId = uploadResult[0]?.insertId as number;

        // Parse and insert ad data
        const adsData = rows
          .map((row) => {
            try {
              const parsed = parseShopeeAdsRow(row);
              return {
                uploadId,
                adNumber: parsed.adNumber || 0,
                adName: parsed.adName || "",
                status: parsed.status || "",
                adType: parsed.adType || "",
                productId: parsed.productId || "",
                bidMethod: parsed.bidMethod || "",
                placement: parsed.placement || "",
                keyword: parsed.keyword || "",
                combinationType: parsed.combinationType || "",
                startDate: parsed.startDate || "",
                endDate: parsed.endDate || "",
                impressions: parsed.impressions || 0,
                clicks: parsed.clicks || 0,
                ctr: parsed.ctr || 0,
                conversions: parsed.conversions || 0,
                directConversions: parsed.directConversions || 0,
                conversionRate: parsed.conversionRate || 0,
                directConversionRate: parsed.directConversionRate || 0,
                costPerConversion: parsed.costPerConversion || 0,
                costPerDirectConversion: parsed.costPerDirectConversion || 0,
                itemsSold: parsed.itemsSold || 0,
                directItemsSold: parsed.directItemsSold || 0,
                gmv: parsed.gmv || 0,
                directRevenue: parsed.directRevenue || 0,
                spend: parsed.spend || 0,
                roas: parsed.roas || 0,
                directRoas: parsed.directRoas || 0,
                acos: parsed.acos || 0,
                directAcos: parsed.directAcos || 0,
              } as InsertShopeeAdsData;
            } catch (error) {
              console.error("Error parsing row:", error);
              return null;
            }
          })
          .filter((ad) => ad !== null) as InsertShopeeAdsData[];

        if (adsData.length > 0) {
          await db.insert(shopeeAdsData).values(adsData);
        }

        return {
          success: true,
          validation,
          data: {
            uploadId,
            totalAds: adsData.length,
            periodStart,
            periodEnd,
          },
        };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    }),

  /**
   * Get latest Shopee Ads upload
   */
  getLatestUpload: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(shopeeAdsUploads)
      .orderBy(shopeeAdsUploads.uploadedAt)
      .limit(1);

    return result[0] || null;
  }),

  /**
   * Get all ads data from latest upload
   */
  getLatestAdsData: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Get latest upload
    const latestUpload = await db
      .select()
      .from(shopeeAdsUploads)
      .orderBy(shopeeAdsUploads.uploadedAt)
      .limit(1);

    if (!latestUpload[0]) return [];

    // Get all ads from that upload
    const ads = await db
      .select()
      .from(shopeeAdsData)
      .where(eq(shopeeAdsData.uploadId, latestUpload[0]!.id));

    return ads;
  }),

  /**
   * Delete upload and associated data
   */
  deleteUpload: protectedProcedure
    .input(z.object({ uploadId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete ads data first
      await db.delete(shopeeAdsData).where(eq(shopeeAdsData.uploadId, input.uploadId));

      // Delete upload record
      await db.delete(shopeeAdsUploads).where(eq(shopeeAdsUploads.id, input.uploadId));

      return { success: true };
    }),
});
