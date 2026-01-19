import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Track, Lesson } from "@shared/schema";

type TrackWithLessons = Track & { lessons: Lesson[] };

export default function TrackDetail() {
  const [, params] = useRoute("/tracks/:slug");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const { data: track, isLoading } = useQuery<TrackWithLessons>({
    queryKey: ["/api/tracks", params?.slug],
    queryFn: async () => {
      if (!params?.slug) return null;
      const response = await fetch(`/api/tracks/${params.slug}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch track');
      }
      return response.json();
    },
    enabled: !!params?.slug,
  });

  const regeneratePdfsMutation = useMutation({
    mutationFn: async () => {
      if (!params?.slug) throw new Error('Track slug is required');
      return apiRequest("POST", `/api/content/regenerate-track-pdfs/${params.slug}`);
    },
    onSuccess: (data) => {
      toast({
        title: "PDF Regeneration Started",
        description: `Regenerating PDFs for ${data.lessonCount} lessons. Progress will be shown in real-time.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks", params?.slug] });
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error?.error || error?.message || "Failed to start PDF regeneration",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRegenerating(false);
    },
  });

  const handleRegenerateAllPdfs = async () => {
    if (!track) return;
    
    const lessonCount = track.lessons?.length || 0;
    if (lessonCount === 0) {
      toast({
        title: "No Lessons",
        description: "This track has no lessons to regenerate PDFs for.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `This will regenerate PDFs for all ${lessonCount} lessons in this track. This may take several minutes. Continue?`
    );
    
    if (!confirmed) return;

    setIsRegenerating(true);
    regeneratePdfsMutation.mutate();
  };

  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </>
    );
  }

  if (!track) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-track-not-found">Track not found</p>
          </div>
        </main>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          
          {/* Admin: Regenerate All PDFs Button */}
          {track.lessons && track.lessons.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={handleRegenerateAllPdfs}
                disabled={isRegenerating}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating PDFs...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate All PDFs ({track.lessons.length} lessons)
                  </>
                )}
              </Button>
            </div>
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
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary-500 text-white">
                        {lesson.order || index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900" data-testid={`text-lesson-title-${lesson.id}`}>
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Available
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
                          Start Lesson
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
    </>
  );
}
