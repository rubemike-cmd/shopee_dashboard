import { useMemo } from 'react';

export interface ProjectionPeriod {
  label: string;
  days: number;
}

export interface ProjectedDataPoint {
  date: string;
  revenue: number;
  profit: number;
  isProjected: boolean;
  confidence?: number;
}

export interface ProjectionMetrics {
  averageDaily: number;
  volatility: number;
  trend: number;
  hasSignificantFluctuation: boolean;
}

const PROJECTION_PERIODS: ProjectionPeriod[] = [
  { label: 'Próximos 7 dias', days: 7 },
  { label: 'Próximos 15 dias', days: 15 },
  { label: 'Próximos 30 dias', days: 30 },
  { label: 'Próximos 60 dias', days: 60 },
  { label: 'Próximos 90 dias', days: 90 },
  { label: 'Próximos 12 meses', days: 365 },
];

/**
 * Calcula a média móvel ponderada dos últimos N dias
 */
function calculateWeightedMovingAverage(data: number[], windowSize: number = 7): number {
  if (data.length === 0) return 0;
  
  const recentData = data.slice(-windowSize);
  const weights = Array.from({ length: recentData.length }, (_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  const weighted = recentData.reduce((sum, val, i) => sum + val * weights[i], 0);
  return weighted / totalWeight;
}

/**
 * Calcula a volatilidade (desvio padrão) dos dados
 */
function calculateVolatility(data: number[]): number {
  if (data.length < 2) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Calcula a tendência linear dos dados
 */
function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Detecta flutuações significativas nos dados
 */
function hasSignificantFluctuation(data: number[], volatility: number, mean: number): boolean {
  if (mean === 0) return false;
  
  // Coeficiente de variação > 30% indica flutuação significativa
  const coefficientOfVariation = (volatility / mean) * 100;
  return coefficientOfVariation > 30;
}

/**
 * Adiciona dias a uma data de forma segura
 */
function addDays(dateStr: string, days: number): string {
  try {
    // Parse a data no formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', dateStr);
      return '';
    }
    
    date.setDate(date.getDate() + days);
    
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    
    return `${newYear}-${newMonth}-${newDay}`;
  } catch (error) {
    console.error('Erro ao adicionar dias:', error);
    return '';
  }
}

/**
 * Hook para calcular projeção de receita futura
 */
export function useRevenueProjection(
  historicalData: Array<{ date: string; revenue: number; profit: number }>,
  selectedPeriodDays: number = 7
) {
  const projectionMetrics = useMemo((): ProjectionMetrics => {
    if (historicalData.length === 0) {
      return {
        averageDaily: 0,
        volatility: 0,
        trend: 0,
        hasSignificantFluctuation: false,
      };
    }

    const revenues = historicalData.map(d => d.revenue);
    const avgDaily = calculateWeightedMovingAverage(revenues, Math.min(7, revenues.length));
    const volatility = calculateVolatility(revenues);
    const trend = calculateTrend(revenues);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    return {
      averageDaily: avgDaily,
      volatility,
      trend,
      hasSignificantFluctuation: hasSignificantFluctuation(revenues, volatility, mean),
    };
  }, [historicalData]);

  const projectedData = useMemo((): ProjectedDataPoint[] => {
    if (historicalData.length === 0) return [];

    const lastDateStr = historicalData[historicalData.length - 1].date;
    const revenues = historicalData.map(d => d.revenue);
    const profits = historicalData.map(d => d.profit);
    
    const avgRevenue = projectionMetrics.averageDaily;
    const avgProfit = calculateWeightedMovingAverage(profits, Math.min(7, profits.length));
    const trend = projectionMetrics.trend;
    const volatility = projectionMetrics.volatility;
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    // Normalizar volatilidade para aplicar como fator de confiança
    const volatilityFactor = Math.max(0, 1 - (volatility / (mean || 1)) * 0.5);
    const confidence = Math.max(0.5, Math.min(1, volatilityFactor));

    const projected: ProjectedDataPoint[] = [];

    for (let i = 1; i <= selectedPeriodDays; i++) {
      const projectedDate = addDays(lastDateStr, i);
      
      if (!projectedDate) {
        console.error('Falha ao gerar data projetada para dia', i);
        continue;
      }

      // Aplicar tendência linear ao valor projetado
      const trendAdjustment = trend * i;
      
      // Adicionar variação aleatória baseada na volatilidade histórica
      const randomFactor = (Math.random() - 0.5) * 2 * volatility;
      
      const projectedRevenue = Math.max(0, avgRevenue + trendAdjustment + randomFactor);
      const profitRatio = mean > 0 ? (profits.reduce((a, b) => a + b, 0) / revenues.reduce((a, b) => a + b, 0)) : 0;
      const projectedProfit = projectedRevenue * profitRatio;

      projected.push({
        date: projectedDate,
        revenue: projectedRevenue,
        profit: projectedProfit,
        isProjected: true,
        confidence,
      });
    }

    return projected;
  }, [historicalData, selectedPeriodDays, projectionMetrics]);

  return {
    projectionMetrics,
    projectedData,
    projectionPeriods: PROJECTION_PERIODS,
  };
}
