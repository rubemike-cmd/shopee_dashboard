import { describe, it, expect } from "vitest";
import { validateSpreadsheetColumns } from "./spreadsheetValidator";

// Colunas exatas da planilha real de pedidos Shopee
const VALID_COLUMNS = [
  "Número do Pedido",
  "Número do Pedido no Canal",
  "Cliente",
  "Email do Cliente",
  "Telefone do Cliente",
  "Endereço do Cliente",
  "Cidade do Cliente",
  "Estado do Cliente",
  "CEP do Cliente",
  "Canal",
  "Empresa",
  "Status",
  "Custo Total",
  "valor da venda",
  "Líquido Total",
  "Modo de Logística",
  "Produtos",
  "Data de Criação",
  "Data de Atualização",
];

describe("validateSpreadsheetColumns", () => {
  it("deve aprovar uma planilha com todas as colunas obrigatórias", () => {
    const result = validateSpreadsheetColumns(VALID_COLUMNS);
    expect(result.valid).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });

  it("deve rejeitar planilha sem colunas obrigatórias", () => {
    const result = validateSpreadsheetColumns(["Nome", "Valor", "Data"]);
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThan(0);
  });

  it("deve detectar coluna 'Status' ausente", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "Status");
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(false);
    expect(result.missingRequired).toContain("Status");
  });

  it("deve detectar coluna 'valor da venda' ausente", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "valor da venda");
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(false);
    expect(result.missingRequired).toContain("valor da venda");
  });

  it("deve detectar coluna 'Líquido Total' ausente", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "Líquido Total");
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(false);
    expect(result.missingRequired).toContain("Líquido Total");
  });

  it("deve aceitar alias 'Lucro Total' como substituto de 'Líquido Total'", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "Líquido Total").concat(["Lucro Total"]);
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true);
    expect(result.missingRequired).not.toContain("Líquido Total");
  });

  it("deve aceitar alias 'Valor Total' como substituto de 'valor da venda'", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "valor da venda").concat(["Valor Total"]);
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true);
    expect(result.missingRequired).not.toContain("valor da venda");
  });

  it("deve aceitar nomes sem acentos como alias válido", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "Número do Pedido").concat(["Numero do Pedido"]);
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true);
  });

  it("deve aceitar nomes com capitalização diferente", () => {
    const cols = VALID_COLUMNS.filter(c => c !== "Status").concat(["status"]);
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true);
  });

  it("deve identificar colunas não reconhecidas", () => {
    const cols = [...VALID_COLUMNS, "Coluna Desconhecida", "Campo Extra"];
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true);
    expect(result.unrecognized).toContain("Coluna Desconhecida");
    expect(result.unrecognized).toContain("Campo Extra");
  });

  it("deve gerar aviso para colunas opcionais ausentes", () => {
    // Remove colunas opcionais como 'Cliente' e 'Cidade do Cliente'
    const cols = VALID_COLUMNS.filter(c => c !== "Cliente" && c !== "Cidade do Cliente");
    const result = validateSpreadsheetColumns(cols);
    expect(result.valid).toBe(true); // Ainda válido pois são opcionais
    expect(result.missingOptional).toContain("Cliente");
  });

  it("deve retornar mapeamento de colunas encontradas", () => {
    const result = validateSpreadsheetColumns(VALID_COLUMNS);
    expect(result.columnMapping).toBeDefined();
    expect(Object.keys(result.columnMapping).length).toBeGreaterThan(0);
  });

  it("deve rejeitar planilha completamente vazia de colunas", () => {
    const result = validateSpreadsheetColumns([]);
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThan(0);
  });

  it("deve listar múltiplas colunas obrigatórias ausentes ao mesmo tempo", () => {
    const result = validateSpreadsheetColumns(["Coluna Aleatória"]);
    expect(result.valid).toBe(false);
    expect(result.missingRequired.length).toBeGreaterThanOrEqual(5);
  });
});
