import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfEbookViewer from "@/components/pdf-ebook-viewer";
import { 
  FileText, 
  Video, 
  Image, 
  Download, 
  Play, 
  BookOpen, 
  File,
  Presentation,
  Calculator,
  MapPin,
  Clock,
  Users,
  Award,
  Book
} from "lucide-react";

interface EnhancedLessonContentProps {
  content: string;
  trackSlug: string;
  lessonTitle: string;
  pdfUrl?: string | null;
  lessonId?: string;
}

/**
 * Transform AI Tutor references in markdown to show first name and subject matter expertise only
 * Pattern: **AI Tutor: Dr. Michael Rodriguez - Diving Physics Specialist with 12+ years...**
 * Becomes: **AI Tutor: Michael - Diving Physics Specialist**
 * Removes: credentials (Dr., Prof., etc.), surnames, years of experience
 */
function transformAITutorNames(content: string): string {
  // Match patterns like:
  // **AI Tutor: Dr. Michael Rodriguez - Diving Physics Specialist with 12+ years...**
  // **AI Tutor: Michael Rodriguez - Diving Physics Specialist**
  // **AI Tutor: Dr. Michael - Diving Physics Specialist**
  // Extract first name and subject matter expertise (remove credentials, years, etc.)
  
  // Comprehensive pattern that matches AI Tutor references
  // Captures: optional title, first name, optional last name, dash, expertise text
  const pattern = /\*\*AI Tutor:\s*(?:Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)?\s*([A-Za-z]+)(?:\s+[A-Za-z]+)?\s*-\s*([^*]+?)\*\*/g;
  
  return content.replace(pattern, (match, firstName, expertise) => {
    // Clean up expertise: remove "with X years", credentials, etc.
    let cleanExpertise = expertise.trim();
    
    // Remove patterns like "with 12+ years", "with 20 years of experience", etc.
    cleanExpertise = cleanExpertise.replace(/\s+with\s+\d+[+\-]?\s*(?:years?|yrs?)\s*(?:of\s+experience|in\s+the\s+field)?.*$/gi, '');
    
    // Remove patterns like "12+ years", "20 years experience", etc. at the end
    cleanExpertise = cleanExpertise.replace(/\s+\d+[+\-]?\s*(?:years?|yrs?)\s*(?:of\s+experience|in\s+the\s+field)?.*$/gi, '');
    
    // Remove any trailing commas, periods, dashes, or whitespace
    cleanExpertise = cleanExpertise.replace(/[,.\-\s]+$/, '').trim();
    
    return `**AI Tutor: ${firstName} - ${cleanExpertise}**`;
  });
}

