import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/hooks/useTags';
import { useProjects } from '@/hooks/useProjects';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioWaveform } from '@/components/ui/audio-waveform';
import LocationSelector from '@/components/forms/LocationSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import { ArrowLeft, X, Check, Loader2, Mic, Download, AlertCircle, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface LipSyncModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  onSuccess?: () => void;
  statusOptions?: StatusOption[];
}

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { value: 'draft', label: 'Draft', color: 'bg-zinc-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-amber-500' },
  { value: 'complete', label: 'Complete', color: 'bg-emerald-500' },
];

const MIN_AUDIO_SECONDS = 5;
const MAX_AUDIO_SECONDS = 600; // 10 minutes
const CREDIT_COST = 1.0;

// Hook to subscribe to single file updates
function useSingleFileRealtime(fileId: string | null) {
  const queryClient = useQueryClient();
  
  const { data: file } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      if (!fileId) return null;
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!fileId,
    refetchInterval: fileId ? 2000 : false, // Poll every 2 seconds when generating
  });
  
  return { file };
}

export default function LipSyncModal({
  open,
  onClose,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: LipSyncModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags, createTag } = useTags();
  const { projects } = useProjects();
  
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState(initialStatus || 'draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Input state
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Subscribe to file updates
  const { file: generatedFile } = useSingleFileRealtime(isGenerating ? fileId : null);
  
  // Get current status option
  const currentStatusOption = statusOptions.find(s => s.value === displayStatus) || statusOptions[0];
  
  // Convert tags to TagData format
  const tagData: TagData[] = tags?.map(t => ({
    id: t.id,
    tag_name: t.tag_name,
    color: t.color || '#8E8E93',
  })) || [];
  
  // Update progress when file updates
  useEffect(() => {
    if (generatedFile) {
      if (generatedFile.status === 'complete' && generatedFile.download_url) {
        setIsGenerating(false);
        setGenerationProgress(100);
        toast.success('Lip sync video generated!');
        onSuccess?.();
      } else if (generatedFile.status === 'failed') {
        setIsGenerating(false);
        setGenerationProgress(0);
        toast.error(generatedFile.error_message || 'Generation failed');
      } else if (generatedFile.progress) {
        setGenerationProgress(generatedFile.progress);
      }
    }
  }, [generatedFile, onSuccess]);
  
  // Validate audio duration
  const validateAudioDuration = (duration: number): string | null => {
    if (duration < MIN_AUDIO_SECONDS) {
      return `Audio must be at least ${MIN_AUDIO_SECONDS} seconds`;
    }
    if (duration > MAX_AUDIO_SECONDS) {
      return `Audio must be less than ${MAX_AUDIO_SECONDS / 60} minutes`;
    }
    return null;
  };
  
  // Handle audio file upload
  const handleAudioUpload = async (file: File) => {
    const validation = validateFile(file, { 
      allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/ogg'],
      maxSize: 50 * 1024 * 1024 // 50MB
    });
    
    if (!validation.valid) {
      setAudioError(validation.error || 'Invalid file');
      return;
    }
    
    setIsUploadingAudio(true);
    setAudioError(null);
    
    try {
      // Get duration before uploading
      const duration = await getAudioFileDuration(file);
      const durationError = validateAudioDuration(duration);
      
      if (durationError) {
        setAudioError(durationError);
        setIsUploadingAudio(false);
        return;
      }
      
      const url = await uploadToR2(file, { folder: 'audio' });
      setAudioUrl(url);
      setAudioDuration(duration);
      setAudioError(null);
    } catch (err) {
      setAudioError((err as Error).message);
    } finally {
      setIsUploadingAudio(false);
    }
  };
  
  // Get audio file duration
  const getAudioFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => reject(new Error('Failed to load audio'));
      audio.src = URL.createObjectURL(file);
    });
  };
  
  // Handle audio playback
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };
  
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleAudioSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };
  
  const removeAudio = () => {
    setAudioUrl(undefined);
    setAudioDuration(0);
    setAudioError(null);
    setIsAudioPlaying(false);
    setAudioCurrentTime(0);
  };
  
  // Handle generation
  const handleGenerate = async () => {
    if (!imageUrl || !audioUrl || !user) {
      toast.error('Please provide both an image and audio file');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const newFileId = uuidv4();
      
      // Create file record
      const { error: dbError } = await supabase.from('files').insert({
        id: newFileId,
        name,
        file_type: 'lip_sync',
        status: 'processing',
        project_id: currentProjectId,
        folder_id: currentFolderId || null,
        tags: selectedTags,
        generation_params: {
          image_url: imageUrl,
          audio_url: audioUrl,
          audio_duration: audioDuration,
        },
      });
      
      if (dbError) throw dbError;
      
      setFileId(newFileId);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'lip_sync',
          payload: {
            file_id: newFileId,
            user_id: user.id,
            project_id: currentProjectId,
            folder_id: currentFolderId,
            file_name: name,
            image_url: imageUrl,
            audio_url: audioUrl,
            audio_duration: audioDuration,
            credits_cost: CREDIT_COST,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Generation failed');
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
    } catch (err) {
      console.error('Generation error:', err);
      toast.error((err as Error).message || 'Failed to start generation');
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };
  
  // Handle tag toggle
  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  // Handle create tag
  const handleCreateTag = async (tagName: string, color: string) => {
    await createTag({ name: tagName, color });
  };
  
  // Handle location change
  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const canGenerate = imageUrl && audioUrl && !audioError && !isGenerating;
  const hasOutput = generatedFile?.status === 'complete' && generatedFile?.download_url;
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-3 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <h2 className="text-lg font-semibold">Lip Sync</h2>
          
          <div className="h-5 w-px bg-border" />
          
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-28 h-7 text-sm"
          />
          
          <LocationSelector
            projectId={currentProjectId}
            folderId={currentFolderId}
            onLocationChange={handleLocationChange}
          />
          
          <Select value={displayStatus} onValueChange={setDisplayStatus}>
            <SelectTrigger className={cn(
              "h-7 w-fit rounded-md text-xs border-0 px-3 py-1 text-white gap-1",
              currentStatusOption.color
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50 rounded-md px-2 py-1 transition-colors">
                {selectedTags.length > 0 ? (
                  <TagList 
                    tags={tagData} 
                    selectedTagIds={selectedTags} 
                    maxVisible={1} 
                    size="sm"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 bg-popover">
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <TagSelector
                tags={tagData}
                selectedTagIds={selectedTags}
                onToggleTag={handleToggleTag}
                onCreateTag={handleCreateTag}
                enableDragDrop
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex-1" />
          
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
        
        {/* Content - Two column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Input Section */}
          <div className="w-1/2 border-r overflow-y-auto p-6 space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>
            
            {/* First Frame Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">First Frame (Required)</label>
              <SingleImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                aspectRatio="video"
                placeholder="Drag & drop image or"
                showGenerateLink={false}
              />
            </div>
            
            {/* Audio Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio File (Required)</label>
              <p className="text-xs text-muted-foreground">
                Min {MIN_AUDIO_SECONDS}s, Max {MAX_AUDIO_SECONDS / 60} minutes
              </p>
              
              {audioUrl ? (
                <div className="relative group rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={() => setIsAudioPlaying(false)}
                  />
                  
                  <AudioWaveform
                    audioUrl={audioUrl}
                    isPlaying={isAudioPlaying}
                    currentTime={audioCurrentTime}
                    onSeek={handleAudioSeek}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleAudioPlayback}
                      >
                        {isAudioPlaying ? (
                          <Pause className="h-4 w-4" strokeWidth={1.5} />
                        ) : (
                          <Play className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={removeAudio}
                    className="absolute -left-2 -top-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleAudioUpload(file);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('audio-upload-input')?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200',
                    'border-border hover:border-primary/50 hover:bg-secondary/50',
                    audioError && 'border-destructive bg-destructive/5'
                  )}
                >
                  {isUploadingAudio ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <Mic className="mb-2 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop audio or <span className="font-medium text-primary">browse</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        MP3, WAV, M4A, AAC • Max 50MB
                      </p>
                    </>
                  )}
                  <input
                    id="audio-upload-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                  />
                </div>
              )}
              
              {audioError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                  {audioError}
                </div>
              )}
            </div>
            
            {/* Generate Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                    Generating...
                  </>
                ) : (
                  <>Generate • {CREDIT_COST} credits</>
                )}
              </Button>
            </div>
          </div>
          
          {/* Output Section */}
          <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/10">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>
            
            {isGenerating && (
              <div className="space-y-4">
                <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">Generating lip sync video...</p>
                  </div>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-center text-sm text-muted-foreground">
                  {generationProgress}% complete
                </p>
              </div>
            )}
            
            {hasOutput && generatedFile?.download_url && (
              <div className="space-y-4">
                <VideoPlayer
                  src={generatedFile.download_url}
                  poster={imageUrl}
                  title={name}
                />
                <Button variant="secondary" className="w-full" asChild>
                  <a href={generatedFile.download_url} download={`${name}.mp4`}>
                    <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    Download Video
                  </a>
                </Button>
              </div>
            )}
            
            {!isGenerating && !hasOutput && (
              <div className="aspect-video rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No output yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
