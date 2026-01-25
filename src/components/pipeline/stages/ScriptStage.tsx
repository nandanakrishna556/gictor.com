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
import { useQueryClient, useQuery } from '@tanstack/react-query';
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
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);
  const generationInitiatedRef = useRef(false);
  const initialLoadDone = useRef(false);

  // Derive from pipeline
  const isServerProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'script';
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
    
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.script_input, pipeline?.status, hasOutput, pipelineId]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    if (generationInitiatedRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    if (generationInitiatedRef.current && prevStatus === 'processing' && currentStatus !== 'processing' && pipeline.script_output?.text) {
      if (toastShownRef.current !== pipelineId) {
        toastShownRef.current = pipelineId;
        toast.success('Script generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
      setIsHumanizing(false);
      generationInitiatedRef.current = false;
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

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

    isLocalGeneratingRef.current = true;
    generationInitiatedRef.current = true;
    setLocalGenerating(true);

    try {
      await saveInput();

      // Set pipeline status to processing BEFORE triggering generation
      await supabase
        .from('pipelines')
        .update({ status: 'processing', current_stage: 'script' })
        .eq('id', pipelineId);

      // Also sync linked file to show processing in project grid
      const { data: linkedFiles } = await supabase
        .from('files')
        .select('id')
        .eq('generation_params->>pipeline_id', pipelineId);

      if (linkedFiles && linkedFiles.length > 0) {
        await supabase
          .from('files')
          .update({ generation_status: 'processing' })
          .eq('id', linkedFiles[0].id);
      }

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'pipeline_script',
          payload: {
            pipeline_id: pipelineId,
            script_type: scriptType,
            perspective,
            duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
            script_format: scriptFormat,
            prompt,
            is_refine: isRefineMode,
            previous_script: isRefineMode ? outputScript?.text : undefined,
            credits_cost: CREDIT_COST,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      setIsRefineMode(false);
      toast.success('Script generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
      // Reset pipeline status on error
      await supabase
        .from('pipelines')
        .update({ status: 'draft' })
        .eq('id', pipelineId);
    }
  };

  // Watch for humanize completion via pipeline script_output changes
  const prevScriptOutputRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isHumanizing || !pipeline?.script_output?.text) return;
    
    const currentOutput = pipeline.script_output.text;
    
    // If we're humanizing and the output changed, it means humanization completed
    if (currentOutput !== prevScriptOutputRef.current && prevScriptOutputRef.current !== null) {
      toast.success('Script humanized!');
      setIsHumanizing(false);
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    }
    
    prevScriptOutputRef.current = currentOutput;
  }, [pipeline?.script_output?.text, isHumanizing, queryClient, pipelineId]);

  // Reset humanizing state when pipeline status changes from processing
  useEffect(() => {
    if (isHumanizing && pipeline?.status !== 'processing') {
      // Small delay to ensure output is updated
      const timer = setTimeout(() => {
        if (pipeline?.script_output?.text) {
          setIsHumanizing(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pipeline?.status, isHumanizing, pipeline?.script_output?.text]);

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
    prevScriptOutputRef.current = outputScript.text;

    try {
      // Set pipeline to processing so usePipeline starts polling
      await supabase
        .from('pipelines')
        .update({ status: 'processing' })
        .eq('id', pipelineId);

      // Use pipeline_humanize type - updates pipeline directly, no file created
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'pipeline_humanize',
          payload: {
            pipeline_id: pipelineId,
            user_id: user.id,
            script: outputScript.text,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Humanization failed');
      }

      toast.success('Humanizing script...');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Humanize error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to humanize script');
      setIsHumanizing(false);
      // Reset pipeline status on error
      await supabase
        .from('pipelines')
        .update({ status: 'draft' })
        .eq('id', pipelineId);
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
            <div className="flex gap-2">
              {(['prompt', 'recreate', 'walkthrough'] as ScriptType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setScriptType(type)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    scriptType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Perspective */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Perspective</label>
            <div className="grid grid-cols-2 gap-2">
              {perspectives.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPerspective(p.value)}
                  className={cn(
                    'p-2.5 rounded-lg border text-left transition-all',
                    perspective === p.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                      perspective === p.value ? 'border-primary' : 'border-muted-foreground/50'
                    )}>
                      {perspective === p.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="font-medium text-sm">{p.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration - Only for prompt type */}
          {scriptType === 'prompt' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Duration</label>
                <div className="flex gap-2">
                  {/* Stepper */}
                  <div className="flex-1 flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={handleDecrement}
                      className="h-9 w-9 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={durationValue}
                      onChange={(e) => { 
                        const val = parseInt(e.target.value) || minValue;
                        setDurationValue(Math.min(maxValue, Math.max(minValue, val))); 
                      }}
                      className="h-9 flex-1 min-w-0 bg-secondary border-x border-border text-center text-sm font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={handleIncrement}
                      className="h-9 w-9 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Unit Toggle */}
                  <div className="flex-1 flex items-center bg-secondary rounded-lg p-1">
                    <button
                      onClick={() => handleUnitChange('seconds')}
                      className={cn(
                        'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                        durationUnit === 'seconds'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Seconds
                    </button>
                    <button
                      onClick={() => handleUnitChange('minutes')}
                      className={cn(
                        'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                        durationUnit === 'minutes'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Minutes
                    </button>
                  </div>
                </div>
              </div>

              {/* Script Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Script Format</label>
                <Select value={scriptFormat} onValueChange={(v) => setScriptFormat(v as ScriptFormat)}>
                  <SelectTrigger className="h-auto py-2.5 px-3">
                    <div className="flex flex-col items-start text-left w-full">
                      <span className="font-medium text-sm">{scriptFormats.find(f => f.value === scriptFormat)?.label}</span>
                      <span className="text-xs text-muted-foreground">{scriptFormats.find(f => f.value === scriptFormat)?.desc}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {scriptFormats.map((f) => (
                      <SelectItem key={f.value} value={f.value} className="py-2">
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-xs text-muted-foreground">{f.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Prompt</label>
              {isRefineMode && (
                <span className="text-xs text-primary font-medium">(Refine Mode)</span>
              )}
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholder()}
              className="min-h-[120px] resize-none text-sm"
            />
          </div>
        </>
      ) : (
        /* Paste Mode */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Paste Your Script</label>
            <span className={cn(
              "text-xs",
              pastedCharCount > 50000 ? "text-destructive" : "text-muted-foreground"
            )}>
              {pastedCharCount.toLocaleString()} characters
            </span>
          </div>
          <Textarea
            value={pastedScript}
            onChange={(e) => setPastedScript(e.target.value)}
            placeholder="Paste your script here..."
            className="min-h-[300px] resize-none text-sm"
          />
          {pastedCharCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Estimated duration: ~{pastedEstimatedSeconds} seconds
            </p>
          )}
        </div>
      )}
    </div>
  );

  const outputContent = isGenerating || isHumanizing ? (
    <div className="h-64 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-3 animate-fade-in">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {isHumanizing ? 'Humanizing your script...' : 'Generating your script...'}
      </p>
    </div>
  ) : outputScript?.text ? (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-card rounded-xl p-5 border border-border">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{outputScript.text}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <span>{charCount.toLocaleString()} characters</span>
        <span>~{estimatedSeconds} seconds</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
        <Button
          variant={isRefineMode ? 'default' : 'secondary'}
          onClick={() => setIsRefineMode(!isRefineMode)}
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
        disabled={isHumanizing || isGenerating}
        className="w-full"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Humanize Script • {HUMANIZE_CREDIT_COST} credits
      </Button>

      {isRefineMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
          <p className="text-primary">
            <strong>Refine Mode:</strong> Describe your changes in the Prompt field, then click Generate.
          </p>
        </div>
      )}
    </div>
  ) : null;

  const outputActions = outputScript?.text && !isGenerating && !isHumanizing ? (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleCopyScript}>
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  ) : null;

  const wasAIGenerated = inputMode === 'generate';

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
      generateLabel={inputMode === 'upload' ? 'Save Script • Free' : (isRefineMode ? `Refine Script • ${CREDIT_COST} Credits` : `Generate Script • ${CREDIT_COST} Credits`)}
      creditsCost={inputMode === 'upload' ? 'Free' : `${CREDIT_COST} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={outputActions}
      emptyStateIcon={<FileText className="h-12 w-12 text-muted-foreground/50" />}
      emptyStateTitle="No script yet"
      emptyStateSubtitle="Generate or paste a script to get started"
    />
  );
}
