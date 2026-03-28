import { useMemo } from 'react';
import { orders as ordersData } from '@/data/orders';
import type { Order } from './useOrdersAnalysis';

export interface GoalMetrics {
  weeklyRevenueGoal: number;
  weeklyProfitGoal: number;
  monthlyRevenueGoal: number;
  monthlyProfitGoal: number;
}

export function useGoalsAnalysis() {
  // Metas padrão baseadas na análise histórica
  const goals: GoalMetrics = {
    weeklyRevenueGoal: 555.31,
    weeklyProfitGoal: 39.95,
    monthlyRevenueGoal: 2221.25,
    monthlyProfitGoal: 159.80,
  };

  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentWeek = getWeekNumber(today);
    
    const weekStart = getWeekStart(currentYear, currentWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekOrders = (ordersData as Order[]).filter(order => {
      const orderDate = new Date(order['Data de Criação']);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });

    const weekRevenue = weekOrders.reduce((sum, o) => sum + o['valor da venda'], 0);
    const weekProfit = weekOrders.reduce((sum, o) => sum + o['Líquido Total'], 0);

    return {
      revenue: weekRevenue,
      profit: weekProfit,
      orders: weekOrders.length,
      revenueProgress: (weekRevenue / goals.weeklyRevenueGoal) * 100,
      profitProgress: (weekProfit / goals.weeklyProfitGoal) * 100,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
    };
  }, []);

  const monthlyProgress = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const monthOrders = (ordersData as Order[]).filter(order => {
      const orderDate = new Date(order['Data de Criação']);
      return orderDate >= monthStart && orderDate <= monthEnd;
    });

    const monthRevenue = monthOrders.reduce((sum, o) => sum + o['valor da venda'], 0);
    const monthProfit = monthOrders.reduce((sum, o) => sum + o['Líquido Total'], 0);

    const daysInMonth = monthEnd.getDate();
    const daysPassed = today.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    return {
      revenue: monthRevenue,
      profit: monthProfit,
      orders: monthOrders.length,
      revenueProgress: (monthRevenue / goals.monthlyRevenueGoal) * 100,
      profitProgress: (monthProfit / goals.monthlyProfitGoal) * 100,
      monthStart: monthStart.toISOString().split('T')[0],
      monthEnd: monthEnd.toISOString().split('T')[0],
      daysPassed,
      daysRemaining,
      monthName: monthStart.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
    };
  }, []);

  const projectedMonthlyRevenue = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = new Date().getDate();
    return (monthlyProgress.revenue / daysPassed) * daysInMonth;
  }, [monthlyProgress]);

  const projectedMonthlyProfit = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = new Date().getDate();
    return (monthlyProgress.profit / daysPassed) * daysInMonth;
  }, [monthlyProgress]);

  const lastFourWeeks = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentWeek = getWeekNumber(today);
    const weeks = [];

    for (let i = 3; i >= 0; i--) {
      const weekNumber = currentWeek - i;
      const weekStart = getWeekStart(currentYear, weekNumber);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekOrders = (ordersData as Order[]).filter(order => {
        const orderDate = new Date(order['Data de Criação']);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });

      const weekRevenue = weekOrders.reduce((sum, o) => sum + o['valor da venda'], 0);
      const weekProfit = weekOrders.reduce((sum, o) => sum + o['Líquido Total'], 0);

      weeks.push({
        week: `Semana ${weekNumber}`,
        revenue: parseFloat(weekRevenue.toFixed(2)),
        profit: parseFloat(weekProfit.toFixed(2)),
        orders: weekOrders.length,
      });
    }

    return weeks;
  }, []);

  return {
    goals,
    weeklyProgress,
    monthlyProgress,
    projectedMonthlyRevenue,
    projectedMonthlyProfit,
    lastFourWeeks,
  };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStart(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}
