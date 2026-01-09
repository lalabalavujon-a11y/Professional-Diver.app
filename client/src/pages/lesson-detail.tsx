import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import AITutor from "@/components/ai-tutor";
import PracticeScenario from "@/components/practice-scenario";
import EnhancedLessonContent from "@/components/enhanced-lesson-content";
import LessonPodcastPlayer from "@/components/lesson-podcast-player";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Bookmark, FileText, Video, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { Lesson } from "@shared/schema";

// Extended lesson type that includes trackSlug
type LessonWithTrackSlug = Lesson & { trackSlug?: string };

// Track outlines for each professional diving subject
const TRACK_OUTLINES = {
  "ndt-inspection": [
    "Visual Inspection Fundamentals",
    "Magnetic Particle Testing",
    "Ultrasonic Thickness Gauging",
    "Corrosion Assessment",
    "Documentation Standards",
    "Final Assessment"
  ],
  "diver-medic": [
    "Respiratory System",
    "Circulatory System", 
    "Gas Laws & Pressure Effects",
    "Emergency Assessment (ABCDE)",
    "Diving Injuries & Treatment",
    "Final Assessment"
  ],
  "commercial-supervisor": [
    "Dive Planning Fundamentals",
    "Risk Assessment & Safety",
    "Team Management",
    "Emergency Response",
    "Quality Assurance",
    "Final Assessment"
  ],
  "saturation-diving": [
    "Life Support Systems",
    "Decompression Management",
    "Human Factors",
    "Emergency Procedures",
    "System Maintenance",
    "Final Assessment"
  ],
  "underwater-welding": [
    "Welding Fundamentals",
    "Electrode Selection",
    "Quality Control",
    "Safety Protocols",
    "Advanced Techniques",
    "Final Assessment"
  ],
  "hyperbaric-operations": [
    "Chamber Operations",
    "Treatment Protocols",
    "Patient Monitoring",
    "Emergency Procedures",
    "Equipment Maintenance",
    "Final Assessment"
  ],
  "alst": [
    "Life Support System Fundamentals",
    "Equipment Operation & Maintenance",
    "Emergency Response Procedures",
    "Safety Protocols & Procedures",
    "Leadership & Communication",
    "Final Assessment"
  ],
  "lst": [
    "Life Support Fundamentals",
    "Gas Management",
    "Emergency Response",
    "Equipment Operations",
    "Safety Systems",
    "Final Assessment"
  ],
  "air-diver-certification": [
    "Diving Physics Fundamentals",
    "Gas Laws & Pressure Effects",
    "Decompression Theory",
    "Safety Calculations",
    "Equipment Physics",
    "Final Assessment"
  ]
};

function getTrackOutline(trackSlug: string): string[] {
  return TRACK_OUTLINES[trackSlug as keyof typeof TRACK_OUTLINES] || TRACK_OUTLINES["ndt-inspection"];
}

// Subject-specific resources for each professional diving subject
const SUBJECT_RESOURCES = {
  "ndt-inspection": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Inspection Checklists" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "NDT Technique Videos" }
  ],
  "diver-medic": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Medical Protocols" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Emergency Procedures" }
  ],
  "commercial-supervisor": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Safety Guidelines" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Leadership Training" }
  ],
  "saturation-diving": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "System Manuals" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Life Support Videos" }
  ],
  "underwater-welding": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Welding Procedures" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Technique Demonstrations" }
  ],
  "hyperbaric-operations": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Treatment Protocols" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Chamber Operations" }
  ],
  "alst": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Assistant Life Support Technician Manuals" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Life Support Procedures" }
  ],
  "lst": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "System Documentation" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Equipment Training" }
  ],
  "air-diver-certification": [
    { icon: <FileText className="w-4 h-4 mr-2" />, title: "Physics Reference Guides" },
    { icon: <Video className="w-4 h-4 mr-2" />, title: "Gas Law Demonstrations" }
  ]
};

function getSubjectResources(trackSlug: string): Array<{icon: JSX.Element, title: string}> {
  return SUBJECT_RESOURCES[trackSlug as keyof typeof SUBJECT_RESOURCES] || SUBJECT_RESOURCES["ndt-inspection"];
}

export default function LessonDetail() {
  const [, params] = useRoute("/lessons/:id");
  const { data: lesson, isLoading } = useQuery<LessonWithTrackSlug>({
    queryKey: ["/api/lessons", params?.id],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
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
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-lesson-not-found">Lesson not found</p>
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
                    Lesson {lesson.order || 1} of 5
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link href={`/admin/lessons/${lesson.id}`}>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium" data-testid="button-edit">
                    Edit Content
                  </button>
                </Link>
                <button className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-gray-100" data-testid="button-bookmark">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-1 p-6">
              <LessonPodcastPlayer
                podcastUrl={(lesson as any).podcastUrl || null}
                podcastDuration={(lesson as any).podcastDuration || undefined}
                lessonTitle={lesson.title}
              />
              
              <EnhancedLessonContent 
                content={lesson.content || "No content available."}
                trackSlug={(lesson as any).trackSlug || 'ndt-inspection'}
                lessonTitle={lesson.title}
              />

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button variant="outline" data-testid="button-previous-lesson">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous Lesson
                  </Button>
                  <Link href={`/lessons/${lesson.id}/quiz`}>
                    <Button 
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium"
                      data-testid="button-take-quiz"
                    >
                      Take Quiz
                    </Button>
                  </Link>
                  <Button variant="outline" data-testid="button-next-lesson">
                    Next Lesson
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
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
                <div className="space-y-2">
                  {getTrackOutline((lesson as any)?.trackSlug || 'ndt-inspection').map((item, index) => (
                    <div key={index} className={`flex items-center p-2 rounded-lg cursor-pointer ${
                      index === 0 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'hover:bg-gray-100'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        index === 0 ? 'bg-primary-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={`text-sm ${
                        index === 0 ? 'font-medium text-primary-700' : 'text-slate-600'
                      }`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Resources</h3>
                <div className="space-y-2">
                  {getSubjectResources((lesson as any)?.trackSlug || 'ndt-inspection').map((resource, index) => (
                    <a key={index} href="#" className="flex items-center p-2 text-primary-600 hover:bg-primary-50 rounded-lg" data-testid={`link-resource-${index}`}>
                      {resource.icon}
                      <span className="text-sm">{resource.title}</span>
                    </a>
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
    </>
  );
}
