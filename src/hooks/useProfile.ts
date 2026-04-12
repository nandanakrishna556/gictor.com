import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  // Check subscription status on load and periodically
  useEffect(() => {
    if (!user) return;

    const checkSubscription = async () => {
      try {
        await supabase.functions.invoke('check-subscription');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (e) {
        console.error('Failed to check subscription:', e);
      }
    };

    checkSubscription();
    const interval = setInterval(checkSubscription, 60000); // every minute
    return () => clearInterval(interval);
  }, [user, queryClient]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Check subscription status on load and periodically
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const checkSubscription = async () => {
      try {
        await supabase.functions.invoke('check-subscription');
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch (e) {
        console.error('Failed to check subscription:', e);
      }
    };

    // Delay initial check to avoid interfering with React's render cycle
    const timeout = setTimeout(checkSubscription, 2000);
    const interval = setInterval(checkSubscription, 60000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user, queryClient]);

  // NOTE: Credit operations are handled server-side in the trigger-generation edge function
  // to ensure security and prevent client-side manipulation.

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutateAsync,
    refetch,
  };
}
