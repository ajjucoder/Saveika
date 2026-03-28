'use client';

import { Home, PlusCircle, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';

const TABS = [
  { href: '/app', icon: Home, labelKey: 'nav.home' },
  { href: '/app/visit/new', icon: PlusCircle, labelKey: 'nav.newVisit' },
  { href: '/app/visits', icon: History, labelKey: 'nav.history' },
  { href: '/app/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Determine active tab - exact match for root, startsWith for others
  const getIsActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map((tab) => {
          const isActive = getIsActive(tab.href);
          const Icon = tab.icon;
          const label = t(tab.labelKey);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200 touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-xs', isActive && 'font-medium')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
