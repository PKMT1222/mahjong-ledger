'use client';

import { ThemeProvider } from './ThemeProvider';
import { LanguageProvider } from './LanguageProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
