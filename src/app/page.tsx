// src/app/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { useLanguage } from '@/lib/i18n-context';


export default function LandingPage() {
  console.log("LandingPage rendered."); // Added log
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">{t('welcome')}</h1>
      <p className="text-lg text-muted-foreground mb-8">{t('signInMessage')}</p>
      <div className="space-x-4">
        <Link href="/login">
          <Button size="lg">{t('getStarted')}</Button>
        </Link>
      </div>
    </div>
  );
}