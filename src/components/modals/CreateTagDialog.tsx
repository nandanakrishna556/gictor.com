import { useState } from 'react';
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

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tag: { tag_name: string; color: string }) => void;
}

const TAG_COLORS = [
  '#007AFF', // Blue
  '#FF9500', // Orange
  '#34C759', // Green
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#5AC8FA', // Light Blue
  '#FFCC00', // Yellow
];

export default function CreateTagDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({ tag_name: name, color });
    setName('');
    setColor(TAG_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">Tag Name</Label>
            <Input
              id="tagName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Urgent"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c && 'ring-2 ring-offset-2 ring-offset-background'
                  )}
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
                />
              ))}
            </div>
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
              Create Tag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
