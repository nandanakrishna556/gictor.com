import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  user_id: string;
  tag_name: string;
  color: string;
  created_at: string;
}

export function useTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user?.id,
  });

  const createTagMutation = useMutation({
    mutationFn: async (tag: { tag_name: string; color?: string }) => {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user!.id,
          tag_name: tag.tag_name,
          color: tag.color || '#007AFF',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag created',
        description: 'Your tag has been created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create tag.',
        variant: 'destructive',
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag deleted',
        description: 'The tag has been deleted.',
      });
    },
  });

  return {
    tags: tags || [],
    isLoading,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
  };
}
