import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { validateAndParseShopeeAds } from "./shopeeAdsValidatorV2";
import { getDb } from "./db";
import { shopeeAdsData, shopeeAdsUploads, InsertShopeeAdsData } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const shopeeAdsRouterV2 = router({
  /**
   * Listar todos os uploads de Shopee Ads com histórico
   */
  listUploads: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) {
        return { success: false, data: [] };
      }
      
      try {
        const uploads = await db
          .select()
          .from(shopeeAdsUploads)
          .orderBy((t) => t.uploadedAt)
          .limit(10);
        
        // Sort in descending order (most recent first)
        uploads.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        
        return {
          success: true,
          data: uploads,
        };
      } catch (error) {
        console.error("Error listing uploads:", error);
        return { success: false, data: [] };
      }
    }),

  /**
   * Upload e processamento de arquivo CSV de Shopee Ads
   */
  uploadReport: protectedProcedure
    .input(
      z.object({
        filename: z.string(),
        content: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          success: false,
          errors: ["Banco de dados indisponível"],
          warnings: [],
          data: null,
        };
      }

      try {
        // Validar e parsear
        const result = validateAndParseShopeeAds(input.content);
        
        if (!result.isValid) {
          return {
            success: false,
            errors: result.errors,
            warnings: result.warnings,
            data: null,
          };
        }
        
        // Extract period from filename
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
          totalAds: result.data.length,
          periodStart,
          periodEnd,
        });

        const uploadId = uploadResult[0]?.insertId as number;

        // Insert ad data
        const adsData = result.data.map((ad) => ({
          uploadId,
          ...ad,
        })) as InsertShopeeAdsData[];

        if (adsData.length > 0) {
          await db.insert(shopeeAdsData).values(adsData);
        }
        
        // Retornar dados parseados
        return {
          success: true,
          errors: result.errors,
          warnings: result.warnings,
          data: {
            filename: input.filename,
            fileSize: input.fileSize,
            totalAds: result.data.length,
            ads: result.data,
            uploadId,
          },
        };
      } catch (error) {
        console.error("Upload error:", error);
        return {
          success: false,
          errors: [`Erro ao processar arquivo: ${String(error)}`],
          warnings: [],
          data: null,
        };
      }
    }),
});
