import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({ src, className, compact = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress || !duration) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30",
      compact && "p-2 gap-2",
      className
    )}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={cn(
          "shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
          compact ? "h-8 w-8" : "h-9 w-9"
        )}
      >
        {isPlaying ? (
          <Pause className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        ) : (
          <Play className={cn("ml-0.5", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
      </button>

      {/* Time & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-muted-foreground tabular-nums shrink-0",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {formatTime(currentTime)}
          </span>
          
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 relative h-1.5 bg-border rounded-full overflow-hidden cursor-pointer"
          >
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <span className={cn(
            "text-muted-foreground tabular-nums shrink-0",
            compact ? "text-[10px]" : "text-xs"
          )}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
