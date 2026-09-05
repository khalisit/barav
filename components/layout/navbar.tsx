'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Sidebar } from '@/components/layout/sidebar';
import { ThemeSwitcher } from '@/components/shared/theme-switcher';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useLanguage } from '@/hooks/use-language';
import { usePresence } from '@/hooks/use-presence';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useLogout } from '@/features/auth/hooks/use-auth-mutations';
import { getInitials } from '@/lib/format';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { navSections } from '@/lib/navigation';
import type { LucideIcon } from 'lucide-react';

export function Navbar() {
  const { user } = useAuth();
  const logout = useLogout();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { onlineCount } = usePresence();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const flatNav = navSections
    .flatMap((s) => s.items)
    .map(({ label, href, icon }) => ({ label, href, icon }));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 md:px-6">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={language === 'ku' ? 'right' : 'left'} className="w-72 p-0" dir={language === 'ku' ? 'rtl' : 'ltr'}>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        <button
          onClick={() => setCommandOpen(true)}
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-sm sm:px-3 sm:py-2 md:max-w-md"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-start">{language === 'ku' ? 'گەڕان...' : 'Search...'}</span>
          <kbd className="hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeSwitcher />
          <LanguageSwitcher />
          <div className="hidden h-8 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-success sm:flex sm:px-3">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </div>
            <span className="text-sm font-semibold">{onlineCount}</span>
            <span className="hidden text-xs font-medium md:inline">
              {language === 'ku' ? 'ئۆنلاین' : 'Online'}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ms-1 flex items-center gap-2 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary" aria-label="User menu">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name} />
                  <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('account.title')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                {t('account.profile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                className="text-destructive focus:text-destructive"
              >
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {flatNav.map((item) => {
              const Icon = item.icon as LucideIcon;
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    router.push(item.href);
                    setCommandOpen(false);
                  }}
                >
                  <Icon className="me-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
