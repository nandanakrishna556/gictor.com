import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import FileGrid from '@/components/files/FileGrid';
import CreateNewModal from '@/components/modals/CreateNewModal';
import CreateFolderDialog from '@/components/modals/CreateFolderDialog';
import CreatePipelineDialog from '@/components/modals/CreatePipelineDialog';
import CreateTagDialog from '@/components/modals/CreateTagDialog';
import { useFiles, Folder } from '@/hooks/useFiles';
import { usePipelines } from '@/hooks/usePipelines';
import { useTags } from '@/hooks/useTags';
import type { Project } from '@/hooks/useProjects';

export default function ProjectDetail() {
  const { projectId, folderId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<string | undefined>(undefined);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createPipelineOpen, setCreatePipelineOpen] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  // Fetch project details
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

  // Fetch current folder if in a folder
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

  const { files, folders, isLoading, createFolder, updateFile, updateFolder, deleteFile, deleteFolder, bulkDeleteFiles, bulkUpdateFiles } = useFiles(projectId!, folderId);
  const { pipelines, createPipeline } = usePipelines();
  const { tags, createTag, deleteTag } = useTags();

  // Filter files based on selected filters
  const filteredFiles = (files || []).filter((file) => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(file.status || '')) {
      return false;
    }
    if (selectedFileTypes.length > 0 && !selectedFileTypes.includes(file.file_type)) {
      return false;
    }
    if (selectedTags.length > 0) {
      const fileTags = file.tags || [];
      if (!selectedTags.some((t) => fileTags.includes(t))) {
        return false;
      }
    }
    return true;
  });

  // Build breadcrumbs
  const buildBreadcrumbs = (): { label: string; href?: string }[] => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'Projects', href: '/projects' }];

    if (project) {
      crumbs.push({
        label: project.name,
        href: folderId ? `/projects/${projectId}` : undefined,
      });
    }

    if (currentFolder) {
      crumbs.push({ label: currentFolder.name });
    }

    return crumbs;
  };

  const handleCreateFolder = async (name: string, status: string, selectedTags: string[]) => {
    await createFolder({ name, status, tags: selectedTags });
    setCreateFolderOpen(false);
  };

  const handleCreatePipeline = async (name: string, stages: any[]) => {
    await createPipeline({ name, stages });
    setCreatePipelineOpen(false);
  };

  const handleCreateTag = async (name: string, color: string) => {
    await createTag({ name, color });
    setCreateTagOpen(false);
  };

  const handleUpdateFileStatus = async (id: string, status: string) => {
    await updateFile({ id, updates: { status } });
  };

  const handleUpdateFileTags = async (id: string, newTags: string[]) => {
    await updateFile({ id, updates: { tags: newTags } });
  };

  const handleUpdateFolderStatus = async (id: string, status: string) => {
    await updateFolder({ id, updates: { status } });
  };

  const handleUpdateFolderTags = async (id: string, newTags: string[]) => {
    await updateFolder({ id, updates: { tags: newTags } });
  };

  const handleDeleteFile = async (id: string) => {
    await deleteFile(id);
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
  };

  const handleBulkDelete = async (ids: string[]) => {
    await bulkDeleteFiles(ids);
  };

  const handleBulkUpdateStatus = async (ids: string[], status: string) => {
    await bulkUpdateFiles({ ids, updates: { status } });
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedStatuses([]);
    setSelectedFileTypes([]);
  };

  const handleDeleteTag = async (id: string) => {
    await deleteTag(id);
    // Remove deleted tag from selected filters
    setSelectedTags((prev) => prev.filter((t) => t !== id));
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
          onCreateNew={() => {
            setCreateModalInitialStatus(undefined);
            setCreateModalOpen(true);
          }}
          showCreateButtons
          tags={tags}
          selectedTags={selectedTags}
          selectedStatuses={selectedStatuses}
          selectedFileTypes={selectedFileTypes}
          onTagsChange={setSelectedTags}
          onStatusesChange={setSelectedStatuses}
          onFileTypesChange={setSelectedFileTypes}
          onCreateTag={() => setCreateTagOpen(true)}
          onDeleteTag={handleDeleteTag}
          onClearFilters={handleClearFilters}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : viewMode === 'kanban' ? (
            // Always show FileGrid for kanban view (so pipeline controls are visible even when empty)
            <FileGrid
              files={filteredFiles}
              folders={folders || []}
              projectId={projectId}
              viewMode={viewMode}
              pipelines={pipelines}
              tags={tags}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              onCreatePipeline={() => setCreatePipelineOpen(true)}
              onCreateNew={(initialStatus) => {
                setCreateModalInitialStatus(initialStatus);
                setCreateModalOpen(true);
              }}
              onCreateTag={() => setCreateTagOpen(true)}
              onDeleteTag={handleDeleteTag}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onUpdateFileStatus={handleUpdateFileStatus}
              onUpdateFileTags={handleUpdateFileTags}
              onUpdateFolderStatus={handleUpdateFolderStatus}
              onUpdateFolderTags={handleUpdateFolderTags}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
            />
          ) : filteredFiles?.length === 0 && folders?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <svg
                  className="h-8 w-8 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                This project is empty
              </h2>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first content or organize with folders
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-apple hover:opacity-90"
              >
                Create new
              </button>
            </div>
          ) : (
            <FileGrid
              files={filteredFiles}
              folders={folders || []}
              projectId={projectId}
              viewMode={viewMode}
              pipelines={pipelines}
              tags={tags}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              onCreatePipeline={() => setCreatePipelineOpen(true)}
              onCreateNew={(initialStatus) => {
                setCreateModalInitialStatus(initialStatus);
                setCreateModalOpen(true);
              }}
              onCreateTag={() => setCreateTagOpen(true)}
              onDeleteTag={handleDeleteTag}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onUpdateFileStatus={handleUpdateFileStatus}
              onUpdateFileTags={handleUpdateFileTags}
              onUpdateFolderStatus={handleUpdateFolderStatus}
              onUpdateFolderTags={handleUpdateFolderTags}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
            />
          )}
        </div>
      </div>

      <CreateNewModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setCreateModalInitialStatus(undefined);
        }}
        projectId={projectId}
        folderId={folderId}
        onCreateFolder={() => setCreateFolderOpen(true)}
        initialStatus={createModalInitialStatus}
        tags={tags}
        onCreateTag={() => setCreateTagOpen(true)}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={handleCreateFolder}
        projectId={projectId}
        folderId={folderId}
        initialStatus={createModalInitialStatus}
        tags={tags}
        onCreateTag={() => setCreateTagOpen(true)}
      />

      <CreatePipelineDialog
        open={createPipelineOpen}
        onOpenChange={setCreatePipelineOpen}
        onSubmit={handleCreatePipeline}
      />

      <CreateTagDialog
        open={createTagOpen}
        onOpenChange={setCreateTagOpen}
        onSubmit={handleCreateTag}
      />
    </MainLayout>
  );
}
