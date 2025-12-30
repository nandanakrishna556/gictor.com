import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from './button';

interface AudioWaveformProps {
  audioUrl: string;
  isPlaying?: boolean;
  currentTime?: number;
  onSeek?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onReady?: (duration: number) => void;
  showControls?: boolean;
  height?: number;
  className?: string;
}

export function AudioWaveform({ 
  audioUrl,
  isPlaying: externalIsPlaying,
  currentTime: externalCurrentTime,
  onSeek,
  onPlayPause,
  onReady,
  showControls = true,
  height = 60,
  className 
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    setIsLoading(true);
    setIsReady(false);

    // Destroy previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(240, 4%, 46%)',
      progressColor: 'hsl(24, 95%, 53%)',
      cursorColor: 'hsl(24, 95%, 53%)',
      cursorWidth: 2,
      height: height,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.load(audioUrl);

    wavesurfer.on('ready', () => {
      const dur = wavesurfer.getDuration();
      setDuration(dur);
      setIsLoading(false);
      setIsReady(true);
      onReady?.(dur);
    });

    wavesurfer.on('audioprocess', () => {
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(time);
    });

    wavesurfer.on('seeking', () => {
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(time);
      onSeek?.(time);
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
      onPlayPause?.(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
      onPlayPause?.(false);
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      onPlayPause?.(false);
    });

    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setIsLoading(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, height]);

  // Sync external play state
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    if (externalIsPlaying !== undefined && externalIsPlaying !== isPlaying) {
      if (externalIsPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [externalIsPlaying, isReady, isPlaying]);

  // Sync external current time (for seeking from outside)
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    if (externalCurrentTime !== undefined && Math.abs(externalCurrentTime - currentTime) > 0.5) {
      wavesurferRef.current.seekTo(externalCurrentTime / duration);
    }
  }, [externalCurrentTime, isReady, duration, currentTime]);

  const togglePlayPause = useCallback(() => {
    if (!wavesurferRef.current || !isReady) return;
    wavesurferRef.current.playPause();
  }, [isReady]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="flex items-center gap-1">
          {Array(30).fill(0).map((_, i) => (
            <div 
              key={i}
              className="w-[3px] bg-muted rounded-full animate-pulse"
              style={{ 
                height: `${Math.random() * 30 + 10}px`,
                animationDelay: `${i * 30}ms`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Waveform Container */}
      <div 
        ref={containerRef} 
        className="w-full cursor-pointer rounded-lg overflow-hidden"
        style={{ height }}
      />
      
      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Play className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}
