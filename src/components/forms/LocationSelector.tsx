import { useState, useEffect } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useFiles } from '@/hooks/useFiles';

interface LocationSelectorProps {
  projectId: string;
  folderId?: string;
  onLocationChange: (projectId: string, folderId?: string) => void;
}

export default function LocationSelector({
  projectId,
  folderId,
  onLocationChange,
}: LocationSelectorProps) {
  const { projects } = useProjects();
  const { folders } = useFiles(projectId);
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [selectedFolderId, setSelectedFolderId] = useState(folderId);

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const selectedFolder = folders?.find(f => f.id === selectedFolderId);

  useEffect(() => {
    setSelectedProjectId(projectId);
    setSelectedFolderId(folderId);
  }, [projectId, folderId]);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    setSelectedFolderId(undefined);
    onLocationChange(id, undefined);
  };

  const handleFolderSelect = (id: string | undefined) => {
    setSelectedFolderId(id);
    onLocationChange(selectedProjectId, id);
    setOpen(false);
  };

  const locationLabel = selectedFolder 
    ? `${selectedProject?.name} / ${selectedFolder.name}`
    : selectedProject?.name || 'Select location';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 rounded-lg text-xs font-normal"
        >
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-32 truncate">{locationLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Projects</p>
          {projects?.map((project) => (
            <div key={project.id}>
              <button
                onClick={() => handleProjectSelect(project.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary',
                  selectedProjectId === project.id && !selectedFolderId && 'bg-primary/10 text-primary'
                )}
              >
                <Layers className="h-4 w-4" />
                {project.name}
              </button>
              
              {selectedProjectId === project.id && folders && folders.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                  <button
                    onClick={() => handleFolderSelect(undefined)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-secondary',
                      !selectedFolderId && 'bg-primary/10 text-primary'
                    )}
                  >
                    Root
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderSelect(folder.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-secondary',
                        selectedFolderId === folder.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
