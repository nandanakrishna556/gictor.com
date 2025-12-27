import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateVoice } from '@/lib/pipeline-service';
import { calculateVoiceCost } from '@/types/pipeline';
import StageLayout from './StageLayout';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { toast } from 'sonner';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceStageProps {
  pipelineId: string;
  onContinue: () => void;
}

const VOICES = [
  { id: 'rachel', name: 'Rachel', description: 'Calm and natural' },
  { id: 'drew', name: 'Drew', description: 'Well-rounded and versatile' },
  { id: 'clyde', name: 'Clyde', description: 'War veteran, gruff' },
  { id: 'paul', name: 'Paul', description: 'Ground reporter, authoritative' },
  { id: 'domi', name: 'Domi', description: 'Strong and confident' },
  { id: 'dave', name: 'Dave', description: 'Conversational, video essays' },
];

export default function VoiceStage({ pipelineId, onContinue }: VoiceStageProps) {
  const { pipeline, updateVoice, isUpdating } = usePipeline(pipelineId);
  
  const [mode, setMode] = useState<'generate' | 'upload'>(pipeline?.voice_input?.mode || 'generate');
  const [voiceId, setVoiceId] = useState(pipeline?.voice_input?.voice_id || 'rachel');
  const [stability, setStability] = useState(pipeline?.voice_input?.voice_settings?.stability || 0.5);
  const [similarity, setSimilarity] = useState(pipeline?.voice_input?.voice_settings?.similarity || 0.75);
  const [speed, setSpeed] = useState(pipeline?.voice_input?.voice_settings?.speed || 1.0);
  const [uploadedUrl, setUploadedUrl] = useState(pipeline?.voice_input?.uploaded_url || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const hasOutput = !!pipeline?.voice_output?.url;
  const outputUrl = pipeline?.voice_output?.url;
  const duration = pipeline?.voice_output?.duration_seconds || 0;
  const scriptText = pipeline?.script_output?.text || '';
  const charCount = scriptText.length;
  const creditsCost = mode === 'upload' ? 0 : calculateVoiceCost(charCount);

  const handleGenerate = async () => {
    if (mode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an audio file first');
        return;
      }
      // Get duration from uploaded audio
      const audio = new Audio(uploadedUrl);
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
        audio.src = uploadedUrl;
      });
      
      await updateVoice({
        input: { mode: 'upload', uploaded_url: uploadedUrl },
        output: { url: uploadedUrl, duration_seconds: audio.duration, generated_at: new Date().toISOString() },
        complete: true,
      });
      toast.success('Audio saved');
      return;
    }

    if (!scriptText) {
      toast.error('No script available. Please complete the Script stage first.');
      return;
    }

    setIsGenerating(true);
    try {
      await updateVoice({
        input: { 
          mode: 'generate', 
          voice_id: voiceId, 
          voice_settings: { stability, similarity, speed } 
        },
      });

      const result = await generateVoice(pipelineId, {
        script_text: scriptText,
        voice_id: voiceId,
        voice_settings: { stability, similarity, speed },
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
      updateVoice({ complete: true });
      onContinue();
    }
  };

  const togglePlayback = () => {
    if (!outputUrl) return;
    
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(outputUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioRef(audio);
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'generate' | 'upload')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="generate" id="generate-voice" />
            <Label htmlFor="generate-voice" className="font-normal cursor-pointer">Generate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id="upload-voice" />
            <Label htmlFor="upload-voice" className="font-normal cursor-pointer">Upload</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Script Preview */}
          <div className="space-y-2">
            <Label>Script ({charCount} characters)</Label>
            <div className="bg-muted/50 rounded-lg p-3 max-h-24 overflow-auto text-sm">
              {scriptText || <span className="text-muted-foreground">No script available</span>}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Stability</Label>
                <span className="text-sm text-muted-foreground">{stability.toFixed(2)}</span>
              </div>
              <Slider
                value={[stability]}
                onValueChange={([v]) => setStability(v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Similarity</Label>
                <span className="text-sm text-muted-foreground">{similarity.toFixed(2)}</span>
              </div>
              <Slider
                value={[similarity]}
                onValueChange={([v]) => setSimilarity(v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speed</Label>
                <span className="text-sm text-muted-foreground">{speed.toFixed(2)}x</span>
              </div>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Upload Audio</Label>
          <SingleImageUpload
            value={uploadedUrl}
            onChange={setUploadedUrl}
            className="h-32"
          />
          <p className="text-xs text-muted-foreground">Supported formats: MP3, WAV, M4A</p>
        </div>
      )}
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
        <Button
          size="lg"
          variant="ghost"
          className="w-20 h-20 rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-10 w-10" />
          ) : (
            <Play className="h-10 w-10 ml-1" />
          )}
        </Button>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium">{formatDuration(duration)}</p>
        <p className="text-sm text-muted-foreground">Duration</p>
      </div>
      <audio src={outputUrl} className="hidden" />
    </div>
  ) : null;

  return (
    <StageLayout
      inputTitle="Voice Input"
      inputContent={inputContent}
      outputTitle="Voice Output"
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRegenerate={handleRegenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Save Audio' : 'Generate Voice'}
      creditsCost={mode === 'upload' ? 'Free' : `${creditsCost.toFixed(2)} credits`}
      showEditButton={false}
    />
  );
}
