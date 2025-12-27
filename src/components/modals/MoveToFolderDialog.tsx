import { useState, useEffect } from 'react';
import { FolderOpen, ChevronRight, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
  onMove: (folderId: string | null) => void;
  itemName: string;
}

export default function MoveToFolderDialog({
  open,
  onOpenChange,
  projectId,
  currentFolderId,
  onMove,
  itemName,
}: MoveToFolderDialogProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch folders for the current level
  const fetchFolders = async (parentId: string | null) => {
    setLoading(true);
    let query = supabase
      .from('folders')
      .select('id, name, parent_folder_id')
      .eq('project_id', projectId)
      .order('name');

    if (parentId) {
      query = query.eq('parent_folder_id', parentId);
    } else {
      query = query.is('parent_folder_id', null);
    }

    const { data } = await query;
    setFolders((data || []) as Folder[]);
    setLoading(false);
  };

  // Fetch path for a folder
  const fetchPath = async (folderId: string | null) => {
    if (!folderId) {
      setCurrentPath([]);
      return;
    }

    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const { data } = await supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .eq('id', currentId)
        .single();

      if (!data) break;
      path.unshift(data as Folder);
      currentId = data.parent_folder_id;
    }

    setCurrentPath(path);
  };

  useEffect(() => {
    if (open) {
      setSelectedFolderId(null);
      fetchFolders(null);
      setCurrentPath([]);
    }
  }, [open, projectId]);

  const navigateToFolder = async (folder: Folder) => {
    await fetchFolders(folder.id);
    await fetchPath(folder.id);
  };

  const navigateToRoot = async () => {
    await fetchFolders(null);
    setCurrentPath([]);
  };

  const navigateToPathFolder = async (folder: Folder, index: number) => {
    await fetchFolders(folder.id);
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleMove = () => {
    // If a folder is selected in the list, move to it
    // Otherwise move to the current path level (root or current folder)
    const targetId = selectedFolderId ?? (currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null);
    
    // Don't move to current location
    if (targetId === currentFolderId) {
      onOpenChange(false);
      return;
    }
    
    onMove(targetId);
    onOpenChange(false);
  };

  const currentLevelId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;
  const isCurrentLocation = currentLevelId === currentFolderId && !selectedFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{itemName}"</DialogTitle>
          <DialogDescription>
            Select a destination folder
          </DialogDescription>
        </DialogHeader>

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
            folders.map((folder) => (
              <button
                key={folder.id}
                onDoubleClick={() => navigateToFolder(folder)}
                onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                disabled={folder.id === currentFolderId}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b last:border-b-0',
                  selectedFolderId === folder.id && 'bg-primary/10',
                  folder.id === currentFolderId && 'opacity-50 cursor-not-allowed'
                )}
              >
                <FolderOpen className="h-5 w-5 text-amber-500" />
                <span className="truncate">{folder.name}</span>
                {folder.id === currentFolderId && (
                  <span className="text-xs text-muted-foreground ml-auto">(current)</span>
                )}
              </button>
            ))
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
            Click "Move here" to move to project root, or double-click a folder to navigate
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
