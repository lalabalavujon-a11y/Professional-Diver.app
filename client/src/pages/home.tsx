import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import HeroSection from "@/components/hero-section";
import TrackCard from "@/components/track-card";
import { LayoutDashboard, List } from "lucide-react";
import type { Track } from "@shared/schema";

export default function Home() {
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <HeroSection />
        
        <section id="tracks" className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2" data-testid="text-learning-tracks">
                Learning Tracks
              </h2>
              <p className="text-sm sm:text-base text-slate-600">Comprehensive courses designed for professional divers</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-slate-500">View:</span>
              <button 
                className="p-2 rounded-md bg-slate-100 text-slate-700"
                data-testid="button-list-view"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                data-testid="button-grid-view"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tracks && tracks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {tracks.map((track, index: number) => (
                <TrackCard 
                  key={track.id} 
                  track={track}
                  progress={{ completed: index === 0 ? 3 : 0, total: index === 0 ? 5 : 7 }}
                  isLocked={index > 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500" data-testid="text-no-tracks">
                No learning tracks available yet.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">Diver Well Training</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500">
              <a href="#" className="hover:text-slate-700">Privacy Policy</a>
              <a href="#" className="hover:text-slate-700">Terms of Service</a>
              <a href="#" className="hover:text-slate-700">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
