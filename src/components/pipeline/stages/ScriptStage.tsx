import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, FileText, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { generateScript } from '@/lib/pipeline-service';
import { PIPELINE_CREDITS } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface ScriptStageProps {
  pipelineId: string;
  onContinue: () => void;
  stageNavigation?: React.ReactNode;
}

type InputMode = 'generate' | 'paste';

const scriptTypes = [
  'Sales', 'Educational', 'Entertainment', 'Tutorial', 'Story', 'Other'
];

export default function ScriptStage({ pipelineId, onContinue, stageNavigation }: ScriptStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  
  // Input state
  const [mode, setMode] = useState<InputMode>('generate');
  const [description, setDescription] = useState('');
  const [scriptType, setScriptType] = useState('Sales');
  const [duration, setDuration] = useState(60);
  const [pastedText, setPastedText] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing data
  useEffect(() => {
    if (pipeline?.script_input) {
      const input = pipeline.script_input;
      setMode(input.mode || 'generate');
      setDescription(input.description || '');
      setScriptType(input.script_type ? input.script_type.charAt(0).toUpperCase() + input.script_type.slice(1) : 'Sales');
      setDuration(input.duration_seconds || 60);
      setPastedText(input.pasted_text || '');
    }
  }, [pipeline?.script_input]);

  // Save input changes
  const saveInput = async () => {
    await updateScript({
      input: {
        mode,
        description,
        script_type: scriptType.toLowerCase() as any,
        duration_seconds: duration,
        pasted_text: pastedText,
      },
    });
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [mode, description, scriptType, duration, pastedText]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    if (mode === 'paste') {
      if (!pastedText.trim()) {
        toast.error('Please paste a script first');
        return;
      }
      await updateScript({
        output: {
          text: pastedText,
          char_count: pastedText.length,
          estimated_duration: Math.ceil(pastedText.length / 15),
        },
        complete: true,
      });
      toast.success('Script saved!');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      const previousScript = isEditing ? pipeline?.script_output?.text : undefined;
      
      const result = await generateScript(
        pipelineId,
        { 
          description, 
          script_type: scriptType.toLowerCase(), 
          duration_seconds: duration 
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
    }
  };

  const handleRegenerate = async () => {
    setIsEditing(false);
    await handleGenerate();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setDescription('');
  };

  const handleContinue = () => {
    if (pipeline?.script_output?.text) {
      updateScript({ complete: true });
      onContinue();
    }
  };

  const hasOutput = !!pipeline?.script_output?.text;
  const outputScript = pipeline?.script_output;

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
            mode === 'generate'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </button>
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
            mode === 'paste'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          Paste Script
        </button>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Estimated duration</Label>
              <span className="text-sm font-medium">{formatDuration(duration)}</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              min={30}
              max={300}
              step={15}
            />
            <p className="text-xs text-muted-foreground">
              ~{Math.round(duration * 15).toLocaleString()} characters
            </p>
          </div>

          {/* Script Type */}
          <div className="space-y-2">
            <Label>Script type</Label>
            <Select value={scriptType} onValueChange={setScriptType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scriptTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              Description {isEditing && <span className="text-primary text-xs ml-2">(Edit Mode)</span>}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isEditing ? "Describe the changes you want..." : "Describe what the script should be about..."}
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
            {pastedText.length.toLocaleString()} characters • ~{Math.ceil(pastedText.length / 15)} seconds
          </p>
        </div>
      )}
    </div>
  );

  const handleCopyScript = async () => {
    if (!outputScript?.text) return;
    try {
      await navigator.clipboard.writeText(outputScript.text);
      toast.success('Script copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy script');
    }
  };

  const outputContent = outputScript ? (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="bg-muted/50 rounded-xl p-4 max-h-96 overflow-y-auto">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{outputScript.text}</p>
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

  // Check if output was AI generated (not pasted)
  const wasAIGenerated = pipeline?.script_input?.mode === 'generate';

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRegenerate={handleRegenerate}
      onEdit={handleEdit}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'paste' ? 'Use Pasted Script' : (isEditing ? 'Edit Script' : 'Generate Script')}
      creditsCost={mode === 'paste' ? 'Free' : `${PIPELINE_CREDITS.script} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={hasOutput ? outputActions : undefined}
      stageNavigation={stageNavigation}
    />
  );
}
