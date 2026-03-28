import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GoalMetrics } from '@/hooks/useGoalsAnalysis';

interface GoalsTrackerProps {
  goals: GoalMetrics;
  goalsUpdatedAt?: Date | null;
  weeklyProgress: {
    revenue: number;
    profit: number;
    orders: number;
    revenueProgress: number;
    profitProgress: number;
    weekStart: string;
    weekEnd: string;
  };
  monthlyProgress: {
    revenue: number;
    profit: number;
    orders: number;
    revenueProgress: number;
    profitProgress: number;
    monthStart: string;
    monthEnd: string;
    daysPassed: number;
    daysRemaining: number;
    monthName: string;
  };
  projectedMonthlyRevenue: number;
  projectedMonthlyProfit: number;
  lastFourWeeks: Array<{
    week: string;
    revenue: number;
    profit: number;
    orders: number;
  }>;
}

export default function GoalsTracker({
  goals,
  goalsUpdatedAt,
  weeklyProgress,
  monthlyProgress,
  projectedMonthlyRevenue,
  projectedMonthlyProfit,
  lastFourWeeks,
}: GoalsTrackerProps) {
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (progress >= 75) return <TrendingUp className="w-5 h-5 text-blue-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Goals last updated info */}
      {goalsUpdatedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Metas personalizadas · última atualização:{' '}
          <span className="font-medium">
            {new Date(goalsUpdatedAt).toLocaleString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      )}
      {/* Weekly Goals */}
      <Card className="chart-container">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-heading">Metas Semanais</h3>
          <span className="text-sm text-muted-foreground ml-auto">
            {weeklyProgress.weekStart} a {weeklyProgress.weekEnd}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Receita</span>
                {getStatusIcon(weeklyProgress.revenueProgress)}
              </div>
              <span className={`font-semibold ${getProgressColor(weeklyProgress.revenueProgress)}`}>
                {weeklyProgress.revenueProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressBarColor(weeklyProgress.revenueProgress)}`}
                style={{ width: `${Math.min(weeklyProgress.revenueProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ {weeklyProgress.revenue.toFixed(2)}</span>
              <span>Meta: R$ {goals.weeklyRevenueGoal.toFixed(2)}</span>
            </div>
          </div>

          {/* Profit Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Lucro</span>
                {getStatusIcon(weeklyProgress.profitProgress)}
              </div>
              <span className={`font-semibold ${getProgressColor(weeklyProgress.profitProgress)}`}>
                {weeklyProgress.profitProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressBarColor(weeklyProgress.profitProgress)}`}
                style={{ width: `${Math.min(weeklyProgress.profitProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ {weeklyProgress.profit.toFixed(2)}</span>
              <span>Meta: R$ {goals.weeklyProfitGoal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{weeklyProgress.orders}</span> pedidos nesta semana
          </div>
        </div>
      </Card>

      {/* Monthly Goals */}
      <Card className="chart-container">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-heading">Metas Mensais - {monthlyProgress.monthName}</h3>
          <span className="text-sm text-muted-foreground ml-auto">
            Dia {monthlyProgress.daysPassed} de 31
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Revenue Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Receita</span>
                {getStatusIcon(monthlyProgress.revenueProgress)}
              </div>
              <span className={`font-semibold ${getProgressColor(monthlyProgress.revenueProgress)}`}>
                {monthlyProgress.revenueProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressBarColor(monthlyProgress.revenueProgress)}`}
                style={{ width: `${Math.min(monthlyProgress.revenueProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ {monthlyProgress.revenue.toFixed(2)}</span>
              <span>Meta: R$ {goals.monthlyRevenueGoal.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
              Projeção: R$ {projectedMonthlyRevenue.toFixed(2)}
            </div>
          </div>

          {/* Profit Goal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Lucro</span>
                {getStatusIcon(monthlyProgress.profitProgress)}
              </div>
              <span className={`font-semibold ${getProgressColor(monthlyProgress.profitProgress)}`}>
                {monthlyProgress.profitProgress.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressBarColor(monthlyProgress.profitProgress)}`}
                style={{ width: `${Math.min(monthlyProgress.profitProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>R$ {monthlyProgress.profit.toFixed(2)}</span>
              <span>Meta: R$ {goals.monthlyProfitGoal.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
              Projeção: R$ {projectedMonthlyProfit.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{monthlyProgress.orders}</span> pedidos neste mês •
            <span className="font-medium ml-1">{monthlyProgress.daysRemaining}</span> dias restantes
          </div>
        </div>
      </Card>

      {/* Last 4 Weeks Chart */}
      <Card className="chart-container">
        <h3 className="text-heading mb-4">Histórico das Últimas 4 Semanas</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={lastFourWeeks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="week" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              formatter={(value) => `R$ ${(value as number).toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" name="Receita" radius={[8, 8, 0, 0]} />
            <Bar dataKey="profit" fill="#10B981" name="Lucro" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Goals Summary */}
      <Card className="chart-container bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <h3 className="text-heading mb-4">Resumo de Metas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">R$ {goals.weeklyRevenueGoal.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Meta Semanal Receita</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">R$ {goals.weeklyProfitGoal.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Meta Semanal Lucro</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">R$ {goals.monthlyRevenueGoal.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Meta Mensal Receita</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">R$ {goals.monthlyProfitGoal.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Meta Mensal Lucro</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
