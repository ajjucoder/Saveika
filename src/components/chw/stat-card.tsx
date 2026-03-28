'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: 'default' | 'primary' | 'warning' | 'success';
  className?: string;
}

const VARIANTS = {
  default: {
    card: 'bg-card',
    icon: 'text-muted-foreground bg-muted',
    value: 'text-foreground',
  },
  primary: {
    card: 'bg-primary/5 border-primary/20',
    icon: 'text-primary bg-primary/10',
    value: 'text-primary',
  },
  warning: {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
    icon: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50',
    value: 'text-amber-700 dark:text-amber-400',
  },
  success: {
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
    icon: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50',
    value: 'text-emerald-700 dark:text-emerald-400',
  },
} as const;

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = VARIANTS[variant];

  return (
    <Card className={cn('transition-shadow hover:shadow-md', styles.card, className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', styles.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
