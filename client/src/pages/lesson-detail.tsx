import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import AITutor from "@/components/ai-tutor";
import PracticeScenario from "@/components/practice-scenario";
import EnhancedLessonContent from "@/components/enhanced-lesson-content";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bookmark, FileText, Video } from "lucide-react";
import { Link } from "wouter";
import type { Lesson } from "@shared/schema";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionType: string;
  subscriptionStatus?: string;
  trialExpiresAt?: string;
};

// Extended lesson type that includes trackSlug and totalLessons
type LessonWithTrackSlug = Lesson & { 
  trackSlug?: string; 
  totalLessons?: number; 
  trackTitle?: string;
  previousLessonId?: string | null;
  nextLessonId?: string | null;
};

// Track outlines for each professional diving subject - All 12 lessons
const TRACK_OUTLINES = {
  "ndt-inspection": [
    "Visual Inspection Fundamentals",
    "Corrosion Assessment & Documentation",
    "Magnetic Particle Inspection (MPI)",
    "Ultrasonic Thickness Gauging",
    "Cathodic Protection Surveying",
    "Eddy Current Testing",
    "Weld Inspection Techniques",
    "Documentation and Reporting Standards",
    "Marine Growth Assessment",
    "Structural Analysis and Assessment",
    "Quality Assurance and Control",
    "Advanced NDT Techniques"
  ],
  "diver-medic": [
    "ABCDE Emergency Assessment Protocol",
    "Diving Physiology & Physics",
    "Decompression Sickness Treatment",
    "Airway Management",
    "Breathing Support & Oxygen Therapy",
    "Circulation Assessment & CPR",
    "Neurological Assessment",
    "Hyperbaric Medicine",
    "Medical Equipment & Supplies",
    "Emergency Communication",
    "Documentation & Reporting",
    "Advanced DMT Procedures"
  ],
  "commercial-supervisor": [
    "Dive Planning Fundamentals",
    "Risk Assessment & Safety",
    "Team Management",
    "Emergency Response",
    "Quality Assurance",
    "Communication Systems",
    "Project Management",
    "Regulatory Compliance",
    "Equipment Management",
    "Documentation & Reporting",
    "Leadership & Decision Making",
    "Advanced Supervision"
  ],
  "saturation-diving": [
    "Saturation System Components",
    "Life Support Systems",
    "Decompression Management",
    "Human Factors",
    "Emergency Procedures",
    "System Maintenance",
    "Gas Management",
    "Environmental Control",
    "Deep Sea Operations",
    "Safety Protocols",
    "Team Coordination",
    "Advanced Saturation"
  ],
  "underwater-welding": [
    "Welding Fundamentals",
    "Electrode Selection",
    "Quality Control",
    "Safety Protocols",
    "Advanced Techniques",
    "Underwater Welding Methods",
    "Weld Inspection",
    "Equipment Operation",
    "Troubleshooting",
    "Material Science",
    "Welding Standards",
    "Master Welder Skills"
  ],
  "hyperbaric-operations": [
    "Chamber Operations",
    "Treatment Protocols",
    "Patient Monitoring",
    "Emergency Procedures",
    "Equipment Maintenance",
    "Gas Management",
    "Safety Systems",
    "Documentation",
    "Advanced Treatments",
    "Quality Assurance",
    "Regulatory Compliance",
    "Senior Operations"
  ],
  "alst": [
    "Life Support System Fundamentals",
    "Gas Management Systems",
    "Equipment Operation & Maintenance",
    "Emergency Response Procedures",
    "Environmental Control Systems",
    "CO₂ Scrubber Systems",
    "Monitoring and Data Logging",
    "Safety Protocols & Procedures",
    "Troubleshooting & Diagnostics",
    "Backup Systems & Redundancy",
    "Communication & Team Coordination",
    "Advanced ALST Operations"
  ],
  "lst": [
    "Advanced Life Support Systems",
    "System Troubleshooting & Diagnostics",
    "Emergency Management & Leadership",
    "System Design and Integration",
    "Advanced Gas Management",
    "Team Leadership & Management",
    "Quality Assurance & Control",
    "System Optimization",
    "Training & Development",
    "Innovation & Technology",
    "Regulatory Compliance",
    "Senior LST Operations"
  ],
  "air-diver-certification": [
    "Diving Physics Review",
    "Gas Laws & Pressure Effects",
    "Decompression Theory",
    "Safety Calculations",
    "Equipment Physics",
    "Ascent Procedures",
    "Emergency Procedures",
    "Tool Handling Safety",
    "Communication Underwater",
    "Problem Solving Drills",
    "Work Techniques",
    "Advanced Air Diving"
  ]
};

