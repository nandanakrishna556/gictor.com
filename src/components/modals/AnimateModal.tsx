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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import LocationSelector from '@/components/forms/LocationSelector';
import { ArrowLeft, X, Loader2, Download, Upload, Film, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface AnimateModalProps {
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

const CREDIT_COST_PER_SECOND = 0.15;

export default function AnimateModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: AnimateModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags } = useTags();
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
  
  // Input state - 9:16 is default
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [animationType, setAnimationType] = useState<'broll'>('broll');
  const [duration, setDuration] = useState(8);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);
  
  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  
  // Upload state
  const [isUploadingFirst, setIsUploadingFirst] = useState(false);
  const [isUploadingLast, setIsUploadingLast] = useState(false);
  
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
  
  // Dynamic credit cost based on duration (0.15 per second)
  const creditCost = Math.ceil(duration * CREDIT_COST_PER_SECOND * 100) / 100;
  
  // Validation
  const hasRequiredInputs = !!firstFrameUrl;
  const canGenerate = hasRequiredInputs && !isGenerating && profile && (profile.credits ?? 0) >= creditCost;
  const hasOutput = file?.generation_status === 'completed' && file?.download_url;
  
  // Sync file data when loaded
  useEffect(() => {
    if (file && !fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      setDisplayStatus(file.status || initialStatusRef.current || 'draft');
      setSelectedTags(file.tags || []);
      
      // Restore generation params if any
      const params = file.generation_params as Record<string, unknown> | null;
      if (params?.first_frame_url) setFirstFrameUrl(params.first_frame_url as string);
      if (params?.last_frame_url) setLastFrameUrl(params.last_frame_url as string);
      if (params?.prompt) setPrompt(params.prompt as string);
      if (params?.aspect_ratio) setAspectRatio(params.aspect_ratio as '16:9' | '9:16');
      if (params?.animation_type) setAnimationType(params.animation_type as 'broll');
      if (params?.duration) setDuration(params.duration as number);
      if (typeof params?.audio_enabled === 'boolean') setAudioEnabled(params.audio_enabled);
      if (typeof params?.camera_fixed === 'boolean') setCameraFixed(params.camera_fixed);
      
      // Check if generation is in progress
      if (file.generation_status === 'processing') {
        setIsGenerating(true);
        setGenerationProgress(file.progress || 0);
      }
    }
  }, [file]);
  
  // Update progress when file updates during generation
  useEffect(() => {
    if (file && isGenerating) {
      if (file.generation_status === 'completed' && file.download_url) {
        setIsGenerating(false);
        setGenerationProgress(100);
        toast.success('Animation video generated!');
        onSuccess?.();
      } else if (file.generation_status === 'failed') {
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
            project_id: currentProjectId,
            folder_id: currentFolderId || null,
            generation_params: {
              first_frame_url: firstFrameUrl,
              last_frame_url: lastFrameUrl || null,
              prompt,
              aspect_ratio: aspectRatio,
              animation_type: animationType,
              duration,
              audio_enabled: audioEnabled,
              camera_fixed: cameraFixed,
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
  }, [fileId, hasUnsavedChanges, name, displayStatus, selectedTags, firstFrameUrl, lastFrameUrl, prompt, aspectRatio, animationType, queryClient, currentProjectId, currentFolderId]);
  
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
  }, [hasUnsavedChanges, name, displayStatus, selectedTags, firstFrameUrl, lastFrameUrl, triggerAutoSave]);

  // Handle file upload to Cloudflare R2 (publicly accessible)
  const handleFileUpload = async (uploadedFile: globalThis.File, isFirstFrame: boolean) => {
    if (!user) return;
    
    const setUploading = isFirstFrame ? setIsUploadingFirst : setIsUploadingLast;
    const setUrl = isFirstFrame ? setFirstFrameUrl : setLastFrameUrl;
    
    // Validate file type
    if (!uploadedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploading(true);
    
    try {
      // Use Cloudflare R2 upload which returns publicly accessible URLs
      const publicUrl = await uploadToR2(uploadedFile, { folder: 'animate-frames' });
      
      setUrl(publicUrl);
      setHasUnsavedChanges(true);
      toast.success(`${isFirstFrame ? 'First' : 'Last'} frame uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  
  // Handle generate
  const handleGenerate = async () => {
    if (!canGenerate || !profile || !user) return;
    
    // Check credits
    if ((profile.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost.toFixed(2)} credits but have ${profile.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Refresh session to get fresh JWT token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Update file status to processing
      await supabase
        .from('files')
        .update({
          generation_status: 'processing',
          progress: 0,
          generation_params: {
            first_frame_url: firstFrameUrl,
            last_frame_url: lastFrameUrl || null,
            prompt,
            aspect_ratio: aspectRatio,
            animation_type: animationType,
            duration,
            audio_enabled: audioEnabled,
            camera_fixed: cameraFixed,
          },
        })
        .eq('id', fileId);
      
      // Prepare payload for edge function
      const requestPayload = {
        type: 'animate',
        payload: {
          file_id: fileId,
          user_id: sessionData.session.user.id,
          project_id: currentProjectId,
          folder_id: currentFolderId,
          file_name: name,
          first_frame_url: firstFrameUrl,
          last_frame_url: lastFrameUrl || null,
          prompt: prompt || null,
          aspect_ratio: aspectRatio,
          animation_type: animationType,
          duration,
          audio_enabled: audioEnabled,
          camera_fixed: cameraFixed,
          credits_cost: creditCost,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };
      
      // Starting generation request
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: requestPayload,
      });
      
      if (error) {
        console.error('Edge function error details:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Generation failed');
      }
      
      toast.success('Generation started! This may take a few minutes.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      toast.error('Failed to start generation');
      
      // Revert file status
      await supabase
        .from('files')
        .update({ generation_status: null })
        .eq('id', fileId);
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
          project_id: currentProjectId,
          folder_id: currentFolderId || null,
          generation_params: {
            first_frame_url: firstFrameUrl,
            last_frame_url: lastFrameUrl || null,
            prompt,
            aspect_ratio: aspectRatio,
            animation_type: animationType,
            duration,
            audio_enabled: audioEnabled,
            camera_fixed: cameraFixed,
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
        <DialogContent className="max-w-[900px] h-[85vh] p-0 gap-0 overflow-hidden rounded-lg flex flex-col [&>button]:hidden">
          {/* Header - Same pattern as LipSyncModal */}
          <div className="flex items-center gap-3 border-b bg-background px-4 h-[52px] flex-nowrap shrink-0 relative z-10 mt-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <h2 className="text-lg font-semibold">Animate</h2>
            
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
            
            {/* Auto-save indicator - always reserve space */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm min-w-[70px] justify-end">
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Saved</span>
                  </>
                ) : (
                  <span className="invisible">Saved</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Input Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 border-r">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>
              
              {/* Generate/Upload Toggle */}
              <InputModeToggle
                mode={inputMode}
                onModeChange={setInputMode}
                uploadLabel="Upload"
              />

              {inputMode === 'upload' ? (
                /* Upload Mode UI */
                <div className="space-y-4">
                  <Label>Upload Video</Label>
                  {uploadedVideoUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <video src={uploadedVideoUrl} controls className="w-full h-40 object-cover" />
                      <button
                        onClick={() => setUploadedVideoUrl(null)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !user) return;
                          
                          // Validate
                          const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
                          if (!validTypes.includes(f.type)) {
                            toast.error('Please upload MP4, MOV, or WebM video');
                            return;
                          }
                          if (f.size > 500 * 1024 * 1024) {
                            toast.error('Video must be less than 500MB');
                            return;
                          }
                          
                          setIsUploadingVideo(true);
                          try {
                            // Use Cloudflare R2 for publicly accessible URLs
                            const publicUrl = await uploadToR2(f, { folder: 'videos' });
                            setUploadedVideoUrl(publicUrl);
                            toast.success('Video uploaded');
                          } catch (error) {
                            toast.error('Failed to upload video');
                          } finally {
                            setIsUploadingVideo(false);
                          }
                        }}
                        disabled={isUploadingVideo}
                      />
                      {isUploadingVideo ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                      ) : (
                        <>
                          <Film className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                          <span className="text-sm text-muted-foreground">Upload your video</span>
                          <span className="text-xs text-muted-foreground/70">MP4, MOV, WebM up to 500MB</span>
                        </>
                      )}
                    </label>
                  )}
                  
                  {uploadedVideoUrl && (
                    <Button
                      onClick={async () => {
                        if (!uploadedVideoUrl) return;
                        setIsSavingUpload(true);
                        try {
                          await supabase.from('files').update({
                            download_url: uploadedVideoUrl,
                            preview_url: uploadedVideoUrl,
                            generation_status: 'completed',
                          }).eq('id', fileId);
                          
                          queryClient.invalidateQueries({ queryKey: ['file', fileId] });
                          queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
                          toast.success('Video saved!');
                          onSuccess?.();
                        } catch (error) {
                          toast.error('Failed to save video');
                        } finally {
                          setIsSavingUpload(false);
                        }
                      }}
                      disabled={isSavingUpload}
                      className="w-full"
                    >
                      {isSavingUpload ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>Save Video <span className="text-emerald-400 ml-1">• Free</span></>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                /* Generate Mode UI */
                <>
              {/* Animation Type */}
              <div className="space-y-2">
                <Label>Animation Type</Label>
                <div className="p-3 rounded-lg border border-primary bg-primary/5">
                  <span className="text-sm font-medium">B-Roll (Natural footage)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creates natural, realistic B-roll footage from your image
                </p>
              </div>
              
              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={aspectRatio === '9:16' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio('9:16')}
                  >
                    9:16 Portrait
                  </Button>
                  <Button
                    type="button"
                    variant={aspectRatio === '16:9' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio('16:9')}
                  >
                    16:9 Landscape
                  </Button>
                </div>
              </div>
              
              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm font-medium">{duration}s</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={1}
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4s</span>
                  <span>12s</span>
                </div>
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audio</Label>
                  <p className="text-xs text-muted-foreground">Generate accompanying audio</p>
                </div>
                <Switch
                  checked={audioEnabled}
                  onCheckedChange={(checked) => {
                    setAudioEnabled(checked);
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>

              {/* Camera Toggle */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label>Camera</Label>
                  <p className="text-xs text-muted-foreground">
                    {cameraFixed ? 'Static (fixed position)' : 'Dynamic (moves naturally)'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!cameraFixed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCameraFixed(false);
                      setHasUnsavedChanges(true);
                    }}
                  >
                    Dynamic
                  </Button>
                  <Button
                    type="button"
                    variant={cameraFixed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCameraFixed(true);
                      setHasUnsavedChanges(true);
                    }}
                  >
                    Static
                  </Button>
                </div>
              </div>
              
              {/* First Frame Upload */}
              <div className="space-y-2">
                <Label>First Frame *</Label>
                {firstFrameUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={firstFrameUrl} alt="First frame" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setFirstFrameUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, true);
                      }}
                      disabled={isUploadingFirst}
                    />
                    {isUploadingFirst ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">Upload first frame</span>
                        <span className="text-xs text-muted-foreground/70">PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              {/* Last Frame Upload */}
              <div className="space-y-2">
                <Label>Last Frame (Optional)</Label>
                {lastFrameUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={lastFrameUrl} alt="Last frame" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setLastFrameUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, false);
                      }}
                      disabled={isUploadingLast}
                    />
                    {isUploadingLast ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">Upload last frame</span>
                        <span className="text-xs text-muted-foreground/70">PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              {/* Prompt */}
              <div className="space-y-2">
                <Label>Prompt (Optional)</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder={animationType === 'broll' 
                    ? "Describe the motion you want (e.g., 'gentle camera pan across the scene')"
                    : "Describe the transition you want (e.g., 'smooth zoom transition')"}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  AI will enhance your prompt or analyze the images if left empty
                </p>
              </div>
              
              {/* Generate Button */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">{creditCost.toFixed(2)} credits</span>
                </div>
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
                    <>Generate Animation • {creditCost.toFixed(2)} credits</>
                  )}
                </Button>
              </div>
              </>
              )}
            </div>
            
            {/* Output Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/10">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>
              
              {isGenerating && (
                <div className="space-y-4">
                  <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                      <p className="text-sm text-muted-foreground">Generating animation...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {hasOutput && file?.download_url && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-xl overflow-hidden border border-border">
                    <video
                      src={file.download_url}
                      controls
                      className="w-full"
                      autoPlay
                      muted
                      loop
                    />
                  </div>
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
                  <div className="text-center">
                    <Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No output yet</p>
                    <p className="text-muted-foreground/70 text-xs mt-1">Upload images and click generate</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
