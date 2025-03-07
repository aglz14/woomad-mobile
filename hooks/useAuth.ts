import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

type UserRole = 'admin' | 'user';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('user');
  const [session, setSession] = useState<Session | null>(null);

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setSession(null);
      setRole('user');
      setIsAdmin(false);
      // Router will handle navigation through onAuthStateChange
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          if (profile) {
            const userRole = profile.role as UserRole;
            setRole(userRole);
            setIsAdmin(userRole === 'admin');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      setSession(session);
      
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          const userRole = profile.role as UserRole;
          setRole(userRole);
          setIsAdmin(userRole === 'admin');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading, role, session, signOut };
}