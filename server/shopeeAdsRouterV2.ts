import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { validateAndParseShopeeAds } from "./shopeeAdsValidatorV2";

export const shopeeAdsRouterV2 = router({
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
          },
        };
      } catch (error) {
        return {
          success: false,
          errors: [`Erro ao processar arquivo: ${String(error)}`],
          warnings: [],
          data: null,
        };
      }
    }),
});
