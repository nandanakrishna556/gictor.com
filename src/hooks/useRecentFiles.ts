import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface RecentFile {
  id: string;
  name: string;
  file_type: string;
  preview_url: string | null;
  status: string;
  project_id: string;
  project_name: string;
  updated_at: string;
  metadata: Json;
  generation_params: Json;
  download_url: string | null;
  error_message: string | null;
}

export function useRecentFiles(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-files', user?.id, limit],
    queryFn: async () => {
      // First get user's projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user!.id);

      if (projectsError) throw projectsError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);
      const projectMap = new Map(projects.map((p) => [p.id, p.name]));

      // Fetch recent files from those projects
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('project_id', projectIds)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (filesError) throw filesError;

      return (files || []).map((file) => ({
        ...file,
        project_name: projectMap.get(file.project_id) || 'Unknown Project',
      })) as RecentFile[];
    },
    enabled: !!user,
  });
}
