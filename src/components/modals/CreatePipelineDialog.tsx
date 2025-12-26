import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PipelineStage, Pipeline } from '@/hooks/usePipelines';

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, stages: PipelineStage[]) => void;
  onDelete?: (id: string) => void;
  editingPipeline?: Pipeline | null;
  isEditingDefault?: boolean;
}

const STAGE_COLORS = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-emerald-500',
];

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'stage-1', name: 'To Do', color: 'bg-amber-500' },
  { id: 'stage-2', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'stage-3', name: 'Done', color: 'bg-green-500' },
];

export default function CreatePipelineDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  editingPipeline,
  isEditingDefault = false,
}: CreatePipelineDialogProps) {
  const [name, setName] = useState('');
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);

  const isEditMode = !!editingPipeline;

  // Reset form when dialog opens/closes or editingPipeline changes
  useEffect(() => {
    if (open) {
      if (editingPipeline) {
        setName(isEditingDefault ? 'Default Pipeline' : editingPipeline.name);
        setStages(editingPipeline.stages);
      } else {
        setName('');
        setStages(DEFAULT_STAGES);
      }
    }
  }, [open, editingPipeline, isEditingDefault]);

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: 'New Stage',
      color: STAGE_COLORS[stages.length % STAGE_COLORS.length],
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (id: string) => {
    if (stages.length > 2) {
      setStages(stages.filter((s) => s.id !== id));
    }
  };

  const handleUpdateStage = (id: string, field: 'name' | 'color', value: string) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setStages(items);
  };

  const handleSubmit = () => {
    const finalName = isEditingDefault ? 'Default Pipeline' : name.trim();
    if ((isEditingDefault || finalName) && stages.length >= 2) {
      onSubmit(finalName, stages);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (editingPipeline && onDelete) {
      onDelete(editingPipeline.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditingDefault ? 'Edit Default Pipeline' : isEditMode ? 'Edit Pipeline' : 'Create Pipeline'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isEditingDefault && (
            <div className="space-y-2">
              <Label htmlFor="pipeline-name">Pipeline Name</Label>
              <Input
                id="pipeline-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Content Review"
                className="rounded-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Stages (drag to reorder)</Label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="stages">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 rounded-lg border border-border p-3"
                  >
                    {stages.map((stage, index) => (
                      <Draggable key={stage.id} draggableId={stage.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              'flex items-center gap-2 rounded-lg bg-background p-1 transition-shadow',
                              snapshot.isDragging && 'shadow-lg ring-2 ring-primary/20'
                            )}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab rounded p-1 hover:bg-secondary active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div
                              className={`h-3 w-3 rounded-full cursor-pointer transition-transform hover:scale-110 ${stage.color}`}
                              onClick={() => {
                                const nextColor = STAGE_COLORS[(STAGE_COLORS.indexOf(stage.color) + 1) % STAGE_COLORS.length];
                                handleUpdateStage(stage.id, 'color', nextColor);
                              }}
                            />
                            <Input
                              value={stage.name}
                              onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                              className="h-8 flex-1 rounded-md text-sm"
                            />
                            <button
                              onClick={() => handleRemoveStage(stage.id)}
                              disabled={stages.length <= 2}
                              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <button
                      onClick={handleAddStage}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Add Stage
                    </button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {isEditMode && onDelete && !isEditingDefault && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete Pipeline
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={(!isEditingDefault && !name.trim()) || stages.length < 2}>
              {isEditingDefault ? 'Save Changes' : isEditMode ? 'Save Changes' : 'Create Pipeline'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
