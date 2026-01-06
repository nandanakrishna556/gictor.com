import { useState, useEffect, useRef } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, X, Loader2, Download, Upload, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimateModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  onSuccess?: () => void;
}

const CREDIT_COST = 1;

export default function AnimateModal({
  open,
  onClose,
  fileId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
}: AnimateModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  
  // Core state
  const fileLoadedRef = useRef(false);
  
  const [name, setName] = useState('Untitled');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // Input state - 9:16 is default
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [animationType, setAnimationType] = useState<'broll' | 'motion_graphics'>('broll');
  
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
  
  // Validation
  const isMotionGraphics = animationType === 'motion_graphics';
  const hasRequiredInputs = firstFrameUrl && (!isMotionGraphics || lastFrameUrl);
  const canGenerate = hasRequiredInputs && !isGenerating && profile && (profile.credits ?? 0) >= CREDIT_COST;
  const hasOutput = file?.generation_status === 'completed' && file?.download_url;
  
  // Sync file data when loaded
  useEffect(() => {
    if (file && !fileLoadedRef.current) {
      fileLoadedRef.current = true;
      setName(file.name);
      
      // Restore generation params if any
      const params = file.generation_params as Record<string, unknown> | null;
      if (params?.first_frame_url) setFirstFrameUrl(params.first_frame_url as string);
      if (params?.last_frame_url) setLastFrameUrl(params.last_frame_url as string);
      if (params?.prompt) setPrompt(params.prompt as string);
      if (params?.aspect_ratio) setAspectRatio(params.aspect_ratio as '16:9' | '9:16');
      if (params?.animation_type) setAnimationType(params.animation_type as 'broll' | 'motion_graphics');
      
      // Check if generation is in progress
      if (file.generation_status === 'processing') {
        setIsGenerating(true);
        setGenerationProgress(file.progress || 0);
      }
    }
  }, [file, initialStatus]);
  
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

  // Handle file upload to Supabase storage
  const handleFileUpload = async (uploadedFile: globalThis.File, isFirstFrame: boolean) => {
    if (!user) return;
    
    const setUploading = isFirstFrame ? setIsUploadingFirst : setIsUploadingLast;
    const setUrl = isFirstFrame ? setFirstFrameUrl : setLastFrameUrl;
    
    setUploading(true);
    
    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, uploadedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);
      
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
    if ((profile.credits ?? 0) < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credit.`);
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
          },
        })
        .eq('id', fileId);
      
      // Prepare payload for edge function
      const requestPayload = {
        type: 'animate',
        payload: {
          file_id: fileId,
          user_id: sessionData.session.user.id,
          project_id: projectId,
          folder_id: folderId,
          file_name: name,
          first_frame_url: firstFrameUrl,
          last_frame_url: lastFrameUrl || null,
          prompt: prompt || null,
          aspect_ratio: aspectRatio,
          animation_type: animationType,
          credits_cost: CREDIT_COST,
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
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
      
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
  
  // Handle close
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[900px] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 h-[52px] shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                <span className="text-sm text-muted-foreground">Animate</span>
              </div>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="h-8 w-40 text-sm"
              />
            </div>

            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Input Section */}
            <div className="w-1/2 overflow-y-auto p-6 space-y-6 border-r">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>
              
              {/* Animation Type */}
              <div className="space-y-2">
                <Label>Animation Type</Label>
                <Select value={animationType} onValueChange={(v: 'broll' | 'motion_graphics') => setAnimationType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broll">B-Roll (Natural footage)</SelectItem>
                    <SelectItem value="motion_graphics">Motion Graphics (Transitions)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {animationType === 'broll' 
                    ? 'Creates natural, realistic B-roll footage from your image'
                    : 'Creates smooth motion graphics transitions between two frames'}
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
                <Label>Last Frame {isMotionGraphics ? <span className="text-destructive">*</span> : '(Optional)'}</Label>
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
                  <span className="font-medium">{CREDIT_COST} credit</span>
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
                    <>Generate Animation • {CREDIT_COST} credit</>
                  )}
                </Button>
                {isMotionGraphics && !lastFrameUrl && (
                  <p className="text-xs text-amber-500 text-center">
                    Motion graphics requires both first and last frames
                  </p>
                )}
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
                      <p className="text-sm text-muted-foreground">Generating animation...</p>
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {generationProgress}% complete
                  </p>
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
