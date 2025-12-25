import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import FileGrid from '@/components/files/FileGrid';
import CreateNewModal from '@/components/modals/CreateNewModal';
import CreateFolderDialog from '@/components/modals/CreateFolderDialog';
import { useFiles, Folder } from '@/hooks/useFiles';
import type { Project } from '@/hooks/useProjects';
import type { FilterState } from '@/components/files/FilterPopover';

export default function ProjectDetail() {
  const { projectId, folderId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ statuses: [], fileTypes: [], tags: [] });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });

  const { data: currentFolder } = useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId!)
        .single();
      if (error) throw error;
      return data as Folder;
    },
    enabled: !!folderId,
  });

  const { files, folders, isLoading, createFolder, updateFile, deleteFile } = useFiles(projectId!, folderId);

  const buildBreadcrumbs = (): { label: string; href?: string }[] => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'Projects', href: '/projects' }];
    if (project) {
      crumbs.push({ label: project.name, href: folderId ? `/projects/${projectId}` : undefined });
    }
    if (currentFolder) {
      crumbs.push({ label: currentFolder.name });
    }
    return crumbs;
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name);
    setCreateFolderOpen(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateFile({ id, updates: { status } });
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await updateFile({ id, updates: { tags } });
  };

  if (!projectId) {
    navigate('/projects');
    return null;
  }

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader
          breadcrumbs={buildBreadcrumbs()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onCreateNew={() => setCreateModalOpen(true)}
          showCreateButtons
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : files?.length === 0 && folders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">This project is empty</h2>
              <p className="mb-6 text-center text-muted-foreground">Create your first content or organize with folders</p>
              <button onClick={() => setCreateModalOpen(true)} className="rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-apple hover:opacity-90">
                Create new
              </button>
            </div>
          ) : (
            <FileGrid
              files={files || []}
              folders={folders || []}
              projectId={projectId}
              viewMode={viewMode}
              filters={filters}
              onCreateNew={() => setCreateModalOpen(true)}
              onDeleteFile={deleteFile}
              onUpdateFileStatus={handleUpdateStatus}
              onUpdateFileTags={handleUpdateTags}
            />
          )}
        </div>
      </div>

      <CreateNewModal open={createModalOpen} onOpenChange={setCreateModalOpen} projectId={projectId} folderId={folderId} />
      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} onSubmit={handleCreateFolder} />
    </MainLayout>
  );
}
