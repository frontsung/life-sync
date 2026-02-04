// src/app/login/page.tsx
'use client';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc'; // Assuming react-icons is installed

import { useLanguage } from '@/lib/i18n-context';


export default function LoginPage() {
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during Google login:', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error during Guest login:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border">
        <h1 className="text-3xl font-bold text-center text-foreground">{t('welcome')}</h1>
        <p className="text-center text-muted-foreground">{t('signInMessage')}</p>
        
        <Button 
          onClick={handleGoogleLogin} 
          className="w-full py-2 px-4 border border-input rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
        >
          <FcGoogle className="h-5 w-5" />
          <span>{t('googleLogin')}</span>
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t('or')}</span>
          </div>
        </div>

        <Button 
          onClick={handleGuestLogin} 
          variant="secondary" 
          className="w-full py-2 px-4 rounded-md shadow-sm"
        >
          {t('guestLogin')}
        </Button>
      </div>
    </div>
  );
}
