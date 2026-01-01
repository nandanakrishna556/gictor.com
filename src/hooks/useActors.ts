import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Actor {
  id: string;
  user_id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  age: string | null;
  gender: string | null;
  accent: string | null;
  physical_details: Record<string, string>;
  personality_details: Record<string, string>;
  voice_details: Record<string, string>;
  custom_image_url: string | null;
  custom_audio_url: string | null;
  sora_prompt: string | null;
  sora_video_url: string | null;
  voice_url: string | null;
  profile_image_url: string | null;
  error_message: string | null;
  progress: number;
  credits_cost: number;
  created_at: string;
  updated_at: string;
}

export interface CreateActorInput {
  name: string;
  age?: string;
  gender?: string;
  accent?: string;
  physical_details?: Record<string, string>;
  personality_details?: Record<string, string>;
  voice_details?: Record<string, string>;
  custom_image_url?: string;
  custom_audio_url?: string;
}

export function useActors() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: actors, isLoading, error } = useQuery({
    queryKey: ['actors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Actor[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds if any actors are processing
      const data = query.state.data as Actor[] | undefined;
      const hasProcessing = data?.some(actor => actor.status === 'processing');
      return hasProcessing ? 5000 : false;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('actors-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actors',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['actors'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const createActorMutation = useMutation({
    mutationFn: async (input: CreateActorInput) => {
      if (!user) throw new Error('Not authenticated');
      if (!profile || profile.credits < 1) {
        throw new Error('Insufficient credits');
      }

      // Create the actor record
      const { data: actor, error: createError } = await supabase
        .from('actors')
        .insert({
          user_id: user.id,
          name: input.name,
          age: input.age || null,
          gender: input.gender || null,
          accent: input.accent || null,
          physical_details: input.physical_details || {},
          personality_details: input.personality_details || {},
          voice_details: input.voice_details || {},
          custom_image_url: input.custom_image_url || null,
          custom_audio_url: input.custom_audio_url || null,
          status: 'processing',
          progress: 0,
          credits_cost: 1,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Deduct 1 credit from user's profile
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', user.id);

      if (creditError) throw creditError;

      // Log credit transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -1,
        transaction_type: 'usage',
        description: 'Actor creation',
      });

      // Refresh session for fresh token
      await supabase.auth.refreshSession();
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Call the trigger-generation edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-generation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData?.session?.access_token}`,
          },
          body: JSON.stringify({
            type: 'create_actor',
            payload: {
              actor_id: actor.id,
              user_id: user.id,
              name: input.name,
              age: input.age,
              gender: input.gender,
              accent: input.accent,
              physical_details: input.physical_details,
              personality_details: input.personality_details,
              voice_details: input.voice_details,
              custom_image_url: input.custom_image_url,
              custom_audio_url: input.custom_audio_url,
              credits_cost: 1,
              supabase_url: import.meta.env.VITE_SUPABASE_URL,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Trigger generation error:', errorData);
        // Don't throw - actor is created, n8n will process it
      }

      return actor as Actor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Actor creation started');
    },
    onError: (error) => {
      console.error('Create actor error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create actor');
    },
  });

  const deleteActorMutation = useMutation({
    mutationFn: async (actorId: string) => {
      const { error } = await supabase
        .from('actors')
        .delete()
        .eq('id', actorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actors'] });
      toast.success('Actor deleted');
    },
    onError: (error) => {
      console.error('Delete actor error:', error);
      toast.error('Failed to delete actor');
    },
  });

  return {
    actors,
    isLoading,
    error,
    createActor: createActorMutation.mutateAsync,
    deleteActor: deleteActorMutation.mutateAsync,
    isCreating: createActorMutation.isPending,
  };
}