function getTrackOutline(trackSlug: string): string[] {
  return TRACK_OUTLINES[trackSlug as keyof typeof TRACK_OUTLINES] || TRACK_OUTLINES["ndt-inspection"];
}

// Subject-specific resources for each professional diving subject - matched to lesson topics
const SUBJECT_RESOURCES: { [key: string]: Array<{icon: JSX.Element, title: string}> } = {
  "ndt-inspection": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "NDT Inspection Checklists" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "NDT Technique Videos" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Corrosion Assessment Guides" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "MPI & UT Demonstrations" }
  ],
  "diver-medic": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Medical Emergency Protocols" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "ABCDE Assessment Videos" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "DCS Treatment Guidelines" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Hyperbaric Medicine Procedures" }
  ],
  "commercial-supervisor": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Dive Planning Templates" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Leadership Training Videos" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Safety Guidelines" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Emergency Response Procedures" }
  ],
  "saturation-diving": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Saturation System Manuals" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Life Support Operations" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Decompression Procedures" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Deep Sea Operations" }
  ],
  "underwater-welding": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Welding Procedures Manual" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Welding Technique Videos" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Quality Control Standards" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Master Welder Techniques" }
  ],
  "hyperbaric-operations": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Treatment Protocols" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Chamber Operations" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Patient Monitoring Guides" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Emergency Procedures" }
  ],
  "alst": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "ALST Operations Manual" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Life Support Procedures" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Gas Management Guides" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Emergency Response Videos" }
  ],
  "lst": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "LST System Documentation" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Advanced Systems Training" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Leadership Guides" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Troubleshooting Videos" }
  ],
  "air-diver-certification": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Diving Physics Reference" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Gas Law Demonstrations" },
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Communication Signal Guide" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Underwater Communication" }
  ]
};

function getSubjectResources(trackSlug: string): Array<{icon: JSX.Element, title: string}> {
  return SUBJECT_RESOURCES[trackSlug as keyof typeof SUBJECT_RESOURCES] || SUBJECT_RESOURCES["ndt-inspection"];
}

