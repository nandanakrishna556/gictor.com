import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/hooks/useTags';
import { useProfile } from '@/hooks/useProfile';
import { useActors } from '@/hooks/useActors';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import LocationSelector from '@/components/forms/LocationSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { ArrowLeft, X, Check, Loader2, Download, AlertCircle, User, Search, Play, Pause, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface SpeechModalProps {
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

const CREDIT_COST_PER_1000_CHARS = 0.25;
const MIN_CHARACTERS = 10;
const MAX_CHARACTERS = 10000;

export default function SpeechModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}: SpeechModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tags, createTag } = useTags();
  const { profile } = useProfile();
  const { actors } = useActors();
  
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
  const [script, setScript] = useState('');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [actorSearchOpen, setActorSearchOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  
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
  
  // Get completed actors with voice
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && actor.voice_url
  ) || [];
  
  // Get selected actor
  const selectedActor = availableActors.find((a) => a.id === selectedActorId);
  
  // Calculate credit cost
  const characterCount = script.length;
  const creditCost = Math.max(CREDIT_COST_PER_1000_CHARS, Math.ceil(characterCount / 1000) * CREDIT_COST_PER_1000_CHARS);
  
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
      if (params?.script) setScript(params.script);
      if (params?.actor_id) setSelectedActorId(params.actor_id);
      
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
        toast.success('Speech audio generated!');
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
            generation_params: {
              script,
              actor_id: selectedActorId,
              actor_voice_url: selectedActor?.voice_url,
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
  }, [fileId, hasUnsavedChanges, name, displayStatus, selectedTags, script, selectedActorId, selectedActor, queryClient, currentProjectId]);
  
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
  }, [hasUnsavedChanges, name, displayStatus, selectedTags, script, selectedActorId, triggerAutoSave]);
  
  // Handle input changes
  const handleNameChange = (value: string) => {
    setName(value);
    setHasUnsavedChanges(true);
  };
  
  const handleScriptChange = (value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      setScript(value);
      setHasUnsavedChanges(true);
    }
  };
  
  const handleActorSelect = (actorId: string) => {
    setSelectedActorId(actorId);
    setActorSearchOpen(false);
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
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
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
      
      // Calculate estimated duration based on script length
      const estimatedDuration = Math.max(10, Math.ceil((script.length / 20) * 5));
      
      // Update file generation_status to processing (preserve kanban status)
      await supabase
        .from('files')
        .update({
          generation_status: 'processing',
          progress: 0,
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: estimatedDuration,
          generation_params: {
            script,
            actor_id: selectedActorId,
            actor_voice_url: selectedActor?.voice_url,
            actor_profile_image: selectedActor?.profile_image_url,
          },
        })
        .eq('id', fileId);
      
      // Prepare payload for edge function
      const requestPayload = {
        type: 'speech',
        payload: {
          file_id: fileId,
          user_id: sessionData.session.user.id,
          project_id: currentProjectId,
          folder_id: currentFolderId,
          file_name: name,
          script,
          actor_voice_url: selectedActor?.voice_url,
          credits_cost: creditCost,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };
      
      console.log('Calling trigger-generation with:', requestPayload);
      
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
        .update({ status: displayStatus })
        .eq('id', fileId);
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
      setSaveStatus('saving');
      
      await supabase
        .from('files')
        .update({
          name,
          status: displayStatus,
          tags: selectedTags,
          generation_params: {
            script,
            actor_id: selectedActorId,
            actor_voice_url: selectedActor?.voice_url,
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
  
  const canGenerate = script.length >= MIN_CHARACTERS && selectedActorId && !isGenerating;
  const hasOutput = !!file?.download_url;
  
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
            <h2 className="text-lg font-semibold">Speech</h2>
            
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
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 border-r border-border">
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
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !user) return;
                          
                          const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];
                          if (!validTypes.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a)$/i)) {
                            toast.error('Please upload MP3, WAV, or M4A audio');
                            return;
                          }
                          if (f.size > 50 * 1024 * 1024) {
                            toast.error('Audio must be less than 50MB');
                            return;
                          }
                          
                          setIsUploadingAudio(true);
                          try {
                            const url = await uploadToR2(f, { 
                              folder: 'speech-audio',
                              allowedTypes: [...validTypes, 'audio/mp4'],
                              maxSize: 50 * 1024 * 1024
                            });
                            setUploadedAudioUrl(url);
                            toast.success('Audio uploaded');
                          } catch (error) {
                            toast.error('Failed to upload audio');
                          } finally {
                            setIsUploadingAudio(false);
                          }
                        }}
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
                    <Button
                      onClick={async () => {
                        if (!uploadedAudioUrl) return;
                        setIsSavingUpload(true);
                        try {
                          await supabase.from('files').update({
                            download_url: uploadedAudioUrl,
                            generation_status: 'completed',
                          }).eq('id', fileId);
                          
                          queryClient.invalidateQueries({ queryKey: ['file', fileId] });
                          queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
                          toast.success('Audio saved!');
                          onSuccess?.();
                        } catch (error) {
                          toast.error('Failed to save audio');
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
                        <>Save Audio <span className="text-emerald-400 ml-1">• Free</span></>
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
                  <span className={cn(
                    "text-xs",
                    characterCount > MAX_CHARACTERS ? "text-destructive" : "text-muted-foreground"
                  )}>
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
                  <p className="text-xs text-muted-foreground">
                    Minimum {MIN_CHARACTERS} characters required
                  </p>
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
                              {[selectedActor.gender, selectedActor.age && `${selectedActor.age}y`].filter(Boolean).join(' • ')}
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
              
              {/* Generate Button */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated cost:</span>
                  <span className="font-medium">{creditCost.toFixed(2)} credits</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {CREDIT_COST_PER_1000_CHARS} credits per 1,000 characters
                </p>
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
                    <>Generate • {creditCost.toFixed(2)} credits</>
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
                      <p className="text-sm text-muted-foreground">Generating speech audio...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {hasOutput && file?.download_url && (
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
                    <audio
                      src={file.download_url}
                      controls
                      className="w-full"
                    />
                  </div>
                  <Button variant="secondary" className="w-full" asChild>
                    <a href={file.download_url} download={`${name}.mp3`}>
                      <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Download Audio
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
