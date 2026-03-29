/**
 * Validador V2 para arquivos CSV de Shopee Ads
 * Mais flexível e tolerante a variações de formato
 */

export interface ShopeeAdsRowV2 {
  adNumber: number | string;
  adName: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  gmv: number;
  roas: number;
  acos: number;
  [key: string]: any; // Allow extra fields
}

export interface ValidationResultV2 {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: ShopeeAdsRowV2[];
}

/**
 * Colunas críticas que devem estar presentes
 */
const CRITICAL_COLUMNS = ['#', 'Nome do Anúncio', 'Status'];

/**
 * Mapeamento flexível de colunas esperadas
 */
const COLUMN_MAPPING: Record<string, string[]> = {
  adNumber: ['#', 'número', 'numero', 'ad number'],
  adName: ['nome do anúncio', 'nome', 'anúncio', 'ad name'],
  status: ['status'],
  impressions: ['impressões', 'impressoes', 'impressions', 'impr'],
  clicks: ['cliques', 'clicks', 'clique'],
  conversions: ['conversões', 'conversoes', 'conversions'],
  spend: ['despesas', 'spend', 'custo', 'cost'],
  gmv: ['gmv', 'receita', 'revenue'],
  roas: ['roas'],
  acos: ['acos'],
};

/**
 * Encontra a coluna no header baseado em mapeamento flexível
 */
function findColumn(headers: string[], targets: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const target of targets) {
    const idx = lowerHeaders.findIndex(h => 
      h === target.toLowerCase() || 
      h.includes(target.toLowerCase())
    );
    if (idx !== -1) return headers[idx];
  }
  
  return null;
}

/**
 * Valida e parseia o CSV de Shopee Ads
 */
export function validateAndParseShopeeAds(
  csvContent: string
): ValidationResultV2 {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: ShopeeAdsRowV2[] = [];

  try {
    // Normalizar conteúdo
    let content = csvContent;
    
    // Remover BOM se presente
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Normalizar line endings
    content = content.replace(/\r\n/g, '\n');
    
    // Dividir em linhas
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      errors.push('Arquivo vazio ou sem dados');
      return { isValid: false, errors, warnings, data };
    }
    
    // Encontrar linha de header (contém '#' ou 'Nome do Anúncio')
    let headerLineIndex = -1;
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('#') || line.includes('nome do an')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      errors.push('Não foi encontrada linha de header no arquivo');
      return { isValid: false, errors, warnings, data };
    }
    
    // Parsear header
    const headerLine = lines[headerLineIndex];
    const headers = headerLine.split(',').map(h => h.trim());
    
    // Verificar colunas críticas
    const criticalFound = CRITICAL_COLUMNS.filter(col => 
      headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
    );
    
    if (criticalFound.length < 2) {
      errors.push(`Colunas críticas ausentes. Encontradas: ${criticalFound.join(', ')}`);
      return { isValid: false, errors, warnings, data };
    }
    
    // Mapear colunas
    const columnMap: Record<string, number> = {};
    for (const [fieldName, targets] of Object.entries(COLUMN_MAPPING)) {
      const col = findColumn(headers, targets);
      if (col) {
        columnMap[fieldName] = headers.indexOf(col);
      }
    }
    
    // Parsear dados
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      
      try {
        const row: ShopeeAdsRowV2 = {
          adNumber: values[columnMap.adNumber] || '',
          adName: values[columnMap.adName] || '',
          status: values[columnMap.status] || '',
          impressions: parseInt(values[columnMap.impressions] || '0') || 0,
          clicks: parseInt(values[columnMap.clicks] || '0') || 0,
          conversions: parseInt(values[columnMap.conversions] || '0') || 0,
          spend: parseFloat(values[columnMap.spend]?.replace(/[^\d.-]/g, '') || '0') || 0,
          gmv: parseFloat(values[columnMap.gmv]?.replace(/[^\d.-]/g, '') || '0') || 0,
          roas: parseFloat(values[columnMap.roas]?.replace(/[%]/g, '') || '0') || 0,
          acos: parseFloat(values[columnMap.acos]?.replace(/[%]/g, '') || '0') || 0,
        };
        
        // Validar se tem dados mínimos
        if (row.adName && row.status) {
          data.push(row);
        }
      } catch (e) {
        warnings.push(`Erro ao parsear linha ${i}: ${String(e)}`);
      }
    }
    
    if (data.length === 0) {
      errors.push('Nenhum dado válido foi encontrado no arquivo');
      return { isValid: false, errors, warnings, data };
    }
    
    return {
      isValid: true,
      errors,
      warnings,
      data,
    };
  } catch (error) {
    errors.push(`Erro ao processar arquivo: ${String(error)}`);
    return { isValid: false, errors, warnings, data };
  }
}
