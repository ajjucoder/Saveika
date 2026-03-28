'use client';

import { useLanguage } from '@/providers/language-provider';

export function WorkersHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('workers.title')}</h1>
      <p className="text-muted-foreground text-sm mt-1">
        {t('workers.subtitle')}
      </p>
    </div>
  );
}
