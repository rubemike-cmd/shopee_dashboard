import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { Order } from '@/hooks/useOrdersAnalysis';

interface LogisticsAnalysisProps {
  orders: Order[];
}

export default function LogisticsAnalysis({ orders }: LogisticsAnalysisProps) {
  const logisticsMetrics = useMemo(() => {
    const metrics: Record<string, {
      totalOrders: number;
      totalCost: number;
      totalProfit: number;
      avgCost: number;
      avgProfit: number;
      successRate: number;
    }> = {};

    orders.forEach(order => {
      const logistics = order['Modo de Logística'];
      if (!metrics[logistics]) {
        metrics[logistics] = {
          totalOrders: 0,
          totalCost: 0,
          totalProfit: 0,
          avgCost: 0,
          avgProfit: 0,
          successRate: 0,
        };
      }
      metrics[logistics].totalOrders += 1;
      metrics[logistics].totalCost += order['Custo Total'];
      metrics[logistics].totalProfit += order['Líquido Total'];
    });

    // Calcular médias e taxa de sucesso
    Object.keys(metrics).forEach(logistics => {
      const data = metrics[logistics];
      data.avgCost = data.totalCost / data.totalOrders;
      data.avgProfit = data.totalProfit / data.totalOrders;
      
      // Taxa de sucesso = pedidos entregues / total
      const deliveredOrders = orders.filter(
        o => o['Modo de Logística'] === logistics && o['Status'] === 'shipped'
      ).length;
      data.successRate = (deliveredOrders / data.totalOrders) * 100;
    });

    return Object.entries(metrics).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [orders]);

  const comparisonData = useMemo(() => {
    return logisticsMetrics.map(metric => ({
      name: metric.name,
      'Custo Médio': parseFloat(metric.avgCost.toFixed(2)),
      'Lucro Médio': parseFloat(metric.avgProfit.toFixed(2)),
      'Total de Pedidos': metric.totalOrders,
      'Taxa de Sucesso': parseFloat(metric.successRate.toFixed(1)),
    }));
  }, [logisticsMetrics]);

  const COLORS = ['#3B82F6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logisticsMetrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <h4 className="text-heading mb-4">{metric.name}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Pedidos</span>
                <span className="font-semibold">{metric.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Custo Médio</span>
                <span className="font-mono font-semibold">R$ {metric.avgCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lucro Médio</span>
                <span className={`font-mono font-semibold ${metric.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {metric.avgProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Taxa de Sucesso</span>
                <span className="font-semibold text-green-600">{metric.successRate.toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Chart */}
      <Card className="chart-container">
        <h3 className="text-heading mb-4">Comparação de Custos vs Lucro por Logística</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
            <Bar dataKey="Custo Médio" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Lucro Médio" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Success Rate Chart */}
      <Card className="chart-container">
        <h3 className="text-heading mb-4">Taxa de Sucesso de Entrega por Logística</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              formatter={(value) => `${(value as number).toFixed(1)}%`}
            />
            <Bar dataKey="Taxa de Sucesso" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Order Volume */}
      <Card className="chart-container">
        <h3 className="text-heading mb-4">Volume de Pedidos por Logística</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="Total de Pedidos" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