// Rich media content for each track
const RICH_MEDIA_CONTENT = {
  "ndt-inspection": {
    videos: [
      {
        id: "visual-inspection-demo",
        title: "Visual Inspection Techniques",
        duration: "12:45",
        description: "Step-by-step demonstration of underwater visual inspection procedures",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "ultrasonic-testing",
        title: "Ultrasonic Thickness Gauging",
        duration: "8:30",
        description: "How to use ultrasonic equipment for accurate thickness measurements",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "inspection-checklist",
        title: "Underwater Inspection Checklist",
        type: "PDF",
        size: "2.3 MB",
        description: "Comprehensive checklist for underwater inspection operations"
      },
      {
        id: "ndt-standards",
        title: "NDT Standards & Procedures",
        type: "PDF", 
        size: "5.1 MB",
        description: "Industry standards for non-destructive testing"
      }
    ],
    interactive: [
      {
        id: "corrosion-calculator",
        title: "Corrosion Rate Calculator",
        type: "Tool",
        description: "Calculate corrosion rates and predict material degradation"
      },
      {
        id: "inspection-simulator",
        title: "Virtual Inspection Simulator",
        type: "Simulation",
        description: "Practice inspection techniques in a virtual environment"
      }
    ]
  },
  "diver-medic": {
    videos: [
      {
        id: "abcde-assessment",
        title: "ABCDE Emergency Assessment",
        duration: "15:20",
        description: "Complete guide to emergency patient assessment underwater",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "decompression-sickness",
        title: "Decompression Sickness Treatment",
        duration: "10:15",
        description: "Recognizing and treating DCS in diving emergencies",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "medical-protocols",
        title: "Diving Medical Protocols",
        type: "PDF",
        size: "3.8 MB",
        description: "Comprehensive medical procedures for diving emergencies"
      },
      {
        id: "emergency-drugs",
        title: "Emergency Drug Reference",
        type: "PDF",
        size: "1.2 MB",
        description: "Quick reference for emergency medications"
      }
    ],
    interactive: [
      {
        id: "medical-calculator",
        title: "Medical Calculations Tool",
        type: "Tool",
        description: "Calculate drug dosages and medical parameters"
      },
      {
        id: "emergency-scenarios",
        title: "Emergency Scenario Trainer",
        type: "Simulation",
        description: "Practice emergency response procedures"
      }
    ]
  },
  "underwater-welding": {
    videos: [
      {
        id: "welding-techniques",
        title: "Underwater Welding Techniques",
        duration: "18:30",
        description: "Professional underwater welding methods and procedures",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "electrode-selection",
        title: "Electrode Selection Guide",
        duration: "12:45",
        description: "Choosing the right electrodes for underwater welding",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "welding-procedures",
        title: "Underwater Welding Procedures",
        type: "PDF",
        size: "4.1 MB",
        description: "Comprehensive welding procedures and standards"
      },
      {
        id: "safety-protocols",
        title: "Welding Safety Protocols",
        type: "PDF",
        size: "2.7 MB",
        description: "Safety procedures for underwater welding operations"
      }
    ],
    interactive: [
      {
        id: "welding-simulator",
        title: "Welding Technique Simulator",
        type: "Simulation",
        description: "Practice welding techniques in virtual environment"
      },
      {
        id: "electrode-calculator",
        title: "Electrode Selection Tool",
        type: "Tool",
        description: "Calculate optimal electrode settings"
      }
    ]
  },
  "hyperbaric-operations": {
    videos: [
      {
        id: "chamber-operations",
        title: "Hyperbaric Chamber Operations",
        duration: "20:15",
        description: "Complete guide to hyperbaric chamber operation procedures",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "treatment-protocols",
        title: "Treatment Protocols",
        duration: "14:30",
        description: "Medical treatment protocols for hyperbaric therapy",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "chamber-manual",
        title: "Chamber Operations Manual",
        type: "PDF",
        size: "5.3 MB",
        description: "Complete hyperbaric chamber operations manual"
      },
      {
        id: "treatment-guidelines",
        title: "Treatment Guidelines",
        type: "PDF",
        size: "3.8 MB",
        description: "Medical treatment guidelines for hyperbaric therapy"
      }
    ],
    interactive: [
      {
        id: "chamber-simulator",
        title: "Chamber Operations Simulator",
        type: "Simulation",
        description: "Practice chamber operations in virtual environment"
      },
      {
        id: "pressure-calculator",
        title: "Pressure Calculator",
        type: "Tool",
        description: "Calculate treatment pressures and durations"
      }
    ]
  },
  "saturation-diving": {
    videos: [
      {
        id: "life-support-systems",
        title: "Life Support Systems",
        duration: "16:45",
        description: "Comprehensive guide to saturation diving life support",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "decompression-management",
        title: "Decompression Management",
        duration: "13:20",
        description: "Advanced decompression procedures for saturation diving",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "saturation-manual",
        title: "Saturation Diving Manual",
        type: "PDF",
        size: "6.2 MB",
        description: "Complete saturation diving operations manual"
      },
      {
        id: "decompression-tables",
        title: "Decompression Tables",
        type: "PDF",
        size: "2.1 MB",
        description: "Saturation diving decompression tables"
      }
    ],
    interactive: [
      {
        id: "saturation-simulator",
        title: "Saturation Diving Simulator",
        type: "Simulation",
        description: "Practice saturation diving operations"
      },
      {
        id: "decompression-calculator",
        title: "Decompression Calculator",
        type: "Tool",
        description: "Calculate decompression schedules"
      }
    ]
  },
  "commercial-supervisor": {
    videos: [
      {
        id: "dive-planning",
        title: "Dive Planning Fundamentals",
        duration: "19:30",
        description: "Comprehensive dive planning and risk assessment",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "team-management",
        title: "Team Management",
        duration: "15:45",
        description: "Leadership and team coordination in commercial diving",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "supervisor-manual",
        title: "Commercial Supervisor Manual",
        type: "PDF",
        size: "4.8 MB",
        description: "Complete commercial diving supervisor manual"
      },
      {
        id: "safety-guidelines",
        title: "Safety Guidelines",
        type: "PDF",
        size: "3.2 MB",
        description: "Safety protocols for commercial diving operations"
      }
    ],
    interactive: [
      {
        id: "planning-simulator",
        title: "Dive Planning Simulator",
        type: "Simulation",
        description: "Practice dive planning and risk assessment"
      },
      {
        id: "risk-calculator",
        title: "Risk Assessment Tool",
        type: "Tool",
        description: "Calculate and assess diving risks"
      }
    ]
  },
  "alst": {
    videos: [
      {
        id: "advanced-life-support",
        title: "Advanced Life Support",
        duration: "22:15",
        description: "Advanced life support techniques for saturation diving",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "emergency-procedures",
        title: "Emergency Procedures",
        duration: "17:30",
        description: "Emergency response procedures for life support systems",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "alst-manual",
        title: "Assistant Life Support Technician Operations Manual",
        type: "PDF",
        size: "5.7 MB",
        description: "Complete Assistant Life Support Technician manual"
      },
      {
        id: "emergency-protocols",
        title: "Emergency Protocols",
        type: "PDF",
        size: "3.5 MB",
        description: "Emergency response protocols for life support"
      }
    ],
    interactive: [
      {
        id: "alst-simulator",
        title: "Assistant Life Support Technician Operations Simulator",
        type: "Simulation",
        description: "Practice life support operations"
      },
      {
        id: "gas-calculator",
        title: "Gas Management Calculator",
        type: "Tool",
        description: "Calculate gas requirements and flow rates"
      }
    ]
  },
  "lst": {
    videos: [
      {
        id: "life-support-fundamentals",
        title: "Life Support Fundamentals",
        duration: "21:45",
        description: "Fundamental life support system operations",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "system-troubleshooting",
        title: "System Troubleshooting",
        duration: "18:20",
        description: "Advanced troubleshooting for life support systems",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "lst-manual",
        title: "LST Operations Manual",
        type: "PDF",
        size: "6.1 MB",
        description: "Complete Life Support Technician manual"
      },
      {
        id: "troubleshooting-guide",
        title: "Troubleshooting Guide",
        type: "PDF",
        size: "4.2 MB",
        description: "Comprehensive troubleshooting procedures"
      }
    ],
    interactive: [
      {
        id: "lst-simulator",
        title: "LST Operations Simulator",
        type: "Simulation",
        description: "Practice life support technician operations"
      },
      {
        id: "system-calculator",
        title: "System Performance Calculator",
        type: "Tool",
        description: "Calculate system performance metrics"
      }
    ]
  },
  "air-diver-certification": {
    videos: [
      {
        id: "gas-laws-demo",
        title: "Gas Laws in Diving",
        duration: "15:30",
        description: "Understanding Boyle's, Charles's, and Dalton's laws in diving applications",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "pressure-effects",
        title: "Pressure Effects on the Body",
        duration: "12:20",
        description: "How pressure changes affect diver physiology and safety",
        thumbnail: "/api/placeholder/320/180"
      },
      {
        id: "decompression-theory",
        title: "Decompression Theory Explained",
        duration: "18:45",
        description: "Nitrogen absorption, elimination, and decompression calculations",
        thumbnail: "/api/placeholder/320/180"
      }
    ],
    documents: [
      {
        id: "gas-laws-reference",
        title: "Gas Laws Reference Guide",
        type: "PDF",
        size: "3.2 MB",
        description: "Comprehensive guide to gas laws and their diving applications"
      },
      {
        id: "pressure-calculations",
        title: "Pressure Calculation Worksheets",
        type: "PDF",
        size: "1.8 MB",
        description: "Practice problems and calculation templates"
      },
      {
        id: "decompression-tables",
        title: "Decompression Tables",
        type: "PDF",
        size: "2.5 MB",
        description: "Standard decompression tables and procedures"
      }
    ],
    interactive: [
      {
        id: "gas-law-calculator",
        title: "Gas Law Calculator",
        type: "Tool",
        description: "Calculate gas volume and pressure changes at different depths"
      },
      {
        id: "decompression-simulator",
        title: "Decompression Simulator",
        type: "Simulation",
        description: "Practice decompression calculations and dive planning"
      },
      {
        id: "physics-quiz",
        title: "Diving Physics Quiz",
        type: "Assessment",
        description: "Test your understanding of diving physics principles"
      }
    ]
  }
};

