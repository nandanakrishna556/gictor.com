import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { useActors } from '@/hooks/useActors';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { Loader2, Download, Search, User, Play, Pause, Check, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface SpeechStageProps {
  pipelineId: string;
  onContinue: () => void;
}

const CREDIT_COST_PER_1000_CHARS = 0.25;
const MIN_CHARACTERS = 10;
const MAX_CHARACTERS = 10000;

export default function SpeechStage({ pipelineId, onContinue }: SpeechStageProps) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { actors } = useActors();
  const { pipeline, updateVoice, updatePipeline } = usePipeline(pipelineId);

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('generate');

  // Input state
  const [script, setScript] = useState('');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [actorSearchOpen, setActorSearchOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Upload state
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const generationInitiatedRef = useRef(false);

  // Get available actors with voice
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && actor.voice_url
  ) || [];

  const selectedActor = availableActors.find((a) => a.id === selectedActorId);

  // Calculate credit cost
  const characterCount = script.length;
  const creditCost = Math.max(CREDIT_COST_PER_1000_CHARS, Math.ceil(characterCount / 1000) * CREDIT_COST_PER_1000_CHARS);

  // Derived state
  const hasOutput = pipeline?.voice_complete && pipeline?.voice_output?.url;
  const outputUrl = pipeline?.voice_output?.url;
  const isServerProcessing = pipeline?.status === 'processing';

  // Load saved state from pipeline
  useEffect(() => {
    if (!pipeline || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const input = pipeline.voice_input;
    if (input) {
      if (input.mode) setInputMode(input.mode as InputMode);
      if (input.voice_id) setSelectedActorId(input.voice_id as string);
      if (input.uploaded_url) setUploadedAudioUrl(input.uploaded_url as string);
    }

    // Load script from voice_input if available (stored alongside voice settings)
    const voiceInput = pipeline.voice_input as any;
    if (voiceInput?.script) {
      setScript(voiceInput.script as string);
    }
  }, [pipeline]);

  // Auto-save inputs (debounced)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInputs = useCallback(() => {
    if (!pipeline || !initialLoadDoneRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      await updateVoice({
        input: {
          mode: inputMode,
          voice_id: selectedActorId,
          script,
          uploaded_url: uploadedAudioUrl,
        } as any,
      });
    }, 1500);
  }, [pipeline, inputMode, selectedActorId, script, uploadedAudioUrl, updateVoice]);

  useEffect(() => {
    if (initialLoadDoneRef.current) {
      saveInputs();
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [inputMode, selectedActorId, script, uploadedAudioUrl, saveInputs]);

  // Handle actor selection
  const handleActorSelect = (actorId: string) => {
    setSelectedActorId(actorId);
    setActorSearchOpen(false);
  };

  // Handle script change
  const handleScriptChange = (value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      setScript(value);
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      toast.error('Please upload MP3, WAV, or M4A audio');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Audio must be less than 50MB');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const url = await uploadToR2(file, {
        folder: 'speech-audio',
        allowedTypes: [...validTypes, 'audio/mp4'],
        maxSize: 50 * 1024 * 1024,
      });
      setUploadedAudioUrl(url);
      toast.success('Audio uploaded');
    } catch {
      toast.error('Failed to upload audio');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Handle save uploaded audio
  const handleSaveUpload = async () => {
    if (!uploadedAudioUrl) return;

    setIsSavingUpload(true);
    try {
      await updateVoice({
        input: {
          mode: 'upload',
          uploaded_url: uploadedAudioUrl,
        } as any,
        output: { url: uploadedAudioUrl, duration_seconds: 0, generated_at: new Date().toISOString() },
        complete: true,
      });

      toast.success('Audio saved!');
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    } catch {
      toast.error('Failed to save audio');
    } finally {
      setIsSavingUpload(false);
    }
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!profile) return;

    if (script.length < MIN_CHARACTERS) {
      toast.error(`Script must be at least ${MIN_CHARACTERS} characters`);
      return;
    }

    if (!selectedActorId || !selectedActor?.voice_url) {
      toast.error('Please select an actor with a voice');
      return;
    }

    if ((profile.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', {
        description: `You need ${creditCost.toFixed(2)} credits but have ${profile.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => (window.location.href = '/billing'),
        },
      });
      return;
    }

    generationInitiatedRef.current = true;
    setIsGenerating(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Update pipeline status to processing
      await updatePipeline({ status: 'processing' });

      // Save input data
      await updateVoice({
        input: {
          mode: 'generate',
          voice_id: selectedActorId,
          script,
        } as any,
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'speech',
          payload: {
            file_id: pipelineId,
            pipeline_id: pipelineId,
            user_id: sessionData.session.user.id,
            project_id: pipeline?.project_id || null,
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start generation');
      await updatePipeline({ status: 'draft' });
    } finally {
      setIsGenerating(false);
      generationInitiatedRef.current = false;
    }
  };

  const canGenerate = script.length >= MIN_CHARACTERS && !!selectedActorId && !isGenerating && !isServerProcessing;
  const showGenerating = isGenerating || (isServerProcessing && generationInitiatedRef.current);

  return (
    <div className="h-full flex min-h-0 overflow-hidden">
      {/* Input Section */}
      <div className="w-1/2 h-full flex flex-col min-h-0 border-r border-border">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>

        {/* Generate/Upload Toggle */}
        <InputModeToggle mode={inputMode} onModeChange={setInputMode} uploadLabel="Upload" />

        {inputMode === 'upload' ? (
          /* Upload Mode UI */
          <div className="space-y-4">
            <label className="text-sm font-medium">Upload Audio</label>
            {uploadedAudioUrl ? (
              <div className="space-y-3">
                <AudioPlayer src={uploadedAudioUrl} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadedAudioUrl(null)}
                  className="w-full"
                >
                  Remove Audio
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/x-m4a,.mp3,.wav,.m4a"
                  className="hidden"
                  onChange={handleAudioUpload}
                  disabled={isUploadingAudio}
                />
                {isUploadingAudio ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                ) : (
                  <>
                    <Mic className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                    <span className="text-sm text-muted-foreground">Upload your audio</span>
                    <span className="text-xs text-muted-foreground/70">MP3, WAV, M4A up to 50MB</span>
                  </>
                )}
              </label>
            )}

            {uploadedAudioUrl && (
              <Button onClick={handleSaveUpload} disabled={isSavingUpload} className="w-full">
                {isSavingUpload ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Audio <span className="text-emerald-400 ml-1">• Free</span>
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          /* Generate Mode UI */
          <>
            {/* Script Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Script (Required)</label>
                <span
                  className={cn(
                    'text-xs',
                    characterCount > MAX_CHARACTERS ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
                </span>
              </div>
              <Textarea
                value={script}
                onChange={(e) => handleScriptChange(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="min-h-[200px] resize-none"
              />
              {characterCount < MIN_CHARACTERS && characterCount > 0 && (
                <p className="text-xs text-muted-foreground">Minimum {MIN_CHARACTERS} characters required</p>
              )}
            </div>

            {/* Actor Voice Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Actor Voice (Required)</label>
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
                            {[selectedActor.gender, selectedActor.age && `${selectedActor.age}y`]
                              .filter(Boolean)
                              .join(' • ')}
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
                          'No actor found.'
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
                                  {[actor.gender, actor.age && `${actor.age}y`, actor.language]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </p>
                              </div>
                              {actor.voice_url && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const audio = document.getElementById(
                                      `preview-audio-${actor.id}`
                                    ) as HTMLAudioElement;
                                    if (audio) {
                                      if (audio.paused) {
                                        document
                                          .querySelectorAll('audio[id^="preview-audio-"]')
                                          .forEach((a) => {
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
                              {selectedActorId === actor.id && <Check className="ml-auto h-4 w-4" />}
                              {actor.voice_url && (
                                <audio
                                  id={`preview-audio-${actor.id}`}
                                  src={actor.voice_url}
                                  preload="none"
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

            {/* Generate Button */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated cost:</span>
                <span className="font-medium">{creditCost.toFixed(2)} credits</span>
              </div>
              <p className="text-xs text-muted-foreground">{CREDIT_COST_PER_1000_CHARS} credits per 1,000 characters</p>
              <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
                {showGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                    Generating...
                  </>
                ) : (
                  <>Generate • {creditCost.toFixed(2)} credits</>
                )}
              </Button>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Output Section */}
      <div className="w-1/2 h-full flex flex-col min-h-0 bg-muted/10">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>

        {showGenerating || isServerProcessing ? (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">Generating speech audio...</p>
              </div>
            </div>
          </div>
        ) : hasOutput && outputUrl ? (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Audio Generated</p>
                  <p className="text-sm text-muted-foreground">{characterCount.toLocaleString()} characters</p>
                </div>
              </div>
              <audio src={outputUrl} controls className="w-full" />
            </div>
            <Button variant="secondary" className="w-full" asChild>
              <a href={outputUrl} download="speech.mp3">
                <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Download Audio
              </a>
            </Button>
            <Button onClick={onContinue} className="w-full">
              Continue to Lip Sync
            </Button>
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No output yet</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
