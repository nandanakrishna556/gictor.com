import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Play, Pause, Download, X, Search, User, Mic, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useActors } from '@/hooks/useActors';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { AudioPlayer } from '@/components/ui/AudioPlayer';


interface SpeechStageProps {
  pipelineId: string;
  onContinue: () => void;
}

const CREDIT_COST_PER_1000_CHARS = 0.25;
const MIN_CHARACTERS = 10;
const MAX_CHARACTERS = 10000;

export default function SpeechStage({ pipelineId, onContinue }: SpeechStageProps) {
  const { pipeline, updateVoice, isUpdating } = usePipeline(pipelineId);
  const { actors } = useActors();
  const { profile } = useProfile();
  
  
  // Input mode
  const [mode, setMode] = useState<InputMode>('generate');
  
  // Input state
  const [script, setScript] = useState('');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [actorSearchOpen, setActorSearchOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Upload state
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  
  // Generation state - local tracking + pipeline status tracking
  const [localGenerating, setLocalGenerating] = useState(false);
  const prevVoiceOutputRef = useRef<string | null>(null);

  // Derive generating state from pipeline status or local state
  const isGenerating = localGenerating || pipeline?.status === 'processing';

  // Watch for voice output changes to detect completion
  useEffect(() => {
    const currentOutput = pipeline?.voice_output?.url;
    
    // If we were generating and now have output, show success
    if (localGenerating && currentOutput && currentOutput !== prevVoiceOutputRef.current) {
      setLocalGenerating(false);
      toast.success('Speech generated successfully!');
    }
    
    // Reset local generating if pipeline status changed from processing
    if (localGenerating && pipeline?.status === 'draft' && currentOutput) {
      setLocalGenerating(false);
    }
    
    prevVoiceOutputRef.current = currentOutput || null;
  }, [pipeline?.voice_output?.url, pipeline?.status, localGenerating]);

  // Get available actors
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && actor.voice_url
  ) || [];
  
  const selectedActor = availableActors.find((a) => a.id === selectedActorId);
  
  // Calculate credit cost
  const characterCount = script.length;
  const creditCost = Math.max(CREDIT_COST_PER_1000_CHARS, Math.ceil(characterCount / 1000) * CREDIT_COST_PER_1000_CHARS);

  // Load existing data
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input;
      if (input.mode === 'upload') {
        setMode('upload');
        setUploadedUrl(input.uploaded_url || '');
      } else {
        setMode('generate');
        if (input.voice_id) {
          setSelectedActorId(input.voice_id);
        }
      }
    }
    // Load script from script_output if available
    if (pipeline?.script_output?.text) {
      setScript(pipeline.script_output.text);
    }
  }, [pipeline?.voice_input, pipeline?.script_output]);


  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToR2(file, { 
        folder: 'pipeline-speech',
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

  const getAudioDuration = (audioUrl: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error('Failed to load audio'));
    });
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

  const handleActorSelect = (actorId: string) => {
    setSelectedActorId(actorId);
    setActorSearchOpen(false);
  };

  const handleGenerate = async () => {
    if (mode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an audio file first');
        return;
      }
      return;
    }

    // Generate mode
    if (script.length < MIN_CHARACTERS) {
      toast.error(`Script must be at least ${MIN_CHARACTERS} characters`);
      return;
    }
    
    if (!selectedActorId || !selectedActor?.voice_url) {
      toast.error('Please select an actor with a voice');
      return;
    }

    if ((profile?.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost.toFixed(2)} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    setLocalGenerating(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Store input data and set pipeline to processing for polling
      await updateVoice({
        input: {
          mode: 'generate',
          voice_id: selectedActorId,
        },
      });

      // Set pipeline status to processing so usePipeline starts polling
      await supabase
        .from('pipelines')
        .update({ status: 'processing', current_stage: 'speech' })
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

      // Prepare payload for edge function - use pipeline_speech to update pipeline directly
      const requestPayload = {
        type: 'pipeline_speech',
        payload: {
          pipeline_id: pipelineId,
          user_id: sessionData.session.user.id,
          script,
          actor_voice_url: selectedActor.voice_url,
          char_count: script.length,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: requestPayload,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Speech generation started!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start generation');
      setLocalGenerating(false);
      // Reset pipeline status on error
      await supabase
        .from('pipelines')
        .update({ status: 'draft' })
        .eq('id', pipelineId);
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
  const canGenerate = mode === 'upload' ? !!uploadedUrl : (script.length >= MIN_CHARACTERS && !!selectedActorId);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const inputContent = (
    <div className="space-y-6">
      <InputModeToggle
        mode={mode}
        onModeChange={setMode}
        uploadLabel="Upload"
      />

      {mode === 'generate' ? (
        <>
          {/* Script Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Script (Required)</Label>
              <span className={cn(
                "text-xs",
                characterCount > MAX_CHARACTERS ? "text-destructive" : "text-muted-foreground"
              )}>
                {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
              </span>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, MAX_CHARACTERS))}
              placeholder="Enter or paste the script to convert to speech..."
              className="min-h-[150px] resize-none"
            />
            {characterCount < MIN_CHARACTERS && characterCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Minimum {MIN_CHARACTERS} characters required
              </p>
            )}
          </div>

          {/* Actor Voice Selector */}
          <div className="space-y-2">
            <Label>Actor Voice (Required)</Label>
            <Popover open={actorSearchOpen} onOpenChange={setActorSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={actorSearchOpen}
                  className="w-full justify-between h-auto py-3"
                >
                  {selectedActor ? (
                    <div className="flex items-center gap-3">
                      {selectedActor.profile_image_url ? (
                        <img
                          src={selectedActor.profile_image_url}
                          alt={selectedActor.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium">{selectedActor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[selectedActor.gender, selectedActor.age && `${selectedActor.age}y`, selectedActor.language].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select an actor voice...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search actors..." />
                  <CommandList>
                    <CommandEmpty>
                      {availableActors.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          <p className="text-muted-foreground">No actors with voice available.</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Create an actor first in the Actors page.
                          </p>
                        </div>
                      ) : (
                        "No actor found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {availableActors.map((actor) => (
                        <CommandItem
                          key={actor.id}
                          value={actor.name}
                          onSelect={() => handleActorSelect(actor.id)}
                          className="cursor-pointer py-3"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {actor.profile_image_url ? (
                              <img
                                src={actor.profile_image_url}
                                alt={actor.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{actor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[actor.gender, actor.age && `${actor.age}y`, actor.language].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                            {actor.voice_url && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const audio = document.getElementById(`preview-audio-${actor.id}`) as HTMLAudioElement;
                                  if (audio) {
                                    if (audio.paused) {
                                      // Stop all other preview audios
                                      document.querySelectorAll('audio[id^="preview-audio-"]').forEach((a) => {
                                        (a as HTMLAudioElement).pause();
                                        (a as HTMLAudioElement).currentTime = 0;
                                      });
                                      setPlayingAudioId(actor.id);
                                      audio.play();
                                      audio.onended = () => setPlayingAudioId(null);
                                    } else {
                                      audio.pause();
                                      audio.currentTime = 0;
                                      setPlayingAudioId(null);
                                    }
                                  }
                                }}
                                className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors"
                              >
                                {playingAudioId === actor.id ? (
                                  <Pause className="h-4 w-4 text-primary" />
                                ) : (
                                  <Play className="h-4 w-4 text-primary" />
                                )}
                              </button>
                            )}
                            {selectedActorId === actor.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                            {actor.voice_url && (
                              <audio id={`preview-audio-${actor.id}`} src={actor.voice_url} preload="none" className="hidden" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Actor Voice Preview */}
          {selectedActor && selectedActor.voice_url && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                {selectedActor.profile_image_url ? (
                  <img
                    src={selectedActor.profile_image_url}
                    alt={selectedActor.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{selectedActor.name}</p>
                  <p className="text-xs text-muted-foreground">Voice Preview</p>
                </div>
              </div>
              <AudioPlayer src={selectedActor.voice_url} />
            </div>
          )}

          {/* Credit cost info */}
          <div className="text-xs text-muted-foreground">
            {CREDIT_COST_PER_1000_CHARS} credits per 1,000 characters
          </div>
        </>
      ) : (
        /* Upload Mode */
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
              <AudioPlayer src={uploadedUrl} />
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
      a.download = `speech-${Date.now()}.mp3`;
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
      {/* Audio Generated Banner */}
      <div className="w-full rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Audio Generated</p>
            <p className="text-sm text-muted-foreground">{characterCount.toLocaleString()} characters</p>
          </div>
        </div>
        <AudioPlayer src={outputAudio.url} />
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium">
          {formatDuration(outputAudio.duration_seconds)}
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
      generateLabel={mode === 'upload' ? 'Use Uploaded Audio' : 'Generate Speech'}
      creditsCost={mode === 'upload' ? 'Free' : `${creditCost.toFixed(2)} credits`}
      generateDisabled={!canGenerate}
      isAIGenerated={mode === 'generate'}
      outputActions={hasOutput ? outputActions : undefined}
      emptyStateIcon={<Mic className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated speech will appear here"
      emptyStateSubtitle="Enter script and select an actor"
    />
  );
}
