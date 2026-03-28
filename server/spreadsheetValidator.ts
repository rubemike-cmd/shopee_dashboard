/**
 * Validação de colunas da planilha de pedidos Shopee.
 * Define colunas obrigatórias, opcionais e mapeamentos alternativos de nomes.
 */

export interface ColumnDefinition {
  canonical: string;         // Nome canônico esperado
  aliases: string[];         // Nomes alternativos aceitos
  required: boolean;         // Se a coluna é obrigatória
  description: string;       // Descrição para exibição ao usuário
}

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    canonical: 'Número do Pedido',
    aliases: ['Numero do Pedido', 'Order ID', 'ID do Pedido'],
    required: true,
    description: 'Identificador único do pedido',
  },
  {
    canonical: 'Status',
    aliases: ['status', 'Status do Pedido'],
    required: true,
    description: 'Status atual do pedido (ex: shipped, wms)',
  },
  {
    canonical: 'valor da venda',
    aliases: ['Valor da Venda', 'Valor Total', 'Receita', 'Revenue'],
    required: true,
    description: 'Valor total da venda',
  },
  {
    canonical: 'Líquido Total',
    aliases: ['Liquido Total', 'Lucro Total', 'Lucro Líquido', 'Lucro Liquido', 'Net Total'],
    required: true,
    description: 'Lucro líquido do pedido',
  },
  {
    canonical: 'Custo Total',
    aliases: ['Custo', 'Cost', 'Total Cost'],
    required: true,
    description: 'Custo total do pedido',
  },
  {
    canonical: 'Estado do Cliente',
    aliases: ['Estado', 'UF', 'State'],
    required: true,
    description: 'Estado (UF) do cliente',
  },
  {
    canonical: 'Modo de Logística',
    aliases: ['Modo de Logistica', 'Logística', 'Logistica', 'Shipping', 'Frete'],
    required: true,
    description: 'Modalidade de envio (ex: Correios, Shopee Xpress)',
  },
  {
    canonical: 'Data de Criação',
    aliases: ['Data de Criacao', 'Data Criação', 'Data Criacao', 'Created At', 'Data do Pedido'],
    required: true,
    description: 'Data de criação do pedido',
  },
  {
    canonical: 'Produtos',
    aliases: ['Produto', 'Items', 'Itens', 'Product'],
    required: true,
    description: 'Produtos do pedido',
  },
  {
    canonical: 'Cliente',
    aliases: ['Nome do Cliente', 'Customer', 'Buyer'],
    required: false,
    description: 'Nome do cliente',
  },
  {
    canonical: 'Cidade do Cliente',
    aliases: ['Cidade', 'City'],
    required: false,
    description: 'Cidade do cliente',
  },
  {
    canonical: 'Modo de Logística',
    aliases: ['Modo de Logistica', 'Logística', 'Logistica'],
    required: false,
    description: 'Modo de logística',
  },
];

export interface ValidationResult {
  valid: boolean;
  missingRequired: string[];       // Colunas obrigatórias ausentes
  missingOptional: string[];       // Colunas opcionais ausentes
  unrecognized: string[];          // Colunas não reconhecidas
  columnMapping: Record<string, string>; // mapeamento: nome_original -> canonical
  warnings: string[];              // Avisos não bloqueantes
}

/**
 * Normaliza um nome de coluna para comparação (remove acentos, espaços extras, lowercase)
 */
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Valida as colunas de uma planilha e retorna o resultado detalhado.
 */
export function validateSpreadsheetColumns(
  sheetColumns: string[]
): ValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const columnMapping: Record<string, string> = {};

  // Normaliza as colunas da planilha para comparação
  const normalizedSheet = sheetColumns.map(c => ({ original: c, normalized: normalize(c) }));

  // Deduplica definições por canonical
  const seen = new Set<string>();
  const uniqueDefs = COLUMN_DEFINITIONS.filter(def => {
    if (seen.has(def.canonical)) return false;
    seen.add(def.canonical);
    return true;
  });

  for (const def of uniqueDefs) {
    // Todos os nomes possíveis para esta coluna
    const allNames = [def.canonical, ...def.aliases].map(n => normalize(n));

    // Tenta encontrar na planilha
    const match = normalizedSheet.find(col => allNames.includes(col.normalized));

    if (match) {
      columnMapping[match.original] = def.canonical;
    } else {
      if (def.required) {
        missingRequired.push(def.canonical);
      } else {
        missingOptional.push(def.canonical);
      }
    }
  }

  // Colunas não reconhecidas (não mapeadas para nenhuma definição)
  const mappedOriginals = new Set(Object.keys(columnMapping));
  const unrecognized = sheetColumns.filter(c => !mappedOriginals.has(c));

  const warnings: string[] = [];
  if (missingOptional.length > 0) {
    warnings.push(
      `Colunas opcionais ausentes: ${missingOptional.join(', ')}. Alguns recursos podem ter dados incompletos.`
    );
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    unrecognized,
    columnMapping,
    warnings,
  };
}
