import { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import type { FilterOptions } from '@/hooks/useOrdersAnalysis';
import type { DateRange } from 'react-day-picker';

interface DashboardFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filterType: string, value: string) => void;
  onDateRangeChange: (start: string | undefined, end: string | undefined) => void;
  onClearFilters: () => void;
  uniqueStatuses: string[];
  uniqueStates: string[];
  uniqueLogistics: string[];
  totalOrders: number;
  filteredCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  shipped: 'Enviado',
  wms: 'WMS',
  picked: 'Coletado',
  packed: 'Embalado',
  waiting_expedition: 'Aguardando Expedição',
  refunded: 'Reembolsado',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  READY_TO_SHIP: 'Pronto para Enviar',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devolvido',
  FAILED: 'Falha na Entrega',
  PENDING_RETURN: 'Retorno Pendente',
  RETURNING: 'Retornando',
  RETURNED_COMPLETED: 'Retorno Concluído',
  REFUND_PENDING: 'Reembolso Pendente',
  REFUND_COMPLETED: 'Reembolso Concluído',
};

export default function DashboardFilters({
  filters,
  onFilterChange,
  onDateRangeChange,
  onClearFilters,
  uniqueStatuses,
  uniqueStates,
  uniqueLogistics,
  totalOrders,
  filteredCount,
}: DashboardFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isInsideDropdown = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(target)
      );
      const isInsideCalendar = calendarRef.current?.contains(target);
      if (!isInsideDropdown) setOpenDropdown(null);
      if (!isInsideCalendar) setShowCalendar(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      const start = range.from.toISOString().split('T')[0];
      const end = range.to ? range.to.toISOString().split('T')[0] + 'T23:59:59' : undefined;
      onDateRangeChange(start, end);
    } else {
      onDateRangeChange(undefined, undefined);
    }
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    onDateRangeChange(undefined, undefined);
  };

  const activeStatusFilters = (filters.status as string[] | undefined) ?? [];
  const activeStateFilters = (filters.estado as string[] | undefined) ?? [];
  const activeLogisticsFilters = (filters.logistica as string[] | undefined) ?? [];
  const hasDateFilter = !!(filters.dataInicio || filters.dataFim);
  const hasAnyFilter =
    activeStatusFilters.length > 0 ||
    activeStateFilters.length > 0 ||
    activeLogisticsFilters.length > 0 ||
    hasDateFilter;

  const isFiltered = filteredCount < totalOrders;

  const formatDateLabel = () => {
    if (!dateRange?.from) return 'Período';
    const from = dateRange.from.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    if (!dateRange.to) return from;
    const to = dateRange.to.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${from} – ${to}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filtros</span>
          {isFiltered && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {filteredCount} de {totalOrders} pedidos
            </span>
          )}
          {!isFiltered && (
            <span className="text-xs text-muted-foreground">
              {totalOrders} pedidos
            </span>
          )}
        </div>
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 gap-1"
          >
            <X className="w-3 h-3" />
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Filter buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status dropdown */}
        <div className="relative" ref={el => { dropdownRefs.current['status'] = el; }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              activeStatusFilters.length > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Status
            {activeStatusFilters.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {activeStatusFilters.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[180px]">
              {uniqueStatuses.map(status => (
                <label key={status} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeStatusFilters.includes(status)}
                    onChange={() => onFilterChange('status', status)}
                    className="w-3.5 h-3.5 rounded accent-primary"
                  />
                  <span className="text-sm">{STATUS_LABELS[status] ?? status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Estado dropdown */}
        <div className="relative" ref={el => { dropdownRefs.current['estado'] = el; }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'estado' ? null : 'estado')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              activeStateFilters.length > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Estado
            {activeStateFilters.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {activeStateFilters.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'estado' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'estado' && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[160px] max-h-56 overflow-y-auto">
              {uniqueStates.map(estado => (
                <label key={estado} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeStateFilters.includes(estado)}
                    onChange={() => onFilterChange('estado', estado)}
                    className="w-3.5 h-3.5 rounded accent-primary"
                  />
                  <span className="text-sm font-mono">{estado}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Logística dropdown */}
        <div className="relative" ref={el => { dropdownRefs.current['logistica'] = el; }}>
          <button
            onClick={() => setOpenDropdown(openDropdown === 'logistica' ? null : 'logistica')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              activeLogisticsFilters.length > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Logística
            {activeLogisticsFilters.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {activeLogisticsFilters.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'logistica' ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === 'logistica' && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg p-2 min-w-[200px]">
              {uniqueLogistics.map(logistica => (
                <label key={logistica} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeLogisticsFilters.includes(logistica)}
                    onChange={() => onFilterChange('logistica', logistica)}
                    className="w-3.5 h-3.5 rounded accent-primary"
                  />
                  <span className="text-sm">{logistica}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date Range picker */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              hasDateFilter
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {formatDateLabel()}
            {hasDateFilter && (
              <span
                onClick={e => { e.stopPropagation(); clearDateRange(); }}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            {!hasDateFilter && (
              <ChevronDown className={`w-3 h-3 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
            )}
          </button>
          {showCalendar && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3">
              <CalendarPicker
                mode="range"
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                className="rounded-lg"
              />
              {dateRange?.from && (
                <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {dateRange.from.toLocaleDateString('pt-BR')}
                    {dateRange.to && ` → ${dateRange.to.toLocaleDateString('pt-BR')}`}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearDateRange} className="text-xs h-6 px-2">
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-border">
          {activeStatusFilters.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {STATUS_LABELS[s] ?? s}
              <button onClick={() => onFilterChange('status', s)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {activeStateFilters.map(e => (
            <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium font-mono">
              {e}
              <button onClick={() => onFilterChange('estado', e)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {activeLogisticsFilters.map(l => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              {l}
              <button onClick={() => onFilterChange('logistica', l)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {hasDateFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <Calendar className="w-3 h-3" />
              {formatDateLabel()}
              <button onClick={clearDateRange} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
