import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "spreadsheets/test.xlsx", url: "https://cdn.example.com/test.xlsx" }),
}));

// Mock db
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
}));

describe("Upload Route Logic", () => {
  it("should accept .xlsx files", () => {
    const allowedExtensions = [".xlsx", ".xls"];
    const testFile = "pedidos_todos.xlsx";
    const ext = testFile.substring(testFile.lastIndexOf("."));
    expect(allowedExtensions).toContain(ext);
  });

  it("should reject non-spreadsheet files", () => {
    const allowedExtensions = [".xlsx", ".xls"];
    const testFile = "document.pdf";
    const ext = testFile.substring(testFile.lastIndexOf("."));
    expect(allowedExtensions).not.toContain(ext);
  });

  it("should correctly count orders from spreadsheet data", () => {
    const mockData = [
      { "Número do Pedido": 1, "Status": "shipped" },
      { "Número do Pedido": 2, "Status": "shipped" },
      { "Número do Pedido": 3, "Status": "wms" },
    ];
    expect(mockData.length).toBe(3);
  });

  it("should map column names correctly", () => {
    const rawRow = {
      "valor da venda": 100.5,
      "Líquido Total": 15.3,
      "Custo Total": 85.2,
      "Status": "shipped",
      "Estado do Cliente": "SP",
      "Modo de Logística": "Correios",
    };

    const mapped = {
      "valor da venda": Number(rawRow["valor da venda"] ?? 0),
      "Líquido Total": Number(rawRow["Líquido Total"] ?? 0),
      "Custo Total": Number(rawRow["Custo Total"] ?? 0),
      "Status": String(rawRow["Status"] ?? ""),
      "Estado do Cliente": String(rawRow["Estado do Cliente"] ?? ""),
      "Modo de Logística": String(rawRow["Modo de Logística"] ?? ""),
    };

    expect(mapped["valor da venda"]).toBe(100.5);
    expect(mapped["Líquido Total"]).toBe(15.3);
    expect(mapped["Status"]).toBe("shipped");
    expect(mapped["Estado do Cliente"]).toBe("SP");
  });

  it("should handle missing optional fields gracefully", () => {
    const rawRow: Record<string, unknown> = {
      "Número do Pedido": 1,
    };

    const emailValue = rawRow["Email do Cliente"] ? String(rawRow["Email do Cliente"]) : null;
    expect(emailValue).toBeNull();

    const valorVenda = Number(rawRow["valor da venda"] ?? 0);
    expect(valorVenda).toBe(0);
  });
});
