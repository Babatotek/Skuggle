import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  subtitle?: string;
  badge?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-white border-slate-200/80 hover:border-slate-300',
  primary: 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-200',
  success: 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-200',
  warning: 'bg-amber-50/40 border-amber-100 hover:border-amber-200',
  danger: 'bg-rose-50/40 border-rose-100 hover:border-rose-200',
};

const iconVariantStyles = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  subtitle,
  badge,
  variant = 'default',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-2xl border p-4.5 transition-all duration-150 shadow-xs ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide truncate">{label}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-900 tracking-tight font-display">{value}</h4>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${iconVariantStyles[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs">
          {trend && (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend.direction === 'up'
                  ? 'text-emerald-700'
                  : trend.direction === 'down'
                  ? 'text-rose-700'
                  : 'text-slate-500'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-400 font-normal ml-0.5">{trend.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-slate-400 truncate ml-auto">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
