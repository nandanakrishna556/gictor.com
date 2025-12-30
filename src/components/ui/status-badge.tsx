import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, Check, X, Clock, AlertCircle, LucideIcon } from 'lucide-react';

export type StatusType = 'processing' | 'completed' | 'failed' | 'draft' | 'review' | 'approved' | 'rejected' | 'active' | 'pending' | 'generating';

interface StatusConfig {
  label: string;
  className: string;
  showLoader?: boolean;
  icon?: React.ReactNode;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  processing: {
    label: 'Processing',
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    showLoader: true,
  },
  generating: {
    label: 'Generating',
    className: 'bg-primary/10 text-primary border-primary/20',
    showLoader: true,
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    icon: <Clock className="h-3 w-3" strokeWidth={1.5} />,
  },
  completed: {
    label: 'Ready',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: <Check className="h-3 w-3" strokeWidth={1.5} />,
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <AlertCircle className="h-3 w-3" strokeWidth={1.5} />,
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  },
  review: {
    label: 'Review',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: <Check className="h-3 w-3" strokeWidth={1.5} />,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: <X className="h-3 w-3" strokeWidth={1.5} />,
  },
  active: {
    label: 'Active',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
};

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
  showLoader?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function StatusBadge({ 
  status, 
  label, 
  className,
  showLoader,
  showIcon = false,
  size = 'md',
  pulse = false,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as StatusType] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  const displayLabel = label || config.label;
  const shouldShowLoader = showLoader ?? config.showLoader;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.className,
        sizeClasses[size],
        'gap-1 font-medium',
        pulse && shouldShowLoader && 'animate-pulse',
        className
      )}
    >
      {shouldShowLoader && (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      )}
      {!shouldShowLoader && showIcon && config.icon && (
        <span className={iconSizes[size]}>{config.icon}</span>
      )}
      {displayLabel}
    </Badge>
  );
}

// Helper to get status config for custom styling
export function getStatusConfig(status: StatusType | string): StatusConfig {
  return STATUS_CONFIG[status as StatusType] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };
}

// Export types for reuse
export type { StatusConfig };
