'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [commandOpen, setCommandOpen] = useState(false);

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
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <button
          onClick={() => setCommandOpen(true)}
          className="group flex w-full max-w-md items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:max-w-sm"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user ? getInitials(user.name) : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {user?.name ?? 'Admin'}
                  </p>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {user?.role.replace('_', ' ') ?? 'admin'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                className="text-destructive focus:text-destructive"
              >
                Log out
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
                  <Icon className="mr-2 h-4 w-4" />
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
