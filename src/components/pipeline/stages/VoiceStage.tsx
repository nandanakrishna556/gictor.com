import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Upload, Sparkles, Play, Pause, Star, ChevronDown, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePipeline } from '@/hooks/usePipeline';
import { generateVoice, getAudioDuration } from '@/lib/pipeline-service';
import { calculateVoiceCost } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface VoiceStageProps {
  pipelineId: string;
  onContinue: () => void;
  stageNavigation?: React.ReactNode;
}

type InputMode = 'generate' | 'upload';

// ElevenLabs voices
const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female', accent: 'American' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', accent: 'American' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', accent: 'American' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', accent: 'American' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', accent: 'American' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', accent: 'American' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', accent: 'American' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', accent: 'American' },
];

export default function VoiceStage({ pipelineId, onContinue, stageNavigation }: VoiceStageProps) {
  const { pipeline, updateVoice, isUpdating } = usePipeline(pipelineId);
  
  // Input state
  const [mode, setMode] = useState<InputMode>('generate');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity: 0.75,
    speed: 1.0,
  });
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Get script from previous stage
  const scriptText = pipeline?.script_output?.text || '';
  const charCount = scriptText.length;
  const estimatedCost = calculateVoiceCost(charCount);

  // Load existing data
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input;
      setMode(input.mode || 'generate');
      if (input.voice_id) {
        const voice = VOICES.find(v => v.id === input.voice_id);
        if (voice) setSelectedVoice(voice);
      }
      if (input.voice_settings) {
        setVoiceSettings(input.voice_settings);
      }
      setUploadedUrl(input.uploaded_url || '');
    }
  }, [pipeline?.voice_input]);

  // Save input changes
  const saveInput = async () => {
    await updateVoice({
      input: {
        mode,
        voice_id: selectedVoice.id,
        voice_settings: voiceSettings,
        uploaded_url: uploadedUrl,
      },
    });
  };

  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [mode, selectedVoice, voiceSettings, uploadedUrl]);

  const togglePlayback = () => {
    const outputUrl = pipeline?.voice_output?.url;
    if (!outputUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(outputUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToR2(file, { 
        folder: 'pipeline-voices',
        allowedTypes: [
          'audio/mpeg', 
          'audio/mp3', 
          'audio/wav', 
          'audio/wave',
          'audio/x-wav',
          'audio/m4a', 
          'audio/x-m4a', 
          'audio/mp4',
          'audio/ogg',
          'audio/webm',
          'audio/aac',
        ],
        maxSize: 50 * 1024 * 1024,
      });
      setUploadedUrl(url);
      
      const duration = await getAudioDuration(url);
      
      await updateVoice({
        input: { mode: 'upload', uploaded_url: url },
        output: { url, duration_seconds: duration, generated_at: new Date().toISOString() },
        complete: true,
      });
      
      toast.success('Audio uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleRemoveUploadedAudio = async () => {
    setUploadedUrl('');
    await updateVoice({ output: null, complete: false });
    toast.success('Audio removed');
  };

  const handleGenerate = async () => {
    if (mode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an audio file first');
        return;
      }
      return;
    }

    if (!scriptText) {
      toast.error('No script available', { description: 'Please complete the Script stage first' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVoice(pipelineId, {
        script_text: scriptText,
        voice_id: selectedVoice.id,
        voice_settings: voiceSettings,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        return;
      }

      toast.success('Voice generation started!');
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (pipeline?.voice_output?.url) {
      updateVoice({ complete: true });
      onContinue();
    }
  };

  const hasOutput = !!pipeline?.voice_output?.url;
  const outputAudio = pipeline?.voice_output;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          onClick={() => setMode('upload')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
            mode === 'upload'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Script Preview - Collapsible */}
          <Collapsible open={scriptOpen} onOpenChange={setScriptOpen}>
            <CollapsibleTrigger asChild>
              <button 
                type="button"
                className="flex w-full items-center justify-between rounded-xl border bg-background p-3 hover:bg-secondary/50 transition-colors"
              >
                <Label className="cursor-pointer">Script to voice ({charCount.toLocaleString()} characters)</Label>
                <ChevronDown className={cn("h-4 w-4 transition-transform", scriptOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-muted/50 rounded-xl p-4 max-h-32 overflow-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {scriptText || 'No script available'}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Voice Selector */}
          <Collapsible open={voiceOpen} onOpenChange={setVoiceOpen}>
            <CollapsibleTrigger asChild>
              <button 
                type="button"
                className="flex w-full items-center justify-between rounded-xl border bg-background p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                    🎙️
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{selectedVoice.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVoice.gender} • {selectedVoice.accent}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", voiceOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => setSelectedVoice(voice)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg p-3 text-left transition-all",
                      selectedVoice.id === voice.id 
                        ? "bg-primary/10 text-primary ring-1 ring-primary" 
                        : "bg-muted/50 hover:bg-secondary"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <Play className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">{voice.gender}</p>
                    </div>
                    {selectedVoice.id === voice.id && (
                      <Star className="h-4 w-4 ml-auto fill-primary text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Voice Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stability</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.stability.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[voiceSettings.stability]}
                    onValueChange={([v]) => setVoiceSettings(s => ({ ...s, stability: v }))}
                    min={0} max={1} step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Similarity</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.similarity.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[voiceSettings.similarity]}
                    onValueChange={([v]) => setVoiceSettings(s => ({ ...s, similarity: v }))}
                    min={0} max={1} step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Speed</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.speed.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[voiceSettings.speed]}
                    onValueChange={([v]) => setVoiceSettings(s => ({ ...s, speed: v }))}
                    min={0.5} max={2} step={0.1}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      ) : (
        <div className="space-y-4">
          <Label>Upload voice audio</Label>
          <label 
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
              isDragging 
                ? "border-primary bg-primary/10" 
                : "hover:border-primary/50 hover:bg-secondary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Upload className={cn("h-8 w-8 mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : isDragging ? 'Drop your audio file here' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A • Max 50MB</p>
          </label>
          {uploadedUrl && (
            <div className="relative group">
              <button
                type="button"
                onClick={handleRemoveUploadedAudio}
                className="absolute -top-2 -left-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              <audio src={uploadedUrl} controls className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const handleDownloadAudio = async () => {
    const audioUrl = outputAudio?.url;
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audio downloaded');
    } catch (error) {
      toast.error('Failed to download audio');
    }
  };

  const outputContent = outputAudio ? (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      {/* Play Button */}
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <Button
          size="lg"
          variant="ghost"
          className="w-16 h-16 rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium">
          {formatDuration(currentTime)} / {formatDuration(outputAudio.duration_seconds)}
        </p>
        <p className="text-sm text-muted-foreground">Duration</p>
      </div>
    </div>
  ) : null;

  const outputActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleDownloadAudio}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );

  // Check if output was AI generated (not uploaded)
  const wasAIGenerated = pipeline?.voice_input?.mode === 'generate';

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUploading || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Use Uploaded Audio' : 'Generate Voice'}
      creditsCost={mode === 'upload' ? 'Free' : `${estimatedCost.toFixed(2)} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={hasOutput ? outputActions : undefined}
      stageNavigation={stageNavigation}
    />
  );
}
