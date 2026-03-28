// Tests for bottom-tabs safe-area CSS class

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BottomTabs } from '@/components/chw/bottom-tabs';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/app',
}));

// Mock language provider
vi.mock('@/providers/language-provider', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.home': 'Home',
        'nav.newVisit': 'New Visit',
        'nav.history': 'History',
        'nav.settings': 'Settings',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

describe('BottomTabs Safe Area', () => {
  it('should use a safe-area class that actually exists in globals.css', () => {
    // Read the globals.css file
    const cssPath = join(process.cwd(), 'src/app/globals.css');
    const cssContent = readFileSync(cssPath, 'utf-8');
    
    // Read the bottom-tabs component
    const componentPath = join(process.cwd(), 'src/components/chw/bottom-tabs.tsx');
    const componentContent = readFileSync(componentPath, 'utf-8');
    
    // Check if the component uses 'safe-area-bottom'
    const usesSafeAreaBottom = componentContent.includes('safe-area-bottom');
    
    if (usesSafeAreaBottom) {
      // If the component uses this class, it must be defined in CSS
      // This test should FAIL initially because safe-area-bottom is NOT in globals.css
      expect(cssContent).toContain('safe-area-bottom');
    }
  });

  it('should have either a valid Tailwind utility or CSS class for safe area', () => {
    render(<BottomTabs />);
    
    const nav = screen.getByRole('navigation');
    const classList = Array.from(nav.classList);
    
    // After fix, should have either:
    // 1. A valid Tailwind v4 utility (like pb-[env(safe-area-inset-bottom)])
    // 2. A class that exists in globals.css (like safe-area-bottom after we add it)
    
    // Check for any form of bottom padding or safe area handling
    const hasPaddingClass = classList.some(cls => 
      cls.startsWith('pb-') || cls.includes('safe-area') || cls === 'safe-area-bottom'
    );
    
    expect(hasPaddingClass).toBe(true);
  });
});
