'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AppLayout from './AppLayout';
import { useRouter } from 'next/navigation';
import React from 'react';

const publicPaths = ['/', '/login'];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isPublic = publicPaths.includes(pathname);

  React.useEffect(() => {
    if (!isLoading && user && isPublic) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, isPublic, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!user && !isPublic) {
    // The middleware should have already started the redirect.
    // We show a loader as a fallback.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if(user && !isPublic){
      return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
}
