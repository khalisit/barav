'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLanguage } from '@/hooks/use-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dir = language === 'ku' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language === 'ku' ? 'ku' : 'en';
  }, [language]);

  // Prevent flash of unlocalized content by matching default RTL/Kurdish structure during SSR
  if (!mounted) {
    return <div style={{ direction: 'rtl' }}>{children}</div>;
  }

  return <>{children}</>;
}
