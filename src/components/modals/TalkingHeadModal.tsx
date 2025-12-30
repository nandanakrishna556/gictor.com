import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/hooks/useTags';
import { useProfile } from '@/hooks/useProfile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import LocationSelector from '@/components/forms/LocationSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import { ArrowLeft, X, Check, Loader2, Mic, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface TalkingHeadModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
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

export default function TalkingHeadModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: TalkingHeadModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags, createTag } = useTags();
  const { profile } = useProfile();
  
  // Core state
  const initialStatusRef = useRef(initialStatus);
  initialStatusRef.current = initialStatus;
  const fileLoadedRef = useRef(false);
  
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState(initialStatus || 'draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Input state
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Fetch file data
  const { data: file } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!fileId,
    refetchInterval: isGenerating ? 2000 : false,
  });
  
  // Get current status option
  const currentStatusOption = statusOptions.find(s => s.value === displayStatus) || statusOptions[0];
  
  // Convert tags to TagData format
  const tagData: TagData[] = tags?.map(t => ({
    id: t.id,
    tag_name: t.tag_name,
    color: t.color || '#8E8E93',
  })) || [];
  
  // Sync file data when loaded
  useEffect(() => {
    if (file && !fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      setDisplayStatus(file.status || initialStatusRef.current || 'draft');
      setSelectedTags(file.tags || []);
      
      // Restore generation params if any
      const params = file.generation_params as any;
      if (params?.image_url) setImageUrl(params.image_url);
      if (params?.audio_url) {
        setAudioUrl(params.audio_url);
        setAudioDuration(params.audio_duration || 0);
      }
      
      // Check if generation is in progress
      if (file.status === 'processing') {
        setIsGenerating(true);
        setGenerationProgress(file.progress || 0);
      }
    }
  }, [file]);
  
  // Update progress when file updates during generation
  useEffect(() => {
    if (file && isGenerating) {
      if (file.status === 'completed' && file.download_url) {
        setIsGenerating(false);
        setGenerationProgress(100);
        toast.success('Lip sync video generated!');
        onSuccess?.();
      } else if (file.status === 'failed') {
        setIsGenerating(false);
        setGenerationProgress(0);
        toast.error(file.error_message || 'Generation failed');
      } else if (file.progress) {
        setGenerationProgress(file.progress);
      }
    }
  }, [file, isGenerating, onSuccess]);
  
  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (!fileId || !hasUnsavedChanges) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        
        await supabase
          .from('files')
          .update({
            name,
            status: displayStatus,
            tags: selectedTags,
            generation_params: {
              image_url: imageUrl,
              audio_url: audioUrl,
              audio_duration: audioDuration,
            },
          })
          .eq('id', fileId);
        
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('idle');
      }
    }, 2000);
  }, [fileId, hasUnsavedChanges, name, displayStatus, selectedTags, imageUrl, audioUrl, audioDuration, queryClient, currentProjectId]);
  
  // Trigger auto-save when unsaved changes occur
  useEffect(() => {
    if (hasUnsavedChanges && fileLoadedRef.current) {
      triggerAutoSave();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, name, displayStatus, selectedTags, imageUrl, audioUrl, triggerAutoSave]);
  
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
  const handleAudioUpload = async (uploadedFile: File) => {
    const audioAllowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/webm'
    ];
    
    const validation = validateFile(uploadedFile, { 
      allowedTypes: audioAllowedTypes,
      maxSize: 50 * 1024 * 1024 // 50MB
    });
    
    if (!validation.valid) {
      setAudioError(validation.error || 'Invalid file');
      return;
    }
    
    setIsUploadingAudio(true);
    setAudioError(null);
    
    try {
      const duration = await getAudioFileDuration(uploadedFile);
      const durationError = validateAudioDuration(duration);
      
      if (durationError) {
        setAudioError(durationError);
        setIsUploadingAudio(false);
        return;
      }
      
      const url = await uploadToR2(uploadedFile, { 
        folder: 'lip-sync-audio',
        allowedTypes: audioAllowedTypes,
        maxSize: 50 * 1024 * 1024
      });
      setAudioUrl(url);
      setAudioDuration(duration);
      setAudioError(null);
      setHasUnsavedChanges(true);
    } catch (err) {
      setAudioError((err as Error).message);
    } finally {
      setIsUploadingAudio(false);
    }
  };
  
  // Get audio file duration
  const getAudioFileDuration = (audioFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => reject(new Error('Failed to load audio'));
      audio.src = URL.createObjectURL(audioFile);
    });
  };
  
  const removeAudio = () => {
    setAudioUrl(undefined);
    setAudioDuration(0);
    setAudioError(null);
    setHasUnsavedChanges(true);
  };
  
  // Handle image change
  const handleImageChange = (url: string | undefined) => {
    setImageUrl(url);
    setHasUnsavedChanges(true);
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
      // Update file record to processing
      await supabase.from('files').update({
        status: 'processing',
        generation_params: {
          image_url: imageUrl,
          audio_url: audioUrl,
          audio_duration: audioDuration,
        },
      }).eq('id', fileId);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'talking_head',
          payload: {
            file_id: fileId,
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
      
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
    } catch (err) {
      console.error('Generation error:', err);
      toast.error((err as Error).message || 'Failed to start generation');
      setIsGenerating(false);
      setGenerationProgress(0);
      
      // Revert file status
      await supabase.from('files').update({ status: displayStatus }).eq('id', fileId);
    }
  };
  
  // Handle name change
  const handleNameChange = (newName: string) => {
    setName(newName);
    setHasUnsavedChanges(true);
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setDisplayStatus(newStatus);
    setHasUnsavedChanges(true);
  };
  
  // Handle tag toggle
  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
    setHasUnsavedChanges(true);
  };
  
  // Handle create tag
  const handleCreateTag = async (tagName: string, color: string) => {
    const { data, error } = await supabase
      .from('user_tags')
      .insert({
        user_id: profile?.id,
        tag_name: tagName,
        color,
      })
      .select()
      .single();
    
    if (!error && data) {
      setSelectedTags(prev => [...prev, data.id]);
      setHasUnsavedChanges(true);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    }
  };
  
  // Handle location change
  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
    setHasUnsavedChanges(true);
  };
  
  // Handle save
  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      
      await supabase
        .from('files')
        .update({
          name,
          status: displayStatus,
          tags: selectedTags,
          generation_params: {
            image_url: imageUrl,
            audio_url: audioUrl,
            audio_duration: audioDuration,
          },
        })
        .eq('id', fileId);
      
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      onSuccess?.();
    } catch (error) {
      setSaveStatus('idle');
      toast.error('Failed to save changes');
    }
  };
  
  // Handle close
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };
  
  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };
  
  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedWarning(false);
    onClose();
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const canGenerate = imageUrl && audioUrl && !audioError && !isGenerating;
  const hasOutput = file?.status === 'completed' && file?.download_url;
  
  // Show nothing until file data is loaded
  if (!file && fileId) {
    return null;
  }
  
  return (
    <>
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmClose}>Don't save</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[900px] h-[85vh] p-0 gap-0 overflow-hidden rounded-lg">
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-3 flex-wrap">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <h2 className="text-lg font-semibold">Talking Head</h2>
            
            <div className="h-5 w-px bg-border" />
            
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-28 h-7 text-sm"
            />
            
            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />
            
            <Select value={displayStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className={cn(
                "h-7 w-fit rounded-md text-xs border-0 px-3 py-1 gap-1",
                currentStatusOption.color,
                "text-primary-foreground"
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
            
            {/* Auto-save indicator */}
            <div className="flex items-center gap-3">
              {saveStatus !== 'idle' && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Saved</span>
                    </>
                  )}
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
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
                  onChange={handleImageChange}
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
                  <AudioPlayer
                    audioUrl={audioUrl}
                    onRemove={removeAudio}
                    onDurationChange={(dur) => setAudioDuration(dur)}
                    showRemove={true}
                  />
                ) : (
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedFile = e.dataTransfer.files[0];
                      if (droppedFile) handleAudioUpload(droppedFile);
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
              
              {hasOutput && file?.download_url && (
                <div className="space-y-4">
                  <VideoPlayer
                    src={file.download_url}
                    poster={imageUrl}
                    title={name}
                  />
                  <Button variant="secondary" className="w-full" asChild>
                    <a href={file.download_url} download={`${name}.mp4`}>
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
    </>
  );
}
