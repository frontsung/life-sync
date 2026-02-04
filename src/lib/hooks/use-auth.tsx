// src/lib/hooks/use-auth.ts
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getOrCreateUserProfile } from '@/app/actions';
import { UserProfile } from '@/lib/types';

// The shape of the authentication state
interface AuthState {
  user: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
}

// The shape of the context value
interface AuthContextType extends AuthState {
  // We might add functions here later, e.g., signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // This is to get the token for the initial session login
        const token = await firebaseUser.getIdToken();
        
        // We fetch the profile once
        const profile = await getOrCreateUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }, token);

        // And set all state at once
        if (profile && 'error' in profile) {
          console.error("Error getting user profile:", profile.error);
          setAuthState({ user: null, userProfile: null, isLoading: false });
        } else {
          setAuthState({
            user: firebaseUser,
            userProfile: profile as UserProfile | null,
            isLoading: false,
          });
        }
        
        // Log the session to the server
        fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        });

      } else {
        // User is signed out
        setAuthState({ user: null, userProfile: null, isLoading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  // We no longer need a separate idToken in the context state,
  // as it's an implementation detail for server actions.
  // Components that need it can get it from `user.getIdToken()`.
  const contextValue = {
    ...authState,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
