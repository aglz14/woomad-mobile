import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'user';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [session, setSession] = useState<Session | null>(null);

  const resetAuthState = () => {
    setSession(null);
    setRole('user');
    setIsAdmin(false);
    setIsLoading(false);
  };

  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      resetAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    if (event === 'SIGNED_OUT') {
      resetAuthState();
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
          return;
        }

        if (profile) {
          const userRole = profile.role as UserRole;
          setRole(userRole);
          setIsAdmin(userRole === 'admin');
        }
        setIsLoading(false);
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
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      setIsLoading(true);
      const { 
        data: { session: currentSession }, 
        error: sessionError 
      } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        resetAuthState();
        return;
      }
      
      if (currentSession) {
        await handleAuthStateChange('INITIAL_SESSION', currentSession);
      } else {
        resetAuthState();
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      resetAuthState();
    } finally {
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading, role, session, signOut };
}