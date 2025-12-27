import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFinalVideo } from '@/lib/pipeline-service';
import { calculateVideoCost } from '@/types/pipeline';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Download, Play, CheckCircle } from 'lucide-react';

interface FinalVideoStageProps {
  pipelineId: string;
  onComplete: () => void;
}

export default function FinalVideoStage({ pipelineId, onComplete }: FinalVideoStageProps) {
  const { pipeline, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  
  const [resolution, setResolution] = useState<string>(pipeline?.final_video_input?.resolution || '720p');
  const [isGenerating, setIsGenerating] = useState(false);

  const hasOutput = !!pipeline?.final_video_output?.url;
  const outputUrl = pipeline?.final_video_output?.url;
  const videoDuration = pipeline?.final_video_output?.duration_seconds || 0;
  
  const firstFrameUrl = pipeline?.first_frame_output?.url;
  const audioUrl = pipeline?.voice_output?.url;
  const audioDuration = pipeline?.voice_output?.duration_seconds || 0;
  const creditsCost = calculateVideoCost(audioDuration);

  const canGenerate = firstFrameUrl && audioUrl && audioDuration > 0;

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Missing required inputs', {
        description: 'Please complete First Frame and Voice stages first.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await updateFinalVideo({
        input: { resolution: resolution as '480p' | '720p' | '1080p' },
        status: 'processing',
      });

      const result = await generateFinalVideo(pipelineId, {
        first_frame_url: firstFrameUrl,
        audio_url: audioUrl,
        audio_duration_seconds: audioDuration,
        resolution,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        await updateFinalVideo({ status: 'failed' });
      } else {
        toast.success('Video generation started');
      }
    } catch (error) {
      toast.error('Failed to start generation');
      await updateFinalVideo({ status: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full">
      {/* Input Section */}
      <div className="flex-1 flex flex-col border-r">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
          <h3 className="font-medium">Final Video Settings</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div className="space-y-4">
              <Label>Input Summary</Label>
              
              <div className="grid grid-cols-2 gap-4">
                {/* First Frame Preview */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">First Frame</p>
                  {firstFrameUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={firstFrameUrl} 
                        alt="First frame" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Not available</span>
                    </div>
                  )}
                </div>

                {/* Audio Preview */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Voice Audio</p>
                  {audioUrl ? (
                    <div className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-2">
                      <Play className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm">{formatDuration(audioDuration)}</span>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Not available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p (Fast)</SelectItem>
                  <SelectItem value="720p">720p (Recommended)</SelectItem>
                  <SelectItem value="1080p">1080p (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Estimate */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Cost Estimate</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audio duration</span>
                <span>{formatDuration(audioDuration)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credit cost</span>
                <span className="font-medium">{creditsCost.toFixed(2)} credits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/20">
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isGenerating || isUpdating || !canGenerate}
          >
            {isGenerating || pipeline?.status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                Generate Final Video • {creditsCost.toFixed(2)} credits
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex-1 flex flex-col bg-muted/10">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
          <h3 className="font-medium">Final Video Output</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {hasOutput ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-full max-w-lg aspect-video rounded-lg overflow-hidden bg-black">
                <video 
                  src={outputUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-medium">{formatDuration(videoDuration)}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <Button variant="outline" asChild>
                  <a href={outputUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ) : pipeline?.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Generating your video...</p>
              <p className="text-sm text-muted-foreground">This may take a few minutes</p>
            </div>
          ) : pipeline?.status === 'failed' ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-lg font-medium text-destructive">Generation failed</p>
              <p className="text-sm text-muted-foreground">Please try again</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="text-lg font-medium">No output yet</p>
              <p className="text-sm">Generate the final video to see the result</p>
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
