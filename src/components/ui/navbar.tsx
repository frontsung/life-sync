'use client';

import * as React from 'react';
import Link from "next/link";
import { CalendarClock, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n-context";
import { useSidebar } from "@/lib/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/hooks/use-auth";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toggle } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    setMounted(true);
  }, []);



  if (!mounted) {
    return (
      <nav className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
             <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CalendarClock className="w-6 h-6 text-primary" />
                </div>
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Life Sync
                </span>
             </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4">
             {/* Mobile Menu Toggle */}
             {user && (
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggle}>
                  <Menu className="w-5 h-5" />
                </Button>
             )}

             <Link href="/" className="flex items-center gap-2">
               <div className="bg-primary/10 p-2 rounded-lg">
                 <CalendarClock className="w-6 h-6 text-primary" />
               </div>
               <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent hidden sm:inline-block">
                 {t('appTitle')}
               </span>
               {/* Mobile Title (Smaller/Icon only if needed, but let's keep text for now) */}
               <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent sm:hidden">
                 Life Sync
               </span>
             </Link>
          </div>

          <div className="flex items-center gap-2">
             
             {/* Language Toggle */}
             <div className="flex items-center border rounded-md bg-background/50 p-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={cn("px-2 py-1 text-xs font-medium rounded-sm transition-colors", language === 'en' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ko')}
                  className={cn("px-2 py-1 text-xs font-medium rounded-sm transition-colors", language === 'ko' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  KO
                </button>
             </div>

             {/* Theme Toggle */}
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle Theme"
             >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
             </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
