import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    isPublished: boolean;
  };
  progress?: {
    completed: number;
    total: number;
  };
  isLocked?: boolean;
}

export default function TrackCard({ track, progress, isLocked }: TrackCardProps) {
  const progressPercentage = progress ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" data-testid={`card-track-${track.id}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 leading-tight" data-testid={`text-track-title-${track.id}`}>
              {track.title}
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed" data-testid={`text-track-summary-${track.id}`}>
              {track.summary}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              isLocked 
                ? "bg-gray-100 text-gray-700" 
                : "bg-ocean-100 text-ocean-700"
            }`}>
              {isLocked ? "Locked" : "Active"}
            </span>
          </div>
        </div>
        
        {progress && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-slate-600">Progress</span>
              <span className="text-xs sm:text-sm font-medium text-slate-900" data-testid={`text-progress-${track.id}`}>
                {progress.completed}/{progress.total} lessons
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${isLocked ? "bg-gray-300" : "bg-primary-500"}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
            <span className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>{progress?.total || 0} lessons</span>
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              <span>3 quizzes</span>
            </span>
          </div>
          {isLocked ? (
            <Button 
              variant="outline" 
              disabled
              className="text-slate-400 cursor-not-allowed text-xs sm:text-sm w-full sm:w-auto min-h-[44px]"
              data-testid={`button-locked-${track.id}`}
            >
              Complete Prerequisites
            </Button>
          ) : (
            <Link href={`/tracks/${track.slug}`} className="w-full sm:w-auto">
              <Button 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base w-full sm:w-auto min-h-[44px]"
                data-testid={`button-continue-${track.id}`}
              >
                Continue
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
