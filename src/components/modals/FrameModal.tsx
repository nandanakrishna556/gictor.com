import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import { toast } from 'sonner';

interface Actor {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  profile_image_url?: string;
  profile_360_url?: string;
}

interface FrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  projectId?: string;
  folderId?: string;
  existingOutput?: {
    download_url: string;
  } | null;
  onSuccess?: () => void;
}

export default function FrameModal({ 
  isOpen, 
  onClose, 
  fileId, 
  projectId,
  folderId,
  existingOutput, 
  onSuccess 
}: FrameModalProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loadingActors, setLoadingActors] = useState(true);

  // Form state
  const [frameType, setFrameType] = useState<'first_frame' | 'last_frame'>('first_frame');
  const [style, setStyle] = useState<'talking_head' | 'broll' | 'motion_graphics'>('talking_head');
  const [styleSubOption, setStyleSubOption] = useState<'ugc' | 'studio'>('ugc');
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Load actors on mount
  useEffect(() => {
    if (isOpen && user) {
      loadActors();
    }
  }, [isOpen, user]);

  const loadActors = async () => {
    try {
      setLoadingActors(true);
      const { data, error } = await supabase
        .from('actors')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActors(data || []);
    } catch (error) {
      console.error('Error loading actors:', error);
      toast.error('Failed to load actors');
    } finally {
      setLoadingActors(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    if (referenceImages.length + files.length > 3) {
      toast.error('Maximum 3 reference images allowed');
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToR2(file, {
          folder: 'reference-images',
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
        });
        uploadedUrls.push(url);
      }

      setReferenceImages([...referenceImages, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate');
      return;
    }

    if (!selectedActor) {
      toast.error('Please select an actor');
      return;
    }

    try {
      setIsGenerating(true);

      const allReferenceImages = [
        selectedActor.profile_360_url,
        ...referenceImages,
        ...(existingOutput?.download_url ? [existingOutput.download_url] : [])
      ].filter(Boolean) as string[];

      let targetFileId = fileId;
      if (!targetFileId) {
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            folder_id: folderId || null,
            name: `${frameType === 'first_frame' ? 'First' : 'Last'} Frame - ${selectedActor.name}`,
            file_type: 'first_frame',
            generation_status: 'processing',
            progress: 0,
            generation_params: {
              frame_type: frameType,
              style: style,
              style_sub_option: styleSubOption,
              actor_id: selectedActor.id,
              aspect_ratio: aspectRatio,
              reference_images: allReferenceImages,
              prompt: prompt,
              credits_cost: 1
            }
          })
          .select()
          .single();

        if (fileError) throw fileError;
        targetFileId = fileData.id;
      } else {
        const { error: updateError } = await supabase
          .from('files')
          .update({
            generation_status: 'processing',
            progress: 0,
            generation_params: {
              frame_type: frameType,
              style: style,
              style_sub_option: styleSubOption,
              actor_id: selectedActor.id,
              aspect_ratio: aspectRatio,
              reference_images: allReferenceImages,
              prompt: prompt,
              credits_cost: 1
            }
          })
          .eq('id', targetFileId);

        if (updateError) throw updateError;
      }

      // Trigger generation via edge function
      const { error: invokeError } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'frame',
          payload: {
            file_id: targetFileId,
            user_id: user.id,
            project_id: projectId,
            folder_id: folderId,
            frame_type: frameType,
            style: style,
            style_sub_option: styleSubOption,
            aspect_ratio: aspectRatio,
            reference_images: allReferenceImages,
            prompt: prompt,
            credits_cost: 1,
            supabase_url: import.meta.env.VITE_SUPABASE_URL
          }
        }
      });

      if (invokeError) throw invokeError;

      toast.success(`${frameType === 'first_frame' ? 'First' : 'Last'} frame generation started!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl shadow-float overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {fileId ? 'Regenerate' : 'Generate'} Frame
              </h2>
              <p className="text-sm text-muted-foreground">
                Create AI-powered video frames
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Frame Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Frame Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFrameType('first_frame')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  frameType === 'first_frame'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <p className="font-medium">First Frame</p>
                <p className="text-xs opacity-70">Opening shot</p>
              </button>
              <button
                onClick={() => setFrameType('last_frame')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  frameType === 'last_frame'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <p className="font-medium">Last Frame</p>
                <p className="text-xs opacity-70">Closing shot</p>
              </button>
            </div>
          </div>

          {/* Style */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Style</label>
            <div className="space-y-2">
              {/* Talking Head */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <input
                  type="radio"
                  name="style"
                  checked={style === 'talking_head'}
                  onChange={() => setStyle('talking_head')}
                  className="w-4 h-4 accent-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-foreground">Talking Head</span>
                  {style === 'talking_head' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setStyleSubOption('ugc')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          styleSubOption === 'ugc'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        UGC
                      </button>
                      <button
                        onClick={() => setStyleSubOption('studio')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          styleSubOption === 'studio'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Studio
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* B-Roll */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <input
                  type="radio"
                  name="style"
                  checked={style === 'broll'}
                  onChange={() => setStyle('broll')}
                  className="w-4 h-4 accent-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-foreground">B-Roll</span>
                  {style === 'broll' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setStyleSubOption('ugc')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          styleSubOption === 'ugc'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        UGC
                      </button>
                      <button
                        onClick={() => setStyleSubOption('studio')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          styleSubOption === 'studio'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Studio
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Motion Graphics */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <input
                  type="radio"
                  name="style"
                  checked={style === 'motion_graphics'}
                  onChange={() => setStyle('motion_graphics')}
                  className="w-4 h-4 accent-primary"
                />
                <div className="flex-1">
                  <span className="font-medium text-foreground">Motion Graphics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Select Actor */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Actor</label>
            {loadingActors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : actors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No actors available. Create an actor first.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {actors.map((actor) => (
                  <button
                    key={actor.id}
                    onClick={() => setSelectedActor(actor)}
                    className={`group relative bg-muted/30 rounded-xl overflow-hidden transition-all hover:shadow-elevated ${
                      selectedActor?.id === actor.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="aspect-square relative">
                      {actor.profile_360_url ? (
                        <>
                          <img src={actor.profile_360_url} alt={actor.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white">
                            360°
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <div className="flex items-center gap-2">
                        {actor.profile_image_url && (
                          <img src={actor.profile_image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <div className="text-left min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {actor.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {actor.gender && `${actor.gender.charAt(0).toUpperCase() + actor.gender.slice(1)}`}
                            {actor.gender && actor.age && ' • '}
                            {actor.age && `${actor.age}y`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          {selectedActor && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
              <div className="flex gap-3">
                {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-border/60'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference Images */}
          {selectedActor && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Reference Images</label>
                <span className="text-xs text-muted-foreground">(Optional, up to 3)</span>
              </div>
              <div className="flex gap-3">
                {referenceImages.map((url, index) => (
                  <div key={index} className="relative group w-20 h-20 rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeReferenceImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {referenceImages.length < 3 && (
                  <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                    {uploadingImages ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1">
                          Upload
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          {selectedActor && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Prompt</label>
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the frame you want to generate..."
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {prompt.length} / 500
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-card/95 backdrop-blur-sm border-t border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Cost: <span className="text-foreground font-medium">1 credit</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedActor || loadingActors}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-primary-glow disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Frame
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
