import { useState, useRef } from 'react';
import { Image, Video, FileText, ArrowLeft, FolderPlus, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FirstFrameForm from '@/components/forms/FirstFrameForm';
import ScriptForm from '@/components/forms/ScriptForm';
import PipelineModal from '@/components/pipeline/PipelineModal';
import { usePipeline } from '@/hooks/usePipeline';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tag } from '@/hooks/useTags';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface CreateNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  folderId?: string;
  onCreateFolder?: (initialStatus?: string) => void;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
  statusOptions?: StatusOption[];
}

type ContentType = 'first_frame' | 'script' | null;

const contentTypes = [
  {
    id: 'folder' as const,
    icon: FolderPlus,
    title: 'Folder',
    description: 'Organize your content',
    isFolder: true,
  },
  {
    id: 'talking_head' as const,
    icon: Video,
    title: 'Talking Head',
    description: 'Create with AI pipeline',
    isPipeline: true,
  },
  {
    id: 'first_frame' as const,
    icon: Image,
    title: 'First Frame',
    description: 'Generate AI images',
  },
  {
    id: 'script' as const,
    icon: FileText,
    title: 'Script',
    description: 'Generate video scripts',
  },
];

export default function CreateNewModal({
  open,
  onOpenChange,
  projectId,
  folderId,
  onCreateFolder,
  initialStatus,
  tags = [],
  onCreateTag,
  statusOptions,
}: CreateNewModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ContentType>(null);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [createdPipelineId, setCreatedPipelineId] = useState<string | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  
  // Store the status in a ref to preserve it between modal transitions
  const pipelineInitialStatusRef = useRef<string | undefined>(undefined);
  
  // Get createPipeline from hook (null ID means no fetch, just get the create function)
  const { createPipeline } = usePipeline(null);

  const handleClose = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const handleSuccess = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const handleTypeSelect = async (type: typeof contentTypes[0]) => {
    if (type.id === 'folder') {
      onOpenChange(false);
      onCreateFolder?.(initialStatus);
    } else if ('isPipeline' in type && type.isPipeline) {
      // Create the pipeline AND a placeholder file for Kanban display
      setIsCreatingPipeline(true);
      
      // Store the Kanban status in ref for the pipeline modal
      pipelineInitialStatusRef.current = initialStatus;
      
      try {
        // Create pipeline with 'draft' status (DB constraint)
        const newPipeline = await createPipeline({
          projectId,
          folderId,
          name: 'Untitled',
          status: 'draft',
          displayStatus: initialStatus, // Store Kanban column in display_status
        });
        
        // Create a placeholder file for Kanban display
        // This file links to the pipeline and shows in the correct Kanban column
        const { error: fileError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            folder_id: folderId || null,
            name: 'Untitled',
            file_type: 'talking_head',
            status: initialStatus || 'draft', // Use Kanban column status
            generation_params: { pipeline_id: newPipeline.id },
          });
        
        if (fileError) {
          console.error('Failed to create file entry:', fileError);
        }
        
        // Store the created pipeline ID and open modal immediately
        setCreatedPipelineId(newPipeline.id);
        onOpenChange(false);
        setIsCreatingPipeline(false);
        setPipelineModalOpen(true);
        
        // Invalidate files query to show the new file in Kanban
        queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      } catch (error) {
        console.error('Failed to create pipeline:', error);
        toast.error('Failed to create pipeline');
        setIsCreatingPipeline(false);
      }
    } else {
      setSelectedType(type.id as ContentType);
    }
  };

  const handlePipelineClose = () => {
    setPipelineModalOpen(false);
    setCreatedPipelineId(null);
    pipelineInitialStatusRef.current = undefined;
  };

  const handlePipelineSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    queryClient.invalidateQueries({ queryKey: ['pipelines', projectId] });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={`gap-0 p-0 ${
            selectedType ? 'max-w-2xl' : 'max-w-md'
          } rounded-2xl border-border`}
        >
          <DialogHeader className="border-b border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedType && (
                  <button
                    onClick={() => setSelectedType(null)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-apple hover:bg-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <DialogTitle className="text-lg font-semibold">
                  {selectedType
                    ? contentTypes.find((t) => t.id === selectedType)?.title
                    : 'Create New'}
                </DialogTitle>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-apple hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          {!selectedType ? (
            <div className="grid grid-cols-2 gap-4 p-6">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  disabled={isCreatingPipeline}
                  className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-apple hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    {isCreatingPipeline && 'isPipeline' in type && type.isPipeline ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <type.icon className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-medium text-foreground">
                    {type.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCreatingPipeline && 'isPipeline' in type && type.isPipeline 
                      ? 'Creating...' 
                      : type.description}
                  </p>
                </button>
              ))}
            </div>
          ) : selectedType === 'first_frame' ? (
            <FirstFrameForm
              projectId={projectId}
              folderId={folderId}
              onSuccess={handleSuccess}
              initialStatus={initialStatus}
              tags={tags}
              onCreateTag={onCreateTag}
              statusOptions={statusOptions}
            />
          ) : (
            <ScriptForm
              projectId={projectId}
              folderId={folderId}
              onSuccess={handleSuccess}
              initialStatus={initialStatus}
              tags={tags}
              onCreateTag={onCreateTag}
              statusOptions={statusOptions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Only open when we have a created pipeline ID */}
      {createdPipelineId && (
        <PipelineModal
          open={pipelineModalOpen}
          onClose={handlePipelineClose}
          pipelineId={createdPipelineId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={pipelineInitialStatusRef.current}
          onSuccess={handlePipelineSuccess}
          statusOptions={statusOptions}
        />
      )}
    </>
  );
}
