import { describe, it, expect } from "vitest";
import {
  validateShopeeAdsHeaders,
  parsePercentage,
  parseCurrency,
  parseInteger,
  parseShopeeAdsRow,
} from "./shopeeAdsValidator";

describe("Shopee Ads Validator", () => {
  describe("validateShopeeAdsHeaders", () => {
    it("should validate correct headers", () => {
      const headers = [
        "#",
        "Nome do Anúncio",
        "Status",
        "Tipos de Anúncios",
        "ID do produto",
        "Método de Lance",
        "Posicionamento",
        "Palavra-chave/Localização",
        "Tipo de combinação",
        "Data de Início",
        "Data de Encerramento",
        "Impressões",
        "Cliques",
        "CTR",
        "Conversões",
        "Conversões Diretas",
        "Taxa de Conversão",
        "Taxa de Conversão Direta",
        "Custo por Conversão",
        "Custo por Conversão Direta",
        "Itens Vendidos",
        "Itens Vendidos Diretos",
        "GMV",
        "Receita direta",
        "Despesas",
        "ROAS",
        "ROAS Direto",
        "ACOS",
        "ACOS Direto",
      ];

      const result = validateShopeeAdsHeaders(headers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingColumns).toHaveLength(0);
    });

    it("should detect missing columns", () => {
      const headers = ["#", "Nome do Anúncio", "Status"];
      const result = validateShopeeAdsHeaders(headers);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingColumns.length).toBeGreaterThan(0);
    });
  });

  describe("parsePercentage", () => {
    it("should parse percentage correctly", () => {
      expect(parsePercentage("1.44%")).toBe(1.44);
      expect(parsePercentage("10%")).toBe(10);
      expect(parsePercentage("-")).toBe(0);
      expect(parsePercentage("")).toBe(0);
    });
  });

  describe("parseCurrency", () => {
    it("should parse currency correctly", () => {
      expect(parseCurrency("124.99")).toBe(124.99);
      expect(parseCurrency("1,234.56")).toBe(1234.56);
      expect(parseCurrency("-")).toBe(0);
      expect(parseCurrency("")).toBe(0);
    });

    it("should handle negative values", () => {
      expect(parseCurrency("-10.50")).toBe(-10.5);
    });
  });

  describe("parseInteger", () => {
    it("should parse integers correctly", () => {
      expect(parseInteger("28723")).toBe(28723);
      expect(parseInteger("415")).toBe(415);
      expect(parseInteger("-")).toBe(0);
      expect(parseInteger("")).toBe(0);
    });
  });

  describe("parseShopeeAdsRow", () => {
    it("should parse a valid ad row", () => {
      const row = {
        "#": "1",
        "Nome do Anúncio": "Test Ad",
        "Status": "Em Andamento",
        "Tipos de Anúncios": "Anúncio de Produto",
        "ID do produto": "123456",
        "Método de Lance": "GMV Max",
        "Posicionamento": "Todos",
        "Palavra-chave/Localização": "test",
        "Tipo de combinação": "Automático",
        "Data de Início": "2026-03-01",
        "Data de Encerramento": "Ilimitado",
        "Impressões": "1000",
        "Cliques": "50",
        "CTR": "5.00%",
        "Conversões": "10",
        "Conversões Diretas": "8",
        "Taxa de Conversão": "20.00%",
        "Taxa de Conversão Direta": "16.00%",
        "Custo por Conversão": "10.00",
        "Custo por Conversão Direta": "12.50",
        "Itens Vendidos": "10",
        "Itens Vendidos Diretos": "8",
        "GMV": "500.00",
        "Receita direta": "400.00",
        "Despesas": "100.00",
        "ROAS": "5.00",
        "ROAS Direto": "4.00",
        "ACOS": "20.00%",
        "ACOS Direto": "25.00%",
      };

      const parsed = parseShopeeAdsRow(row);
      expect(parsed.adNumber).toBe(1);
      expect(parsed.adName).toBe("Test Ad");
      expect(parsed.status).toBe("Em Andamento");
      expect(parsed.impressions).toBe(1000);
      expect(parsed.clicks).toBe(50);
      expect(parsed.ctr).toBe(5);
      expect(parsed.conversions).toBe(10);
      expect(parsed.spend).toBe(100);
      expect(parsed.gmv).toBe(500);
      expect(parsed.roas).toBe(5);
      expect(parsed.acos).toBe(20);
    });
  });
});
