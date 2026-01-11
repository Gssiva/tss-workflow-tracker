import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default', trend }: StatsCardProps) {
  const variants = {
    default: {
      bg: 'bg-card',
      icon: 'bg-primary/10 text-primary',
      border: 'border-border',
    },
    success: {
      bg: 'bg-card',
      icon: 'bg-success/10 text-success',
      border: 'border-success/20',
    },
    warning: {
      bg: 'bg-card',
      icon: 'bg-warning/10 text-warning',
      border: 'border-warning/20',
    },
    destructive: {
      bg: 'bg-card',
      icon: 'bg-destructive/10 text-destructive',
      border: 'border-destructive/20',
    },
    info: {
      bg: 'bg-card',
      icon: 'bg-info/10 text-info',
      border: 'border-info/20',
    },
  };

  const style = variants[variant];

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
      style.bg,
      style.border
    )}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold tracking-tight text-foreground">{value}</p>
            {trend && (
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          'flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 hover:scale-105',
          style.icon
        )}>
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
