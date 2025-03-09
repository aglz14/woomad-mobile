import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

type UserRole = 'admin' | 'user';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [session, setSession] = useState<Session | null>(null);

  // Reset auth state and clear session
  const resetAuthState = () => {
    setSession(null);
    setRole('user');
    setIsAdmin(false);
  };

  async function signOut() {
    try {
      setIsLoading(true);
      // First try to get the current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      // If there's no session, just reset the auth state
      if (!currentSession) {
        resetAuthState();
        router.replace('/auth/login');
        return;
      }

      // If we have a session, try to sign out
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (signOutError) {
        console.error('Error in signOut:', signOutError);
        // Even if sign out fails, we'll reset the local state
      }

      resetAuthState();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, we'll reset the local state
      resetAuthState();
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }

  const handleAuthStateChange = async (
    event: string,
    session: Session | null
  ) => {
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
      resetAuthState();
      setIsLoading(false);
      return;
    }

    setSession(session);

    if (session?.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          resetAuthState();
          setIsLoading(false);
          return;
        }

        if (profile) {
          const userRole = profile.role as UserRole;
          setRole(userRole);
          setIsAdmin(userRole === 'admin');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        resetAuthState();
      } finally {
        setIsLoading(false);
      }
    } else {
      resetAuthState();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      handleAuthStateChange(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      setIsLoading(true);
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError &&
        sessionError.message !==
          'Invalid Refresh Token: Refresh Token Not Found'
      ) {
        console.error('Session error:', sessionError);
        resetAuthState();
        setIsLoading(false);
        return;
      }

      if (currentSession) {
        await handleAuthStateChange('INITIAL_SESSION', currentSession);
      } else {
        resetAuthState();
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      resetAuthState();
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading, role, session, signOut };
}
