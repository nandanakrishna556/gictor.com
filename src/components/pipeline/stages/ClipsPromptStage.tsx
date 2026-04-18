import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Video, Sparkles, ArrowRight, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface BRollPromptStageProps {
  pipelineId: string;
  onContinue: () => void;
  stageNavigation?: React.ReactNode;
}

// These are the B-Roll specific settings that will be used for video generation
interface BRollPromptInput {
  motion_prompt?: string;
  duration_seconds?: number;
  camera_motion?: 'static' | 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'dolly' | 'orbit';
  motion_intensity?: number; // 0-100
}

const CAMERA_MOTIONS = [
  { value: 'static', label: 'Static', description: 'No camera movement' },
  { value: 'pan_left', label: 'Pan Left', description: 'Camera pans from right to left' },
  { value: 'pan_right', label: 'Pan Right', description: 'Camera pans from left to right' },
  { value: 'zoom_in', label: 'Zoom In', description: 'Camera zooms into the scene' },
  { value: 'zoom_out', label: 'Zoom Out', description: 'Camera zooms out of the scene' },
  { value: 'dolly', label: 'Dolly', description: 'Camera moves forward into scene' },
  { value: 'orbit', label: 'Orbit', description: 'Camera orbits around subject' },
];

const DURATION_OPTIONS = [
  { value: 3, label: '3 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 7, label: '7 seconds' },
  { value: 10, label: '10 seconds' },
];

export default function BRollPromptStage({ pipelineId, onContinue, stageNavigation }: BRollPromptStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  
  // Input state - we use script_input/output for B-Roll prompt since structure is similar
  const [motionPrompt, setMotionPrompt] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [cameraMotion, setCameraMotion] = useState<string>('static');
  const [motionIntensity, setMotionIntensity] = useState(50);
  
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data from script_input (reused for B-Roll prompt)
  useEffect(() => {
    if (pipeline?.script_input) {
      const input = pipeline.script_input as any;
      setMotionPrompt(input.motion_prompt || input.description || '');
      setDurationSeconds(input.duration_seconds || 5);
      setCameraMotion(input.camera_motion || 'static');
      setMotionIntensity(input.motion_intensity || 50);
    }
  }, [pipeline?.script_input]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (pipelineId) {
        await updateScript({
          input: {
            mode: 'paste' as any, // We use paste mode since there's no AI generation for prompt
            description: motionPrompt,
            duration_seconds: durationSeconds,
            // Additional B-Roll specific fields
            motion_prompt: motionPrompt,
            camera_motion: cameraMotion,
            motion_intensity: motionIntensity,
          } as any,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [motionPrompt, durationSeconds, cameraMotion, motionIntensity, pipelineId]);

  const handleSave = async () => {
    if (!motionPrompt.trim()) {
      toast.error('Please enter a motion description');
      return;
    }

    setIsSaving(true);
    try {
      await updateScript({
        input: {
          mode: 'paste' as any,
          description: motionPrompt,
          duration_seconds: durationSeconds,
          motion_prompt: motionPrompt,
          camera_motion: cameraMotion,
          motion_intensity: motionIntensity,
        } as any,
        output: {
          text: motionPrompt,
          char_count: motionPrompt.length,
          estimated_duration: durationSeconds,
        },
        complete: true,
      });
      toast.success('Prompt saved!');
    } catch (error) {
      toast.error('Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = () => {
    if (!pipeline?.script_complete) {
      toast.error('Please save the prompt first');
      return;
    }
    onContinue();
  };

  const hasOutput = pipeline?.script_complete && pipeline?.script_output?.text;
  const firstFrameUrl = pipeline?.first_frame_output?.url;

  const inputContent = (
    <div className="space-y-6">
      {/* First Frame Preview */}
      {firstFrameUrl && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">First Frame</Label>
          <div className="relative w-full max-w-[200px]">
            <img 
              src={firstFrameUrl} 
              alt="First frame" 
              className="w-full h-auto rounded-lg border"
            />
          </div>
        </div>
      )}

      {/* Motion Prompt */}
      <div className="space-y-2">
        <Label>Motion Description</Label>
        <Textarea
          value={motionPrompt}
          onChange={(e) => setMotionPrompt(e.target.value)}
          placeholder="Describe how the scene should animate. E.g., 'Gentle waves rolling onto the beach, birds flying in the distance, clouds slowly drifting across the sky'"
          className="min-h-32 rounded-xl resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Describe the motion and animation you want in your B-Roll video
        </p>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duration</Label>
        <Select value={durationSeconds.toString()} onValueChange={(v) => setDurationSeconds(parseInt(v))}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Camera Motion */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Camera Motion
        </Label>
        <Select value={cameraMotion} onValueChange={setCameraMotion}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMERA_MOTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Motion Intensity */}
      {cameraMotion !== 'static' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Motion Intensity</Label>
            <span className="text-sm text-muted-foreground">{motionIntensity}%</span>
          </div>
          <Slider
            value={[motionIntensity]}
            onValueChange={(v) => setMotionIntensity(v[0])}
            min={10}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtle</span>
            <span>Dramatic</span>
          </div>
        </div>
      )}
    </div>
  );

  const outputContent = hasOutput ? (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
      <div className="w-full max-w-md space-y-4 bg-muted/30 rounded-xl p-6">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Prompt Settings Saved
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Motion:</span>
            <p className="mt-1">{pipeline?.script_output?.text || motionPrompt}</p>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>{durationSeconds}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Camera:</span>
            <span>{CAMERA_MOTIONS.find(c => c.value === cameraMotion)?.label || 'Static'}</span>
          </div>
          {cameraMotion !== 'static' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intensity:</span>
              <span>{motionIntensity}%</span>
            </div>
          )}
        </div>
      </div>
      <Button onClick={handleContinue} className="gap-2">
        Continue to Final Video
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[300px]">
      <Video className="h-16 w-16 text-muted-foreground/50" />
      <p className="text-lg font-medium">Configure Video Motion</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Set up how your B-Roll video will animate from the first frame
      </p>
    </div>
  );

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={!!hasOutput}
      onGenerate={handleSave}
      onContinue={handleContinue}
      isGenerating={isSaving || isUpdating}
      canContinue={!!hasOutput}
      generateLabel="Save Prompt"
      creditsCost="Free"
    />
  );
}
