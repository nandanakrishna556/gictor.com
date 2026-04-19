import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, ChevronRight, Home, FolderTree } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentFolderId?: string | null;
  onMove: (folderId: string | null, projectId?: string) => void;
  itemName: string;
  allowProjectSwitch?: boolean;
}

export default function MoveToFolderDialog({
  open,
  onOpenChange,
  projectId,
  currentFolderId,
  onMove,
  itemName,
  allowProjectSwitch = false,
}: MoveToFolderDialogProps) {
  const { projects } = useProjects();
  const [activeProjectId, setActiveProjectId] = useState(projectId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [parentId, setParentId] = useState<string | null>(null);

  // Fetch folders for the current level via React Query (cached + fast)
  const { data: folders = [], isLoading: loading } = useQuery({
    queryKey: ['move-folders', activeProjectId, parentId],
    queryFn: async () => {
      let query = supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .eq('project_id', activeProjectId)
        .order('name');

      if (parentId) {
        query = query.eq('parent_folder_id', parentId);
      } else {
        query = query.is('parent_folder_id', null);
      }
      const { data } = await query;
      return (data || []) as Folder[];
    },
    enabled: open && !!activeProjectId,
  });

  // Reset on open / project change
  useEffect(() => {
    if (open) {
      setActiveProjectId(projectId);
      setSelectedFolderId(null);
      setParentId(null);
      setCurrentPath([]);
    }
  }, [open, projectId]);

  // When switching projects, reset navigation
  useEffect(() => {
    setSelectedFolderId(null);
    setParentId(null);
    setCurrentPath([]);
  }, [activeProjectId]);

  const navigateToFolder = async (folder: Folder) => {
    setParentId(folder.id);
    setCurrentPath((prev) => [...prev, folder]);
    setSelectedFolderId(null);
  };

  const navigateToRoot = () => {
    setParentId(null);
    setCurrentPath([]);
    setSelectedFolderId(null);
  };

  const navigateToPathFolder = (folder: Folder, index: number) => {
    setParentId(folder.id);
    setCurrentPath((prev) => prev.slice(0, index + 1));
    setSelectedFolderId(null);
  };

  const isCrossProject = activeProjectId !== projectId;

  const handleMove = () => {
    const targetFolderId =
      selectedFolderId ?? (currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null);

    // Don't move to current location (same project, same folder)
    if (!isCrossProject && targetFolderId === currentFolderId) {
      onOpenChange(false);
      return;
    }

    onMove(targetFolderId, isCrossProject ? activeProjectId : undefined);
    onOpenChange(false);
  };

  const currentLevelId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  const isCurrentLocation =
    !isCrossProject && currentLevelId === currentFolderId && !selectedFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{itemName}"</DialogTitle>
          <DialogDescription>
            Select a destination {allowProjectSwitch ? 'project and folder' : 'folder'}
          </DialogDescription>
        </DialogHeader>

        {/* Project Selector (only when allowed) */}
        {allowProjectSwitch && projects && projects.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Project
            </label>
            <Select value={activeProjectId} onValueChange={setActiveProjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.id === projectId && (
                      <span className="ml-2 text-xs text-muted-foreground">(current)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
          <button
            onClick={navigateToRoot}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors',
              currentPath.length === 0 && 'text-primary font-medium'
            )}
          >
            <Home className="h-4 w-4" />
            <span>Root</span>
          </button>
          {currentPath.map((folder, index) => (
            <div key={folder.id} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => navigateToPathFolder(folder, index)}
                className={cn(
                  'px-2 py-1 rounded hover:bg-secondary transition-colors truncate max-w-32',
                  index === currentPath.length - 1 && 'text-primary font-medium'
                )}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* Folder List */}
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : folders.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No subfolders in this location
            </div>
          ) : (
            folders.map((folder) => {
              const disabled = !isCrossProject && folder.id === currentFolderId;
              return (
                <button
                  key={folder.id}
                  onDoubleClick={() => navigateToFolder(folder)}
                  onClick={() =>
                    setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)
                  }
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b last:border-b-0',
                    selectedFolderId === folder.id && 'bg-primary/10',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <FolderOpen className="h-5 w-5 text-amber-500" />
                  <span className="truncate flex-1">{folder.name}</span>
                  {disabled && (
                    <span className="text-xs text-muted-foreground">(current)</span>
                  )}
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToFolder(folder);
                    }}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Move to current location hint */}
        {currentPath.length > 0 && !selectedFolderId && (
          <p className="text-xs text-muted-foreground">
            Click "Move here" to move to "{currentPath[currentPath.length - 1].name}"
          </p>
        )}
        {currentPath.length === 0 && !selectedFolderId && (
          <p className="text-xs text-muted-foreground">
            Click "Move here" to move to {isCrossProject ? 'project root' : 'project root'}, or double-click a folder to navigate
          </p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isCurrentLocation}>
            Move here
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

