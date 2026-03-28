'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/providers/language-provider';

interface DisclaimerBannerProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function DisclaimerBanner({ className, variant = 'default' }: DisclaimerBannerProps) {
  const { t } = useLanguage();

  if (variant === 'compact') {
    return (
      <p className={`text-xs text-muted-foreground italic ${className ?? ''}`}>
        {t('disclaimer.text')}
      </p>
    );
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:bg-amber-950/20 ${className ?? ''}`}>
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <span className="font-medium">{t('disclaimer.title')}: </span>
        {t('disclaimer.text')}
      </AlertDescription>
    </Alert>
  );
}
