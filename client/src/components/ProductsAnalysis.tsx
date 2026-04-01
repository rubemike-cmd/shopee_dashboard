import { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

export function ProductsAnalysis() {


  // Buscar dados de produtos
  const { data: productsData, isLoading } = trpc.products.getTopProducts.useQuery({
    limit: 20,
  });

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    if (!productsData) return [];
    
    return productsData.map((product: any, index: number) => ({
      ...product,
      name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
      color: COLORS[index % COLORS.length],
    }));
  }, [productsData]);

  // Calcular totais
  const totals = useMemo(() => {
    if (!productsData) return { totalSales: 0, totalRevenue: 0, totalProfit: 0, avgMargin: 0 };
    
    const totalSales = productsData.reduce((sum: number, p: any) => sum + p.quantity, 0);
    const totalRevenue = productsData.reduce((sum: number, p: any) => sum + p.revenue, 0);
    const totalProfit = productsData.reduce((sum: number, p: any) => sum + p.profit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalSales, totalRevenue, totalProfit, avgMargin };
  }, [productsData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalSales}</div>
            <p className="text-xs text-gray-500 mt-1">unidades vendidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">receita bruta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalProfit)}</div>
            <p className="text-xs text-gray-500 mt-1">lucro líquido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">margem de lucro</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="margin">Margem</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos por Vendas</CardTitle>
              <CardDescription>Quantidade de unidades vendidas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value} un.`} />
                  <Bar dataKey="quantity" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos por Faturamento</CardTitle>
              <CardDescription>Receita total por produto</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Margem de Lucro por Produto</CardTitle>
              <CardDescription>Percentual de lucro em relação ao faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.map((p: any) => ({ ...p, margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
                  <Bar dataKey="margin" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Produtos</CardTitle>
          <CardDescription>Detalhamento completo de vendas, faturamento e lucro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold">Produto</th>
                  <th className="text-right py-2 px-2 font-semibold">Vendas</th>
                  <th className="text-right py-2 px-2 font-semibold">Faturamento</th>
                  <th className="text-right py-2 px-2 font-semibold">Lucro</th>
                  <th className="text-right py-2 px-2 font-semibold">Margem</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((product: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-2">{product.quantity}</td>
                    <td className="text-right py-2 px-2">{formatCurrency(product.revenue)}</td>
                    <td className="text-right py-2 px-2 text-green-600 font-semibold">{formatCurrency(product.profit)}</td>
                    <td className="text-right py-2 px-2">
                      <span className={product.revenue > 0 ? (product.profit / product.revenue > 0.1 ? 'text-green-600' : 'text-orange-600') : ''}>
                        {product.revenue > 0 ? ((product.profit / product.revenue) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
