import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Video, Image as ImageIcon, FileAudio, Loader2, Download, CheckCircle } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFinalVideo } from '@/lib/pipeline-service';
import { calculateVideoCost } from '@/types/pipeline';
import { toast } from 'sonner';

interface FinalVideoStageProps {
  pipelineId: string;
  onComplete: () => void;
}

export default function FinalVideoStage({ pipelineId, onComplete }: FinalVideoStageProps) {
  const { pipeline, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  
  const [resolution, setResolution] = useState<string>(pipeline?.final_video_input?.resolution || '720p');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get outputs from previous stages
  const firstFrameUrl = pipeline?.first_frame_output?.url;
  const scriptText = pipeline?.script_output?.text;
  const voiceUrl = pipeline?.voice_output?.url;
  const voiceDuration = pipeline?.voice_output?.duration_seconds || 0;

  const estimatedCost = calculateVideoCost(voiceDuration);
  const hasAllInputs = firstFrameUrl && scriptText && voiceUrl;
  const hasOutput = !!pipeline?.final_video_output?.url;
  const outputVideo = pipeline?.final_video_output;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    if (!hasAllInputs) {
      toast.error('Missing inputs', { description: 'Please complete all previous stages first' });
      return;
    }

    setIsGenerating(true);
    try {
      await updateFinalVideo({
        input: { resolution: resolution as '480p' | '720p' | '1080p' },
        status: 'processing',
      });

      const result = await generateFinalVideo(pipelineId, {
        first_frame_url: firstFrameUrl!,
        audio_url: voiceUrl!,
        audio_duration_seconds: voiceDuration,
        resolution,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        await updateFinalVideo({ status: 'failed' });
        return;
      }

      toast.success('Final video generation started!');
    } catch (error) {
      toast.error('Failed to start generation');
      await updateFinalVideo({ status: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Input Summary */}
      <div className="flex-1 flex flex-col border-r">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
          <h3 className="font-medium">Summary</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* First Frame Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-primary" />
              First Frame
            </div>
            {firstFrameUrl ? (
              <img 
                src={firstFrameUrl} 
                alt="First frame" 
                className="w-full aspect-video object-cover rounded-lg"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Not completed</p>
            )}
          </div>

          {/* Script Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Script
            </div>
            {scriptText ? (
              <div className="bg-muted/50 rounded-lg p-3 max-h-24 overflow-y-auto">
                <p className="text-sm text-muted-foreground line-clamp-4">{scriptText}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not completed</p>
            )}
          </div>

          {/* Voice Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileAudio className="h-4 w-4 text-primary" />
              Voice ({formatDuration(voiceDuration)})
            </div>
            {voiceUrl ? (
              <audio src={voiceUrl} controls className="w-full h-10" />
            ) : (
              <p className="text-sm text-muted-foreground">Not completed</p>
            )}
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label>Output Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p (Fast)</SelectItem>
                <SelectItem value="720p">720p (Recommended)</SelectItem>
                <SelectItem value="1080p">1080p (High Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 space-y-3">
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isGenerating || isUpdating || !hasAllInputs || pipeline?.status === 'processing'}
          >
            {isGenerating || pipeline?.status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Final Video...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Generate Final Video • {estimatedCost.toFixed(1)} Credits
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            1 credit per 8 seconds of audio ({formatDuration(voiceDuration)} = {estimatedCost.toFixed(1)} credits)
          </p>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 flex flex-col bg-muted/10">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
          <h3 className="font-medium">Final Video</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {hasOutput && outputVideo ? (
            <div className="w-full max-w-lg space-y-4">
              <video 
                src={outputVideo.url} 
                controls 
                className="w-full aspect-video rounded-xl bg-black"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Duration: {formatDuration(outputVideo.duration_seconds)}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href={outputVideo.url} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ) : pipeline?.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <p className="text-lg font-medium">Generating your video...</p>
                <p className="text-sm text-muted-foreground">This may take a few minutes</p>
              </div>
            </div>
          ) : pipeline?.status === 'failed' ? (
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <p className="text-lg font-medium text-destructive">Generation failed</p>
              <p className="text-sm text-muted-foreground">Please try again</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <Video className="h-16 w-16 text-muted-foreground/50" />
              <p className="text-lg font-medium">No video generated yet</p>
              <p className="text-sm text-muted-foreground">Complete all stages and generate your final video</p>
            </div>
          )}
        </div>

        {hasOutput && (
          <div className="px-6 py-4 border-t bg-muted/20">
            <Button className="w-full" onClick={onComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Pipeline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
