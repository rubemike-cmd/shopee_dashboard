import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { spreadsheetUploads } from "../drizzle/schema";
import { validateSpreadsheetColumns } from "./spreadsheetValidator";
import { shopeeAdsUploads, shopeeAdsData } from "../drizzle/schema";
import { validateShopeeAdsHeaders, parseShopeeAdsRow } from "./shopeeAdsValidator";
import Papa from "papaparse";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos .xlsx e .xls são aceitos"));
    }
  },
});

export function registerUploadRoutes(app: express.Express) {
  app.post(
    "/api/upload/spreadsheet",
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }

        const fileBuffer = req.file.buffer;
        const filename = req.file.originalname;

        // Parse the Excel file to extract orders
        const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (rawData.length === 0) {
          return res.status(400).json({
            error: "A planilha está vazia. Nenhum pedido encontrado.",
            validation: { valid: false, missingRequired: [], missingOptional: [], unrecognized: [], columnMapping: {}, warnings: [] },
          });
        }

        // Validate columns
        const sheetColumns = Object.keys(rawData[0] as Record<string, unknown>);
        const validation = validateSpreadsheetColumns(sheetColumns);

        if (!validation.valid) {
          return res.status(422).json({
            error: `Planilha inválida: ${validation.missingRequired.length} coluna(s) obrigatória(s) ausente(s).`,
            validation,
          });
        }

        const totalOrders = rawData.length;

        // Upload to S3
        const fileKey = `spreadsheets/${nanoid()}-${filename}`;
        const { url: fileUrl } = await storagePut(
          fileKey,
          fileBuffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        // Save record to DB
        const db = await getDb();
        if (db) {
          await db.insert(spreadsheetUploads).values({
            filename,
            fileKey,
            fileUrl,
            fileSize: req.file.size,
            totalOrders,
          });
        }

        // Return the parsed data so the frontend can update the dashboard
        res.json({
          success: true,
          filename,
          fileUrl,
          totalOrders,
          data: rawData,
          validation,
        });
      } catch (err: any) {
        console.error("[Upload] Error:", err);
        res.status(500).json({ error: err.message || "Erro ao processar arquivo" });
      }
    }
  );

  // Shopee Ads CSV upload
  app.post("/api/upload/shopee-ads", express.json({ limit: "50mb" }), async (req, res) => {
    try {
      const { filename, content, fileSize } = req.body as { filename: string; content: string; fileSize: number };

      if (!filename || !content) {
        return res.status(400).json({ error: "Arquivo ou conteúdo ausente" });
      }

      // Parse CSV
      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ error: `Erro ao processar CSV: ${parseResult.errors[0]?.message}` });
      }

      const rows = parseResult.data as Record<string, string>[];
      if (rows.length === 0) {
        return res.status(400).json({ error: "Arquivo CSV vazio" });
      }

      // Validate headers
      const headers = Object.keys(rows[0] || {});
      const validation = validateShopeeAdsHeaders(headers);

      if (!validation.isValid) {
        return res.json({
          success: false,
          validation,
          data: null,
        });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Banco de dados indisponível" });
      }

      // Extract period from filename
      let periodStart = "";
      let periodEnd = "";
      const periodMatch = filename.match(/(\d{2}_\d{2}_\d{4})-(\d{2}_\d{2}_\d{4})/);
      if (periodMatch) {
        periodStart = periodMatch[1].replace(/_/g, "/");
        periodEnd = periodMatch[2].replace(/_/g, "/");
      }

      // Insert upload record
      const uploadResult = await db.insert(shopeeAdsUploads).values({
        filename,
        fileKey: `shopee-ads/${Date.now()}-${filename}`,
        fileUrl: `s3://shopee-ads/${Date.now()}-${filename}`,
        fileSize,
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
            };
          } catch (error) {
            console.error("Error parsing row:", error);
            return null;
          }
        })
        .filter((ad) => ad !== null);

      if (adsData.length > 0) {
        await db.insert(shopeeAdsData).values(adsData as any);
      }

      return res.json({
        success: true,
        validation,
        data: {
          uploadId,
          totalAds: adsData.length,
          periodStart,
          periodEnd,
        },
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get upload history
  app.get("/api/upload/history", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json({ uploads: [] });

      const uploads = await db
        .select()
        .from(spreadsheetUploads)
        .orderBy(spreadsheetUploads.uploadedAt);

      res.json({ uploads: uploads.reverse() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
