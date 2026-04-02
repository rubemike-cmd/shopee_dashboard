import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRevenueProjection } from './useRevenueProjection';

describe('useRevenueProjection', () => {
  it('should return empty projection for empty historical data', () => {
    const { result } = renderHook(() => useRevenueProjection([], 7));
    
    expect(result.current.projectedData).toEqual([]);
    expect(result.current.projectionMetrics.averageDaily).toBe(0);
  });

  it('should calculate projection metrics correctly', () => {
    const historicalData = [
      { date: '2026-03-01', revenue: 100, profit: 20 },
      { date: '2026-03-02', revenue: 120, profit: 24 },
      { date: '2026-03-03', revenue: 110, profit: 22 },
      { date: '2026-03-04', revenue: 130, profit: 26 },
      { date: '2026-03-05', revenue: 125, profit: 25 },
    ];

    const { result } = renderHook(() => useRevenueProjection(historicalData, 7));

    expect(result.current.projectionMetrics.averageDaily).toBeGreaterThan(0);
    expect(result.current.projectionMetrics.volatility).toBeGreaterThanOrEqual(0);
    expect(result.current.projectionMetrics.trend).toBeDefined();
  });

  it('should generate correct number of projected data points', () => {
    const historicalData = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      revenue: 100 + Math.random() * 50,
      profit: 20 + Math.random() * 10,
    }));

    const { result } = renderHook(() => useRevenueProjection(historicalData, 7));

    expect(result.current.projectedData.length).toBe(7);
    result.current.projectedData.forEach(point => {
      expect(point.isProjected).toBe(true);
      expect(point.revenue).toBeGreaterThanOrEqual(0);
      expect(point.profit).toBeGreaterThanOrEqual(0);
      expect(point.confidence).toBeGreaterThanOrEqual(0.5);
      expect(point.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should handle different projection periods', () => {
    const historicalData = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      revenue: 100 + Math.random() * 50,
      profit: 20 + Math.random() * 10,
    }));

    const periods = [7, 15, 30, 60, 90, 365];

    periods.forEach(period => {
      const { result } = renderHook(() => useRevenueProjection(historicalData, period));
      expect(result.current.projectedData.length).toBe(period);
    });
  });

  it('should detect significant fluctuations', () => {
    // Dados com alta volatilidade
    const volatileData = [
      { date: '2026-03-01', revenue: 50, profit: 10 },
      { date: '2026-03-02', revenue: 200, profit: 40 },
      { date: '2026-03-03', revenue: 30, profit: 6 },
      { date: '2026-03-04', revenue: 180, profit: 36 },
      { date: '2026-03-05', revenue: 40, profit: 8 },
      { date: '2026-03-06', revenue: 190, profit: 38 },
      { date: '2026-03-07', revenue: 35, profit: 7 },
    ];

    const { result } = renderHook(() => useRevenueProjection(volatileData, 7));

    expect(result.current.projectionMetrics.hasSignificantFluctuation).toBe(true);
  });

  it('should return projection periods', () => {
    const { result } = renderHook(() => useRevenueProjection([], 7));

    expect(result.current.projectionPeriods).toBeDefined();
    expect(result.current.projectionPeriods.length).toBeGreaterThan(0);
    expect(result.current.projectionPeriods[0]).toHaveProperty('label');
    expect(result.current.projectionPeriods[0]).toHaveProperty('days');
  });

  it('should generate valid dates for projected data', () => {
    const historicalData = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, '0')}`,
      revenue: 100 + Math.random() * 50,
      profit: 20 + Math.random() * 10,
    }));

    const { result } = renderHook(() => useRevenueProjection(historicalData, 7));

    result.current.projectedData.forEach(point => {
      // Validar formato de data YYYY-MM-DD
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Validar que é uma data válida
      const date = new Date(point.date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});
