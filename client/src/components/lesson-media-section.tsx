import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Volume2, 
  Download, 
  Play, 
  Pause,
  File
} from "lucide-react";

interface LessonMediaSectionProps {
  pdfUrl: string | null;
  podcastUrl: string | null;
  podcastDuration?: number;
  lessonTitle: string;
}

export default function LessonMediaSection({ 
  pdfUrl, 
  podcastUrl, 
  podcastDuration,
  lessonTitle 
}: LessonMediaSectionProps) {
  // Debug: Log received props
  console.log('LessonMediaSection props:', { pdfUrl, podcastUrl, hasPdf: !!pdfUrl, hasPodcast: !!podcastUrl });
  
  // URLs are relative and will be proxied by Vite to the Express server
  // No need to convert to absolute URLs since Vite proxy handles /uploads
  const absolutePdfUrl = pdfUrl;
  const absolutePodcastUrl = podcastUrl;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(podcastDuration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !absolutePodcastUrl) return;

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
  }, [podcastDuration, absolutePodcastUrl]);

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
    if (absolutePodcastUrl) {
      const link = document.createElement('a');
      link.href = absolutePodcastUrl;
      link.download = `${lessonTitle.replace(/[^a-z0-9]/gi, '_')}-podcast.m4a`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePdfDownload = () => {
    if (absolutePdfUrl) {
      const link = document.createElement('a');
      link.href = absolutePdfUrl;
      link.download = `${lessonTitle.replace(/\s+/g, '-')}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // If neither file exists, don't render anything
  if (!absolutePdfUrl && !absolutePodcastUrl) {
    return null;
  }

  // Determine grid columns based on which files exist
  const gridCols = absolutePdfUrl && absolutePodcastUrl ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <div className={`mb-6 grid gap-4 ${gridCols}`}>
      {/* PDF Card */}
      {absolutePdfUrl && (
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <span>Lesson PDF</span>
            </CardTitle>
            {absolutePdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePdfDownload}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {absolutePdfUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-red-700 font-medium">{lessonTitle}</p>
              <div className="border border-red-200 rounded-lg overflow-hidden bg-white shadow-inner">
                <iframe
                  src={absolutePdfUrl}
                  className="w-full h-[400px] md:h-[600px]"
                  title="Lesson PDF Content"
                  style={{ minHeight: '400px' }}
                  onError={(e) => {
                    console.error('PDF iframe error:', e);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-red-300 mx-auto mb-3" />
              <p className="text-sm text-red-600">No PDF content available</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Podcast Card */}
      {absolutePodcastUrl && (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Volume2 className="w-5 h-5 text-blue-600" />
              </div>
              <span>Lesson Podcast</span>
            </CardTitle>
            {absolutePodcastUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePodcastDownload}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {absolutePodcastUrl ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">{lessonTitle}</p>
                <p className="text-xs text-blue-600">Deep dive audio content</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="w-12 h-12 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <Progress value={progress} className="h-2 mb-1" />
                    <div className="flex items-center justify-between text-xs text-blue-600">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <audio
                ref={audioRef}
                src={absolutePodcastUrl}
                preload="metadata"
                className="hidden"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Audio error:', e);
                  setIsLoading(false);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Volume2 className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-sm text-blue-600">No podcast available</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

