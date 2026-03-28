'use client';

import { Label } from '@/components/ui/label';
import { useLanguage } from '@/providers/language-provider';
import { SCREENING_SIGNALS, RESPONSE_OPTIONS } from '@/lib/signals';
import { normalizeVisitResponses } from '@/lib/visit-responses';
import { cn } from '@/lib/utils';
import type { VisitResponses } from '@/lib/types';

interface SignalBreakdownProps {
  responses: VisitResponses;
  className?: string;
  compact?: boolean;
}

export function SignalBreakdown({ responses, className, compact = false }: SignalBreakdownProps) {
  const { locale } = useLanguage();
  const normalizedResponses = normalizeVisitResponses(responses);

  return (
    <div className={cn('space-y-3', compact && 'space-y-1.5', className)}>
      {SCREENING_SIGNALS.map((signal, index) => {
        const value = normalizedResponses[signal.key as keyof VisitResponses];
        const signalLabel = locale === 'ne' ? signal.label_ne : signal.label_en;
        const responseOption = RESPONSE_OPTIONS.find((r) => r.value === value);
        const responseLabel = responseOption
          ? locale === 'ne'
            ? responseOption.label_ne
            : responseOption.label_en
          : String(value);

        return (
          <div key={signal.key} className={cn('flex items-start gap-3', compact && 'gap-2')}>
            <span className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium',
              compact && 'w-5 h-5 text-[10px]'
            )}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Label className={cn('text-sm', compact && 'text-xs')}>{signalLabel}</Label>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    value === 0 && 'bg-muted text-muted-foreground',
                    value === 1 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                    value === 2 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                    value === 3 && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                    compact && 'text-[10px] px-1.5'
                  )}
                >
                  {responseLabel}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
