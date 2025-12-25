import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface File {
  id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  file_type: string;
  tags: string[];
  status: string;
  preview_url: string | null;
  download_url: string | null;
  metadata: Json;
  generation_params: Json;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  project_id: string;
  parent_folder_id: string | null;
  name: string;
  tags: string[];
  status: string;
  access_control: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useFiles(projectId: string, folderId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['files', projectId, folderId],
    queryFn: async () => {
      let query = supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as File[];
    },
    enabled: !!projectId,
  });

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', projectId, folderId],
    queryFn: async () => {
      let query = supabase
        .from('folders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('parent_folder_id', folderId);
      } else {
        query = query.is('parent_folder_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!projectId,
  });

  // Realtime subscription for file updates
  useEffect(() => {
    const channel = supabase
      .channel(`files-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['files', projectId] });

          if (payload.eventType === 'UPDATE') {
            const file = payload.new as File;
            if (file.status === 'completed') {
              toast({
                title: 'Generation complete',
                description: `"${file.name}" is ready.`,
              });
            } else if (file.status === 'failed') {
              toast({
                title: 'Generation failed',
                description: `Failed to generate "${file.name}".`,
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, toast]);

  const createFileMutation = useMutation({
    mutationFn: async (file: { id?: string; project_id: string; folder_id?: string | null; name: string; file_type: string; status?: string; generation_params?: Json }) => {
      const { data, error } = await supabase
        .from('files')
        .insert([file])
        .select()
        .single();

      if (error) throw error;
      return data as File;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          project_id: projectId,
          parent_folder_id: folderId || null,
          name,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
      toast({
        title: 'Folder created',
        description: 'Your folder has been created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateFileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; status?: string; preview_url?: string; download_url?: string; tags?: string[] } }) => {
      const { data, error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as File;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['files', projectId] });
      
      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData(['files', projectId, folderId]);
      
      // Optimistically update
      queryClient.setQueryData(['files', projectId, folderId], (old: File[] | undefined) => {
        if (!old) return old;
        return old.map(file => file.id === id ? { ...file, ...updates } : file);
      });
      
      return { previousFiles };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFiles) {
        queryClient.setQueryData(['files', projectId, folderId], context.previousFiles);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; status?: string; tags?: string[] } }) => {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Folder;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['folders', projectId] });
      
      const previousFolders = queryClient.getQueryData(['folders', projectId, folderId]);
      
      queryClient.setQueryData(['folders', projectId, folderId], (old: Folder[] | undefined) => {
        if (!old) return old;
        return old.map(folder => folder.id === id ? { ...folder, ...updates } : folder);
      });
      
      return { previousFolders };
    },
    onError: (err, variables, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders', projectId, folderId], context.previousFolders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('folders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
      toast({
        title: 'Folder deleted',
        description: 'The folder has been deleted.',
      });
    },
  });

  const bulkDeleteFilesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('files').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast({
        title: 'Files deleted',
        description: 'Selected files have been deleted.',
      });
    },
  });

  const bulkUpdateFilesMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: { status?: string; tags?: string[] } }) => {
      const { error } = await supabase.from('files').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast({
        title: 'Files updated',
        description: 'Selected files have been updated.',
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      toast({
        title: 'File deleted',
        description: 'The file has been deleted.',
      });
    },
  });

  return {
    files,
    folders,
    isLoading: filesLoading || foldersLoading,
    createFile: createFileMutation.mutateAsync,
    createFolder: createFolderMutation.mutateAsync,
    updateFile: updateFileMutation.mutateAsync,
    updateFolder: updateFolderMutation.mutateAsync,
    deleteFile: deleteFileMutation.mutateAsync,
    deleteFolder: deleteFolderMutation.mutateAsync,
    bulkDeleteFiles: bulkDeleteFilesMutation.mutateAsync,
    bulkUpdateFiles: bulkUpdateFilesMutation.mutateAsync,
  };
}
