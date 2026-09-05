'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { navSections } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';

const getNavKey = (label: string) => {
  if (label === 'Revenue & Expenses') return 'nav.revenue';
  return 'nav.' + label.toLowerCase().replace(' ', '-');
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      });
    }
  }, [pathname]);

  return (
    <div className="flex h-full flex-col border-e border-sidebar-border bg-sidebar" dir={language === 'ku' ? 'rtl' : 'ltr'}>
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4 xl:gap-2.5 xl:px-6">
        <Image
          src="/logo.png"
          alt="Barav Quiz"
          width={36}
          height={36}
          className="rounded-md object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
            Barav Quiz
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {language === 'ku' ? 'پەنێڵی بەڕێوەبەر' : 'Admin Panel'}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3 xl:px-3 xl:py-4" dir={language === 'ku' ? 'rtl' : 'ltr'}>
        <nav className="space-y-6">
          {navSections.map((section) => {
            const visibleItems = section.items;
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:px-3 xl:text-[11px]">
                  {t('nav.' + section.label.toLowerCase())}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        ref={isActive ? activeRef : null}
                        onClick={onNavigate}
                        className={cn(
                          'group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.96] xl:gap-3 xl:px-3 xl:py-2',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-md bg-primary/10"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                        <Icon
                          className={cn(
                            'relative h-4 w-4 shrink-0',
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        <span className="relative">{t(getNavKey(item.label))}</span>
                        {item.badge && (
                          <span className="relative ms-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3 xl:p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 xl:p-3">
          <p className="text-xs font-semibold text-foreground">Barav Quiz</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {language === 'ku' ? 'دڵخۆش بە لەگەڵمان' : 'Be Happy With Us'}
          </p>
        </div>
      </div>
    </div>
  );
}
