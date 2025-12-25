import { useState } from 'react';
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
import type { PipelineStage } from '@/hooks/usePipelines';

interface CreatePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, stages: PipelineStage[]) => void;
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

export default function CreatePipelineDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePipelineDialogProps) {
  const [name, setName] = useState('');
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: 'stage-1', name: 'To Do', color: 'bg-amber-500' },
    { id: 'stage-2', name: 'In Progress', color: 'bg-blue-500' },
    { id: 'stage-3', name: 'Done', color: 'bg-green-500' },
  ]);

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

  const handleSubmit = () => {
    if (name.trim() && stages.length >= 2) {
      onSubmit(name.trim(), stages);
      setName('');
      setStages([
        { id: 'stage-1', name: 'To Do', color: 'bg-amber-500' },
        { id: 'stage-2', name: 'In Progress', color: 'bg-blue-500' },
        { id: 'stage-3', name: 'Done', color: 'bg-green-500' },
      ]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <div className="space-y-2">
            <Label>Stages</Label>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <div
                    className={`h-3 w-3 rounded-full ${stage.color}`}
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
              ))}
              <button
                onClick={handleAddStage}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                Add Stage
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || stages.length < 2}>
            Create Pipeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
