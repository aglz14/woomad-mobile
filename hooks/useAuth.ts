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
  const [authError, setAuthError] = useState<string | null>(null);

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

      if (event === 'SIGNED_OUT') {
        router.replace('/auth/login');
        return;
      }
      
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
          setAuthError(null);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuthError('Error loading user profile');
        }
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      setAuthError(null);
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
      setAuthError('Error checking authentication status');
      
      // If there's an auth error, redirect to login
      if (error.message?.includes('refresh_token_not_found')) {
        router.replace('/auth/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { isAdmin, isLoading, role, session, authError, signOut };
}