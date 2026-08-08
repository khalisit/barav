'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { navSections } from '@/lib/navigation';
import { useAuth } from '@/features/auth/components/auth-provider';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <Image
          src="/logo.png"
          alt="Barav Quiz"
          width={36}
          height={36}
          className="rounded-lg object-cover"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
            Barav Quiz
          </span>
          <span className="text-[11px] text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
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
                        onClick={onNavigate}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
                        <span className="relative">{item.label}</span>
                        {item.badge && (
                          <span className="relative ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
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

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-3">
          <p className="text-xs font-semibold text-foreground">Barav Quiz Pro</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Enterprise plan active
          </p>
        </div>
      </div>
    </div>
  );
}
