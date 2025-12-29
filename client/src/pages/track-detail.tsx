import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import type { Track, Lesson } from "@shared/schema";

type TrackWithLessons = Track & { lessons: Lesson[] };

export default function TrackDetail() {
  const [, params] = useRoute("/tracks/:slug");
  const { data: track, isLoading } = useQuery<TrackWithLessons>({
    queryKey: ["/api/tracks", params?.slug],
    enabled: !!params?.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-track-not-found">Track not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/tracks">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Tracks
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-track-title">
            {track.title}
          </h1>
          {track.summary && (
            <p className="mt-2 text-slate-600" data-testid="text-track-summary">
              {track.summary}
            </p>
          )}
        </div>

        {track.lessons && track.lessons.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Lessons</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {track.lessons.map((lesson: any, index: number) => (
                <li key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        "bg-primary-500 text-white"
                      }`}>
                        {lesson.order || index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900" data-testid={`text-lesson-title-${lesson.id}`}>
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Lesson {lesson.order || index + 1} of {track.lessons.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/lessons/${lesson.id}`}>
                        <Button 
                          size="sm"
                          className="bg-primary-500 hover:bg-primary-600 text-white"
                          data-testid={`button-start-lesson-${lesson.id}`}
                        >
                          {index === 0 ? "Start Lesson" : "View Lesson"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-slate-500 text-center" data-testid="text-no-lessons">
              No lessons available for this track yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
