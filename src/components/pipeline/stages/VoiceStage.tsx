import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Play, Pause, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { getAudioDuration } from '@/lib/pipeline-service';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface VoiceStageProps {
  pipelineId: string;
  onContinue: () => void;
  stageNavigation?: React.ReactNode;
}

export default function VoiceStage({ pipelineId, onContinue, stageNavigation }: VoiceStageProps) {
  const { pipeline, updateVoice, isUpdating } = usePipeline(pipelineId);
  
  // Input state
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load existing data
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input;
      setUploadedUrl(input.uploaded_url || '');
    }
  }, [pipeline?.voice_input]);

  const togglePlayback = () => {
    const outputUrl = pipeline?.voice_output?.url;
    if (!outputUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(outputUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToR2(file, { 
        folder: 'pipeline-voices',
        allowedTypes: [
          'audio/mpeg', 
          'audio/mp3', 
          'audio/wav', 
          'audio/wave',
          'audio/x-wav',
          'audio/m4a', 
          'audio/x-m4a', 
          'audio/mp4',
          'audio/ogg',
          'audio/webm',
          'audio/aac',
        ],
        maxSize: 50 * 1024 * 1024,
      });
      setUploadedUrl(url);
      
      const duration = await getAudioDuration(url);
      
      await updateVoice({
        input: { mode: 'upload', uploaded_url: url },
        output: { url, duration_seconds: duration, generated_at: new Date().toISOString() },
        complete: true,
      });
      
      toast.success('Audio uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleRemoveUploadedAudio = async () => {
    setUploadedUrl('');
    await updateVoice({ output: null, complete: false });
    toast.success('Audio removed');
  };

  const handleGenerate = async () => {
    if (!uploadedUrl) {
      toast.error('Please upload an audio file first');
      return;
    }
  };

  const handleContinue = () => {
    if (pipeline?.voice_output?.url) {
      updateVoice({ complete: true });
      onContinue();
    }
  };

  const hasOutput = !!pipeline?.voice_output?.url;
  const outputAudio = pipeline?.voice_output;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const inputContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Upload voice audio</Label>
        <label 
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
            isDragging 
              ? "border-primary bg-primary/10" 
              : "hover:border-primary/50 hover:bg-secondary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Upload className={cn("h-8 w-8 mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm text-muted-foreground">
            {isUploading ? 'Uploading...' : isDragging ? 'Drop your audio file here' : 'Drag & drop or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A • Max 50MB</p>
        </label>
        {uploadedUrl && (
          <div className="relative group">
            <button
              type="button"
              onClick={handleRemoveUploadedAudio}
              className="absolute -top-2 -left-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <audio src={uploadedUrl} controls className="w-full" />
          </div>
        )}
      </div>
    </div>
  );

  const handleDownloadAudio = async () => {
    const audioUrl = outputAudio?.url;
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audio downloaded');
    } catch (error) {
      toast.error('Failed to download audio');
    }
  };

  const outputContent = outputAudio ? (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      {/* Play Button */}
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
        <Button
          size="lg"
          variant="ghost"
          className="w-16 h-16 rounded-full"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium">
          {formatDuration(currentTime)} / {formatDuration(outputAudio.duration_seconds)}
        </p>
        <p className="text-sm text-muted-foreground">Duration</p>
      </div>
    </div>
  ) : null;

  const outputActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleDownloadAudio}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={handleContinue}
      isGenerating={isUploading || isUpdating}
      canContinue={hasOutput}
      generateLabel="Use Uploaded Audio"
      creditsCost="Free"
      isAIGenerated={false}
      outputActions={hasOutput ? outputActions : undefined}
      stageNavigation={stageNavigation}
    />
  );
}
