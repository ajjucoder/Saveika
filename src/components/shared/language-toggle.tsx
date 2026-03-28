'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, type Locale } from '@/providers/language-provider';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const LANGUAGES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
];

export function LanguageToggle({ className, variant = 'default' }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLanguage();

  const currentLanguage = LANGUAGES.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === 'compact' ? 'sm' : 'default'}
          className={`gap-2 ${className ?? ''}`}
        >
          <Globe className="h-4 w-4" />
          {variant === 'compact' ? (
            <span className="sr-only">{t('common.language')}</span>
          ) : (
            <span>{currentLanguage?.nativeLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <span className="flex items-center justify-between gap-4 w-full">
              <span>{language.label}</span>
              <span className="text-muted-foreground">{language.nativeLabel}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
