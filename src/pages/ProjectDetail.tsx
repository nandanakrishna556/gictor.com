import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { ProjectDetailSkeleton } from '@/components/files/ProjectDetailSkeleton';
import FileGrid from '@/components/files/FileGrid';
import CreateNewModal from '@/components/modals/CreateNewModal';
import CreateFolderDialog from '@/components/modals/CreateFolderDialog';
import CreatePipelineDialog from '@/components/modals/CreatePipelineDialog';
import CreateTagDialog from '@/components/modals/CreateTagDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import { FileDetailModalEnhanced } from '@/components/files/FileDetailModalEnhanced';
import PipelineModal from '@/components/pipeline/PipelineModal';
import ClipsPipelineModal from '@/components/pipeline/ClipsPipelineModal';
import TalkingHeadModal from '@/components/modals/TalkingHeadModal';
import { useFiles, Folder, File } from '@/hooks/useFiles';
import { useFileRealtime } from '@/hooks/useFileRealtime';
import { usePipelines, Pipeline, PipelineStage, DEFAULT_STAGES } from '@/hooks/usePipelines';
import { useTags } from '@/hooks/useTags';
import type { Project } from '@/hooks/useProjects';

export default function ProjectDetail() {
  const { projectId, folderId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<string | undefined>(undefined);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderInitialStatus, setCreateFolderInitialStatus] = useState<string | undefined>(undefined);
  const [createPipelineOpen, setCreatePipelineOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editingDefaultPipeline, setEditingDefaultPipeline] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);

  // Confirmation dialog states
  const [deleteFileConfirm, setDeleteFileConfirm] = useState<{ open: boolean; file: File | null }>({ open: false, file: null });
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ open: boolean; folder: Folder | null }>({ open: false, folder: null });
  const [deletePipelineConfirm, setDeletePipelineConfirm] = useState<{ open: boolean; pipeline: Pipeline | null }>({ open: false, pipeline: null });
  
  // File detail modal state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Pipeline modal state for talking head files
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [openPipelineId, setOpenPipelineId] = useState<string | null>(null);
  
  // B-Roll pipeline modal state
  const [brollPipelineModalOpen, setBrollPipelineModalOpen] = useState(false);
  const [openBrollPipelineId, setOpenBrollPipelineId] = useState<string | null>(null);
  
  // Talking Head modal state
  const [talkingHeadModalOpen, setTalkingHeadModalOpen] = useState(false);
  const [openTalkingHeadFileId, setOpenTalkingHeadFileId] = useState<string | null>(null);

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

  // Fetch folder ancestry for breadcrumbs
  const { data: folderAncestry } = useQuery({
    queryKey: ['folder-ancestry', folderId],
    queryFn: async () => {
      if (!folderId) return [];
      
      const ancestry: Folder[] = [];
      let currentId: string | null = folderId;
      
      while (currentId) {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('id', currentId)
          .single();
        
        if (error || !data) break;
        ancestry.unshift(data as Folder);
        currentId = data.parent_folder_id;
      }
      
      return ancestry;
    },
    enabled: !!folderId,
  });

  const currentFolder = folderAncestry?.[folderAncestry.length - 1];

  const { files, folders, isLoading, createFolder, updateFile, updateFolder, deleteFile, deleteFolder, bulkDeleteFiles, bulkUpdateFiles } = useFiles(projectId!, folderId);
  const { pipelines, createPipeline, updatePipeline, deletePipeline, updateDefaultStages, defaultStages } = usePipelines();
  const { tags, createTag, deleteTag } = useTags();
  
  // Enable real-time updates for file status changes
  useFileRealtime(projectId);

  // Get current pipeline stages for status options
  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const currentStatusOptions = (currentPipeline?.stages || defaultStages).map((stage) => ({
    value: stage.id,
    label: stage.name,
    color: stage.color,
  }));

  // Filter files based on selected filters and search
  const filteredFiles = (files || []).filter((file) => {
    // Search filter
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
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

  // Build breadcrumbs with full folder path (starting with project, not "Projects" page)
  const buildBreadcrumbs = (): { label: string; href?: string }[] => {
    const crumbs: { label: string; href?: string }[] = [];

    if (project) {
      // Project is first item, clickable if we're in a folder
      crumbs.push({
        label: project.name,
        href: folderId ? `/projects/${projectId}` : undefined,
      });
    }

    // Add all folder ancestors
    if (folderAncestry) {
      folderAncestry.forEach((folder, index) => {
        const isLast = index === folderAncestry.length - 1;
        crumbs.push({
          label: folder.name,
          href: isLast ? undefined : `/projects/${projectId}/folder/${folder.id}`,
        });
      });
    }

    return crumbs;
  };

  const handleCreateFolder = async (name: string, status: string, selectedTags: string[]) => {
    await createFolder({ name, status, tags: selectedTags });
    setCreateFolderOpen(false);
  };

  const handleCreatePipeline = async (name: string, stages: PipelineStage[]) => {
    if (editingDefaultPipeline) {
      // Update default pipeline stages
      await updateDefaultStages(stages);
      setCreatePipelineOpen(false);
      setEditingDefaultPipeline(false);
    } else if (editingPipeline) {
      await updatePipeline({ id: editingPipeline.id, name, stages });
      setCreatePipelineOpen(false);
      setEditingPipeline(null);
    } else {
      await createPipeline({ name, stages });
      setCreatePipelineOpen(false);
    }
  };

  const handleDeletePipeline = async (id: string) => {
    await deletePipeline(id);
    if (selectedPipelineId === id) {
      setSelectedPipelineId(null);
    }
    setCreatePipelineOpen(false);
    setEditingPipeline(null);
    setDeletePipelineConfirm({ open: false, pipeline: null });
  };

  const handleEditPipeline = (pipeline: Pipeline | null) => {
    if (pipeline === null) {
      // Edit default pipeline
      setEditingDefaultPipeline(true);
      setEditingPipeline(null);
    } else {
      setEditingPipeline(pipeline);
      setEditingDefaultPipeline(false);
    }
    setCreatePipelineOpen(true);
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

  const handleUpdateFileName = async (id: string, name: string) => {
    await updateFile({ id, updates: { name } });
  };

  const handleUpdateFolderName = async (id: string, name: string) => {
    await updateFolder({ id, updates: { name } });
  };

  const handleDeleteFileRequest = (id: string) => {
    const file = files?.find(f => f.id === id);
    if (file) {
      setDeleteFileConfirm({ open: true, file });
    }
  };

  const handleDeleteFileConfirm = async () => {
    if (deleteFileConfirm.file) {
      await deleteFile(deleteFileConfirm.file.id);
      setDeleteFileConfirm({ open: false, file: null });
    }
  };

  const handleDeleteFolderRequest = (id: string) => {
    const folder = folders?.find(f => f.id === id);
    if (folder) {
      setDeleteFolderConfirm({ open: true, folder });
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (deleteFolderConfirm.folder) {
      await deleteFolder(deleteFolderConfirm.folder.id);
      setDeleteFolderConfirm({ open: false, folder: null });
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    await bulkDeleteFiles(ids);
  };

  const handleBulkUpdateStatus = async (ids: string[], status: string) => {
    await bulkUpdateFiles({ ids, updates: { status } });
  };

  const handleMoveFile = async (id: string, folderId: string | null) => {
    await updateFile({ id, updates: { folder_id: folderId } });
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

  // Handle file click - open pipeline modal for talking_head/clips files, otherwise file detail modal
  const handleFileClick = (file: File) => {
    if (file.file_type === 'talking_head') {
      // Extract pipeline_id from generation_params
      const params = file.generation_params as { pipeline_id?: string } | null;
      if (params?.pipeline_id) {
        setOpenPipelineId(params.pipeline_id);
        setPipelineModalOpen(true);
      } else {
        // Fallback to file detail modal if no pipeline_id
        setSelectedFile(file);
      }
    } else if (file.file_type === 'clips' || file.file_type === 'b_roll') {
      // Extract pipeline_id from generation_params for Clips
      const params = file.generation_params as { pipeline_id?: string } | null;
      if (params?.pipeline_id) {
        setOpenBrollPipelineId(params.pipeline_id);
        setBrollPipelineModalOpen(true);
      } else {
        // Fallback to file detail modal if no pipeline_id
        setSelectedFile(file);
      }
    } else if (file.file_type === 'talking_head') {
      // Open Talking Head modal
      setOpenTalkingHeadFileId(file.id);
      setTalkingHeadModalOpen(true);
    } else {
      setSelectedFile(file);
    }
  };

  // Only show loading state if projectId is missing, don't navigate away
  if (!projectId) {
    return (
      <MainLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  // Create a virtual "default pipeline" for editing
  const getEditingPipelineForDialog = () => {
    if (editingDefaultPipeline) {
      return {
        id: '__default__',
        user_id: '',
        name: 'Default Pipeline',
        stages: defaultStages,
        created_at: '',
        updated_at: '',
        is_default: true,
      } as Pipeline;
    }
    return editingPipeline;
  };

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
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectMode={selectMode}
          onSelectModeChange={setSelectMode}
        />

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {isLoading ? (
            <ProjectDetailSkeleton />
          ) : viewMode === 'kanban' ? (
            // Always show FileGrid for kanban view (so pipeline controls are visible even when empty)
            <FileGrid
              files={filteredFiles}
              folders={folders || []}
              projectId={projectId}
              currentFolderId={folderId || null}
              viewMode={viewMode}
              pipelines={pipelines}
              tags={tags}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              onCreatePipeline={() => { setEditingPipeline(null); setEditingDefaultPipeline(false); setCreatePipelineOpen(true); }}
              onEditPipeline={handleEditPipeline}
              onEditDefaultPipeline={() => handleEditPipeline(null)}
              onCreateNew={(initialStatus) => {
                setCreateModalInitialStatus(initialStatus);
                setCreateModalOpen(true);
              }}
              onCreateTag={() => setCreateTagOpen(true)}
              onDeleteTag={handleDeleteTag}
              onDeleteFile={handleDeleteFileRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onFileClick={handleFileClick}
              onUpdateFileStatus={handleUpdateFileStatus}
              onUpdateFileTags={handleUpdateFileTags}
              onUpdateFolderStatus={handleUpdateFolderStatus}
              onUpdateFolderTags={handleUpdateFolderTags}
              onUpdateFileName={handleUpdateFileName}
              onUpdateFolderName={handleUpdateFolderName}
              onMoveFile={handleMoveFile}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              defaultStages={defaultStages}
              selectMode={selectMode}
              onSelectModeChange={setSelectMode}
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
              currentFolderId={folderId || null}
              viewMode={viewMode}
              pipelines={pipelines}
              tags={tags}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              onCreatePipeline={() => { setEditingPipeline(null); setEditingDefaultPipeline(false); setCreatePipelineOpen(true); }}
              onEditPipeline={handleEditPipeline}
              onEditDefaultPipeline={() => handleEditPipeline(null)}
              onCreateNew={(initialStatus) => {
                setCreateModalInitialStatus(initialStatus);
                setCreateModalOpen(true);
              }}
              onCreateTag={() => setCreateTagOpen(true)}
              onDeleteTag={handleDeleteTag}
              onDeleteFile={handleDeleteFileRequest}
              onDeleteFolder={handleDeleteFolderRequest}
              onFileClick={handleFileClick}
              onUpdateFileStatus={handleUpdateFileStatus}
              onUpdateFileTags={handleUpdateFileTags}
              onUpdateFolderStatus={handleUpdateFolderStatus}
              onUpdateFolderTags={handleUpdateFolderTags}
              onUpdateFileName={handleUpdateFileName}
              onUpdateFolderName={handleUpdateFolderName}
              onMoveFile={handleMoveFile}
              onBulkDelete={handleBulkDelete}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              defaultStages={defaultStages}
              selectMode={selectMode}
              onSelectModeChange={setSelectMode}
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
        onCreateFolder={(status) => {
          setCreateFolderInitialStatus(status);
          setCreateFolderOpen(true);
        }}
        initialStatus={createModalInitialStatus}
        tags={tags}
        onCreateTag={() => setCreateTagOpen(true)}
        statusOptions={currentStatusOptions}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={(open) => {
          setCreateFolderOpen(open);
          if (!open) setCreateFolderInitialStatus(undefined);
        }}
        onSubmit={handleCreateFolder}
        projectId={projectId}
        folderId={folderId}
        initialStatus={createFolderInitialStatus}
        tags={tags}
        onCreateTag={() => setCreateTagOpen(true)}
        statusOptions={currentStatusOptions}
      />

      <CreatePipelineDialog
        open={createPipelineOpen}
        onOpenChange={(open) => {
          setCreatePipelineOpen(open);
          if (!open) {
            setEditingPipeline(null);
            setEditingDefaultPipeline(false);
          }
        }}
        onSubmit={handleCreatePipeline}
        onDelete={editingDefaultPipeline ? undefined : handleDeletePipeline}
        editingPipeline={getEditingPipelineForDialog()}
        isEditingDefault={editingDefaultPipeline}
      />

      <CreateTagDialog
        open={createTagOpen}
        onOpenChange={setCreateTagOpen}
        onSubmit={handleCreateTag}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDeleteDialog
        open={deleteFileConfirm.open}
        onOpenChange={(open) => !open && setDeleteFileConfirm({ open: false, file: null })}
        onConfirm={handleDeleteFileConfirm}
        title="Delete file?"
        description="This action cannot be undone. This will permanently delete the file."
        itemName={deleteFileConfirm.file?.name}
      />

      <ConfirmDeleteDialog
        open={deleteFolderConfirm.open}
        onOpenChange={(open) => !open && setDeleteFolderConfirm({ open: false, folder: null })}
        onConfirm={handleDeleteFolderConfirm}
        title="Delete folder?"
        description="This action cannot be undone. This will permanently delete the folder and all its contents."
        itemName={deleteFolderConfirm.folder?.name}
      />

      {/* File Detail Modal */}
      <FileDetailModalEnhanced
        file={selectedFile ? {
          id: selectedFile.id,
          name: selectedFile.name,
          file_type: selectedFile.file_type,
          status: selectedFile.status || 'processing',
          preview_url: selectedFile.preview_url,
          download_url: selectedFile.download_url,
          error_message: selectedFile.error_message,
          metadata: selectedFile.metadata,
          generation_params: selectedFile.generation_params,
        } : null}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* Pipeline Modal for Talking Head files */}
      <PipelineModal
        open={pipelineModalOpen}
        onClose={() => {
          setPipelineModalOpen(false);
          setOpenPipelineId(null);
        }}
        pipelineId={openPipelineId}
        projectId={projectId}
        folderId={folderId}
        onSuccess={() => {
          // Refresh files after save
        }}
        statusOptions={currentStatusOptions}
      />

      {/* Clips Pipeline Modal */}
      <ClipsPipelineModal
        open={brollPipelineModalOpen}
        onClose={() => {
          setBrollPipelineModalOpen(false);
          setOpenBrollPipelineId(null);
        }}
        pipelineId={openBrollPipelineId}
        projectId={projectId}
        folderId={folderId}
        onSuccess={() => {
          // Refresh files after save
        }}
        statusOptions={currentStatusOptions}
      />

      {/* Talking Head Modal */}
      {openTalkingHeadFileId && (
        <TalkingHeadModal
          open={talkingHeadModalOpen}
          onClose={() => {
            setTalkingHeadModalOpen(false);
            setOpenTalkingHeadFileId(null);
          }}
          fileId={openTalkingHeadFileId}
          projectId={projectId}
          folderId={folderId}
          onSuccess={() => {
            // Refresh files after save
          }}
          statusOptions={currentStatusOptions}
        />
      )}
    </MainLayout>
  );
}
