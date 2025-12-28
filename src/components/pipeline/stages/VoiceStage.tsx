import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Sparkles, Play, Pause, Star, ChevronDown, Download, X, Search, Filter, Loader2, Volume2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePipeline } from '@/hooks/usePipeline';
import { generateVoice, getAudioDuration } from '@/lib/pipeline-service';
import { calculateVoiceCost } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import { supabase } from '@/integrations/supabase/client';

const getAccentCategory = (accent: string | undefined): 'American' | 'British' | 'Other' => {
  if (!accent) return 'Other';
  const lower = accent.toLowerCase();
  if (lower.includes('american')) return 'American';
  if (lower.includes('british')) return 'British';
  return 'Other';
};

interface VoiceStageProps {
  pipelineId: string;
  onContinue: () => void;
  stageNavigation?: React.ReactNode;
}

type InputMode = 'generate' | 'upload';

const VOICES_CACHE_KEY = 'elevenlabs_curated_voices_v2';
const VOICES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Voice interface - normalized format from edge function
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  gender?: string | null;
  age?: string | null;
  accent?: string | null;
  description?: string | null;
  use_case?: string | null;
}

export default function VoiceStage({ pipelineId, onContinue, stageNavigation }: VoiceStageProps) {
  const { pipeline, updateVoice, isUpdating } = usePipeline(pipelineId);
  
  // Input state
  const [mode, setMode] = useState<InputMode>('generate');
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null);
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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [accentFilter, setAccentFilter] = useState<string>('all');
  
  // Voice preview state
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
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

  // Voice fetch error state
  const [voiceFetchError, setVoiceFetchError] = useState<string | null>(null);

  // Fetch voices from ElevenLabs - NO CACHING for debugging
  useEffect(() => {
    const fetchVoices = async () => {
      console.log('=== VOICE FETCH START ===');
      console.log('Calling elevenlabs-voices edge function...');
      setIsLoadingVoices(true);
      setVoiceFetchError(null);
      
      try {
        // Fetch from edge function - NO CACHING
        console.log('Making supabase.functions.invoke call...');
        const { data, error } = await supabase.functions.invoke('elevenlabs-voices');
        
        console.log('=== VOICE FETCH RESPONSE ===');
        console.log('Error:', error);
        console.log('Data:', data);
        console.log('Data type:', typeof data);
        
        if (error) {
          console.error('Edge function error:', error);
          const errorMsg = `Failed to load voices: ${error.message || 'Unknown error'}`;
          setVoiceFetchError(errorMsg);
          toast.error(errorMsg);
          return;
        }
        
        if (!data) {
          console.error('No data returned from edge function');
          setVoiceFetchError('No data returned from voice API');
          toast.error('No data returned from voice API');
          return;
        }
        
        console.log('Data.voices exists:', !!data.voices);
        console.log('Data.voices length:', data.voices?.length);
        
        if (data?.voices && data.voices.length > 0) {
          console.log(`Total voices from API: ${data.voices.length}`);
          console.log('Sample voice_ids:', data.voices.slice(0, 5).map((v: ElevenLabsVoice) => v.voice_id));
          console.log('Sample voice object:', JSON.stringify(data.voices[0], null, 2));
          
          // Filter to only curated voices
          const curatedVoices = data.voices.filter((voice: ElevenLabsVoice) => 
            CURATED_VOICE_IDS.has(voice.voice_id)
          );
          
          console.log(`Curated voices found: ${curatedVoices.length}`);
          
          // If no curated voices found, use all voices as fallback
          if (curatedVoices.length === 0) {
            console.warn('No curated voices matched - using all voices as fallback');
            setVoices(data.voices);
            if (!selectedVoice && data.voices.length > 0) {
              setSelectedVoice(data.voices[0]);
            }
          } else {
            console.log('First 3 curated voices:', curatedVoices.slice(0, 3).map((v: ElevenLabsVoice) => v.name));
            setVoices(curatedVoices);
            if (!selectedVoice && curatedVoices.length > 0) {
              setSelectedVoice(curatedVoices[0]);
            }
          }
        } else {
          console.warn('No voices in response or empty array');
          setVoiceFetchError('No voices found in API response');
        }
      } catch (error) {
        console.error('=== VOICE FETCH ERROR ===');
        console.error('Caught error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error fetching voices';
        setVoiceFetchError(errorMsg);
        toast.error(`Failed to load voices: ${errorMsg}`);
      } finally {
        console.log('=== VOICE FETCH END ===');
        setIsLoadingVoices(false);
      }
    };
    
    fetchVoices();
  }, []);

  // Extract filter options from voice data
  const filterOptions = useMemo(() => {
    const genders = new Set<string>();
    const ages = new Set<string>();
    
    voices.forEach(voice => {
      if (voice.gender) genders.add(voice.gender);
      if (voice.age) ages.add(voice.age);
    });
    
    return {
      genders: Array.from(genders).sort(),
      ages: Array.from(ages).sort(),
      accents: ['American', 'British', 'Other'] as const,
    };
  }, [voices]);

  // Filter voices based on search and filters
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = voice.name.toLowerCase().includes(query);
        const matchesDescription = voice.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }
      
      // Gender filter
      if (genderFilter !== 'all' && voice.gender?.toLowerCase() !== genderFilter.toLowerCase()) {
        return false;
      }
      
      // Age filter
      if (ageFilter !== 'all' && voice.age?.toLowerCase() !== ageFilter.toLowerCase()) {
        return false;
      }
      
      // Accent filter (using category grouping)
      if (accentFilter !== 'all' && getAccentCategory(voice.accent) !== accentFilter) {
        return false;
      }
      
      return true;
    });
  }, [voices, searchQuery, genderFilter, ageFilter, accentFilter]);

  const activeFilterCount = [genderFilter, ageFilter, accentFilter].filter(f => f !== 'all').length;
  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setGenderFilter('all');
    setAgeFilter('all');
    setAccentFilter('all');
    setSearchQuery('');
  };

  // Load existing data
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input;
      setMode(input.mode || 'generate');
      if (input.voice_id && voices.length > 0) {
        const voice = voices.find(v => v.voice_id === input.voice_id);
        if (voice) setSelectedVoice(voice);
      }
      if (input.voice_settings) {
        setVoiceSettings(input.voice_settings);
      }
      setUploadedUrl(input.uploaded_url || '');
    }
  }, [pipeline?.voice_input, voices]);

  // Save input changes
  const saveInput = async () => {
    if (!selectedVoice) return;
    await updateVoice({
      input: {
        mode,
        voice_id: selectedVoice.voice_id,
        voice_settings: voiceSettings,
        uploaded_url: uploadedUrl,
      },
    });
  };

  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [mode, selectedVoice, voiceSettings, uploadedUrl]);

  // Voice preview
  const handlePreviewVoice = (voice: ElevenLabsVoice) => {
    if (!voice.preview_url) {
      toast.error('No preview available for this voice');
      return;
    }
    
    // If already previewing this voice, stop it
    if (previewingVoiceId === voice.voice_id) {
      previewAudioRef.current?.pause();
      setPreviewingVoiceId(null);
      return;
    }
    
    // Stop any existing preview
    previewAudioRef.current?.pause();
    
    // Create and play new preview
    previewAudioRef.current = new Audio(voice.preview_url);
    previewAudioRef.current.onended = () => setPreviewingVoiceId(null);
    previewAudioRef.current.onerror = () => {
      toast.error('Failed to play voice preview');
      setPreviewingVoiceId(null);
    };
    previewAudioRef.current.play();
    setPreviewingVoiceId(voice.voice_id);
  };

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

    if (!selectedVoice) {
      toast.error('Please select a voice');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVoice(pipelineId, {
        script_text: scriptText,
        voice_id: selectedVoice.voice_id,
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
                    {isLoadingVoices ? (
                      <p className="font-medium text-muted-foreground">Loading voices...</p>
                    ) : selectedVoice ? (
                      <>
                        <p className="font-medium">{selectedVoice.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedVoice.gender} • {selectedVoice.accent || selectedVoice.language || 'Unknown'}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-muted-foreground">Select a voice</p>
                    )}
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", voiceOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-4">
              {/* Search and Filter Controls */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search voices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="shrink-0 gap-1.5"
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        {filterOptions.genders.map(g => (
                          <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={ageFilter} onValueChange={setAgeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Age" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        {filterOptions.ages.map(a => (
                          <SelectItem key={a} value={a.toLowerCase()}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={accentFilter} onValueChange={setAccentFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Accent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accents</SelectItem>
                        {filterOptions.accents.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Results count and clear */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} found
                  </span>
                  {(hasActiveFilters || searchQuery) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Voice List */}
              {isLoadingVoices ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading voices from ElevenLabs...</p>
                </div>
              ) : voiceFetchError ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <div className="text-destructive">
                    <p className="font-medium">Failed to load voices</p>
                    <p className="text-sm text-muted-foreground mt-1">{voiceFetchError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {filteredVoices.map((voice) => (
                      <div
                        key={voice.voice_id}
                        onClick={() => setSelectedVoice(voice)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all",
                          selectedVoice?.voice_id === voice.voice_id 
                            ? "bg-primary/10 text-primary ring-1 ring-primary" 
                            : "bg-muted/50 hover:bg-secondary"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-full bg-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(voice);
                          }}
                        >
                          {previewingVoiceId === voice.voice_id ? (
                            <Square className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{voice.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {voice.gender && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {voice.gender}
                              </span>
                            )}
                            {voice.age && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {voice.age}
                              </span>
                            )}
                            {voice.accent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {voice.accent}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedVoice?.voice_id === voice.voice_id && (
                          <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                        )}
                      </div>
                    ))}
                    {filteredVoices.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No voices match your filters
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}

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
                  <p className="text-xs text-muted-foreground">Lower = more expressive, higher = more consistent</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Clarity / Similarity</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.similarity.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[voiceSettings.similarity]}
                    onValueChange={([v]) => setVoiceSettings(s => ({ ...s, similarity: v }))}
                    min={0} max={1} step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">How closely to match original voice characteristics</p>
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
