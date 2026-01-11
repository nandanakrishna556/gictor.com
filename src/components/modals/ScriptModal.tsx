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
import LocationSelector from '@/components/forms/LocationSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import { ArrowLeft, X, Check, Loader2, FileText, Sparkles, RefreshCw, Wand2, Minus, Plus, Upload, Link, Copy, Download, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface ScriptModalProps {
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

type ScriptType = 'prompt' | 'recreate' | 'walkthrough';
type Perspective = 'mixed' | '1st' | '2nd' | '3rd';
type ScriptFormat = 'demo' | 'listicle' | 'problem-solution' | 'educational' | 'comparison' | 'promotional' | 'vsl';
type DurationUnit = 'seconds' | 'minutes';
type VideoSource = 'upload' | 'url';

const perspectives: { value: Perspective; label: string; desc: string }[] = [
  { value: 'mixed', label: 'Mixed', desc: 'Best for the situation' },
  { value: '1st', label: '1st Person', desc: '"I will show you..."' },
  { value: '2nd', label: '2nd Person', desc: '"You need to..."' },
  { value: '3rd', label: '3rd Person', desc: '"The user sees..."' },
];

const scriptFormats: { value: ScriptFormat; label: string; desc: string }[] = [
  { value: 'demo', label: 'Demo', desc: 'Product demonstration' },
  { value: 'listicle', label: 'Listicle', desc: 'Top X reasons/tips format' },
  { value: 'problem-solution', label: 'Problem-Solution', desc: 'Pain point → solution' },
  { value: 'educational', label: 'Educational', desc: 'Teaching/explaining concept' },
  { value: 'comparison', label: 'Comparison', desc: 'Us vs them / before-after' },
  { value: 'promotional', label: 'Promotional', desc: 'Direct marketing pitch' },
  { value: 'vsl', label: 'VSL', desc: 'Video sales letter format' },
];

const formatPlaceholders: Record<ScriptFormat, string> = {
  demo: `Describe your product and key features to demo...

Example: Create a demo for our AI video generator. Hook: "Stop spending $5K on video ads." Show the 3-step process: write script → pick AI actor → generate. End with free trial CTA.`,

  listicle: `What's your list topic and target audience?

Example: "5 AI tools every creator needs in 2025." Fast-paced, 10-15 sec per point. Hook with a bold claim, deliver value quickly, end with "Follow for more."`,

  'problem-solution': `What pain point are you solving?

Example: "Tired of paying agencies $5K per video?" Agitate the frustration, then reveal our AI solution. Show before/after: weeks of waiting vs. 5-minute generation.`,

  educational: `What concept are you teaching and to whom?

Example: Explain AI lip-sync for beginners. Break it down: 1) What it is, 2) How AI analyzes audio, 3) How it maps to faces. Use simple analogies, friendly tone.`,

  comparison: `What are you comparing?

Example: Traditional video production vs AI. Compare: Cost ($5K vs $50), Time (weeks vs minutes), Revisions (expensive vs unlimited). End with "The choice is clear."`,

  promotional: `What offer or product are you promoting?

Example: Black Friday sale - 50% off annual plans, 48 hours only. Create urgency, add social proof ("Join 10K+ creators"), strong CTA to claim the discount.`,

  vsl: `What product/service are you selling?

Example: VSL for our AI course. Structure: Hook → Pain → Story → Solution → Value stack → Price anchor → Guarantee → Urgency + CTA. Target: 5-10 minutes.`,
};

const CREDIT_COST = 0.5;

