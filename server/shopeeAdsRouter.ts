import { router, protectedProcedure } from "./_core/trpc";
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
        // Remove BOM if present and normalize line endings
        let content = input.content;
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        content = content.replace(/\r\n/g, '\n');
        
        // Remove metadata lines from Shopee CSV (lines before actual headers)
        const lines = content.split('\n');
        let dataStartIndex = 0;
        
        // Find the line with actual headers (contains '#' column)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#') || (line.includes('#') && line.toLowerCase().includes('nome'))) {
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
                ...parsed,
              } as InsertShopeeAdsData;
            } catch (error) {
              console.error("Error parsing row:", error);
              return null;
            }
          })
          .filter((row) => row !== null) as InsertShopeeAdsData[];

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
        console.error("Upload error:", error);
        throw error;
      }
    }),

  /**
   * Get latest upload metadata
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
   * Get latest ads data
   */
  getLatestAdsData: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const latestUpload = await db
      .select()
      .from(shopeeAdsUploads)
      .orderBy(shopeeAdsUploads.uploadedAt)
      .limit(1);

    if (!latestUpload[0]) return [];

    const ads = await db
      .select()
      .from(shopeeAdsData)
      .where(eq(shopeeAdsData.uploadId, latestUpload[0].id));

    return ads;
  }),

  /**
   * Delete upload and associated ads
   */
  deleteUpload: protectedProcedure
    .input(z.object({ uploadId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(shopeeAdsData).where(eq(shopeeAdsData.uploadId, input.uploadId));
      await db.delete(shopeeAdsUploads).where(eq(shopeeAdsUploads.id, input.uploadId));

      return { success: true };
    }),
});
