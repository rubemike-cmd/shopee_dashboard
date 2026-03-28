import { useState, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Truck, DollarSign, FileDown, Loader2 } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import OrdersTable from '@/components/OrdersTable';
import LogisticsAnalysis from '@/components/LogisticsAnalysis';
import GoalsTracker from '@/components/GoalsTracker';
import GoalsEditor from '@/components/GoalsEditor';
import DashboardFilters from '@/components/DashboardFilters';
import { useOrdersAnalysis, FilterOptions } from '@/hooks/useOrdersAnalysis';
import { useGoalsAnalysis } from '@/hooks/useGoalsAnalysis';
import { useOrders } from '@/contexts/OrdersContext';
import { usePdfReport } from '@/hooks/usePdfReport';
import SpreadsheetUploader from '@/components/SpreadsheetUploader';
import InsightsPanel from '@/components/InsightsPanel';

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444'];

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'orders' | 'logistics' | 'goals' | 'upload'>('overview');
  const { orders: contextOrders } = useOrders();
  const { generatePdf, isGenerating } = usePdfReport();

  const {
    filteredOrders,
    metrics,
    statusDistribution,
    stateDistribution,
    logisticsDistribution,
    revenueByDate,
    topProducts,
    productProfitability,
    uniqueStates,
    uniqueStatuses,
    uniqueLogistics,
  } = useOrdersAnalysis(filters, contextOrders);

  const {
    goals,
    goalsUpdatedAt,
    weeklyProgress,
    monthlyProgress,
    projectedMonthlyRevenue,
    projectedMonthlyProfit,
    lastFourWeeks,
    isUsingCustomGoals,
  } = useGoalsAnalysis(contextOrders.length > 0 ? contextOrders : undefined);

  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prev => {
      const current = (prev[filterType as keyof FilterOptions] as string[] | undefined) ?? [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
  }, []);

  const handleDateRangeChange = useCallback((start: string | undefined, end: string | undefined) => {
    setFilters(prev => ({ ...prev, dataInicio: start, dataFim: end }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);

  const handleExportPdf = async () => {
    await generatePdf({
      metrics,
      filteredCount: filteredOrders.length,
      totalCount: contextOrders.length || 49,
      filters,
      topProducts: productProfitability.map(p => ({
        name: p.name,
        count: p.count,
        totalRevenue: p.totalProfit,
        totalProfit: p.totalProfit,
      })),
      chartElementIds: [
        'chart-revenue-date',
        'chart-status',
        'chart-states',
        'chart-logistics',
        'chart-profitability',
      ],
    });
  };

  const TABS = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'insights', label: '✦ Insights' },
    { id: 'goals', label: 'Metas' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'logistics', label: 'Logística' },
    { id: 'upload', label: 'Atualizar Dados' },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-display">Painel de Análise de Pedidos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Shopee Dashboard — Análise em Tempo Real</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isGenerating}
            className="gap-2 shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            {isGenerating ? 'Gerando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Optimized Filters */}
        <DashboardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearFilters}
          uniqueStatuses={uniqueStatuses}
          uniqueStates={uniqueStates}
          uniqueLogistics={uniqueLogistics}
          totalOrders={contextOrders.length || 49}
          filteredCount={filteredOrders.length}
        />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-in-up">
          <MetricCard
            label="Total de Pedidos"
            value={metrics.totalOrders}
            icon={<Package />}
            color="primary"
          />
          <MetricCard
            label="Valor da Venda"
            value={metrics.totalRevenue}
            format="currency"
            icon={<DollarSign />}
            color="success"
          />
          <MetricCard
            label="Lucro Líquido"
            value={metrics.totalProfit}
            format="currency"
            icon={<TrendingUp />}
            color="success"
          />
          <MetricCard
            label="Margem de Lucro"
            value={metrics.profitMargin}
            format="percentage"
            icon={<Truck />}
            color="primary"
          />
        </div>

        {/* Charts Grid (always visible) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="chart-container" id="chart-revenue-date">
            <h3 className="text-heading mb-4">Receita por Data</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value) => `R$ ${(value as number).toFixed(2)}`}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} name="Receita" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 5 }} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="chart-container" id="chart-status">
            <h3 className="text-heading mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} pedidos`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="chart-container" id="chart-states">
                <h3 className="text-heading mb-4">Pedidos por Estado</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stateDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-container" id="chart-logistics">
                <h3 className="text-heading mb-4">Distribuição de Logística</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={logisticsDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="chart-container" id="chart-profitability">
              <h3 className="text-heading mb-4">Rentabilidade por Produto (Top 12)</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={productProfitability} layout="vertical" margin={{ top: 5, right: 30, left: 250, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" style={{ fontSize: '10px' }} width={240} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value) => `R$ ${(value as number).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="totalProfit" fill="#10B981" name="Lucro Total" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="chart-container">
              <h3 className="text-heading mb-4">Top 10 Produtos Mais Vendidos</h3>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between gap-3">
                    <span className="text-sm flex-1 truncate">{product.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-28 bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${(product.count / Math.max(...topProducts.map(p => p.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground w-6 text-right">{product.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <InsightsPanel
              data={{
                totalOrders: metrics.totalOrders,
                totalRevenue: metrics.totalRevenue,
                totalProfit: metrics.totalProfit,
                profitMargin: metrics.profitMargin,
                avgOrderValue: metrics.avgOrderValue,
                topProducts: productProfitability.map(p => ({
                  name: p.name,
                  count: p.count,
                  totalProfit: p.totalProfit,
                })),
                statusDistribution: statusDistribution.map(s => ({
                  name: s.name,
                  value: s.value,
                  percentage: s.percentage,
                })),
                stateDistribution: stateDistribution.map(s => ({
                  name: s.name,
                  value: s.value,
                })),
                logisticsDistribution: logisticsDistribution.map(l => ({
                  name: l.name,
                  value: l.value,
                })),
              }}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading">Acompanhamento de Metas</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isUsingCustomGoals ? 'Metas personalizadas salvas' : 'Usando metas padrão baseadas no histórico'}
                </p>
              </div>
              <GoalsEditor />
            </div>
            <GoalsTracker
              goals={goals}
              goalsUpdatedAt={goalsUpdatedAt}
              weeklyProgress={weeklyProgress}
              monthlyProgress={monthlyProgress}
              projectedMonthlyRevenue={projectedMonthlyRevenue}
              projectedMonthlyProfit={projectedMonthlyProfit}
              lastFourWeeks={lastFourWeeks}
            />
          </div>
        )}

        {activeTab === 'orders' && <OrdersTable orders={filteredOrders} />}
        {activeTab === 'logistics' && <LogisticsAnalysis orders={filteredOrders} />}
        {activeTab === 'upload' && <SpreadsheetUploader />}
      </div>
    </div>
  );
}
