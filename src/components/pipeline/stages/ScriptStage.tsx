import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateScript } from '@/lib/pipeline-service';
import { PIPELINE_CREDITS } from '@/types/pipeline';
import StageLayout from './StageLayout';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface ScriptStageProps {
  pipelineId: string;
  onContinue: () => void;
}

const SCRIPT_TYPES = [
  { value: 'sales', label: 'Sales' },
  { value: 'educational', label: 'Educational' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'story', label: 'Story' },
  { value: 'other', label: 'Other' },
];

export default function ScriptStage({ pipelineId, onContinue }: ScriptStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  
  const [mode, setMode] = useState<'generate' | 'paste'>(pipeline?.script_input?.mode || 'generate');
  const [description, setDescription] = useState(pipeline?.script_input?.description || '');
  const [scriptType, setScriptType] = useState<string>(pipeline?.script_input?.script_type || 'sales');
  const [durationSeconds, setDurationSeconds] = useState(pipeline?.script_input?.duration_seconds || 30);
  const [pastedText, setPastedText] = useState(pipeline?.script_input?.pasted_text || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const hasOutput = !!pipeline?.script_output?.text;
  const outputText = pipeline?.script_output?.text;
  const charCount = pipeline?.script_output?.char_count || 0;
  const estimatedDuration = pipeline?.script_output?.estimated_duration || 0;

  const handleGenerate = async () => {
    if (mode === 'paste') {
      if (!pastedText.trim()) {
        toast.error('Please paste a script');
        return;
      }
      const text = pastedText.trim();
      await updateScript({
        input: { mode: 'paste', pasted_text: text },
        output: { 
          text, 
          char_count: text.length, 
          estimated_duration: Math.ceil(text.length / 15) // ~15 chars per second
        },
        complete: true,
      });
      toast.success('Script saved');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      await updateScript({
        input: { mode: 'generate', description, script_type: scriptType as any, duration_seconds: durationSeconds },
      });

      const result = await generateScript(pipelineId, {
        description,
        script_type: scriptType,
        duration_seconds: durationSeconds,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
      } else {
        toast.success('Generation started');
      }
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleContinue = () => {
    if (hasOutput) {
      updateScript({ complete: true });
      onContinue();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'generate' | 'paste')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="generate" id="generate-script" />
            <Label htmlFor="generate-script" className="font-normal cursor-pointer">Generate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paste" id="paste-script" />
            <Label htmlFor="paste-script" className="font-normal cursor-pointer">Paste</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Script Type */}
          <div className="space-y-2">
            <Label>Script Type</Label>
            <Select value={scriptType} onValueChange={setScriptType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRIPT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Duration</Label>
              <span className="text-sm text-muted-foreground">{formatDuration(durationSeconds)}</span>
            </div>
            <Slider
              value={[durationSeconds]}
              onValueChange={([v]) => setDurationSeconds(v)}
              min={15}
              max={120}
              step={5}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the script should be about..."
              rows={6}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Paste Script</Label>
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your script here..."
            rows={12}
          />
          <p className="text-xs text-muted-foreground">
            {pastedText.length} characters • ~{formatDuration(Math.ceil(pastedText.length / 15))} estimated
          </p>
        </div>
      )}
    </div>
  );

  const outputContent = outputText ? (
    <div className="space-y-4">
      <div className="bg-background rounded-lg border p-4 max-h-96 overflow-auto">
        <p className="whitespace-pre-wrap">{outputText}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{charCount} characters</span>
        <span>•</span>
        <span>~{formatDuration(estimatedDuration)} estimated</span>
      </div>
    </div>
  ) : null;

  return (
    <StageLayout
      inputTitle="Script Input"
      inputContent={inputContent}
      outputTitle="Script Output"
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRegenerate={handleRegenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'paste' ? 'Save Script' : 'Generate'}
      creditsCost={mode === 'paste' ? 'Free' : `${PIPELINE_CREDITS.script} credits`}
      showEditButton={true}
      onEdit={() => {
        if (outputText) {
          setMode('paste');
          setPastedText(outputText);
        }
      }}
    />
  );
}
