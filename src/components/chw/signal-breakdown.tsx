'use client';

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

const RESPONSE_STYLES: Record<number, { bg: string; text: string; dot: string }> = {
  0: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  1: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  2: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  3: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export function SignalBreakdown({ responses, className, compact = false }: SignalBreakdownProps) {
  const { locale } = useLanguage();
  const normalizedResponses = normalizeVisitResponses(responses);

  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5', className)}>
      {SCREENING_SIGNALS.map((signal, index) => {
        const value = normalizedResponses[signal.key as keyof VisitResponses];
        const signalLabel = locale === 'ne' ? signal.label_ne : signal.label_en;
        const responseOption = RESPONSE_OPTIONS.find((r) => r.value === value);
        const responseLabel = responseOption
          ? locale === 'ne'
            ? responseOption.label_ne
            : responseOption.label_en
          : String(value);
        
        const styles = RESPONSE_STYLES[value] || RESPONSE_STYLES[0];

        return (
          <div 
            key={signal.key} 
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors',
              compact && 'p-2 gap-2'
            )}
          >
            <span className={cn(
              'flex-shrink-0 size-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground',
              compact && 'w-4 h-4 text-[8px]'
            )}>
              {index + 1}
            </span>
            <span className={cn(
              'flex-1 text-xs font-medium text-foreground/90',
              compact && 'text-[10px]'
            )}>
              {signalLabel}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full',
                styles.bg,
                styles.text,
                compact && 'text-[9px] px-1.5 py-0.5'
              )}
            >
              <span className={cn('size-1.5 rounded-full', styles.dot)} />
              {responseLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
