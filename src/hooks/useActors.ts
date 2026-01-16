import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { getEstimatedDuration } from '@/utils/generationEstimates';

export interface Actor {
  id: string;
  user_id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  mode: 'generate' | 'upload' | null;
  
  // Actor details (for AI generated)
  age: number | null;
  gender: string | null;
  language: string | null;
  accent: string | null;
  other_instructions: string | null;
  
  // User uploaded assets (for upload mode)
  custom_image_url: string | null;
  custom_audio_url: string | null;
  
  // Generated assets
  profile_image_url: string | null;      // Front-facing thumbnail for cards
  profile_360_url: string | null;        // Full 360° grid
  voice_url: string | null;              // Index TTS generated voice
  sora_video_url: string | null;         // Sora 2 video (generate mode only)
  sora_prompt: string | null;
  
  // Status
  error_message: string | null;
  progress: number;
  credits_cost: number;
  
  // Generation timing
  generation_started_at: string | null;
  estimated_duration_seconds: number | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateActorInput {
  name: string;
  mode: 'generate' | 'upload';
  age?: number;
  gender?: string;
  language?: string;
  accent?: string;
  other_instructions?: string;
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
      return data as unknown as Actor[];
    },
    enabled: !!user,
    refetchInterval: (query) => {
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
        toast.error('Insufficient credits', { 
          description: 'You need at least 1 credit to create an actor.',
          action: {
            label: 'Buy Credits',
            onClick: () => window.location.href = '/billing',
          },
        });
        throw new Error('Insufficient credits');
      }

      // Calculate estimated duration for actor creation
      const estimatedDuration = getEstimatedDuration({ type: 'create_actor' });

      // Create the actor record with generation timing
      const { data: actor, error: createError } = await supabase
        .from('actors')
        .insert({
          user_id: user.id,
          name: input.name,
          mode: input.mode,
          age: input.age || null,
          gender: input.gender || null,
          language: input.language || null,
          accent: input.accent || null,
          other_instructions: input.other_instructions || null,
          custom_image_url: input.custom_image_url || null,
          custom_audio_url: input.custom_audio_url || null,
          status: 'processing',
          progress: 0,
          credits_cost: 1,
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: estimatedDuration,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Note: Credit deduction is handled server-side by the trigger-generation edge function
      // The database trigger prevents client-side credit manipulation

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
              mode: input.mode,
              name: input.name,
              age: input.age,
              gender: input.gender,
              language: input.language,
              accent: input.accent,
              other_instructions: input.other_instructions,
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
      }

      return actor as unknown as Actor;
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
