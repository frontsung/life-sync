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

import { useAuth } from "@/lib/hooks/use-auth";
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { Button } from './button';
import { LogOut } from 'lucide-react';

import { useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { isOpen, close } = useSidebar();
  const { user, userProfile } = useAuth();
  const router = useRouter();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    if(isOpen){
      close();
    }
  }, [pathname]);

  const links = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/schedule', label: t('scheduleManagement'), icon: Calendar },
    { href: '/todo', label: t('todoManagement'), icon: CheckSquare },
    { href: '/finance', label: t('financeManagement'), icon: Wallet },
    { href: '/secret', label: t('secretSpace'), icon: Lock },
  ];

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      await signOut(auth); // Sign out from Firebase on the client
      await fetch('/api/sessionLogout', { method: 'POST' }); // Clear server session
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

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
        "fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
        "flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-1 py-6 px-4">
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

        <div className="p-4 border-t">
          {user ? (
            <div className="flex items-center gap-3">
              <Image
                src={userProfile?.photoURL || '/default-avatar.svg'}
                alt="User"
                width={40}
                height={40}
                unoptimized
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{userProfile?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Login
              </Button>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
