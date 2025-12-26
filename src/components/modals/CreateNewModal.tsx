import { useState } from 'react';
import { Image, Video, FileText, ArrowLeft, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FirstFrameForm from '@/components/forms/FirstFrameForm';
import TalkingHeadForm from '@/components/forms/TalkingHeadForm';
import ScriptForm from '@/components/forms/ScriptForm';
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
  onCreateFolder?: () => void;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
  statusOptions?: StatusOption[];
}

type ContentType = 'first_frame' | 'talking_head' | 'script' | null;

const contentTypes = [
  {
    id: 'folder' as const,
    icon: FolderPlus,
    title: 'Folder',
    description: 'Organize your content',
    isFolder: true,
  },
  {
    id: 'first_frame' as const,
    icon: Image,
    title: 'First Frame',
    description: 'Generate AI images',
  },
  {
    id: 'talking_head' as const,
    icon: Video,
    title: 'Talking Head',
    description: 'Create talking head videos',
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
  const [selectedType, setSelectedType] = useState<ContentType>(null);

  const handleClose = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const handleSuccess = () => {
    setSelectedType(null);
    onOpenChange(false);
  };

  const handleTypeSelect = (type: typeof contentTypes[0]) => {
    if (type.id === 'folder') {
      onOpenChange(false);
      onCreateFolder?.();
    } else {
      setSelectedType(type.id as ContentType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`gap-0 p-0 ${
          selectedType ? 'max-w-2xl' : 'max-w-md'
        } rounded-2xl border-border`}
      >
        <DialogHeader className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            {selectedType && (
              <button
                onClick={() => setSelectedType(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-apple hover:bg-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle className="text-xl font-semibold">
              {selectedType
                ? contentTypes.find((t) => t.id === selectedType)?.title
                : 'What would you like to create?'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-4 p-6">
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-apple hover:border-primary hover:bg-primary/5"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <type.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {type.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {type.description}
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
        ) : selectedType === 'talking_head' ? (
          <TalkingHeadForm
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
  );
}
