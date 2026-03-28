import { ArrowUp, ArrowDown } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  trend?: number;
  format?: 'currency' | 'number' | 'percentage';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export default function MetricCard({
  label,
  value,
  icon,
  trend,
  format = 'number',
  color = 'primary',
}: MetricCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0;

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `R$ ${val.toFixed(2).replace('.', ',')}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  const colorClasses = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600',
  };

  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{label}</p>
          <p className="metric-value mt-2">{formatValue(value)}</p>
          
          {trend !== undefined && (
            <div className={`metric-change ${isPositiveTrend ? 'positive' : 'negative'}`}>
              {isPositiveTrend ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`text-3xl ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
