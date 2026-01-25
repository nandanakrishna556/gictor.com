import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { Sparkles, FileText, Copy, Loader2, RefreshCw, Wand2, Minus, Plus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface ScriptStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type ScriptType = 'prompt' | 'recreate' | 'walkthrough';
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
const HUMANIZE_CREDIT_COST = 0.25;
const MAX_DURATION_SECONDS = 1800; // 30 minutes

export default function ScriptStage({ pipelineId, onContinue }: ScriptStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [scriptType, setScriptType] = useState<ScriptType>('prompt');
  const [perspective, setPerspective] = useState<Perspective>('mixed');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('minutes');
  const [scriptFormat, setScriptFormat] = useState<ScriptFormat>('demo');
  const [prompt, setPrompt] = useState('');
  const [pastedScript, setPastedScript] = useState('');
  
  // Output state
  const [isRefineMode, setIsRefineMode] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  
  // Generation state - watch pipeline status directly
  const [localGenerating, setLocalGenerating] = useState(false);
  const generationInitiatedRef = useRef(false);
  const initialLoadDone = useRef(false);
  const prevScriptOutputRef = useRef<string | null>(null);

  // Derive from pipeline status
  const isServerProcessing = pipeline?.status === 'processing';
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);
  const hasOutput = !!pipeline?.script_output?.text;
  const outputScript = pipeline?.script_output;

  // Duration logic
  const incrementAmount = durationUnit === 'minutes' ? 1 : 15;
  const minValue = durationUnit === 'minutes' ? 1 : 15;
  const maxValue = durationUnit === 'minutes' ? 30 : 1800;

  // Load existing data only on first mount
  useEffect(() => {
    if (pipeline?.script_input && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const input = pipeline.script_input as any;
      setInputMode(input.mode || 'generate');
      setScriptType(input.script_type || 'prompt');
      setPerspective(input.perspective || 'mixed');
      setDurationValue(input.duration_value || 1);
      setDurationUnit(input.duration_unit || 'minutes');
      setScriptFormat(input.script_format || 'demo');
      setPrompt(input.prompt || '');
      setPastedScript(input.pasted_script || '');
    }
  }, [pipeline?.script_input]);

  // Watch pipeline for completion - n8n calls update-pipeline-status which updates script_output
  useEffect(() => {
    if (!pipeline || !generationInitiatedRef.current) return;
    
    const currentOutput = pipeline.script_output?.text;
    
    // Detect when new output arrives
    if (currentOutput && currentOutput !== prevScriptOutputRef.current) {
      setLocalGenerating(false);
      setIsHumanizing(false);
      generationInitiatedRef.current = false;
      toast.success('Script generated!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
    
    prevScriptOutputRef.current = currentOutput || null;
  }, [pipeline?.script_output?.text, queryClient]);

  // Save input changes
  const saveInput = async () => {
    await updateScript({
      input: {
        mode: inputMode,
        script_type: scriptType,
        perspective,
        duration_value: durationValue,
        duration_unit: durationUnit,
        duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
        script_format: scriptFormat,
        prompt,
        pasted_script: pastedScript,
      } as any,
    });
  };

  // Auto-save on changes (excluding prompt to prevent typing interruption)
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [inputMode, scriptType, perspective, durationValue, durationUnit, scriptFormat, pastedScript]);
  
  // Separate debounced save for prompt (longer delay)
  useEffect(() => {
    const timer = setTimeout(saveInput, 1500);
    return () => clearTimeout(timer);
  }, [prompt]);

  // Duration handlers
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
      const newVal = Math.max(1, Math.min(30, Math.round(durationValue / 60)));
      setDurationValue(newVal);
    }
    setDurationUnit(newUnit);
  };

  // Get placeholder based on format and mode
  const getPlaceholder = () => {
    if (isRefineMode) {
      return `What changes do you want?

Example: Make it shorter (45 sec). More urgency at the end. Conversational tone. Remove pricing.`;
    }
    if (scriptType === 'recreate') {
      return `How should we adapt this video?

Example: Recreate this competitor's script for our product. Keep their hook structure and energy. Replace their features with ours: AI actors, instant generation, unlimited revisions.`;
    }
    if (scriptType === 'walkthrough') {
      return `What features should we walk through?

Example: Dashboard walkthrough for new users. Show: 1) Create project, 2) Add script, 3) Select actor, 4) Generate video. Emphasize simplicity at each step.`;
    }
    return formatPlaceholders[scriptFormat];
  };

  const handleGenerate = async () => {
    if (inputMode === 'upload') {
      if (!pastedScript.trim()) {
        toast.error('Please paste a script first');
        return;
      }
      await updateScript({
        output: {
          text: pastedScript,
          char_count: pastedScript.length,
          estimated_duration: Math.ceil(pastedScript.length / 17),
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

    if (!profile || (profile.credits ?? 0) < CREDIT_COST) {
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
    setLocalGenerating(true);

    try {
      await saveInput();

      // Create internal file for n8n to process (n8n expects file_id)
      const { data: internalFile, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: pipeline?.project_id,
          name: `${pipeline?.name || 'Pipeline'} - Script`,
          file_type: 'script',
          generation_status: 'processing',
          generation_params: {
            pipeline_id: pipelineId,
            is_internal: true,
            stage: 'script',
          },
        })
        .select()
        .single();

      if (fileError || !internalFile) {
        throw new Error('Failed to create internal file');
      }

      // Use standard 'script' type - n8n processes it, update-file-status syncs back to pipeline
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'script',
          payload: {
            file_id: internalFile.id,
            user_id: user?.id,
            prompt: prompt,
            script_type: scriptType,
            script_format: scriptFormat,
            perspective,
            duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
            is_refine: isRefineMode,
            previous_script: isRefineMode ? outputScript?.text : undefined,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
          },
        },
      });

      if (error || !data?.success) {
        // Clean up internal file on failure
        await supabase.from('files').delete().eq('id', internalFile.id);
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      setIsRefineMode(false);
      toast.success('Script generation started!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
    }
  };

  const handleHumanize = async () => {
    if (!outputScript?.text || !profile || !user || !pipeline) return;

    if ((profile.credits ?? 0) < HUMANIZE_CREDIT_COST) {
      toast.error('Insufficient credits', { 
        description: `You need ${HUMANIZE_CREDIT_COST} credits but have ${profile.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    setIsHumanizing(true);
    generationInitiatedRef.current = true;

    try {
      // Create internal file for n8n to process
      const { data: internalFile, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: pipeline?.project_id,
          name: `${pipeline?.name || 'Pipeline'} - Humanize`,
          file_type: 'script',
          generation_status: 'processing',
          generation_params: {
            pipeline_id: pipelineId,
            is_internal: true,
            stage: 'humanize',
          },
        })
        .select()
        .single();

      if (fileError || !internalFile) {
        throw new Error('Failed to create internal file');
      }

      // Use 'humanize' type - n8n processes it, update-file-status syncs back to pipeline
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'humanize',
          payload: {
            file_id: internalFile.id,
            user_id: user.id,
            script: outputScript.text,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
          },
        },
      });

      if (error || !data?.success) {
        // Clean up internal file on failure
        await supabase.from('files').delete().eq('id', internalFile.id);
        throw new Error(error?.message || data?.error || 'Humanization failed');
      }

      toast.success('Humanizing script...');
    } catch (error) {
      console.error('Humanize error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to humanize script');
      setIsHumanizing(false);
      generationInitiatedRef.current = false;
    }
  };

  const handleContinue = () => {
    if (pipeline?.script_output?.text) {
      updateScript({ complete: true });
      onContinue();
    }
  };

  const handleCopyScript = async () => {
    if (!outputScript?.text) return;
    try {
      await navigator.clipboard.writeText(outputScript.text);
      toast.success('Script copied to clipboard');
    } catch {
      toast.error('Failed to copy script');
    }
  };

  const handleDownload = () => {
    if (!outputScript?.text) return;
    const blob = new Blob([outputScript.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script downloaded');
  };

  // Calculate stats
  const charCount = outputScript?.text?.length || 0;
  const pastedCharCount = pastedScript.length;
  const estimatedSeconds = Math.round(charCount / 17);
  const pastedEstimatedSeconds = Math.round(pastedCharCount / 17);

  const inputContent = (
    <div className="space-y-5">
      {/* Generate/Paste Toggle */}
      <InputModeToggle
        mode={inputMode}
        onModeChange={setInputMode}
        uploadLabel="Paste"
      />

      {inputMode === 'generate' ? (
        <>
          {/* Script Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Script Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['prompt', 'recreate', 'walkthrough'] as ScriptType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setScriptType(type)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-all",
                    scriptType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {type === 'prompt' ? 'Prompt' : type === 'recreate' ? 'Recreate' : 'Walkthrough'}
                </button>
              ))}
            </div>
          </div>

          {/* Perspective */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Perspective</label>
            <div className="flex flex-wrap gap-2">
              {perspectives.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPerspective(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-all",
                    perspective === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleDecrement}
                disabled={durationValue <= minValue}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-16 text-center font-medium">{durationValue}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleIncrement}
                disabled={(durationUnit === 'minutes' && durationValue >= 30) || 
                         (durationUnit === 'seconds' && durationValue >= MAX_DURATION_SECONDS)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="flex gap-1">
                <button
                  onClick={() => handleUnitChange('seconds')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-all",
                    durationUnit === 'seconds'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  sec
                </button>
                <button
                  onClick={() => handleUnitChange('minutes')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-all",
                    durationUnit === 'minutes'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  min
                </button>
              </div>
            </div>
          </div>

          {/* Script Format */}
          {scriptType === 'prompt' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Script Format</label>
              <Select value={scriptFormat} onValueChange={(v: ScriptFormat) => setScriptFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scriptFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex flex-col items-start">
                        <span>{format.label}</span>
                        <span className="text-xs text-muted-foreground">{format.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {isRefineMode ? 'Refinement Instructions' : 'Prompt'}
              </label>
              {isRefineMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRefineMode(false)}
                  className="h-6 text-xs"
                >
                  Cancel Refine
                </Button>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholder()}
              className="min-h-[120px] resize-none"
            />
          </div>
        </>
      ) : (
        /* Paste Mode */
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paste Your Script</label>
              {pastedCharCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {pastedCharCount.toLocaleString()} chars • ~{pastedEstimatedSeconds}s
                </span>
              )}
            </div>
            <Textarea
              value={pastedScript}
              onChange={(e) => setPastedScript(e.target.value)}
              placeholder="Paste your script here..."
              className="min-h-[200px] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );

  const outputContent = hasOutput ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>~{Math.floor(estimatedSeconds / 60)}:{(estimatedSeconds % 60).toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyScript}
            className="h-8"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      <div className="bg-secondary/30 rounded-xl p-4 max-h-[300px] overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{outputScript?.text}</p>
      </div>
      
      {/* Action buttons like ScriptModal */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setIsRefineMode(false);
            handleGenerate();
          }}
          disabled={isGenerating || isHumanizing}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
        <Button
          variant={isRefineMode ? 'default' : 'secondary'}
          onClick={() => setIsRefineMode(!isRefineMode)}
          disabled={isGenerating || isHumanizing}
          className="flex-1"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Refine
        </Button>
      </div>
      
      {/* Humanize Button */}
      <Button
        variant="outline"
        onClick={handleHumanize}
        disabled={isHumanizing || isGenerating || (profile?.credits ?? 0) < HUMANIZE_CREDIT_COST}
        className="w-full"
      >
        {isHumanizing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Humanizing...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Humanize Script • {HUMANIZE_CREDIT_COST} credits
          </>
        )}
      </Button>
      
      {isRefineMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
          <p className="text-primary">
            <strong>Refine Mode:</strong> Describe your changes in the Prompt field, then click "Generate Script".
          </p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isHumanizing || isUpdating}
      canContinue={hasOutput}
      generateLabel={inputMode === 'upload' ? 'Save Script • Free' : isRefineMode ? 'Refine Script' : 'Generate Script'}
      creditsCost={inputMode === 'upload' ? '' : `${CREDIT_COST} credits`}
      generateDisabled={inputMode === 'generate' && !prompt.trim()}
      isAIGenerated={inputMode === 'generate'}
      emptyStateIcon={<FileText className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated script will appear here"
      emptyStateSubtitle="Enter a prompt and click Generate"
    />
  );
}
