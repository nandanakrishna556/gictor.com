import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTags } from "@/hooks/useTags";
import { useProfile } from "@/hooks/useProfile";
import { Actor } from "@/hooks/useActors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TagList, TagSelector, TagData } from "@/components/ui/tag-badge";
import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { InputModeToggle, InputMode } from "@/components/ui/input-mode-toggle";
import LocationSelector from "@/components/forms/LocationSelector";
import ActorSelectorPopover from "./ActorSelectorPopover";
import { ArrowLeft, X, Loader2, Download, Upload, Image as ImageIcon, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface FrameModalProps {
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
  { value: "draft", label: "Draft", color: "bg-zinc-500" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "review", label: "Review", color: "bg-amber-500" },
  { value: "complete", label: "Complete", color: "bg-emerald-500" },
];

type FrameType = "first" | "last";
type Style = "talking_head" | "broll" | "motion_graphics";
type SubStyle = "ugc" | "studio";
type AspectRatio = "9:16" | "16:9" | "1:1";
type CameraPerspective = "1st_person" | "3rd_person";
type Resolution = "1K" | "2K" | "4K";

export default function FrameModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: FrameModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags, createTag } = useTags();
  const { profile } = useProfile();

  // Core state
  const initialStatusRef = useRef(initialStatus);
  initialStatusRef.current = initialStatus;
  const fileLoadedRef = useRef(false);

  const [name, setName] = useState("Untitled Frame");
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState(initialStatus || "draft");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Input state
  const [frameType, setFrameType] = useState<FrameType>("first");
  const [style, setStyle] = useState<Style>("talking_head");
  const [subStyle, setSubStyle] = useState<SubStyle>("ugc");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [cameraPerspective, setCameraPerspective] = useState<CameraPerspective>("3rd_person");
  const [resolution, setResolution] = useState<Resolution>("2K");

  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);

  // Upload state
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Generation state - localGenerating is ONLY for instant feedback before server updates
  const [localGenerating, setLocalGenerating] = useState(false);
  
  // Tracks if we just clicked generate (prevents useEffect from overriding)
  const isLocalGeneratingRef = useRef(false);

  // Track previous status for transition detection
  const prevFileStatusRef = useRef<string | null>(null);
  const toastShownForFileIdRef = useRef<string | null>(null);

  // Fetch file data
  const { data: file } = useQuery({
    queryKey: ["file", fileId],
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("*").eq("id", fileId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!fileId,
    // Refetch based on FILE status, not just local state
    refetchInterval: (query) => {
      const fileData = query.state.data;
      const shouldPoll = localGenerating || fileData?.generation_status === 'processing';
      return shouldPoll ? 2000 : false;
    },
  });

  // DERIVED from file - this is the source of truth
  const isFileGenerating = file?.generation_status === 'processing';
  const fileProgress = file?.progress || 0;

  // Combined state: show generating if local OR server says so
  const isGenerating = localGenerating || isFileGenerating;
  const generationProgress = isFileGenerating ? fileProgress : (localGenerating ? 5 : 0);

  // Get current status option
  const currentStatusOption = statusOptions.find((s) => s.value === displayStatus) || statusOptions[0];

  // Convert tags to TagData format
  const tagData: TagData[] =
    tags?.map((t) => ({
      id: t.id,
      tag_name: t.tag_name,
      color: t.color || "#8E8E93",
    })) || [];

  // Dynamic credit cost based on resolution
  const creditCost = resolution === "4K" ? 0.5 : 0.25;

  // Validation
  const canGenerate = !isGenerating && profile && (profile.credits ?? 0) >= creditCost;
  const hasOutput = file?.generation_status === "completed" && file?.download_url;

  // Sync file data when loaded
  useEffect(() => {
    if (!file) return;

    // First time load - set name, tags, params, etc.
    if (!fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      setDisplayStatus(file.status || initialStatusRef.current || "draft");
      setSelectedTags(file.tags || []);

      // CRITICAL: Initialize prevFileStatusRef to current status to prevent false "transitions"
      // This prevents showing toast when opening a file that's already completed
      prevFileStatusRef.current = file.generation_status;
      
      // If file is already completed, mark toast as shown to prevent duplicate
      if (file.generation_status === 'completed' && file.download_url) {
        toastShownForFileIdRef.current = file.id;
      }

      // Restore generation params if any
      const params = file.generation_params as Record<string, unknown> | null;
      if (params?.frame_type) setFrameType(params.frame_type as FrameType);
      if (params?.style) setStyle(params.style as Style);
      if (params?.substyle) setSubStyle(params.substyle as SubStyle);
      if (params?.aspect_ratio) setAspectRatio(params.aspect_ratio as AspectRatio);
      if (params?.actor_id) setSelectedActorId(params.actor_id as string);
      if (params?.reference_images) setReferenceImages(params.reference_images as string[]);
      if (params?.camera_perspective) setCameraPerspective(params.camera_perspective as CameraPerspective);
      if (params?.resolution) setResolution(params.resolution as Resolution);
      if (params?.prompt) setPrompt(params.prompt as string);
    }
  }, [file]);

  // Handle generation status transitions - ONLY for toasts
  useEffect(() => {
    if (!file) return;

    const currentStatus = file.generation_status;
    const prevStatus = prevFileStatusRef.current;

    // CRITICAL: Skip transition detection if we're in local generating mode
    // This prevents false "completion" detection when file data hasn't caught up yet
    if (isLocalGeneratingRef.current) {
      // Only update ref when server confirms processing
      if (currentStatus === 'processing') {
        isLocalGeneratingRef.current = false;
        prevFileStatusRef.current = 'processing';
      }
      return;
    }

    // Server confirmed processing - clear local state
    if (currentStatus === 'processing') {
      setLocalGenerating(false);
    }

    // Detect transition FROM processing TO completed (only if not locally generating)
    if (prevStatus === 'processing' && currentStatus === 'completed' && file.download_url) {
      // Only show toast once per file completion
      if (toastShownForFileIdRef.current !== file.id) {
        toastShownForFileIdRef.current = file.id;
        toast.success('Image generated!');
        onSuccess?.();
        queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      }
      setLocalGenerating(false);
    }

    // Detect transition FROM processing TO failed
    if (prevStatus === 'processing' && currentStatus === 'failed') {
      if (toastShownForFileIdRef.current !== file.id) {
        toastShownForFileIdRef.current = file.id;
        toast.error(file.error_message || 'Generation failed');
      }
      setLocalGenerating(false);
    }

    // Update ref for next comparison
    prevFileStatusRef.current = currentStatus;
  }, [file, onSuccess, queryClient, currentProjectId]);

  // Reset local state when modal closes
  useEffect(() => {
    if (!open) {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
      fileLoadedRef.current = false;
      prevFileStatusRef.current = null;
      // Don't reset toastShownForFileIdRef - we want to remember which file we showed toast for
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
        setSaveStatus("saving");

        await supabase
          .from("files")
          .update({
            name,
            status: displayStatus,
            tags: selectedTags,
            project_id: currentProjectId,
            folder_id: currentFolderId || null,
            generation_params: {
              frame_type: frameType,
              style,
              substyle: style !== "motion_graphics" ? subStyle : null,
              aspect_ratio: aspectRatio,
              actor_id: style === "talking_head" ? selectedActorId : null,
              reference_images: referenceImages,
              prompt,
              camera_perspective: style === "broll" ? cameraPerspective : null,
              resolution,
            },
          })
          .eq("id", fileId);

        setHasUnsavedChanges(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);

        queryClient.invalidateQueries({ queryKey: ["files", currentProjectId] });
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus("idle");
      }
    }, 2000);
  }, [
    fileId,
    hasUnsavedChanges,
    name,
    displayStatus,
    selectedTags,
    frameType,
    style,
    subStyle,
    aspectRatio,
    selectedActorId,
    referenceImages,
    prompt,
    cameraPerspective,
    resolution,
    queryClient,
    currentProjectId,
    currentFolderId,
  ]);

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
  }, [hasUnsavedChanges, triggerAutoSave]);

  // Handle input changes
  const handleNameChange = (value: string) => {
    setName(value);
    setHasUnsavedChanges(true);
  };

  const handleFrameTypeChange = (type: FrameType) => {
    setFrameType(type);
    setHasUnsavedChanges(true);
  };

  const handleStyleChange = (newStyle: Style) => {
    setStyle(newStyle);
    if (newStyle !== "motion_graphics") {
      setSubStyle("ugc");
    }
    setHasUnsavedChanges(true);
  };

  const handleSubStyleChange = (newSubStyle: SubStyle) => {
    setSubStyle(newSubStyle);
    setHasUnsavedChanges(true);
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    setHasUnsavedChanges(true);
  };

  const handleActorSelect = (actorId: string | null, actor?: Actor) => {
    setSelectedActorId(actorId);
    setSelectedActor(actor || null);
    setHasUnsavedChanges(true);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
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
      .from("user_tags")
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
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created");
    }
  };

  // Handle reference image upload
  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingIndex(index);

    try {
      const fileName = `${user.id}/reference-images/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(fileName);

      setReferenceImages((prev) => {
        const newImages = [...prev];
        newImages[index] = publicUrl;
        return newImages.filter(Boolean);
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Handle generate
  const handleGenerate = async () => {
    // IMMEDIATE visual feedback - ref prevents useEffect from overriding
    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    // Reset toast tracking for this new generation (but don't set prevFileStatusRef - let the useEffect handle it)

    // Validation
    if (!profile || !user) {
      setLocalGenerating(false);
      return;
    }

    // Check credits
    if ((profile.credits ?? 0) < creditCost) {
      toast.error(`Insufficient credits. You need ${creditCost} credits.`);
      setLocalGenerating(false);
      return;
    }

    try {
      // Refresh session to get fresh JWT token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Session expired. Please log in again.");
      }

      // Update file generation_status to processing
      await supabase
        .from("files")
        .update({
          generation_status: "processing",
          progress: 0,
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: 60,
          generation_params: {
            frame_type: frameType,
            style,
            substyle: style !== "motion_graphics" ? subStyle : null,
            aspect_ratio: aspectRatio,
            actor_id: style === "talking_head" || style === "broll" ? selectedActorId : null,
            reference_images: referenceImages,
            prompt,
            camera_perspective: style === "broll" ? cameraPerspective : null,
            resolution,
          },
        })
        .eq("id", fileId);

      // Prepare payload for edge function
      const requestPayload = {
        type: "frame",
        payload: {
          file_id: fileId,
          user_id: sessionData.session.user.id,
          project_id: currentProjectId,
          folder_id: currentFolderId,
          file_name: name,
          frame_type: frameType,
          style,
          substyle: style !== "motion_graphics" ? subStyle : null,
          aspect_ratio: aspectRatio,
          actor_id: style === "talking_head" || style === "broll" ? selectedActorId : null,
          actor_360_url: style === "talking_head" || style === "broll" ? selectedActor?.profile_360_url : null,
          reference_images: referenceImages,
          output_image_url: file?.download_url || null,
          prompt,
          camera_perspective: style === "broll" ? cameraPerspective : null,
          frame_resolution: resolution,
          credits_cost: creditCost,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };

      console.log("Calling trigger-generation with:", requestPayload);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("trigger-generation", {
        body: requestPayload,
      });

      if (error) {
        console.error("Edge function error details:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Generation failed");
      }

      toast.success("Generation started! This may take a moment.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["files", currentProjectId] });
    } catch (error) {
      console.error("Generation error:", error);
      setLocalGenerating(false);
      toast.error("Failed to start generation");

      // Revert file status
      await supabase
        .from("files")
        .update({ 
          generation_status: 'idle',
          progress: 0,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq("id", fileId);
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

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      await supabase
        .from("files")
        .update({
          name,
          status: displayStatus,
          tags: selectedTags,
          generation_params: {
            frame_type: frameType,
            style,
            substyle: style !== "motion_graphics" ? subStyle : null,
            aspect_ratio: aspectRatio,
            actor_id: style === "talking_head" ? selectedActorId : null,
            reference_images: referenceImages,
            prompt,
            camera_perspective: style === "broll" ? cameraPerspective : null,
            resolution,
          },
        })
        .eq("id", fileId);

      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);

      queryClient.invalidateQueries({ queryKey: ["files", currentProjectId] });
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("idle");
    }
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
          {/* Header */}
          <div className="flex items-center gap-3 border-b bg-background px-4 h-[52px] flex-nowrap shrink-0 relative z-10 mt-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <h2 className="text-lg font-semibold">Frame</h2>

            <div className="h-5 w-px bg-border" />

            <Input value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-28 h-7 text-sm" />

            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />

            <Select value={displayStatus} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={cn(
                  "h-7 w-fit rounded-md text-xs border-0 px-3 py-1 gap-1",
                  currentStatusOption.color,
                  "text-primary-foreground",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", opt.color)} />
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
                    <TagList tags={tagData} selectedTagIds={selectedTags} maxVisible={1} size="sm" />
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
              <div className="flex items-center gap-1.5 text-sm min-w-[70px] justify-end">
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
                    <span className="text-emerald-500">Saved</span>
                  </>
                ) : (
                  <span className="text-muted-foreground invisible">Saved</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          {/* Content - Two column layout */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Input Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-5 border-r border-border">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>

              {/* Frame Type Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Frame Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={frameType === "first" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleFrameTypeChange("first")}
                  >
                    First Frame
                  </Button>
                  <Button
                    variant={frameType === "last" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleFrameTypeChange("last")}
                  >
                    Last Frame
                  </Button>
                </div>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Style</label>
                <div className="space-y-2">
                  {/* Talking Head */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      style === "talking_head"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() => handleStyleChange("talking_head")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                          style === "talking_head" ? "border-primary" : "border-muted-foreground",
                        )}
                      >
                        {style === "talking_head" && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">Talking Head</span>
                    </div>
                    {style === "talking_head" && (
                      <div className="flex gap-1">
                        <Button
                          variant={subStyle === "ugc" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubStyleChange("ugc");
                          }}
                        >
                          UGC
                        </Button>
                        <Button
                          variant={subStyle === "studio" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubStyleChange("studio");
                          }}
                        >
                          Studio
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* B-Roll */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      style === "broll" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    )}
                    onClick={() => handleStyleChange("broll")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                          style === "broll" ? "border-primary" : "border-muted-foreground",
                        )}
                      >
                        {style === "broll" && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">B-Roll</span>
                    </div>
                    {style === "broll" && (
                      <div className="flex gap-1">
                        <Button
                          variant={subStyle === "ugc" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubStyleChange("ugc");
                          }}
                        >
                          UGC
                        </Button>
                        <Button
                          variant={subStyle === "studio" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubStyleChange("studio");
                          }}
                        >
                          Studio
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Motion Graphics */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      style === "motion_graphics"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() => handleStyleChange("motion_graphics")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                          style === "motion_graphics" ? "border-primary" : "border-muted-foreground",
                        )}
                      >
                        {style === "motion_graphics" && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">Motion Graphics</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {style === "talking_head" && "Person looking directly at camera"}
                  {style === "broll" && "Person captured mid-action, natural movement"}
                  {style === "motion_graphics" &&
                    (frameType === "first"
                      ? "Background only - colors, gradients, patterns"
                      : "Graphics & elements - icons, shapes, text areas")}
                </p>
              </div>

              {/* Camera Perspective - Only show for B-Roll */}
              {style === "broll" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Camera Perspective</label>
                  <div className="flex gap-2">
                    <Button
                      variant={cameraPerspective === "1st_person" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setCameraPerspective("1st_person");
                        setHasUnsavedChanges(true);
                      }}
                    >
                      1st Person
                    </Button>
                    <Button
                      variant={cameraPerspective === "3rd_person" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setCameraPerspective("3rd_person");
                        setHasUnsavedChanges(true);
                      }}
                    >
                      3rd Person
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cameraPerspective === "1st_person"
                      ? "POV shot - viewer sees through the subject's eyes"
                      : "Observer view - camera captures the subject from outside"}
                  </p>
                </div>
              )}

              {/* Actor Selector - Show for Talking Head and B-Roll */}
              {(style === "talking_head" || style === "broll") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Actor</label>
                  <ActorSelectorPopover selectedActorId={selectedActorId} onSelect={handleActorSelect} />
                </div>
              )}

              {/* Aspect Ratio & Resolution - Same Row */}
              <div className="space-y-2">
                <div className="flex gap-4">
                  {/* Aspect Ratio Dropdown */}
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Aspect Ratio</label>
                    <Select value={aspectRatio} onValueChange={(value) => handleAspectRatioChange(value as AspectRatio)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                        <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Resolution Dropdown */}
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">Resolution</label>
                    <Select value={resolution} onValueChange={(value) => { setResolution(value as Resolution); setHasUnsavedChanges(true); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1K">1K • 0.25 credits</SelectItem>
                        <SelectItem value="2K">2K • 0.25 credits</SelectItem>
                        <SelectItem value="4K">4K • 0.5 credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Reference Images */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference Images (Optional, up to 3)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((index) => {
                    const imageUrl = referenceImages[index];
                    const isUploading = uploadingIndex === index;

                    return (
                      <div key={index} className="relative">
                        {imageUrl ? (
                          <div className="aspect-square rounded-lg border border-border overflow-hidden group relative">
                            <img
                              src={imageUrl}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-full object-contain bg-muted"
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <label
                            className={cn(
                              "aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:border-primary/50",
                              isUploading && "pointer-events-none",
                            )}
                          >
                            {isUploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Add</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(index, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder={
                    style === "motion_graphics"
                      ? frameType === "first"
                        ? "Describe the background: colors, gradients, patterns, abstract shapes..."
                        : "Describe the graphics: icons, shapes, text areas, call-to-action elements..."
                      : style === "broll"
                        ? "Describe the action, scene, and environment (person will be captured mid-action)..."
                        : "Describe the person, their expression, clothing, and setting (looking at camera)..."
                  }
                  rows={3}
                  className="resize-none"
                />
                {hasOutput && !isGenerating && (
                  <p className="text-xs text-muted-foreground">Describe what you'd like to change</p>
                )}
              </div>

              {/* Generate Section */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">{creditCost} credits</span>
                </div>
                <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                      Generating...
                    </>
                  ) : (
                    `Generate • ${creditCost} credits`
                  )}
                </Button>
              </div>
            </div>

            {/* Output Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/10">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>

              {isGenerating ? (
                <div className="space-y-4">
                  <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                      <p className="text-sm text-muted-foreground">Generating your image...</p>
                    </div>
                  </div>
                </div>
              ) : hasOutput && file?.download_url ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <img src={file.download_url} alt={name} className="w-full object-contain" />
                  </div>
                  <Button variant="secondary" className="w-full" asChild>
                    <a href={file.download_url} download={`${name}.png`}>
                      <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Download Image
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="text-muted-foreground text-sm">Generated image will appear here</p>
                  <p className="text-muted-foreground/70 text-xs">Configure inputs and click Generate</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
