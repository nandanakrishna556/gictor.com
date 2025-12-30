import React, { useState, useRef } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  onRemove?: () => void;
  onDurationChange?: (duration: number) => void;
  showRemove?: boolean;
  className?: string;
}

export function AudioPlayer({ 
  audioUrl, 
  onRemove, 
  onDurationChange,
  showRemove = true,
  className 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const handleLoadedMetadata = () => {
    const dur = audioRef.current?.duration || 0;
    setDuration(dur);
    onDurationChange?.(dur);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("relative border border-border rounded-xl p-4 bg-secondary/30", className)}>
      {/* Remove button */}
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground z-10 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div
            className="h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
