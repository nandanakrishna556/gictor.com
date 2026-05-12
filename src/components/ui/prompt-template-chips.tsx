import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface PromptTemplate {
  label: string;
  prompt: string;
}

export const FRAME_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    label: "Action + Scene + Wardrobe",
    prompt:
      "A modern, well-lit setting. The actor wears [wardrobe], with a [expression] expression, performing [action] toward the camera.",
  },
  {
    label: "UGC Selfie",
    prompt:
      "Casual bedroom or living room background, soft natural light. The actor wears a plain hoodie, smiling warmly while holding their phone at arm's length, talking directly to the camera.",
  },
  {
    label: "Studio Talking Head",
    prompt:
      "Clean studio backdrop with soft key lighting. The actor wears a neutral-toned shirt, calm and confident expression, gesturing naturally while speaking to camera.",
  },
  {
    label: "Outdoor Lifestyle",
    prompt:
      "Sunny outdoor street scene with shallow depth of field. The actor wears casual streetwear, relaxed expression, mid-stride walking past the camera.",
  },
];

interface PromptTemplateChipsProps {
  templates?: PromptTemplate[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function PromptTemplateChips({
  templates = FRAME_PROMPT_TEMPLATES,
  onSelect,
  className,
}: PromptTemplateChipsProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const handleChipClick = (tpl: PromptTemplate) => {
    setActiveLabel(tpl.label);
    setDraft(tpl.prompt);
  };

  const handleApply = () => {
    onSelect(draft);
    setActiveLabel(null);
    setDraft("");
  };

  const handleCancel = () => {
    setActiveLabel(null);
    setDraft("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-0.5">
          <Sparkles className="h-3 w-3" />
          Templates:
        </span>
        {templates.map((tpl) => {
          const isActive = activeLabel === tpl.label;
          return (
            <button
              key={tpl.label}
              type="button"
              onClick={() => handleChipClick(tpl)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              )}
            >
              {tpl.label}
            </button>
          );
        })}
      </div>

      {activeLabel && (
        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Preview: {activeLabel}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              Edit before applying
            </span>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-20 text-sm resize-none bg-background"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!draft.trim()}
              className="h-7 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Use this prompt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
