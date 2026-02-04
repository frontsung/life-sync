'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { LanguageProvider } from '@/lib/i18n-context';
import { SidebarProvider } from '@/lib/sidebar-context';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/lib/hooks/use-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  // We should always wrap children with providers.
  // The 'mounted' check inside individual components (like Navbar) handles UI hydration mismatches.
  // Unwrapping providers here causes 'useContext' to fail in child components during initial render.
  
  return (
    <AuthProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <SidebarProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SidebarProvider>
        </LanguageProvider>
      </NextThemesProvider>
    </AuthProvider>
  );
}