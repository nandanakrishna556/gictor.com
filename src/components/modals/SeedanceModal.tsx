import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/hooks/useTags';
import { useProfile } from '@/hooks/useProfile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { ImageUpload } from '@/components/ui/image-upload';
import { AudioPlayer } from '@/components/ui/audio-player';
import LocationSelector from '@/components/forms/LocationSelector';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import {
  ArrowLeft,
  X,
  Check,
  Loader2,
  Download,
  Mic,
  Film,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';
import type { Actor } from '@/hooks/useActors';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface SeedanceModalProps {
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
const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_VIDEOS_DURATION = 15; // seconds combined
const MAX_REFERENCE_AUDIOS = 2;

const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const AUDIO_TYPES = [
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
  'audio/webm',
];

interface UploadedVideo {
  url: string;
  duration: number;
  name: string;
}

interface UploadedAudio {
  url: string;
  duration: number;
  name: string;
}

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to read video metadata'));
    };
    video.src = URL.createObjectURL(file);
  });

const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error('Failed to read audio metadata'));
    audio.src = URL.createObjectURL(file);
  });

export default function SeedanceModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: SeedanceModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags } = useTags();
  const { profile } = useProfile();

  const initialStatusRef = useRef(initialStatus);
  initialStatusRef.current = initialStatus;
  const fileLoadedRef = useRef(false);

  // Header state
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState(initialStatus || 'draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Auto-save
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Input state
  const [actorId, setActorId] = useState<string | null>(null);
  const [actorSnapshot, setActorSnapshot] = useState<{
    id: string;
    name: string;
    profile_image_url: string | null;
    voice_url: string | null;
  } | null>(null);
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | undefined>();
  const [lastFrameUrl, setLastFrameUrl] = useState<string | undefined>();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceVideos, setReferenceVideos] = useState<UploadedVideo[]>([]);
  const [referenceAudios, setReferenceAudios] = useState<UploadedAudio[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('9:16');
  const [duration, setDuration] = useState<number>(8);
  const [prompt, setPrompt] = useState('');

  // Upload state
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch file data — seed initialData from any cached files list for instant hydration
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
    staleTime: 30_000,
    initialData: () => {
      const caches = queryClient.getQueriesData<any[]>({ queryKey: ['files', projectId] });
      for (const [, list] of caches) {
        if (Array.isArray(list)) {
          const match = list.find((f) => f?.id === fileId);
          if (match) return match;
        }
      }
      return undefined;
    },
  });

  const currentStatusOption =
    statusOptions.find((s) => s.value === displayStatus) || statusOptions[0];

  const tagData: TagData[] = tags?.map((t) => ({
    id: t.id,
    tag_name: t.tag_name,
    color: t.color || '#8E8E93',
  })) || [];

  const creditCost = Math.ceil(duration * CREDIT_COST_PER_SECOND * 100) / 100;
  const totalVideoDuration = referenceVideos.reduce((sum, v) => sum + v.duration, 0);

  const hasOutput = file?.generation_status === 'completed' && !!file?.download_url;

  // Reset hydration flag when modal closes so reopening rehydrates fresh state
  useEffect(() => {
    if (!open) {
      fileLoadedRef.current = false;
    }
  }, [open]);

  // Hydrate from file row
  useEffect(() => {
    if (open && file && !fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      setDisplayStatus(file.status || initialStatusRef.current || 'draft');
      setSelectedTags(file.tags || []);

      const params = file.generation_params as Record<string, unknown> | null;
      if (params) {
        setActorId((params.actor_id as string) || null);
        setActorSnapshot((params.actor_snapshot as typeof actorSnapshot) || null);
        setFirstFrameUrl((params.first_frame_url as string) || undefined);
        setLastFrameUrl((params.last_frame_url as string) || undefined);
        setReferenceImages(Array.isArray(params.reference_images) ? (params.reference_images as string[]) : []);
        setReferenceVideos(Array.isArray(params.reference_videos) ? (params.reference_videos as UploadedVideo[]) : []);
        setReferenceAudios(Array.isArray(params.reference_audios) ? (params.reference_audios as UploadedAudio[]) : []);
        setAspectRatio((params.aspect_ratio as typeof aspectRatio) || '9:16');
        setDuration(typeof params.duration === 'number' ? Math.min(15, Math.max(4, params.duration as number)) : 8);
        setPrompt((params.prompt as string) || '');
      } else {
        setActorId(null);
        setActorSnapshot(null);
        setFirstFrameUrl(undefined);
        setLastFrameUrl(undefined);
        setReferenceImages([]);
        setReferenceVideos([]);
        setReferenceAudios([]);
        setAspectRatio('9:16');
        setDuration(8);
        setPrompt('');
      }

      if (file.generation_status === 'processing') {
        setIsGenerating(true);
      }
    }
  }, [open, file]);

  // Detect generation completion
  useEffect(() => {
    if (file && isGenerating) {
      if (file.generation_status === 'completed' && file.download_url) {
        setIsGenerating(false);
        toast.success('Seedance video generated!');
        onSuccess?.();
      } else if (file.generation_status === 'failed') {
        setIsGenerating(false);
        toast.error(file.error_message || 'Generation failed');
      }
    }
  }, [file, isGenerating, onSuccess]);

  // Build params object for persistence
  const buildParams = useCallback(
    () => ({
      actor_id: actorId,
      actor_snapshot: actorSnapshot,
      first_frame_url: firstFrameUrl || null,
      last_frame_url: lastFrameUrl || null,
      reference_images: referenceImages,
      reference_videos: referenceVideos,
      reference_audios: referenceAudios,
      aspect_ratio: aspectRatio,
      duration,
      prompt,
    }),
    [
      actorId,
      actorSnapshot,
      firstFrameUrl,
      lastFrameUrl,
      referenceImages,
      referenceVideos,
      referenceAudios,
      aspectRatio,
      duration,
      prompt,
    ],
  );

  const syncDraftToCache = useCallback(() => {
    if (!fileId || !fileLoadedRef.current) return;

    const draftData = {
      name,
      status: displayStatus,
      tags: selectedTags,
      project_id: currentProjectId,
      folder_id: currentFolderId || null,
      generation_params: buildParams(),
    };

    queryClient.setQueryData(['file', fileId], (current: any) =>
      current ? { ...current, ...draftData } : current,
    );

    const cachedFileLists = queryClient.getQueriesData<any[]>({ queryKey: ['files'] });
    for (const [queryKey, cachedList] of cachedFileLists) {
      if (!Array.isArray(cachedList)) continue;
      if (!cachedList.some((item) => item?.id === fileId)) continue;

      queryClient.setQueryData(
        queryKey,
        cachedList.map((item) => (item?.id === fileId ? { ...item, ...draftData } : item)),
      );
    }
  }, [
    fileId,
    name,
    displayStatus,
    selectedTags,
    currentProjectId,
    currentFolderId,
    buildParams,
    queryClient,
  ]);

  const persistDraft = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!fileId || !fileLoadedRef.current) return;

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      syncDraftToCache();

      if (!options?.silent) {
        setSaveStatus('saving');
      }

      const { error } = await supabase
        .from('files')
        .update({
          name,
          status: displayStatus,
          tags: selectedTags,
          project_id: currentProjectId,
          folder_id: currentFolderId || null,
          generation_params: buildParams() as never,
        })
        .eq('id', fileId);

      if (error) throw error;

      if (!options?.silent) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }

      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
    },
    [
      fileId,
      name,
      displayStatus,
      selectedTags,
      currentProjectId,
      currentFolderId,
      buildParams,
      queryClient,
      syncDraftToCache,
    ],
  );

  // Keep local query cache in sync for instant reopen
  useEffect(() => {
    syncDraftToCache();
  }, [syncDraftToCache]);

  // Auto-save
  const triggerAutoSave = useCallback(() => {
    if (!fileId || !hasUnsavedChanges || !fileLoadedRef.current) return;

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      void persistDraft();
    }, 800);
  }, [fileId, hasUnsavedChanges, persistDraft]);

  useEffect(() => {
    if (hasUnsavedChanges && fileLoadedRef.current) triggerAutoSave();
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [hasUnsavedChanges, triggerAutoSave]);

  const markDirty = () => setHasUnsavedChanges(true);

  // Actor selection
  const handleActorSelect = (id: string | null, actor?: Actor) => {
    setActorId(id);
    if (actor) {
      setActorSnapshot({
        id: actor.id,
        name: actor.name,
        profile_image_url: actor.profile_image_url,
        voice_url: actor.voice_url,
      });
    } else {
      setActorSnapshot(null);
    }
    markDirty();
  };

  // Reference video upload with combined-duration validation
  const handleVideoUpload = async (uploadedFile: File) => {
    if (!user) return;
    setVideoError(null);

    const validation = validateFile(uploadedFile, {
      allowedTypes: VIDEO_TYPES,
      maxSize: 500 * 1024 * 1024,
    });
    if (!validation.valid) {
      setVideoError(validation.error || 'Invalid file');
      return;
    }

    setIsUploadingVideo(true);
    try {
      const dur = await getVideoDuration(uploadedFile);
      if (dur > MAX_REFERENCE_VIDEOS_DURATION) {
        setVideoError(
          `Single video exceeds the ${MAX_REFERENCE_VIDEOS_DURATION}s combined limit.`,
        );
        setIsUploadingVideo(false);
        return;
      }
      if (totalVideoDuration + dur > MAX_REFERENCE_VIDEOS_DURATION) {
        const remaining = Math.max(0, MAX_REFERENCE_VIDEOS_DURATION - totalVideoDuration);
        setVideoError(
          `Adding this video exceeds the ${MAX_REFERENCE_VIDEOS_DURATION}s combined limit. Only ${remaining.toFixed(1)}s remaining.`,
        );
        setIsUploadingVideo(false);
        return;
      }

      const url = await uploadToR2(uploadedFile, {
        folder: 'seedance-reference-videos',
        allowedTypes: VIDEO_TYPES,
        maxSize: 500 * 1024 * 1024,
      });

      setReferenceVideos((prev) => [...prev, { url, duration: dur, name: uploadedFile.name }]);
      markDirty();
    } catch (err) {
      setVideoError((err as Error).message || 'Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeVideo = (idx: number) => {
    setReferenceVideos((prev) => prev.filter((_, i) => i !== idx));
    setVideoError(null);
    markDirty();
  };

  // Reference audio upload
  const handleAudioUpload = async (uploadedFile: File) => {
    if (!user) return;
    setAudioError(null);

    if (referenceAudios.length >= MAX_REFERENCE_AUDIOS) {
      setAudioError(`Maximum ${MAX_REFERENCE_AUDIOS} audio files allowed.`);
      return;
    }

    const validation = validateFile(uploadedFile, {
      allowedTypes: AUDIO_TYPES,
      maxSize: 50 * 1024 * 1024,
    });
    if (!validation.valid) {
      setAudioError(validation.error || 'Invalid file');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const dur = await getAudioDuration(uploadedFile).catch(() => 0);
      const url = await uploadToR2(uploadedFile, {
        folder: 'seedance-reference-audios',
        allowedTypes: AUDIO_TYPES,
        maxSize: 50 * 1024 * 1024,
      });
      setReferenceAudios((prev) => [...prev, { url, duration: dur, name: uploadedFile.name }]);
      markDirty();
    } catch (err) {
      setAudioError((err as Error).message || 'Failed to upload audio');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const removeAudio = (idx: number) => {
    setReferenceAudios((prev) => prev.filter((_, i) => i !== idx));
    setAudioError(null);
    markDirty();
  };

  // Generation
  const canGenerate = !!prompt.trim() && !isGenerating;

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;

    if ((profile?.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', {
        description: `You need ${creditCost.toFixed(2)} credits but have ${(profile?.credits ?? 0).toFixed(2)}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => (window.location.href = '/billing'),
        },
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      const params = buildParams();

      await supabase
        .from('files')
        .update({
          generation_status: 'processing',
          generation_started_at: new Date().toISOString(),
          progress: 0,
          generation_params: params as never,
        })
        .eq('id', fileId);

      const requestPayload = {
        type: 'seedance',
        payload: {
          file_id: fileId,
          user_id: sessionData.session.user.id,
          project_id: currentProjectId,
          folder_id: currentFolderId,
          file_name: name,
          actor_id: actorId,
          actor_snapshot: actorSnapshot,
          first_frame_url: firstFrameUrl || null,
          last_frame_url: lastFrameUrl || null,
          reference_images: referenceImages,
          reference_videos: referenceVideos,
          reference_audios: referenceAudios,
          aspect_ratio: aspectRatio,
          duration,
          prompt,
          credits_cost: creditCost,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: requestPayload,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Generation started! This may take a few minutes.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
    } catch (err) {
      console.error('Generation error:', err);
      setIsGenerating(false);
      toast.error((err as Error).message || 'Failed to start generation');
      await supabase
        .from('files')
        .update({ generation_status: null })
        .eq('id', fileId);
    }
  };

  // Header handlers
  const handleNameChange = (v: string) => {
    setName(v);
    markDirty();
  };
  const handleStatusChange = (v: string) => {
    setDisplayStatus(v);
    markDirty();
  };
  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
    markDirty();
  };
  const handleCreateTag = async (tagName: string, color: string) => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('user_tags')
      .insert({ user_id: profile.id, tag_name: tagName, color })
      .select()
      .single();
    if (!error && data) {
      setSelectedTags((prev) => [...prev, data.id]);
      markDirty();
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    }
  };
  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
    markDirty();
  };

  const handleClose = async () => {
    try {
      if (hasUnsavedChanges) {
        await persistDraft();
      }
    } catch (error) {
      console.error('Close save error:', error);
    } finally {
      setShowUnsavedWarning(false);
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    try {
      await persistDraft();
    } catch {
      // ignore
    } finally {
      setShowUnsavedWarning(false);
      onClose();
    }
  };

  if (!file && fileId) return null;

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
            <AlertDialogCancel
              onClick={() => {
                setShowUnsavedWarning(false);
                setHasUnsavedChanges(false);
                onClose();
              }}
            >
              Don't save
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[1100px] h-[90vh] p-0 gap-0 overflow-hidden rounded-lg flex flex-col [&>button]:hidden">
          {/* Standardized 52px header */}
          <div className="flex items-center gap-3 border-b bg-background px-4 h-[52px] flex-nowrap shrink-0 relative z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <h2 className="text-lg font-semibold">Seedance 2.0</h2>

            <div className="h-5 w-px bg-border" />

            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-32 h-7 text-sm"
            />

            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />

            <Select value={displayStatus} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={cn(
                  'h-7 w-fit rounded-md text-xs border-0 px-3 py-1 gap-1',
                  currentStatusOption.color,
                  'text-primary-foreground',
                )}
              >
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

          {/* Two-column layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Input */}
            <div className="w-1/2 flex flex-col overflow-hidden border-r">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Input
                </h3>

                {/* Actor */}
                <div className="space-y-2">
                  <Label>Actor</Label>
                  <ActorSelectorPopover selectedActorId={actorId} onSelect={handleActorSelect} />
                </div>

                {/* First / Last frame in same row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First frame</Label>
                    <SingleImageUpload
                      value={firstFrameUrl}
                      onChange={(url) => {
                        setFirstFrameUrl(url);
                        markDirty();
                      }}
                      folder="seedance-frames"
                      aspectRatio="video"
                      placeholder="Upload first frame or"
                      showGenerateLink={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last frame</Label>
                    <SingleImageUpload
                      value={lastFrameUrl}
                      onChange={(url) => {
                        setLastFrameUrl(url);
                        markDirty();
                      }}
                      folder="seedance-frames"
                      aspectRatio="video"
                      placeholder="Upload last frame or"
                      showGenerateLink={false}
                    />
                  </div>
                </div>

                {/* Reference images */}
                <div className="space-y-2">
                  <Label>Reference images</Label>
                  <p className="text-xs text-muted-foreground">
                    Up to {MAX_REFERENCE_IMAGES} images
                  </p>
                  <ImageUpload
                    maxFiles={MAX_REFERENCE_IMAGES}
                    folder="seedance-reference-images"
                    onImagesChange={(urls) => {
                      setReferenceImages(urls);
                      markDirty();
                    }}
                    placeholder="Drag & drop reference images or"
                  />
                </div>

                {/* Reference videos */}
                <div className="space-y-2">
                  <Label>Reference videos</Label>
                  <p className="text-xs text-muted-foreground">
                    Up to {MAX_REFERENCE_VIDEOS_DURATION}s combined ·{' '}
                    <span
                      className={cn(
                        totalVideoDuration > MAX_REFERENCE_VIDEOS_DURATION && 'text-destructive',
                      )}
                    >
                      {totalVideoDuration.toFixed(1)}s used
                    </span>
                  </p>

                  {referenceVideos.length > 0 && (
                    <div className="space-y-2">
                      {referenceVideos.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
                        >
                          <video
                            src={v.url}
                            className="h-12 w-16 rounded-md bg-black object-cover"
                            muted
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{v.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.duration.toFixed(1)}s
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeVideo(i)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalVideoDuration < MAX_REFERENCE_VIDEOS_DURATION && (
                    <label
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all',
                        videoError
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50',
                      )}
                    >
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleVideoUpload(f);
                          e.target.value = '';
                        }}
                        disabled={isUploadingVideo}
                      />
                      {isUploadingVideo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.5} />
                      ) : (
                        <>
                          <Film
                            className="mb-2 h-6 w-6 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop video or{' '}
                            <span className="text-primary font-medium">browse</span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            MP4, MOV, WebM
                          </p>
                        </>
                      )}
                    </label>
                  )}

                  {videoError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                      {videoError}
                    </div>
                  )}
                </div>

                {/* Reference audios */}
                <div className="space-y-2">
                  <Label>Reference audios</Label>
                  <p className="text-xs text-muted-foreground">
                    Up to {MAX_REFERENCE_AUDIOS} audio files
                  </p>

                  {referenceAudios.length > 0 && (
                    <div className="space-y-2">
                      {referenceAudios.map((a, i) => (
                        <div key={i} className="relative">
                          <AudioPlayer
                            audioUrl={a.url}
                            onRemove={() => removeAudio(i)}
                            showRemove
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {referenceAudios.length < MAX_REFERENCE_AUDIOS && (
                    <label
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all',
                        audioError
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50',
                      )}
                    >
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAudioUpload(f);
                          e.target.value = '';
                        }}
                        disabled={isUploadingAudio}
                      />
                      {isUploadingAudio ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.5} />
                      ) : (
                        <>
                          <Mic className="mb-2 h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop audio or{' '}
                            <span className="text-primary font-medium">browse</span>
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            MP3, WAV, M4A · Max 50MB
                          </p>
                        </>
                      )}
                    </label>
                  )}

                  {audioError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                      {audioError}
                    </div>
                  )}
                </div>

                {/* Aspect ratio + Video duration in same row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Aspect Ratio</Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={(v) => {
                        setAspectRatio(v as typeof aspectRatio);
                        markDirty();
                      }}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Video Duration</Label>
                    <div className="flex gap-1">
                      {([10, 15] as const).map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          variant={duration === opt ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-9"
                          onClick={() => {
                            setDuration(opt);
                            markDirty();
                          }}
                        >
                          {opt}s
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      markDirty();
                    }}
                    placeholder="Describe the video you want to generate..."
                    className="min-h-28 rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Sticky generate */}
              <div className="shrink-0 p-4 border-t bg-background">
                <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                      Generating...
                    </>
                  ) : (
                    <>Generate · {creditCost.toFixed(2)} credits</>
                  )}
                </Button>
              </div>
            </div>

            {/* Output */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/10">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Output
              </h3>

              {isGenerating && (
                <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2
                      className="h-10 w-10 animate-spin text-primary mx-auto"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm text-muted-foreground">Generating Seedance video...</p>
                  </div>
                </div>
              )}

              {hasOutput && file?.download_url && (
                <div className="space-y-4 animate-fade-in">
                  <div className="aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                      src={file.download_url}
                      controls
                      className="w-full h-full object-contain"
                      poster={firstFrameUrl}
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
                <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
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
