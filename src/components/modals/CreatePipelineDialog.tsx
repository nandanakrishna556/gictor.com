import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PipelineStage } from '@/hooks/usePipelines';

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pipeline: { name: string; stages: PipelineStage[] }) => void;
}

const STAGE_COLORS = [
  'bg-amber-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-emerald-500',
  'bg-pink-500',
  'bg-indigo-500',
];

export default function CreatePipelineDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePipelineDialogProps) {
  const [name, setName] = useState('');
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'stage-1', name: 'To Do', color: 'bg-amber-500' },
    { id: 'stage-2', name: 'Done', color: 'bg-green-500' },
  ]);

  const addStage = () => {
    const newId = `stage-${Date.now()}`;
    const colorIndex = stages.length % STAGE_COLORS.length;
    setStages([
      ...stages,
      { id: newId, name: '', color: STAGE_COLORS[colorIndex] },
    ]);
  };

  const removeStage = (id: string) => {
    if (stages.length > 2) {
      setStages(stages.filter((s) => s.id !== id));
    }
  };

  const updateStage = (id: string, updates: Partial<PipelineStage>) => {
    setStages(
      stages.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || stages.some((s) => !s.name.trim())) return;

    onSubmit({ name, stages });
    setName('');
    setStages([
      { id: 'stage-1', name: 'To Do', color: 'bg-amber-500' },
      { id: 'stage-2', name: 'Done', color: 'bg-green-500' },
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pipeline</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Content Review"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Stages</Label>
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2"
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  
                  <div
                    className={`h-3 w-3 rounded-full ${stage.color}`}
                    onClick={() => {
                      const nextColorIndex =
                        (STAGE_COLORS.indexOf(stage.color) + 1) %
                        STAGE_COLORS.length;
                      updateStage(stage.id, { color: STAGE_COLORS[nextColorIndex] });
                    }}
                  />
                  
                  <Input
                    value={stage.name}
                    onChange={(e) =>
                      updateStage(stage.id, { name: e.target.value })
                    }
                    placeholder={`Stage ${index + 1}`}
                    className="h-8 flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  />
                  
                  {stages.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeStage(stage.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addStage}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add stage
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg">
              Create Pipeline
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
