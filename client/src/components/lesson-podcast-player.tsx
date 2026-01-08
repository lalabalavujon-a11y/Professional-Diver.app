import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Download, Volume2 } from "lucide-react";

interface LessonPodcastPlayerProps {
  podcastUrl: string | null;
  podcastDuration?: number;
  lessonTitle: string;
}

export default function LessonPodcastPlayer({ 
  podcastUrl, 
  podcastDuration,
  lessonTitle 
}: LessonPodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcastDuration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration || podcastDuration || 0);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', () => setIsLoading(true));
      audio.removeEventListener('canplay', () => setIsLoading(false));
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [podcastDuration]);

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

  const handleDownload = () => {
    if (podcastUrl) {
      const link = document.createElement('a');
      link.href = podcastUrl;
      link.download = `${lessonTitle.replace(/[^a-z0-9]/gi, '_')}-podcast.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!podcastUrl) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
            <Volume2 className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 text-slate-900">Lesson Deep Dive Podcast</h3>
            <p className="text-sm text-slate-600 mb-2 truncate">{lessonTitle}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="sm"
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 p-0 flex-shrink-0"
                variant="default"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <Progress value={progress} className="h-2" />
              </div>
              
              <span className="text-xs text-slate-500 min-w-[80px] text-right flex-shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-shrink-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        
        <audio
          ref={audioRef}
          src={podcastUrl}
          preload="metadata"
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}

