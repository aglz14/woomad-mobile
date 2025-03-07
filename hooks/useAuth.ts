import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'user';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [session, setSession] = useState<Session | null>(null);

  // Reset auth state
  const resetAuthState = () => {
    setSession(null);
    setRole('user');
    setIsAdmin(false);
  };

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      resetAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  const handleAuthStateChange = async (event: string, session: Session | null) => {
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
      }
    } else {
      resetAuthState();
    }
  };

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError && sessionError.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        console.error('Session error:', sessionError);
        resetAuthState();
        return;
      }
      
      if (currentSession) {
        await handleAuthStateChange('INITIAL_SESSION', currentSession);
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('Error checking user:', error);
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading, role, session, signOut };
}