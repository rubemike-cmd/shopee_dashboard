import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { useOrders } from '@/contexts/OrdersContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { Order } from '@/hooks/useOrdersAnalysis';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

export function ProductsAnalysis() {
  const { orders } = useOrders();

  // Processar dados de produtos
  const productsData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const productMap = new Map<string, {
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }>();

    orders.forEach((order: Order) => {
      const productName = order['Produtos'] || 'Sem nome';
      const price = parseFloat(String(order['Valor Total'])) || 0;
      const cost = parseFloat(String(order['Custo Total'])) || 0;
      const profitValue = parseFloat(String(order['Líquido Total'])) || 0;

      if (productMap.has(productName)) {
        const existing = productMap.get(productName)!;
        existing.quantity += 1;
        existing.revenue += price;
        existing.cost += cost;
        existing.profit += profitValue;
      } else {
        productMap.set(productName, {
          name: productName,
          quantity: 1,
          revenue: price,
          cost: cost,
          profit: profitValue,
          margin: 0,
        });
      }
    });

    // Calcular margem de lucro: Margem = Lucro Total / Custo Total
    const products = Array.from(productMap.values()).map(p => ({
      ...p,
      margin: p.cost > 0 ? (p.profit / p.cost) * 100 : 0,
    }));

    // Ordenar por revenue (maior primeiro)
    return products.sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  // Calcular KPIs
  const stats = useMemo(() => {
    const totalProducts = productsData.length;
    const totalQuantity = productsData.reduce((sum, p) => sum + p.quantity, 0);
    const totalRevenue = productsData.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = productsData.reduce((sum, p) => sum + p.profit, 0);
    const totalCost = productsData.reduce((sum, p) => sum + p.cost, 0);
    // Margem = Lucro Total / Custo Total
    const avgMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return { totalProducts, totalQuantity, totalRevenue, totalProfit, avgMargin };
  }, [productsData]);

  // Dados para gráfico de margem
  const marginChartData = useMemo(() => {
    return productsData.slice(0, 10).map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      margin: parseFloat(p.margin.toFixed(1)),
      revenue: parseFloat(p.revenue.toFixed(2)),
    }));
  }, [productsData]);

  // Dados para gráfico de lucro acumulado
  const profitChartData = useMemo(() => {
    let accumulated = 0;
    return productsData.slice(0, 10).map(p => {
      accumulated += p.profit;
      return {
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        profit: parseFloat(p.profit.toFixed(2)),
        accumulated: parseFloat(accumulated.toFixed(2)),
      };
    });
  }, [productsData]);

  // Produtos com baixa margem (alertas)
  const lowMarginProducts = useMemo(() => {
    return productsData.filter(p => p.margin < stats.avgMargin && p.margin > 0).slice(0, 5);
  }, [productsData, stats.avgMargin]);

  // Produtos com boa margem (destaques)
  const highMarginProducts = useMemo(() => {
    return productsData.filter(p => p.margin > stats.avgMargin).slice(0, 5);
  }, [productsData, stats.avgMargin]);

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Nenhum dado de pedidos carregado. Faça upload de dados para visualizar análise de produtos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Produtos</p>
          <p className="text-2xl font-bold">{stats.totalProducts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Vendas</p>
          <p className="text-2xl font-bold">{stats.totalQuantity}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Faturamento Total</p>
          <p className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lucro Total</p>
          <p className="text-2xl font-bold text-green-600">R$ {stats.totalProfit.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Margem Média</p>
          <p className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Margem por Produto */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Margem de Lucro por Produto (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Margem (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="margin" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {marginChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.margin >= stats.avgMargin ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Lucro Acumulado */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Lucro Acumulado (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Lucro (R$)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `R$ ${value}`} />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Lucro Individual" />
              <Line type="monotone" dataKey="accumulated" stroke="#10b981" name="Acumulado" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alertas e Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos com Baixa Margem */}
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Produtos com Baixa Margem</h3>
          </div>
          <div className="space-y-2">
            {lowMarginProducts.length > 0 ? (
              lowMarginProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-red-200">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} vendas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{product.margin.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">R$ {product.profit.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum produto com margem abaixo da média</p>
            )}
          </div>
        </Card>

        {/* Produtos com Boa Margem */}
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Produtos Destaque (Alta Margem)</h3>
          </div>
          <div className="space-y-2">
            {highMarginProducts.length > 0 ? (
              highMarginProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-green-200">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} vendas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{product.margin.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">R$ {product.profit.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum produto com margem acima da média</p>
            )}
          </div>
        </Card>
      </div>

      {/* Tabela Completa de Produtos */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ranking Completo de Produtos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left p-2">Produto</th>
                <th className="text-right p-2">Vendas</th>
                <th className="text-right p-2">Faturamento</th>
                <th className="text-right p-2">Lucro</th>
                <th className="text-right p-2">Margem</th>
              </tr>
            </thead>
            <tbody>
              {productsData.map((product, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div>
                      <p className="font-medium">{product.name}</p>
                    </div>
                  </td>
                  <td className="text-right p-2">{product.quantity}</td>
                  <td className="text-right p-2">R$ {product.revenue.toFixed(2)}</td>
                  <td className="text-right p-2 text-green-600 font-medium">R$ {product.profit.toFixed(2)}</td>
                  <td className="text-right p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      product.margin >= stats.avgMargin
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
