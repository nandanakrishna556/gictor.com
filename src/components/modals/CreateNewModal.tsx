import { useState, useRef } from 'react';
import { Video, FolderPlus, X, Loader2, Film, Mic, Image, FileText } from 'lucide-react';
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

type PipelineType = 'talking_head' | 'clips';
type QuickGenType = 'talking_head' | 'audio' | 'first_frame' | 'b_roll' | 'script';

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
    title: 'Lip Sync',
    description: 'Sync audio to face',
    isQuickGen: true,
  },
  {
    id: 'audio' as const,
    icon: Mic,
    title: 'Speech',
    description: 'Generate voice audio',
    isQuickGen: true,
  },
  {
    id: 'first_frame' as const,
    icon: Image,
    title: 'First Frame',
    description: 'Generate AI image',
    isQuickGen: true,
  },
  {
    id: 'b_roll' as const,
    icon: Film,
    title: 'B-Roll',
    description: 'Generate video from image',
    isQuickGen: true,
  },
  {
    id: 'script' as const,
    icon: FileText,
    title: 'Script',
    description: 'Generate script',
    isQuickGen: true,
  },
  // TEMPORARILY HIDDEN - Re-enable by uncommenting:
  // {
  //   id: 'talking_head_pipeline' as const,
  //   icon: Video,
  //   title: 'Talking Head Pipeline',
  //   description: 'Create with AI pipeline',
  //   isPipeline: true,
  //   pipelineType: 'talking_head' as PipelineType,
  // },
  // {
  //   id: 'clips' as const,
  //   icon: Film,
  //   title: 'Clips',
  //   description: 'Generate video clips',
  //   isPipeline: true,
  //   pipelineType: 'clips' as PipelineType,
  // },
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
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [bRollModalOpen, setBRollModalOpen] = useState(false);
  const [lipSyncModalOpen, setLipSyncModalOpen] = useState(false);
  const [speechModalOpen, setSpeechModalOpen] = useState(false);
  const [createdPipelineId, setCreatedPipelineId] = useState<string | null>(null);
  const [createdFileId, setCreatedFileId] = useState<string | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  
  // Store the status in a ref to preserve it between modal transitions
  const pipelineInitialStatusRef = useRef<string | undefined>(undefined);
  
  // Get createPipeline from hook (null ID means no fetch, just get the create function)
  const { createPipeline } = usePipeline(null);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleTypeSelect = async (type: typeof contentTypes[0]) => {
    if (type.id === 'folder') {
      onOpenChange(false);
      onCreateFolder?.(initialStatus);
    } else if ('isQuickGen' in type && type.isQuickGen) {
      // Handle quick generation types - create file record first
      if (type.id === 'talking_head') {
        setIsCreatingPipeline(true);
        setCreatingType(type.id);
        pipelineInitialStatusRef.current = initialStatus;
        
        try {
          const newFileId = uuidv4();
          
          // Create file record immediately (like pipeline pattern)
          const { error: fileError } = await supabase
            .from('files')
            .insert({
              id: newFileId,
              project_id: projectId,
              folder_id: folderId || null,
              name: 'Untitled',
              file_type: 'talking_head',
              status: initialStatus || 'draft',
              generation_params: {},
            });
          
          if (fileError) {
            throw fileError;
          }
          
          setCreatedFileId(newFileId);
          onOpenChange(false);
          setIsCreatingPipeline(false);
          setCreatingType(null);
          setLipSyncModalOpen(true);
          
          queryClient.invalidateQueries({ queryKey: ['files', projectId] });
        } catch (error) {
          console.error('Failed to create file entry:', error);
          toast.error('Failed to create file');
          setIsCreatingPipeline(false);
          setCreatingType(null);
        }
      } else if (type.id === 'audio') {
        // Handle Speech generation
        setIsCreatingPipeline(true);
        setCreatingType(type.id);
        pipelineInitialStatusRef.current = initialStatus;
        
        try {
          const newFileId = uuidv4();
          
          const { error: fileError } = await supabase
            .from('files')
            .insert({
              id: newFileId,
              project_id: projectId,
              folder_id: folderId || null,
              name: 'Untitled',
              file_type: 'speech',
              status: initialStatus || 'draft',
              generation_params: {},
            });
          
          if (fileError) {
            throw fileError;
          }
          
          setCreatedFileId(newFileId);
          onOpenChange(false);
          setIsCreatingPipeline(false);
          setCreatingType(null);
          setSpeechModalOpen(true);
          
          queryClient.invalidateQueries({ queryKey: ['files', projectId] });
        } catch (error) {
          console.error('Failed to create file entry:', error);
          toast.error('Failed to create file');
          setIsCreatingPipeline(false);
          setCreatingType(null);
        }
      } else {
        // Coming soon for other quick gen types
        toast.info(`${type.title} generation coming soon!`);
      }
    } else if ('isPipeline' in type && (type as any).isPipeline) {
      // Handle pipeline types (currently hidden)
      const pipelineType = (type as any).pipelineType as PipelineType;
      setIsCreatingPipeline(true);
      setCreatingType(type.id);
      pipelineInitialStatusRef.current = initialStatus;
      
      const fileType = pipelineType === 'clips' ? 'clips' : 'talking_head';
      
      try {
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
        setIsCreatingPipeline(false);
        setCreatingType(null);
        
        if (pipelineType === 'clips') {
          setBRollModalOpen(true);
        } else {
          setPipelineModalOpen(true);
        }
        
        queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      } catch (error) {
        console.error('Failed to create pipeline:', error);
        toast.error('Failed to create pipeline');
        setIsCreatingPipeline(false);
        setCreatingType(null);
      }
    }
  };

  const handlePipelineClose = () => {
    setPipelineModalOpen(false);
    setBRollModalOpen(false);
    setLipSyncModalOpen(false);
    setSpeechModalOpen(false);
    setCreatedPipelineId(null);
    setCreatedFileId(null);
    pipelineInitialStatusRef.current = undefined;
  };

  const handlePipelineSuccess = () => {
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

          <div className="grid grid-cols-3 gap-4 p-8">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                disabled={isCreatingPipeline}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-apple hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {isCreatingPipeline && creatingType === type.id ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <type.icon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <h3 className="font-medium text-foreground">
                  {type.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isCreatingPipeline && creatingType === type.id
                    ? 'Creating...' 
                    : type.description}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Talking Head Pipeline Modal */}
      {createdPipelineId && pipelineModalOpen && (
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

      {/* Clips Pipeline Modal */}
      {createdPipelineId && bRollModalOpen && (
        <ClipsPipelineModal
          open={bRollModalOpen}
          onClose={handlePipelineClose}
          pipelineId={createdPipelineId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={pipelineInitialStatusRef.current}
          onSuccess={handlePipelineSuccess}
          statusOptions={statusOptions}
        />
      )}

      {/* Lip Sync Modal */}
      {createdFileId && lipSyncModalOpen && (
        <LipSyncModal
          open={lipSyncModalOpen}
          onClose={handlePipelineClose}
          fileId={createdFileId}
          projectId={projectId}
          folderId={folderId}
          initialStatus={pipelineInitialStatusRef.current}
          onSuccess={handlePipelineSuccess}
          statusOptions={statusOptions}
        />
      )}

      {/* Speech Modal */}
      {createdFileId && speechModalOpen && (
        <SpeechModal
          open={speechModalOpen}
          onClose={handlePipelineClose}
          fileId={createdFileId}
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