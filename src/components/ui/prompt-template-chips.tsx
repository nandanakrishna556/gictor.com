import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-0.5">
        <Sparkles className="h-3 w-3" />
        Templates:
      </span>
      {templates.map((tpl) => (
        <button
          key={tpl.label}
          type="button"
          onClick={() => onSelect(tpl.prompt)}
          className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          {tpl.label}
        </button>
      ))}
    </div>
  );
}
