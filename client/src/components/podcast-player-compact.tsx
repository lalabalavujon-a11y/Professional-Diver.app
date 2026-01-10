import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, Download, Play, Pause } from "lucide-react";

interface PodcastPlayerCompactProps {
  podcastUrl: string;
  podcastDuration?: number;
  lessonTitle: string;
}

export default function PodcastPlayerCompact({ 
  podcastUrl, 
  podcastDuration,
  lessonTitle 
}: PodcastPlayerCompactProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcastDuration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !podcastUrl) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration || podcastDuration || 0);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      setIsLoading(false);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', () => setIsLoading(true));
      audio.removeEventListener('canplay', () => setIsLoading(false));
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('error', () => {});
    };
  }, [podcastDuration, podcastUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePodcastDownload = () => {
    if (podcastUrl) {
      const link = document.createElement('a');
      link.href = podcastUrl;
      link.download = `${lessonTitle.replace(/[^a-z0-9]/gi, '_')}-podcast.m4a`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!podcastUrl) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      {/* Labels */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Podcast</h3>
          <p className="text-xs text-blue-700">Topic: {lessonTitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          size="sm"
          onClick={togglePlay}
          disabled={isLoading}
          className="w-10 h-10 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </Button>
        
        {/* Icon */}
        <div className="flex-shrink-0">
          <Volume2 className="w-5 h-5 text-blue-600" />
        </div>
        
        {/* Progress Bar and Time */}
        <div className="flex-1 min-w-0">
          <Progress value={progress} className="h-2 mb-1" />
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Download Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePodcastDownload}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 flex-shrink-0"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
      
      <audio
        ref={audioRef}
        src={podcastUrl}
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('Audio error:', e);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

