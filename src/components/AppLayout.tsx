'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { Navbar } from '@/components/ui/navbar';
import { useSidebar } from '@/lib/sidebar-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  // Calculate main content left margin based on sidebar state for desktop
  // Sidebar width is fixed at w-64 (16rem)
  const mainContentLeftMargin = isOpen ? 'lg:ml-64' : 'lg:ml-0';

  return (
    <div className="relative flex flex-col h-full"> {/* Root container for AppLayout */}
      <Navbar /> {/* Stays at the top */}

      {/* Main content area below Navbar */}
      <div className="relative flex flex-1"> {/* This will be the area that fills remaining space below navbar */}

        {/* Sidebar - fixed positioning */}
        {/* On desktop, it will appear to be part of the flow, on mobile it will be fixed and hidden/shown */}
        {/* The Sidebar component itself needs to handle its fixed/sticky positioning */}
        <Sidebar />

        {/* Main Content - takes remaining space, pushes content when sidebar is open */}
        {/* Use padding-left or margin-left to push content based on sidebar width */}
        <main className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${mainContentLeftMargin}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
