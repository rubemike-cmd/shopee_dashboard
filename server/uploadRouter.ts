import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { spreadsheetUploads } from "../drizzle/schema";
import { validateSpreadsheetColumns } from "./spreadsheetValidator";

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
