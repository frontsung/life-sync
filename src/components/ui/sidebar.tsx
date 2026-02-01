'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Wallet, 
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n-context';
import { useSidebar } from '@/lib/sidebar-context';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isOpen, close } = useSidebar();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    close();
  }, [pathname]);

  const links = [
    { href: '/', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/schedule', label: t('scheduleManagement'), icon: Calendar },
    { href: '/todo', label: t('todoManagement'), icon: CheckSquare },
    { href: '/finance', label: t('financeManagement'), icon: Wallet },
    { href: '/secret', label: t('secretSpace'), icon: Lock },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed lg:sticky top-[64px] left-0 z-40 w-64 h-[calc(100vh-64px)] bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full py-6 px-4">
          <ul className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              
              const isDashboard = link.href === '/';
              const isExactMatch = pathname === '/';
              const active = isDashboard ? isExactMatch : isActive;

              return (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={close} // Close on click for mobile
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
