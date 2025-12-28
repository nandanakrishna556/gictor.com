import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function AudioWaveform({ 
  audioUrl, 
  isPlaying, 
  currentTime = 0, 
  onSeek,
  className 
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate waveform data from audio
  useEffect(() => {
    if (!audioUrl) return;

    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setDuration(audioBuffer.duration);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        // Normalize
        const max = Math.max(...filteredData);
        const normalized = filteredData.map(d => d / max);
        
        setWaveformData(normalized);
        audioContext.close();
      } catch (error) {
        console.error('Failed to generate waveform:', error);
        // Generate placeholder waveform
        setWaveformData(Array(100).fill(0).map(() => Math.random() * 0.5 + 0.2));
      } finally {
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const gap = 2;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(4, value * (height - 8));
      const y = (height - barHeight) / 2;
      
      const isPlayed = index / waveformData.length <= progress;
      
      ctx.fillStyle = isPlayed 
        ? 'hsl(24, 100%, 50%)' // primary color
        : 'hsl(240, 4%, 46%)'; // muted color
      
      ctx.beginPath();
      ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, 2);
      ctx.fill();
    });
  }, [waveformData, currentTime, duration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const time = progress * duration;
    
    onSeek(time);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-16", className)}>
        <div className="flex items-center gap-1">
          {Array(20).fill(0).map((_, i) => (
            <div 
              key={i}
              className="w-1 bg-muted rounded-full animate-pulse"
              style={{ 
                height: `${Math.random() * 24 + 8}px`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "w-full h-16 cursor-pointer rounded-lg",
        className
      )}
      onClick={handleClick}
    />
  );
}