export default function LessonDetail() {
  const [, params] = useRoute("/lessons/:id");
  const { data: lesson, isLoading, error } = useQuery<LessonWithTrackSlug>({
    queryKey: ["/api/lessons", params?.id],
    enabled: !!params?.id,
    queryFn: async () => {
      if (!params?.id) throw new Error('Lesson ID is required');
      const response = await fetch(`/api/lessons/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Lesson not found');
        }
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }
      const data = await response.json();
      
      // If lesson doesn't have trackSlug, try to get it from the track
      if (data && !data.trackSlug && data.trackId) {
        try {
          // Get track info to populate trackSlug
          const trackResponse = await fetch(`/api/tracks`);
          if (trackResponse.ok) {
            const tracks = await trackResponse.json();
            const track = tracks.find((t: any) => t.id === data.trackId);
            if (track) {
              data.trackSlug = track.slug;
              data.trackTitle = track.title;
            }
          }
        } catch (e) {
          console.error('Error fetching track info:', e);
        }
      }
      
      return data;
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch all lessons in the track for track outline navigation
  const { data: trackData } = useQuery<{ lessons: Array<{ id: string; title: string; order: number }> }>({
    queryKey: ["/api/tracks", lesson?.trackSlug],
    enabled: !!lesson?.trackSlug,
    queryFn: async () => {
      const response = await fetch(`/api/tracks/${lesson?.trackSlug}`);
      if (!response.ok) throw new Error('Failed to fetch track');
      return response.json();
    }
  });

  // Get current user to check admin access
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Get access permissions for Partner Admins
  const { data: accessPermissions } = useQuery({
    queryKey: ["/api/users/access-permissions"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/access-permissions?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch access permissions');
      return response.json();
    },
    enabled: currentUser?.role === 'PARTNER_ADMIN' || currentUser?.role === 'SUPERVISOR'
  });

  // Check if user has admin access (Super Admin, Admin, or Partner Admin with contentEditor permission)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;
  const isPartnerAdmin = currentUser?.role === 'PARTNER_ADMIN';
  const hasContentEditorAccess = 
    isAdmin || 
    isSuperAdmin ||
    (isPartnerAdmin && accessPermissions?.contentEditor === true);

  // Only show Edit Content for admins
  const canEditContent = hasContentEditorAccess;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4" data-testid="text-lesson-not-found">
              {error ? `Error: ${error instanceof Error ? error.message : 'Failed to load lesson'}` : 'Lesson not found'}
            </p>
            {params?.id && (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-4">Lesson ID: {params.id}</p>
                <Link href="/tracks">
                  <Button variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Tracks
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/tracks">
                  <button className="text-slate-500 hover:text-slate-700" data-testid="button-back">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </Link>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900" data-testid="text-lesson-title">
                    {lesson.title}
                  </h2>
                  <p className="text-sm text-slate-500" data-testid="text-lesson-meta">
                    Lesson {lesson.order || 1} of {lesson.totalLessons || 12}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {canEditContent && (
                  <Link href={`/admin/lessons/${lesson.id}`}>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium" data-testid="button-edit">
                      Edit Content
                    </button>
                  </Link>
                )}
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-gray-100" data-testid="button-bookmark">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-1 p-6">
              <EnhancedLessonContent 
                content={lesson.content || "No content available."}
                trackSlug={(lesson as any).trackSlug || 'ndt-inspection'}
                lessonTitle={lesson.title}
                videos={(lesson as any).videos}
                documents={(lesson as any).documents}
                embeds={(lesson as any).embeds}
                links={(lesson as any).links}
                images={(lesson as any).images}
                audio={(lesson as any).audio}
              />

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  {lesson.previousLessonId ? (
                    <Link href={`/lessons/${lesson.previousLessonId}`}>
                      <Button variant="outline" data-testid="button-previous-lesson">
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Previous Lesson
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" disabled data-testid="button-previous-lesson">
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Previous Lesson
                    </Button>
                  )}
                  <Link href={`/lessons/${lesson.id}/quiz`}>
                    <Button 
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium"
                      data-testid="button-take-quiz"
                    >
                      Take Quiz
                    </Button>
                  </Link>
                  {lesson.nextLessonId ? (
                    <Link href={`/lessons/${lesson.nextLessonId}`}>
                      <Button variant="outline" data-testid="button-next-lesson">
                        Next Lesson
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" disabled data-testid="button-next-lesson">
                      Next Lesson
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Lesson Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-ocean-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600">Content Reading</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 border-2 border-primary-500 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-slate-900 font-medium">Quiz Attempt</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full mr-3"></div>
                    <span className="text-sm text-slate-400">Completion</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Track Outline</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {trackData?.lessons ? (
                    trackData.lessons.map((trackLesson) => {
                      const isCurrentLesson = trackLesson.id === lesson.id;
                      return (
                        <Link key={trackLesson.id} href={`/lessons/${trackLesson.id}`}>
                          <div className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                            isCurrentLesson
                              ? 'bg-primary-50 border border-primary-200' 
                              : 'hover:bg-gray-100'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-3 ${
                              isCurrentLesson ? 'bg-primary-500' : 'bg-gray-300'
                            }`}></div>
                            <span className={`text-sm ${
                              isCurrentLesson ? 'font-medium text-primary-700' : 'text-slate-600'
                            }`}>
                              {trackLesson.order}. {trackLesson.title}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    // Fallback to static outline if track data not available
                    getTrackOutline((lesson as any)?.trackSlug || 'ndt-inspection').map((item, index) => {
                      const isCurrentLesson = index === (lesson.order ? lesson.order - 1 : 0);
                      return (
                        <div key={index} className={`flex items-center p-2 rounded-lg ${
                          isCurrentLesson
                            ? 'bg-primary-50 border border-primary-200' 
                            : 'hover:bg-gray-100 cursor-pointer'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            isCurrentLesson ? 'bg-primary-500' : 'bg-gray-300'
                          }`}></div>
                          <span className={`text-sm ${
                            isCurrentLesson ? 'font-medium text-primary-700' : 'text-slate-600'
                          }`}>{item}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Resources</h3>
                <div className="space-y-2">
                  {getSubjectResources((lesson as any)?.trackSlug || 'ndt-inspection').map((resource, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Placeholder for resource download/view functionality
                        console.log(`Opening resource: ${resource.title}`);
                        // TODO: Implement actual resource download/view functionality
                      }}
                      className="flex items-center w-full text-left p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" 
                      data-testid={`link-resource-${index}`}
                    >
                      {resource.icon}
                      <span className="text-sm">{resource.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Tutor Integration */}
        <AITutor trackSlug={(lesson as any).trackSlug || 'ndt-inspection'} lessonTitle={lesson.title} />
        
        {/* Practice Scenarios */}
        <PracticeScenario trackSlug={(lesson as any).trackSlug || 'ndt-inspection'} />
      </main>
    </div>
  );
}
