import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { FileText, Copy, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { generateScript } from '@/lib/pipeline-service';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface ScriptStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type Perspective = 'mixed' | '1st' | '2nd' | '3rd';
type ScriptFormat = 'demo' | 'listicle' | 'problem-solution' | 'educational' | 'comparison' | 'promotional' | 'vsl';
type DurationUnit = 'seconds' | 'minutes';

const perspectives: { value: Perspective; label: string; desc: string }[] = [
  { value: 'mixed', label: 'Mixed', desc: 'Best for the situation' },
  { value: '1st', label: '1st Person', desc: '"I will show you..."' },
  { value: '2nd', label: '2nd Person', desc: '"You need to..."' },
  { value: '3rd', label: '3rd Person', desc: '"The user sees..."' },
];

const scriptFormats: { value: ScriptFormat; label: string; desc: string }[] = [
  { value: 'demo', label: 'Demo', desc: 'Product demonstration' },
  { value: 'listicle', label: 'Listicle', desc: 'Top X reasons/tips format' },
  { value: 'problem-solution', label: 'Problem-Solution', desc: 'Pain point → solution' },
  { value: 'educational', label: 'Educational', desc: 'Teaching/explaining concept' },
  { value: 'comparison', label: 'Comparison', desc: 'Us vs them / before-after' },
  { value: 'promotional', label: 'Promotional', desc: 'Direct marketing pitch' },
  { value: 'vsl', label: 'VSL', desc: 'Video sales letter format' },
];

const formatPlaceholders: Record<ScriptFormat, string> = {
  demo: `Describe your product and key features to demo...

Example: Create a demo for our AI video generator. Hook: "Stop spending $5K on video ads." Show the 3-step process: write script → pick AI actor → generate. End with free trial CTA.`,

  listicle: `What's your list topic and target audience?

Example: "5 AI tools every creator needs in 2025." Fast-paced, 10-15 sec per point. Hook with a bold claim, deliver value quickly, end with "Follow for more."`,

  'problem-solution': `What pain point are you solving?

Example: "Tired of paying agencies $5K per video?" Agitate the frustration, then reveal our AI solution. Show before/after: weeks of waiting vs. 5-minute generation.`,

  educational: `What concept are you teaching and to whom?

Example: Explain AI lip-sync for beginners. Break it down: 1) What it is, 2) How AI analyzes audio, 3) How it maps to faces. Use simple analogies, friendly tone.`,

  comparison: `What are you comparing?

Example: Traditional video production vs AI. Compare: Cost ($5K vs $50), Time (weeks vs minutes), Revisions (expensive vs unlimited). End with "The choice is clear."`,

  promotional: `What offer or product are you promoting?

Example: Black Friday sale - 50% off annual plans, 48 hours only. Create urgency, add social proof ("Join 10K+ creators"), strong CTA to claim the discount.`,

  vsl: `What product/service are you selling?

Example: VSL for our AI course. Structure: Hook → Pain → Story → Solution → Value stack → Price anchor → Guarantee → Urgency + CTA. Target: 5-10 minutes.`,
};

const CREDIT_COST = 0.25;

export default function ScriptStage({ pipelineId, onContinue }: ScriptStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  
  // Input mode
  const [mode, setMode] = useState<InputMode>('generate');
  
  // Input state - matches ScriptModal
  const [perspective, setPerspective] = useState<Perspective>('mixed');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('minutes');
  const [scriptFormat, setScriptFormat] = useState<ScriptFormat>('demo');
  const [prompt, setPrompt] = useState('');
  const [pastedText, setPastedText] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Prevent overwriting during typing
  const initialLoadDone = useRef(false);
  const generationInitiatedRef = useRef(false);

  // Duration constraints - max 1800 seconds (30 minutes)
  const MAX_DURATION_SECONDS = 1800;
  const incrementAmount = durationUnit === 'minutes' ? 1 : 15;
  const minValue = durationUnit === 'minutes' ? 1 : 15;

  // Load existing data
  useEffect(() => {
    if (pipeline?.script_input && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const input = pipeline.script_input;
      // Map 'paste' to 'upload' for InputMode compatibility
      const inputMode = input.mode === 'paste' ? 'upload' : (input.mode || 'generate');
      setMode(inputMode as InputMode);
      setPerspective((input as any).perspective || 'mixed');
      setDurationValue((input as any).duration_value || 1);
      setDurationUnit((input as any).duration_unit || 'minutes');
      setScriptFormat((input as any).script_format || 'demo');
      setPrompt(input.description || '');
      setPastedText(input.pasted_text || '');
    }
  }, [pipeline?.script_input]);

  // Auto-save on changes
  const saveInput = useCallback(async () => {
    if (!pipelineId || generationInitiatedRef.current) return;
    
    // Map 'upload' back to 'paste' for storage
    const storageMode = mode === 'upload' ? 'paste' : mode;
    
    await updateScript({
      input: {
        mode: storageMode,
        description: prompt,
        script_type: scriptFormat as any,
        duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
        pasted_text: pastedText,
      } as any,
    });
  }, [mode, prompt, scriptFormat, durationValue, durationUnit, pastedText, pipelineId, updateScript]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = setTimeout(saveInput, 1500);
    return () => clearTimeout(timer);
  }, [saveInput]);

  const handleDecrement = () => {
    const newValue = durationValue - incrementAmount;
    if (newValue >= minValue) {
      setDurationValue(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = durationValue + incrementAmount;
    if ((durationUnit === 'seconds' && newValue <= MAX_DURATION_SECONDS) || 
        (durationUnit === 'minutes' && newValue * 60 <= MAX_DURATION_SECONDS)) {
      setDurationValue(newValue);
    }
  };

  const handleUnitChange = (newUnit: DurationUnit) => {
    if (newUnit === durationUnit) return;
    if (newUnit === 'seconds') {
      const newVal = Math.min(durationValue * 60, MAX_DURATION_SECONDS);
      setDurationValue(newVal);
    } else {
      const newVal = Math.max(1, Math.min(5, Math.round(durationValue / 60)));
      setDurationValue(newVal);
    }
    setDurationUnit(newUnit);
  };

  const getPlaceholder = () => formatPlaceholders[scriptFormat];

  const handleGenerate = async () => {
    // 'upload' mode = paste mode for scripts
    if (mode === 'upload') {
      if (!pastedText.trim()) {
        toast.error('Please paste a script first');
        return;
      }
      await updateScript({
        output: {
          text: pastedText,
          char_count: pastedText.length,
          estimated_duration: Math.ceil(pastedText.length / 17),
        },
        complete: true,
      });
      toast.success('Script saved!');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // Check credits
    if ((profile?.credits ?? 0) < CREDIT_COST) {
      toast.error('Insufficient credits', { 
        description: `You need ${CREDIT_COST} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    generationInitiatedRef.current = true;
    setIsGenerating(true);

    try {
      const previousScript = isEditing ? pipeline?.script_output?.text : undefined;
      
      const result = await generateScript(
        pipelineId,
        { 
          description: prompt, 
          script_type: scriptFormat, 
          duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
        },
        isEditing,
        previousScript
      );

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        return;
      }

      toast.success('Script generation started!');
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
      generationInitiatedRef.current = false;
    }
  };

  const handleRegenerate = async () => {
    setIsEditing(false);
    await handleGenerate();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPrompt('');
  };

  const handleContinue = () => {
    if (pipeline?.script_output?.text) {
      updateScript({ complete: true });
      onContinue();
    }
  };

  const hasOutput = !!pipeline?.script_output?.text;
  const outputScript = pipeline?.script_output;

  // Check if output was AI generated (not pasted)
  const wasAIGenerated = pipeline?.script_input?.mode === 'generate';

  const handleCopyScript = async () => {
    if (!outputScript?.text) return;
    try {
      await navigator.clipboard.writeText(outputScript.text);
      toast.success('Script copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy script');
    }
  };

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <InputModeToggle
        mode={mode}
        onModeChange={setMode}
        uploadLabel="Paste"
      />

      {mode === 'generate' ? (
        <>
          {/* Duration with stepper */}
          <div className="space-y-3">
            <Label>Estimated duration</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-xl overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={handleDecrement}
                  disabled={durationValue <= minValue}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="px-4 min-w-[60px] text-center font-medium">
                  {durationValue}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none"
                  onClick={handleIncrement}
                  disabled={durationUnit === 'minutes' ? durationValue >= 30 : durationValue >= MAX_DURATION_SECONDS}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => handleUnitChange('seconds')}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    durationUnit === 'seconds'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  sec
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange('minutes')}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    durationUnit === 'minutes'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  min
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ~{((durationUnit === 'minutes' ? durationValue * 60 : durationValue) * 17).toLocaleString()} characters
            </p>
          </div>

          {/* Perspective */}
          <div className="space-y-2">
            <Label>Perspective</Label>
            <Select value={perspective} onValueChange={(v) => setPerspective(v as Perspective)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perspectives.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Script Format */}
          <div className="space-y-2">
            <Label>Script format</Label>
            <Select value={scriptFormat} onValueChange={(v) => setScriptFormat(v as ScriptFormat)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scriptFormats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex flex-col">
                      <span>{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>
              Prompt {isEditing && <span className="text-primary text-xs ml-2">(Refine Mode)</span>}
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isEditing ? "Describe the changes you want..." : getPlaceholder()}
              className="min-h-32 rounded-xl resize-none"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Paste your script</Label>
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your script here..."
            className="min-h-64 rounded-xl resize-none"
          />
          <p className="text-sm text-muted-foreground">
            {pastedText.length.toLocaleString()} characters • ~{Math.ceil(pastedText.length / 17)} seconds
          </p>
        </div>
      )}
    </div>
  );

  const outputContent = outputScript ? (
    <div className="w-full space-y-4">
      <div className="bg-muted/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
        <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{outputScript.text}</p>
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{outputScript.char_count?.toLocaleString()} characters</span>
        <span>~{outputScript.estimated_duration} seconds</span>
      </div>
    </div>
  ) : null;

  const outputActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleCopyScript}>
        <Copy className="h-4 w-4 mr-2" />
        Copy Script
      </Button>
    </div>
  );

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleRegenerate}
      onEdit={handleEdit}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Use Pasted Script' : (isEditing ? 'Refine Script' : 'Generate Script')}
      creditsCost={mode === 'upload' ? 'Free' : `${CREDIT_COST} credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={hasOutput ? outputActions : undefined}
      emptyStateIcon={<FileText className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated script will appear here"
      emptyStateSubtitle="Configure inputs and click Generate"
    />
  );
}
