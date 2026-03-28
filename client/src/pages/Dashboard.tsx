import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Package, TrendingUp, Truck, DollarSign } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { useOrdersAnalysis, FilterOptions } from '@/hooks/useOrdersAnalysis';

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#EF4444'];

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    status: false,
    estado: false,
    logistica: false,
  });

  const {
    metrics,
    statusDistribution,
    stateDistribution,
    logisticsDistribution,
    revenueByDate,
    topProducts,
    uniqueStates,
    uniqueStatuses,
    uniqueLogistics,
  } = useOrdersAnalysis(filters);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => {
      const current = prev[filterType as keyof FilterOptions] as string[] | undefined || [];
      const updated = Array.isArray(current) ? [...current] : [];
      
      if (updated.includes(value)) {
        return {
          ...prev,
          [filterType]: updated.filter(v => v !== value),
        };
      } else {
        return {
          ...prev,
          [filterType]: [...updated, value],
        };
      }
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(v => Array.isArray(v) && v.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-display">Painel de Análise de Pedidos</h1>
          <p className="text-muted-foreground mt-1">Shopee Dashboard - Análise em Tempo Real</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Sidebar */}
        <div className="mb-8 bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading">Filtros</h2>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, status: !prev.status }))}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-semibold text-sm">Status</span>
                <ChevronDown size={16} className={`transition-transform ${expandedFilters.status ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilters.status && (
                <div className="mt-2 space-y-2 pl-2">
                  {uniqueStatuses.map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(filters.status as string[] | undefined)?.includes(status) || false}
                        onChange={() => handleFilterChange('status', status)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{status}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Estado Filter */}
            <div>
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, estado: !prev.estado }))}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-semibold text-sm">Estado</span>
                <ChevronDown size={16} className={`transition-transform ${expandedFilters.estado ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilters.estado && (
                <div className="mt-2 space-y-2 pl-2 max-h-48 overflow-y-auto">
                  {uniqueStates.map(estado => (
                    <label key={estado} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(filters.estado as string[] | undefined)?.includes(estado) || false}
                        onChange={() => handleFilterChange('estado', estado)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{estado}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Logística Filter */}
            <div>
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, logistica: !prev.logistica }))}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-semibold text-sm">Logística</span>
                <ChevronDown size={16} className={`transition-transform ${expandedFilters.logistica ? 'rotate-180' : ''}`} />
              </button>
              {expandedFilters.logistica && (
                <div className="mt-2 space-y-2 pl-2">
                  {uniqueLogistics.map(logistica => (
                    <label key={logistica} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(filters.logistica as string[] | undefined)?.includes(logistica) || false}
                        onChange={() => handleFilterChange('logistica', logistica)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{logistica}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-in-up">
          <MetricCard
            label="Total de Pedidos"
            value={metrics.totalOrders}
            icon={<Package />}
            color="primary"
          />
          <MetricCard
            label="Receita Total"
            value={metrics.totalRevenue}
            format="currency"
            icon={<DollarSign />}
            color="success"
          />
          <MetricCard
            label="Lucro Total"
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Date */}
          <Card className="chart-container">
            <h3 className="text-heading mb-4">Receita por Data</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Receita"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Distribution */}
          <Card className="chart-container">
            <h3 className="text-heading mb-4">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} pedidos`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top States */}
          <Card className="chart-container">
            <h3 className="text-heading mb-4">Pedidos por Estado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateDistribution}>
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
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Logistics Distribution */}
          <Card className="chart-container">
            <h3 className="text-heading mb-4">Distribuição de Logística</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={logisticsDistribution}>
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
                <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="chart-container">
          <h3 className="text-heading mb-4">Top 10 Produtos</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm flex-1">{product.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(product.count / Math.max(...topProducts.map(p => p.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground w-8 text-right">
                    {product.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
