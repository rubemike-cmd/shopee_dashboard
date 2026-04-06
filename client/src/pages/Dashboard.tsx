import { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Truck, DollarSign, FileDown, Loader2, BarChart2, TrendingUp as TrendingUpIcon, CalendarDays, X as XIcon, AlertTriangle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import OrdersTable from '@/components/OrdersTable';
import LogisticsAnalysis from '@/components/LogisticsAnalysis';
import GoalsTracker from '@/components/GoalsTracker';
import GoalsEditor from '@/components/GoalsEditor';
import DashboardFilters from '@/components/DashboardFilters';
import { useOrdersAnalysis, FilterOptions } from '@/hooks/useOrdersAnalysis';
import { useGoalsAnalysis } from '@/hooks/useGoalsAnalysis';
import { useRevenueProjection } from '@/hooks/useRevenueProjection';
import { useOrders } from '@/contexts/OrdersContext';
import { usePdfReport } from '@/hooks/usePdfReport';
import SpreadsheetUploader from '@/components/SpreadsheetUploader';
import InsightsPanel from '@/components/InsightsPanel';
import { ShopeeAdsDashboard } from '@/components/ShopeeAdsDashboard';
import { ProductsAnalysis } from '@/components/ProductsAnalysis';

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444'];

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'orders' | 'logistics' | 'goals' | 'upload' | 'shopee-ads' | 'products'>('overview');
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

  // Revenue chart state: view mode and inline date range
  const [revenueView, setRevenueView] = useState<'daily' | 'cumulative'>('daily');
  const [chartDateStart, setChartDateStart] = useState<string>('');
  const [chartDateEnd, setChartDateEnd] = useState<string>('');
  const [showChartCalendar, setShowChartCalendar] = useState(false);
  const [showProjection, setShowProjection] = useState(false);
  const [projectionDays, setProjectionDays] = useState(7);

  // Revenue projection hook
  const { projectionMetrics, projectedData, projectionPeriods } = useRevenueProjection(revenueByDate, projectionDays);

  // Dates available in the data
  const allDates = useMemo(() => revenueByDate.map(d => d.date), [revenueByDate]);
  const minDate = allDates[0] ?? '';
  const maxDate = allDates[allDates.length - 1] ?? '';

  // Filter revenueByDate by inline calendar selection
  const chartFilteredRevenue = useMemo(() => {
    if (!chartDateStart && !chartDateEnd) return revenueByDate;
    return revenueByDate.filter(d => {
      if (chartDateStart && d.date < chartDateStart) return false;
      if (chartDateEnd && d.date > chartDateEnd) return false;
      return true;
    });
  }, [revenueByDate, chartDateStart, chartDateEnd]);

  // Build cumulative series
  const cumulativeRevenue = useMemo(() => {
    let cumRev = 0, cumPro = 0;
    return chartFilteredRevenue.map(d => {
      cumRev += d.revenue;
      cumPro += d.profit;
      return { date: d.date, revenue: cumRev, profit: cumPro };
    });
  }, [chartFilteredRevenue]);

  // Combinar dados históricos com projeção
  const chartDataWithProjection = useMemo(() => {
    if (!showProjection || projectedData.length === 0) {
      return revenueView === 'daily' ? chartFilteredRevenue : cumulativeRevenue;
    }
    
    const historical = revenueView === 'daily' ? chartFilteredRevenue : cumulativeRevenue;
    
    // Se for visualização acumulada, calcular acumulada dos dados projetados
    let projectedWithCumulative = projectedData;
    if (revenueView === 'cumulative' && historical.length > 0) {
      const lastHistoricalRev = historical[historical.length - 1].revenue;
      const lastHistoricalProf = historical[historical.length - 1].profit;
      
      projectedWithCumulative = projectedData.map((d, idx) => {
        const cumulativeRev = lastHistoricalRev + projectedData.slice(0, idx + 1).reduce((sum, p) => sum + p.revenue, 0);
        const cumulativeProf = lastHistoricalProf + projectedData.slice(0, idx + 1).reduce((sum, p) => sum + p.profit, 0);
        
        return {
          ...d,
          revenue: cumulativeRev,
          profit: cumulativeProf,
        };
      });
    }
    
    // Combinar e ordenar cronologicamente
    const combined = [...historical, ...projectedWithCumulative];
    
    // Funcao para converter DD/MM/YYYY ou YYYY-MM-DD para timestamp
    const dateToTimestamp = (dateStr: string): number => {
      if (dateStr.includes('/')) {
        // Formato DD/MM/YYYY
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
      } else {
        // Formato YYYY-MM-DD
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      }
    };
    
    return combined.sort((a, b) => dateToTimestamp(a.date) - dateToTimestamp(b.date));
  }, [revenueView, chartFilteredRevenue, cumulativeRevenue, showProjection, projectedData]);

  const revenueChartData = chartDataWithProjection;

  const TABS = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'insights', label: '✦ Insights' },
    { id: 'goals', label: 'Metas' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'logistics', label: 'Logística' },
    { id: 'shopee-ads', label: '📊 Shopee Ads' },
    { id: 'products', label: '📦 Produtos' },
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
            {/* Chart header with controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-heading">Receita por Data</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Projection toggle button */}
                <button
                  onClick={() => setShowProjection(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    showProjection
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <TrendingUpIcon className="w-3.5 h-3.5" />
                  Projeção
                </button>
                {/* Daily / Cumulative toggle */}
                <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs">
                  <button
                    onClick={() => setRevenueView('daily')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                      revenueView === 'daily'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-background text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Diário
                  </button>
                  <button
                    onClick={() => setRevenueView('cumulative')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                      revenueView === 'cumulative'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'bg-background text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <TrendingUpIcon className="w-3.5 h-3.5" />
                    Acumulado
                  </button>
                </div>
                {/* Calendar toggle button */}
                <button
                  onClick={() => setShowChartCalendar(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    showChartCalendar || chartDateStart || chartDateEnd
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {chartDateStart || chartDateEnd ? 'Período' : 'Filtrar datas'}
                </button>
                {/* Clear inline date filter */}
                {(chartDateStart || chartDateEnd) && (
                  <button
                    onClick={() => { setChartDateStart(''); setChartDateEnd(''); }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <XIcon className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Inline calendar date range picker */}
            {showChartCalendar && (
              <div className="mb-4 p-3 rounded-lg border border-border bg-secondary/30 flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Data inicial</label>
                  <input
                    type="date"
                    value={chartDateStart}
                    min={minDate}
                    max={chartDateEnd || maxDate}
                    onChange={e => setChartDateStart(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Data final</label>
                  <input
                    type="date"
                    value={chartDateEnd}
                    min={chartDateStart || minDate}
                    max={maxDate}
                    onChange={e => setChartDateEnd(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground pb-1">
                  {chartFilteredRevenue.length} dia{chartFilteredRevenue.length !== 1 ? 's' : ''} no período
                </p>
              </div>
            )}

            {/* Projection period selector */}
            {showProjection && (
              <div className="mb-4 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Período de projeção:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {projectionPeriods.map(period => (
                      <button
                        key={period.days}
                        onClick={() => setProjectionDays(period.days)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          projectionDays === period.days
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-background border border-border text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
                {projectionMetrics.hasSignificantFluctuation && (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">Flutuação significativa detectada nos dados. A projeção pode ter menor precisão.</p>
                  </div>
                )}
              </div>
            )}

            {/* Active period badge */}
            {(chartDateStart || chartDateEnd) && !showChartCalendar && (
              <p className="text-xs text-primary mb-3">
                Período: {chartDateStart || minDate} → {chartDateEnd || maxDate} &nbsp;·&nbsp; {chartFilteredRevenue.length} dia{chartFilteredRevenue.length !== 1 ? 's' : ''}
              </p>
            )}

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  formatter={(value) => `R$ ${(value as number).toFixed(2)}`}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line 
                  key="revenue-line"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (payload?.isProjected) {
                      return <circle key={`revenue-dot-${index}`} cx={cx} cy={cy} r={2} fill="#3B82F6" opacity={0.5} />;
                    }
                    return <circle key={`revenue-dot-${index}`} cx={cx} cy={cy} r={3} fill="#3B82F6" />;
                  }}
                  activeDot={{ r: 5 }} 
                  name={revenueView === 'cumulative' ? 'Receita Acumulada' : 'Receita'} 
                />
                <Line 
                  key="profit-line"
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (payload?.isProjected) {
                      return <circle key={`profit-dot-${index}`} cx={cx} cy={cy} r={2} fill="#10B981" opacity={0.5} />;
                    }
                    return <circle key={`profit-dot-${index}`} cx={cx} cy={cy} r={3} fill="#10B981" />;
                  }}
                  activeDot={{ r: 5 }} 
                  name={revenueView === 'cumulative' ? 'Lucro Acumulado' : 'Lucro'} 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="chart-container" id="chart-status">
            <h3 className="text-heading mb-4">Rentabilidade por Produto</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={productProfitability.slice(0, 8).map(p => ({
                    name: p.name.length > 26 ? p.name.substring(0, 26) + '…' : p.name,
                    fullName: p.name,
                    value: Math.max(p.totalRevenue, 0.01),
                    totalRevenue: p.totalRevenue,
                    totalProfit: p.totalProfit,
                    count: p.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  dataKey="value"
                >
                  {productProfitability.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload[0]) return null;
                    const d = payload[0].payload as { fullName: string; totalRevenue: number; totalProfit: number; count: number };
                    const pct = metrics.totalRevenue > 0 ? (d.totalRevenue / metrics.totalRevenue * 100).toFixed(1) : '0';
                    return (
                      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, maxWidth: 240 }}>
                        <p style={{ fontWeight: 600, marginBottom: 6 }}>{d.fullName}</p>
                        <p style={{ marginBottom: 2 }}>Faturamento: <strong>R$ {d.totalRevenue.toFixed(2)}</strong> <span style={{ color: '#6B7280' }}>({pct}% do total)</span></p>
                        <p style={{ marginBottom: 2 }}>Lucro acumulado: <strong style={{ color: d.totalProfit >= 0 ? '#10B981' : '#EF4444' }}>R$ {d.totalProfit.toFixed(2)}</strong></p>
                        <p style={{ color: '#6B7280' }}>{d.count} venda(s)</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
                />
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
              <GoalsEditor profitMargin={metrics.profitMargin} />
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
        {activeTab === 'shopee-ads' && <ShopeeAdsDashboard />}
        {activeTab === 'upload' && <SpreadsheetUploader />}
        {activeTab === 'products' && <ProductsAnalysis />}
      </div>
    </div>
  );
}