export default function ScriptModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: ScriptModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags } = useTags();
  const { profile } = useProfile();

  // Core state
  const initialStatusRef = useRef(initialStatus);
  initialStatusRef.current = initialStatus;
  const fileLoadedRef = useRef(false);

  const [name, setName] = useState('Untitled Script');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState(initialStatus || 'draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Script inputs
  const [scriptType, setScriptType] = useState<ScriptType>('prompt');
  const [perspective, setPerspective] = useState<Perspective>('mixed');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('minutes');
  const [scriptFormat, setScriptFormat] = useState<ScriptFormat>('demo');
  const [prompt, setPrompt] = useState('');
  const [videoSource, setVideoSource] = useState<VideoSource>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');

  // Output
  const [scriptOutput, setScriptOutput] = useState('');
  const [isRefineMode, setIsRefineMode] = useState(false);

  // Upload state
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevFileStatusRef = useRef<string | null>(null);
  const toastShownForFileIdRef = useRef<string | null>(null);

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
    refetchInterval: (query) => {
      const fileData = query.state.data;
      const shouldPoll = localGenerating || fileData?.generation_status === 'processing';
      return shouldPoll ? 2000 : false;
    },
  });

  // Derived state
  const isFileGenerating = file?.generation_status === 'processing';
  const isGenerating = localGenerating || isFileGenerating;
  const hasOutput = file?.generation_status === 'completed' && file?.script_output;

  // Get current status option
  const currentStatusOption = statusOptions.find(s => s.value === displayStatus) || statusOptions[0];

  // Convert tags to TagData format
  const tagData: TagData[] = tags?.map(t => ({
    id: t.id,
    tag_name: t.tag_name,
    color: t.color || '#8E8E93',
  })) || [];

  // Validation
  const canGenerate = !isGenerating && profile && (profile.credits ?? 0) >= CREDIT_COST && prompt.trim().length > 0;

  // Sync file data when loaded
  useEffect(() => {
    if (!file) return;

    if (!fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      setDisplayStatus(file.status || initialStatusRef.current || 'draft');
      setSelectedTags(file.tags || []);
      
      prevFileStatusRef.current = file.generation_status;
      
      if (file.generation_status === 'completed' && file.script_output) {
        toastShownForFileIdRef.current = file.id;
        setScriptOutput(file.script_output);
      }

      // Restore generation params
      const params = file.generation_params as Record<string, unknown> | null;
      if (params?.script_type) setScriptType(params.script_type as ScriptType);
      if (params?.perspective) setPerspective(params.perspective as Perspective);
      if (params?.duration_value) setDurationValue(params.duration_value as number);
      if (params?.duration_unit) setDurationUnit(params.duration_unit as DurationUnit);
      if (params?.script_format) setScriptFormat(params.script_format as ScriptFormat);
      if (params?.prompt) setPrompt(params.prompt as string);
      if (params?.video_source) setVideoSource(params.video_source as VideoSource);
      if (params?.video_url) setVideoUrl(params.video_url as string);
      if (params?.uploaded_video_url) setUploadedVideoUrl(params.uploaded_video_url as string);
    }
  }, [file]);

  // Handle generation status transitions
  useEffect(() => {
    if (!file) return;

    const currentStatus = file.generation_status;
    const prevStatus = prevFileStatusRef.current;

    if (isLocalGeneratingRef.current) {
      if (currentStatus === 'processing') {
        isLocalGeneratingRef.current = false;
        prevFileStatusRef.current = 'processing';
      }
      return;
    }

    if (currentStatus === 'processing') {
      setLocalGenerating(false);
    }

    if (prevStatus === 'processing' && currentStatus === 'completed' && file.script_output) {
      if (toastShownForFileIdRef.current !== file.id) {
        toastShownForFileIdRef.current = file.id;
        toast.success('Script generated!');
        setScriptOutput(file.script_output);
        onSuccess?.();
        queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      }
      setLocalGenerating(false);
    }

    if (prevStatus === 'processing' && currentStatus === 'failed') {
      if (toastShownForFileIdRef.current !== file.id) {
        toastShownForFileIdRef.current = file.id;
        toast.error(file.error_message || 'Generation failed');
      }
      setLocalGenerating(false);
    }

    prevFileStatusRef.current = currentStatus;
  }, [file, onSuccess, queryClient, currentProjectId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
      fileLoadedRef.current = false;
      prevFileStatusRef.current = null;
      setIsRefineMode(false);
    }
  }, [open]);

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
              script_type: scriptType,
              perspective,
              duration_value: durationValue,
              duration_unit: durationUnit,
              duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
              script_format: scriptFormat,
              prompt,
              video_source: videoSource,
              video_url: videoUrl,
              uploaded_video_url: uploadedVideoUrl,
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
  }, [fileId, hasUnsavedChanges, name, displayStatus, selectedTags, scriptType, perspective, durationValue, durationUnit, scriptFormat, prompt, videoSource, videoUrl, uploadedVideoUrl, queryClient, currentProjectId, currentFolderId]);

  useEffect(() => {
    if (hasUnsavedChanges && fileLoadedRef.current) {
      triggerAutoSave();
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, triggerAutoSave]);

  // Input handlers
  const handleNameChange = (value: string) => {
    setName(value);
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (value: string) => {
    setDisplayStatus(value);
    setHasUnsavedChanges(true);
  };

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
    setHasUnsavedChanges(true);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
    setHasUnsavedChanges(true);
  };

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
      setSelectedTags((prev) => [...prev, data.id]);
      setHasUnsavedChanges(true);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    }
  };

  // Duration handlers - max 300 seconds (5 minutes)
  const MAX_DURATION_SECONDS = 300;
  const incrementAmount = durationUnit === 'minutes' ? 1 : 15;
  const minValue = durationUnit === 'minutes' ? 1 : 15;
  const maxValue = durationUnit === 'minutes' ? 5 : 300;

  const handleDecrement = () => {
    const newValue = durationValue - incrementAmount;
    if (newValue >= minValue) {
      setDurationValue(newValue);
      setHasUnsavedChanges(true);
    }
  };

  const handleIncrement = () => {
    const newValue = durationValue + incrementAmount;
    if ((durationUnit === 'seconds' && newValue <= MAX_DURATION_SECONDS) || 
        (durationUnit === 'minutes' && newValue * 60 <= MAX_DURATION_SECONDS)) {
      setDurationValue(newValue);
      setHasUnsavedChanges(true);
    }
  };

  const handleUnitChange = (newUnit: DurationUnit) => {
    if (newUnit === durationUnit) return;
    if (newUnit === 'seconds') {
      const newVal = Math.min(durationValue * 60, MAX_DURATION_SECONDS);
      setDurationValue(newVal);
    } else {
      const newVal = Math.max(1, Math.min(5, Math.round(durationValue / 60)));
      setDurationValue(newVal);
    }
    setDurationUnit(newUnit);
    setHasUnsavedChanges(true);
  };

  // Video upload handlers
  const handleVideoUpload = async (uploadedFile: globalThis.File) => {
    if (!user) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(uploadedFile.type)) {
      toast.error('Please upload a valid video file (MP4, MOV, WebM, AVI)');
      return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (uploadedFile.size > maxSize) {
      toast.error('Video file must be less than 500MB');
      return;
    }

    setIsUploadingVideo(true);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/videos/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setUploadedVideoUrl(publicUrl);
      setHasUnsavedChanges(true);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setUploadedVideoUrl('');
    setHasUnsavedChanges(true);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleVideoUpload(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleVideoUpload(selectedFile);
    }
  };

  // Get placeholder based on format and mode
  const getPlaceholder = () => {
    if (isRefineMode) {
      return `What changes do you want?

Example: Make it shorter (45 sec). More urgency at the end. Conversational tone. Remove pricing.`;
    }
    if (scriptType === 'recreate') {
      return `How should we adapt this video?

Example: Recreate this competitor's script for our product. Keep their hook structure and energy. Replace their features with ours: AI actors, instant generation, unlimited revisions.`;
    }
    if (scriptType === 'walkthrough') {
      return `What features should we walk through?

Example: Dashboard walkthrough for new users. Show: 1) Create project, 2) Add script, 3) Select actor, 4) Generate video. Emphasize simplicity at each step.`;
    }
    return formatPlaceholders[scriptFormat];
  };

  // Handle generation
  const handleGenerate = async () => {
    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    if (!profile || !user) {
      toast.error('Please sign in to generate scripts');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
      return;
    }

    if ((profile.credits ?? 0) < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
      return;
    }

    try {
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
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: 30,
          generation_params: {
            script_type: scriptType,
            perspective,
            duration_value: durationValue,
            duration_unit: durationUnit,
            duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
            script_format: scriptFormat,
            prompt,
            video_source: videoSource,
            video_url: videoUrl,
            uploaded_video_url: uploadedVideoUrl,
            is_refine: isRefineMode,
            previous_script: isRefineMode ? scriptOutput : undefined,
          },
        })
        .eq('id', fileId);

      // Map frontend script format to backend script_type enum
      const formatToScriptType: Record<ScriptFormat, string> = {
        demo: 'tutorial',
        listicle: 'educational',
        'problem-solution': 'sales',
        educational: 'educational',
        comparison: 'sales',
        promotional: 'sales',
        vsl: 'sales',
      };

      // Prepare payload for edge function
      const payload = {
        type: 'script',
        payload: {
          file_id: fileId,
          user_id: user.id,
          project_id: currentProjectId,
          script_type: formatToScriptType[scriptFormat],
          perspective,
          duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
          script_format: scriptFormat,
          prompt,
          video_url: scriptType !== 'prompt' ? (videoSource === 'url' ? videoUrl : uploadedVideoUrl) : undefined,
          is_refine: isRefineMode,
          previous_script: isRefineMode ? scriptOutput : undefined,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
          credits_cost: CREDIT_COST,
        },
      };

      // Call edge function
      const response = await supabase.functions.invoke('trigger-generation', {
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to start generation');
      }

      setIsRefineMode(false);
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate script');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(scriptOutput);
    toast.success('Copied to clipboard');
  };

  // Download as text file
  const handleDownload = () => {
    const blob = new Blob([scriptOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script downloaded');
  };

  // Calculate stats
  const charCount = scriptOutput.length;
  const estimatedSeconds = Math.round(charCount / 17);

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

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
            script_type: scriptType,
            perspective,
            duration_value: durationValue,
            duration_unit: durationUnit,
            duration_seconds: durationUnit === 'minutes' ? durationValue * 60 : durationValue,
            script_format: scriptFormat,
            prompt,
            video_source: videoSource,
            video_url: videoUrl,
            uploaded_video_url: uploadedVideoUrl,
          },
        })
        .eq('id', fileId);

      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('idle');
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedWarning(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCloseAttempt()}>
        <DialogContent className="max-w-[900px] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
          {/* Header - 52px standardized */}
          <div className="h-[52px] shrink-0 flex items-center gap-3 px-4 border-b border-border bg-card">
            <button
              onClick={handleCloseAttempt}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Script</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-32 h-7 text-sm"
            />

            <div className="h-4 w-px bg-border" />

            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />

            <div className="h-4 w-px bg-border" />

            {/* Status selector */}
            <Select value={displayStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-7 w-auto gap-1.5 border-none shadow-none px-2">
                <div className={cn('w-2 h-2 rounded-full', currentStatusOption?.color)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border" />

            {/* Tags */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-7 px-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  {selectedTags.length > 0 ? (
                    <TagList tags={tagData} selectedTagIds={selectedTags} maxVisible={2} size="sm" />
                  ) : (
                    '+ Add tag'
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <TagSelector
                  tags={tagData}
                  selectedTagIds={selectedTags}
                  onToggleTag={handleToggleTag}
                  onCreateTag={handleCreateTag}
                />
              </PopoverContent>
            </Popover>

            <div className="flex-1" />

            {/* Save status */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  Saved
                </>
              ) : null}
            </div>

            <button
              onClick={handleCloseAttempt}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Input Section */}
            <div className="w-1/2 overflow-y-auto p-5 space-y-5 border-r border-border">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Input
              </h3>

              {/* Script Type - Full width buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Script Type</label>
                <div className="flex gap-2">
                  {(['prompt', 'recreate', 'walkthrough'] as ScriptType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setScriptType(type); setHasUnsavedChanges(true); }}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                        scriptType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                      )}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perspective - Compact cards */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Perspective</label>
                <div className="grid grid-cols-2 gap-2">
                  {perspectives.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => { setPerspective(p.value); setHasUnsavedChanges(true); }}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all',
                        perspective === p.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 bg-card'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0',
                          perspective === p.value ? 'border-primary' : 'border-muted-foreground/50'
                        )}>
                          {perspective === p.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{p.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 ml-5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt-specific fields */}
              {scriptType === 'prompt' && (
                <>
                  {/* Duration - Equal width split */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estimated Duration</label>
                    <div className="flex gap-2">
                      {/* Stepper - takes 50% */}
                      <div className="flex-1 flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={handleDecrement}
                          className="h-9 w-9 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={durationValue}
                          onChange={(e) => { 
                            const val = parseInt(e.target.value) || minValue;
                            setDurationValue(Math.min(maxValue, Math.max(minValue, val))); 
                            setHasUnsavedChanges(true); 
                          }}
                          className="h-9 flex-1 min-w-0 bg-secondary border-x border-border text-center text-sm font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={handleIncrement}
                          className="h-9 w-9 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Unit Toggle - takes 50% */}
                      <div className="flex-1 flex items-center bg-secondary rounded-lg p-1">
                        <button
                          onClick={() => handleUnitChange('seconds')}
                          className={cn(
                            'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                            durationUnit === 'seconds'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Seconds
                        </button>
                        <button
                          onClick={() => handleUnitChange('minutes')}
                          className={cn(
                            'flex-1 py-1.5 rounded-md text-sm font-medium transition-all',
                            durationUnit === 'minutes'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          Minutes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Script Format */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Script Format</label>
                    <Select value={scriptFormat} onValueChange={(v) => { setScriptFormat(v as ScriptFormat); setHasUnsavedChanges(true); }}>
                      <SelectTrigger className="h-auto py-2.5 px-3">
                        <div className="flex flex-col items-start text-left w-full">
                          <span className="font-medium text-sm">{scriptFormats.find(f => f.value === scriptFormat)?.label}</span>
                          <span className="text-xs text-muted-foreground">{scriptFormats.find(f => f.value === scriptFormat)?.desc}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {scriptFormats.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="py-2">
                            <div className="flex flex-col items-start text-left">
                              <span className="font-medium">{f.label}</span>
                              <span className="text-xs text-muted-foreground">{f.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Video source for recreate/walkthrough */}
              {(scriptType === 'recreate' || scriptType === 'walkthrough') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Source</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setVideoSource('upload'); setHasUnsavedChanges(true); }}
                        className={cn(
                          'flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2',
                          videoSource === 'upload'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        <Upload className="h-4 w-4" />
                        Upload Video
                      </button>
                      <button
                        onClick={() => { setVideoSource('url'); setHasUnsavedChanges(true); }}
                        className={cn(
                          'flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2',
                          videoSource === 'url'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        <Link className="h-4 w-4" />
                        Paste URL
                      </button>
                    </div>
                  </div>

                  {videoSource === 'upload' ? (
                    <div>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      
                      {uploadedVideoUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-card border border-border">
                          <video
                            src={uploadedVideoUrl}
                            className="w-full aspect-video object-contain bg-black"
                            controls
                          />
                          <button
                            onClick={handleRemoveVideo}
                            className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => videoInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                            isDraggingVideo
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/20 hover:bg-muted/40'
                          )}
                        >
                          {isUploadingVideo ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                <Video className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Drop video or click to browse</p>
                                <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to 500MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Input
                        value={videoUrl}
                        onChange={(e) => { setVideoUrl(e.target.value); setHasUnsavedChanges(true); }}
                        placeholder="https://youtube.com/watch?v=..."
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">YouTube, Vimeo, Loom, or direct video links</p>
                    </div>
                  )}
                </>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Prompt</label>
                  {isRefineMode && (
                    <span className="text-xs text-primary font-medium">(Refine Mode)</span>
                  )}
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setHasUnsavedChanges(true); }}
                  placeholder={getPlaceholder()}
                  className="min-h-[120px] resize-none text-sm"
                />
              </div>

              {/* Generate */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">{CREDIT_COST} credits</span>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full h-10"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isRefineMode ? `Refine Script • ${CREDIT_COST} credits` : `Generate Script • ${CREDIT_COST} credits`}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Output Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Output
                </h3>
                {scriptOutput && !isGenerating && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="h-8 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownload}
                      className="h-8 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                )}
              </div>

              {isGenerating ? (
                <div className="h-64 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating your script...</p>
                </div>
              ) : scriptOutput ? (
                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-5 border border-border">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{scriptOutput}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                    <span>{charCount} characters</span>
                    <span>~{estimatedSeconds} seconds</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      variant={isRefineMode ? 'default' : 'secondary'}
                      onClick={() => setIsRefineMode(!isRefineMode)}
                      className="flex-1"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Refine
                    </Button>
                  </div>

                  {isRefineMode && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
                      <p className="text-primary">
                        <strong>Refine Mode:</strong> Describe your changes in the Prompt field, then click "Refine Script".
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 rounded-xl bg-card/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm">Generated script will appear here</p>
                  <p className="text-muted-foreground/70 text-xs">Configure inputs and click Generate</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes warning */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmClose}>Don't save</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