export default function EnhancedLessonContent({ content, trackSlug, lessonTitle, pdfUrl, lessonId }: EnhancedLessonContentProps) {
  const [activeTab, setActiveTab] = useState("content");
  const richMedia = RICH_MEDIA_CONTENT[trackSlug as keyof typeof RICH_MEDIA_CONTENT] || RICH_MEDIA_CONTENT["ndt-inspection"];

  // Fetch track progress for real-time progress bar
  const { data: trackProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/tracks", trackSlug, "progress"],
    queryFn: async () => {
      const response = await fetch(`/api/tracks/${trackSlug}/progress`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!trackSlug,
  });

  // Calculate progress percentage
  const progressPercentage = trackProgress?.completionPercentage || 0;
  const progressDisplay = progressLoading ? '...' : `${Math.round(progressPercentage)}%`;

  return (
    <div className="space-y-6">
      {/* Enhanced Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="reference" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Reference Guide
          </TabsTrigger>
        </TabsList>

        {/* Main Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {lessonTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                >
                  {transformAITutorNames(content || "No content available.")}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {richMedia.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                      <Play className="w-5 h-5 mr-2" />
                      Play Video
                    </Button>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black bg-opacity-70">
                    {video.duration}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Watch Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reference Guide Tab */}
        <TabsContent value="reference" className="space-y-4">
          {pdfUrl && lessonId ? (
            <PdfEbookViewer 
              pdfUrl={pdfUrl} 
              lessonTitle={lessonTitle}
              lessonId={lessonId}
            />
          ) : (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-8 text-center">
                <Book className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-700">No reference guide available for this lesson.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Learning Progress Indicators */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Learning Progress</h3>
                <p className="text-sm text-blue-700">Track your advancement through professional diving skills</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">{progressDisplay}</div>
              <div className="text-sm text-blue-700">Complete</div>
            </div>
          </div>
          <div className="mt-3 bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
