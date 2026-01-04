import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({ src, className, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);

    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
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
    } catch (err) {
      console.error("Audio playback error", err);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
    setCurrentTime(audio.currentTime);
  };

  const format = (t: number) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-muted/30", className)}>
      <button
        onClick={togglePlay}
        className={cn(
          "shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 active:scale-95",
          compact ? "h-7 w-7" : "h-8 w-8"
        )}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      <span className={cn("text-muted-foreground tabular-nums shrink-0", compact ? "text-[10px]" : "text-xs")}>
        {format(currentTime)}
      </span>

      <div
        ref={progressRef}
        onClick={seek}
        className="flex-1 relative h-1.5 bg-border rounded-full overflow-hidden cursor-pointer"
      >
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className={cn("text-muted-foreground tabular-nums shrink-0", compact ? "text-[10px]" : "text-xs")}>
        {format(duration)}
      </span>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
