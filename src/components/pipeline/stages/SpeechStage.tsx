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
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';


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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  
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
  
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const generationInitiatedRef = useRef(false);

  // Fetch linked file for realtime updates
  const { data: linkedFile } = useQuery({
    queryKey: ['pipeline-speech-file', pipelineId],
    queryFn: async () => {
      const { data } = await supabase
        .from('files')
        .select('*')
        .eq('generation_params->>pipeline_id', pipelineId)
        .eq('file_type', 'speech')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!pipelineId,
    refetchInterval: (query) => {
      const file = query.state.data;
      return (localGenerating || file?.generation_status === 'processing') ? 2000 : false;
    },
  });

  // Derive generating state from linked file
  const isServerProcessing = linkedFile?.generation_status === 'processing';
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);

  // Watch linked file for completion and sync to pipeline
  useEffect(() => {
    if (!linkedFile || !generationInitiatedRef.current) return;
    
    if (linkedFile.generation_status === 'completed' && linkedFile.download_url) {
      // Get duration from file
      const metadata = linkedFile.metadata as any;
      const duration = metadata?.duration_seconds || 0;
      
      // Sync to pipeline
      updateVoice({
        output: { 
          url: linkedFile.download_url, 
          duration_seconds: duration, 
          generated_at: new Date().toISOString() 
        },
        complete: true,
      });
      
      // Clean up the temporary file
      supabase.from('files').delete().eq('id', linkedFile.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['pipeline-speech-file', pipelineId] });
      });
      
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
      toast.success('Speech generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } else if (linkedFile.generation_status === 'failed') {
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
      toast.error(linkedFile.error_message || 'Speech generation failed');
    }
  }, [linkedFile, pipelineId, queryClient, updateVoice]);

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
    generationInitiatedRef.current = true;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Store input data
      await updateVoice({
        input: {
          mode: 'generate',
          voice_id: selectedActorId,
        },
      });

      // Create a temporary file record (same as standalone SpeechModal)
      const { data: newFile, error: createError } = await supabase
        .from('files')
        .insert({
          name: 'Pipeline Speech',
          file_type: 'speech',
          project_id: pipeline?.project_id,
          status: 'draft',
          generation_status: 'processing',
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: Math.max(10, Math.ceil((script.length / 20) * 5)),
          generation_params: { 
            pipeline_id: pipelineId,
            is_internal: true,
            script,
            actor_id: selectedActorId,
            actor_voice_url: selectedActor.voice_url,
          }
        })
        .select()
        .single();

      if (createError || !newFile) {
        throw new Error('Failed to create file record');
      }

      // Use 'speech' type like standalone SpeechModal
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'speech',
          payload: {
            file_id: newFile.id,
            user_id: sessionData.session.user.id,
            project_id: pipeline?.project_id,
            script: script,
            actor_voice_url: selectedActor.voice_url,
            credits_cost: creditCost,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Speech generation started!');
      queryClient.invalidateQueries({ queryKey: ['pipeline-speech-file', pipelineId] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start generation');
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
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
                              <audio
                                id={`preview-audio-${actor.id}`}
                                src={actor.voice_url}
                                className="hidden"
                              />
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
        </>
      ) : (
        /* Upload Mode */
        <div className="space-y-4">
          <Label>Upload audio file</Label>
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

  const outputContent = hasOutput && outputAudio ? (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mic className="h-4 w-4" />
        <span>Duration: {formatDuration(outputAudio.duration_seconds || 0)}</span>
      </div>
      <AudioPlayer src={outputAudio.url} />
    </div>
  ) : null;

  const outputActions = hasOutput ? (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          if (!outputAudio?.url) return;
          try {
            const response = await fetch(outputAudio.url);
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
        }}
        className="h-8"
      >
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>
    </div>
  ) : undefined;

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
      generateLabel={mode === 'upload' ? 'Save Audio • Free' : 'Generate Speech'}
      creditsCost={mode === 'upload' ? '' : `${creditCost.toFixed(2)} credits`}
      generateDisabled={!canGenerate}
      isAIGenerated={mode === 'generate'}
      outputActions={outputActions}
      emptyStateIcon={<Mic className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated audio will appear here"
      emptyStateSubtitle="Enter a script and select an actor voice"
    />
  );
}
