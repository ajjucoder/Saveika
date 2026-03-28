'use client';

import { Badge } from '@/components/ui/badge';
import { RISK_COLORS } from '@/lib/constants';
import { useLanguage } from '@/providers/language-provider';
import type { RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function RiskBadge({
  level,
  score,
  showScore = false,
  size = 'md',
  className,
}: RiskBadgeProps) {
  const { t } = useLanguage();
  const colors = RISK_COLORS[level];

  const label = t(`risk.${level}`);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border transition-colors',
        colors.badge,
        SIZE_CLASSES[size],
        className
      )}
    >
      {label}
      {showScore && score !== undefined && (
        <span className="ml-1.5 opacity-75">({score})</span>
      )}
    </Badge>
  );
}

// Compact score display for lists/tables
interface ScoreDisplayProps {
  score: number;
  level: RiskLevel;
  className?: string;
}

export function ScoreDisplay({ score, level, className }: ScoreDisplayProps) {
  const colors = RISK_COLORS[level];

  return (
    <div
      className={cn(
        'flex items-center gap-2 font-semibold',
        colors.text,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', colors.bg)} />
      <span>{score}</span>
    </div>
  );
}
