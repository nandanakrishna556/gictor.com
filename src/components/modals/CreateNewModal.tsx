import { useState, useRef } from 'react';
import { Video, FolderPlus, X, Loader2, Film, Mic, Image, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PipelineModal from '@/components/pipeline/PipelineModal';
import ClipsPipelineModal from '@/components/pipeline/ClipsPipelineModal';
import LipSyncModal from '@/components/modals/LipSyncModal';
import SpeechModal from '@/components/modals/SpeechModal';
import { usePipeline } from '@/hooks/usePipeline';
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

type WorkflowType = 'talking_head' | 'b_roll' | 'motion_graphics';
type ElementType = 'folder' | 'lip_sync' | 'speech' | 'first_frame' | 'last_frame' | 'script' | 'swap';

const workflows = [
  {
    id: 'talking_head' as WorkflowType,
    icon: Video,
    title: 'Talking Head',
    description: 'Create talking head video',
  },
  {
    id: 'b_roll' as WorkflowType,
    icon: Film,
    title: 'B-Roll',
    description: 'Generate video clips',
  },
  {
    id: 'motion_graphics' as WorkflowType,
    icon: Sparkles,
    title: 'Motion Graphics',
    description: 'Generate motion graphics',
    comingSoon: true,
  },
];

const elements = [
  {
    id: 'folder' as ElementType,
    icon: FolderPlus,
    title: 'Folder',
    description: 'Organize your content',
  },
  {
    id: 'lip_sync' as ElementType,
    icon: Video,
    title: 'Lip Sync',
    description: 'Sync audio to face',
  },
  {
    id: 'speech' as ElementType,
    icon: Mic,
    title: 'Speech',
    description: 'Generate voice audio',
  },
  {
    id: 'first_frame' as ElementType,
    icon: Image,
    title: 'First Frame',
    description: 'Generate AI image',
  },
  {
    id: 'last_frame' as ElementType,
    icon: Image,
    title: 'Last Frame',
    description: 'Generate ending image',
    comingSoon: true,
  },
  {
    id: 'script' as ElementType,
    icon: FileText,
    title: 'Script',
    description: 'Generate script',
  },
  {
    id: 'swap' as ElementType,
    icon: RefreshCw,
    title: 'Swap',
    description: 'Face swap',
    comingSoon: true,
  },
];

export default function CreateNewModal({
  open,
  onOpenChange,
  projectId,
  folderId,
  onCreateFolder,
  initialStatus,
  statusOptions,
}: CreateNewModalProps) {
  const queryClient = useQueryClient();
  const [talkingHeadWorkflowOpen, setTalkingHeadWorkflowOpen] = useState(false);
  const [bRollWorkflowOpen, setBRollWorkflowOpen] = useState(false);
  const [lipSyncModalOpen, setLipSyncModalOpen] = useState(false);
  const [speechModalOpen, setSpeechModalOpen] = useState(false);
  const [createdPipelineId, setCreatedPipelineId] = useState<string | null>(null);
  const [createdFileId, setCreatedFileId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  
  const initialStatusRef = useRef<string | undefined>(undefined);
  
  const { createPipeline } = usePipeline(null);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleWorkflowSelect = async (workflow: typeof workflows[0]) => {
    if (workflow.comingSoon) {
      toast.info(`${workflow.title} workflow coming soon!`);
      return;
    }

    setIsCreating(true);
    setCreatingType(workflow.id);
    initialStatusRef.current = initialStatus;

    try {
      // talking_head workflow uses lip_sync pipeline type
      // b_roll workflow uses clips pipeline type
      const pipelineType = workflow.id === 'talking_head' ? 'lip_sync' : 'clips';
      const fileType = workflow.id === 'talking_head' ? 'lip_sync' : 'clips';

      const newPipeline = await createPipeline({
        projectId,
        folderId,
        name: 'Untitled',
        status: 'draft',
        displayStatus: initialStatus,
        pipelineType: pipelineType,
      });

      const { error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          folder_id: folderId || null,
          name: 'Untitled',
          file_type: fileType,
          status: initialStatus || 'draft',
          generation_params: { pipeline_id: newPipeline.id, pipeline_type: pipelineType },
        });

      if (fileError) {
        console.error('Failed to create file entry:', fileError);
      }

      setCreatedPipelineId(newPipeline.id);
      onOpenChange(false);
      setIsCreating(false);
      setCreatingType(null);

      if (workflow.id === 'b_roll') {
        setBRollWorkflowOpen(true);
      } else {
        setTalkingHeadWorkflowOpen(true);
      }

      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    } catch (error) {
      console.error('Failed to create workflow:', error);
      toast.error('Failed to create workflow');
      setIsCreating(false);
      setCreatingType(null);
    }
  };

  const handleElementSelect = async (element: typeof elements[0]) => {
    if (element.comingSoon) {
      toast.info(`${element.title} coming soon!`);
      return;
    }

    if (element.id === 'folder') {
      onOpenChange(false);
      onCreateFolder?.(initialStatus);
      return;
    }

    if (element.id === 'lip_sync' || element.id === 'speech') {
      setIsCreating(true);
      setCreatingType(element.id);
      initialStatusRef.current = initialStatus;

      try {
        const newFileId = uuidv4();

        const { error: fileError } = await supabase
          .from('files')
          .insert({
            id: newFileId,
            project_id: projectId,
            folder_id: folderId || null,
            name: 'Untitled',
            file_type: element.id,
            status: initialStatus || 'draft',
            generation_params: {},
          });

        if (fileError) {
          throw fileError;
        }

        setCreatedFileId(newFileId);
        onOpenChange(false);
        setIsCreating(false);
        setCreatingType(null);

        if (element.id === 'lip_sync') {
          setLipSyncModalOpen(true);
        } else if (element.id === 'speech') {
          setSpeechModalOpen(true);
        }

        queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      } catch (error) {
        console.error('Failed to create file entry:', error);
        toast.error('Failed to create file');
        setIsCreating(false);
        setCreatingType(null);
      }
    } else {
      // Other elements coming soon
      toast.info(`${element.title} coming soon!`);
    }
  };

  const handleModalClose = () => {
    setTalkingHeadWorkflowOpen(false);
    setBRollWorkflowOpen(false);
    setLipSyncModalOpen(false);
    setSpeechModalOpen(false);
    setCreatedPipelineId(null);
    setCreatedFileId(null);
    initialStatusRef.current = undefined;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    queryClient.invalidateQueries({ queryKey: ['pipelines', projectId] });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="gap-0 p-0 max-w-2xl rounded-2xl border-border">
          <DialogHeader className="border-b border-border px-6 py-5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                Create New
              </DialogTitle>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-apple hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Workflows Section */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Workflows
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => handleWorkflowSelect(workflow)}
                    disabled={isCreating || workflow.comingSoon}
                    className="relative flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-apple hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workflow.comingSoon && (
                      <span className="absolute top-2 right-2 text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        Soon
                      </span>
                    )}
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      {isCreating && creatingType === workflow.id ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      ) : (
                        <workflow.icon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <h3 className="font-medium text-foreground">
                      {workflow.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isCreating && creatingType === workflow.id
                        ? 'Creating...'
                        : workflow.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Elements Section */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Elements
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {elements.map((element) => (
                  <button
                    key={element.id}
                    onClick={() => handleElementSelect(element)}
                    disabled={isCreating || element.comingSoon}
                    className="relative flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-apple hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {element.comingSoon && (
                      <span className="absolute top-2 right-2 text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        Soon
                      </span>
                    )}
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      {isCreating && creatingType === element.id ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      ) : (
                        <element.icon className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <h3 className="font-medium text-foreground">
                      {element.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isCreating && creatingType === element.id
                        ? 'Creating...'
                        : element.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Talking Head Workflow Modal */}
      {createdPipelineId && talkingHeadWorkflowOpen && (
        <PipelineModal
          open={talkingHeadWorkflowOpen}
          onClose={handleModalClose}
          pipelineId={createdPipelineId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={initialStatusRef.current}
          onSuccess={handleSuccess}
          statusOptions={statusOptions}
        />
      )}

      {/* B-Roll Workflow Modal */}
      {createdPipelineId && bRollWorkflowOpen && (
        <ClipsPipelineModal
          open={bRollWorkflowOpen}
          onClose={handleModalClose}
          pipelineId={createdPipelineId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={initialStatusRef.current}
          onSuccess={handleSuccess}
          statusOptions={statusOptions}
        />
      )}

      {/* Lip Sync Modal */}
      {createdFileId && lipSyncModalOpen && (
        <LipSyncModal
          open={lipSyncModalOpen}
          onClose={handleModalClose}
          fileId={createdFileId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={initialStatusRef.current}
          onSuccess={handleSuccess}
          statusOptions={statusOptions}
        />
      )}

      {/* Speech Modal */}
      {createdFileId && speechModalOpen && (
        <SpeechModal
          open={speechModalOpen}
          onClose={handleModalClose}
          fileId={createdFileId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={initialStatusRef.current}
          onSuccess={handleSuccess}
          statusOptions={statusOptions}
        />
      )}
    </>
  );
}
