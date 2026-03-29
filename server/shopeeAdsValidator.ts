/**
 * Validador e parser para arquivos CSV de Shopee Ads
 * Verifica colunas obrigatórias e converte dados para o formato esperado
 */

export interface ShopeeAdsRow {
  adNumber: number;
  adName: string;
  status: string;
  adType: string;
  productId: string;
  bidMethod: string;
  placement: string;
  keyword: string;
  combinationType: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  directConversions: number;
  conversionRate: number;
  directConversionRate: number;
  costPerConversion: number;
  costPerDirectConversion: number;
  itemsSold: number;
  directItemsSold: number;
  gmv: number;
  directRevenue: number;
  spend: number;
  roas: number;
  directRoas: number;
  acos: number;
  directAcos: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  foundColumns: string[];
  missingColumns: string[];
}

// Colunas obrigatórias esperadas no CSV
const REQUIRED_COLUMNS = [
  '#',
  'Nome do Anúncio',
  'Status',
  'Tipos de Anúncios',
  'ID do produto',
  'Método de Lance',
  'Posicionamento',
  'Palavra-chave/Localização',
  'Tipo de combinação',
  'Data de Início',
  'Data de Encerramento',
  'Impressões',
  'Cliques',
  'CTR',
  'Conversões',
  'Conversões Diretas',
  'Taxa de Conversão',
  'Taxa de Conversão Direta',
  'Custo por Conversão',
  'Custo por Conversão Direta',
  'Itens Vendidos',
  'Itens Vendidos Diretos',
  'GMV',
  'Receita direta',
  'Despesas',
  'ROAS',
  'ROAS Direto',
  'ACOS',
  'ACOS Direto',
];

export function validateShopeeAdsHeaders(headers: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const foundColumns: string[] = [];
  const missingColumns: string[] = [];

  // Filter out empty headers (from metadata rows)
  const filteredHeaders = headers.filter(h => h && h.trim().length > 0);
  
  // Normalize headers
  const normalizedHeaders = filteredHeaders.map(h => h.trim());

  // Check for required columns (case-insensitive)
  for (const required of REQUIRED_COLUMNS) {
    const found = normalizedHeaders.some(h => h.toLowerCase() === required.toLowerCase());
    if (found) {
      foundColumns.push(required);
    } else {
      missingColumns.push(required);
    }
  }

  // Determine severity
  if (missingColumns.length > 0) {
    errors.push(
      `Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    foundColumns,
    missingColumns,
  };
}

export function parsePercentage(value: string): number {
  if (!value || value === '-') return 0;
  const cleaned = value.toString().replace('%', '').trim();
  return parseFloat(cleaned) || 0;
}

export function parseCurrency(value: string | number): number {
  if (!value || value === '-') return 0;
  const cleaned = value.toString().replace(/[^\d.-]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

export function parseInteger(value: string | number): number {
  if (!value || value === '-') return 0;
  const cleaned = value.toString().replace(/[^\d-]/g, '').trim();
  return parseInt(cleaned, 10) || 0;
}

export function parseShopeeAdsRow(row: Record<string, string>): ShopeeAdsRow {
  return {
    adNumber: parseInteger(row['#']),
    adName: row['Nome do Anúncio'] || '',
    status: row['Status'] || '',
    adType: row['Tipos de Anúncios'] || '',
    productId: row['ID do produto'] || '',
    bidMethod: row['Método de Lance'] || '',
    placement: row['Posicionamento'] || '',
    keyword: row['Palavra-chave/Localização'] || '',
    combinationType: row['Tipo de combinação'] || '',
    startDate: row['Data de Início'] || '',
    endDate: row['Data de Encerramento'] || '',
    impressions: parseInteger(row['Impressões']),
    clicks: parseInteger(row['Cliques']),
    ctr: parsePercentage(row['CTR']),
    conversions: parseInteger(row['Conversões']),
    directConversions: parseInteger(row['Conversões Diretas']),
    conversionRate: parsePercentage(row['Taxa de Conversão']),
    directConversionRate: parsePercentage(row['Taxa de Conversão Direta']),
    costPerConversion: parseCurrency(row['Custo por Conversão']),
    costPerDirectConversion: parseCurrency(row['Custo por Conversão Direta']),
    itemsSold: parseInteger(row['Itens Vendidos']),
    directItemsSold: parseInteger(row['Itens Vendidos Diretos']),
    gmv: parseCurrency(row['GMV']),
    directRevenue: parseCurrency(row['Receita direta']),
    spend: parseCurrency(row['Despesas']),
    roas: parseFloat(row['ROAS']) || 0,
    directRoas: parseFloat(row['ROAS Direto']) || 0,
    acos: parsePercentage(row['ACOS']),
    directAcos: parsePercentage(row['ACOS Direto']),
  };
}
