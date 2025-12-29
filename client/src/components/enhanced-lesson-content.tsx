import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Link as LinkIcon,
  ExternalLink,
  Music
} from "lucide-react";
import type { MediaItem } from "./lesson-media-manager";

interface EnhancedLessonContentProps {
  content: string;
  trackSlug: string;
  lessonTitle: string;
  videos?: MediaItem[];
  documents?: MediaItem[];
  embeds?: MediaItem[];
  links?: MediaItem[];
  images?: MediaItem[];
  audio?: MediaItem[];
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

export default function EnhancedLessonContent({ 
  content, 
  trackSlug, 
  lessonTitle,
  videos = [],
  documents = [],
  embeds = [],
  links = [],
  images = [],
  audio = []
}: EnhancedLessonContentProps) {
  const [activeTab, setActiveTab] = useState("content");
  
  // Parse media items if they come as strings (from database)
  const parseMedia = (media: any): MediaItem[] => {
    if (!media) return [];
    if (typeof media === 'string') {
      try {
        return JSON.parse(media);
      } catch {
        return [];
      }
    }
    return Array.isArray(media) ? media : [];
  };

  const parsedVideos = parseMedia(videos);
  const parsedDocuments = parseMedia(documents);
  const parsedEmbeds = parseMedia(embeds);
  const parsedLinks = parseMedia(links);
  const parsedImages = parseMedia(images);
  const parsedAudio = parseMedia(audio);

  // Fallback to hardcoded content if no media is provided
  const richMedia = RICH_MEDIA_CONTENT[trackSlug as keyof typeof RICH_MEDIA_CONTENT] || RICH_MEDIA_CONTENT["ndt-inspection"];
  const displayVideos = parsedVideos.length > 0 ? parsedVideos : richMedia.videos;
  const displayDocuments = parsedDocuments.length > 0 ? parsedDocuments : richMedia.documents;

  return (
    <div className="space-y-6">
      {/* Enhanced Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <File className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Media
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
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-slate-900 mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-semibold text-slate-800 mt-5 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold text-slate-700 mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-slate-700 mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-slate-700">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-700">{children}</ol>,
                    li: ({ children }) => <li className="ml-4">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg my-4"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-slate-700 italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          {displayVideos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No videos available for this lesson.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displayVideos.map((video: any) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    {video.thumbnail && (
                      <img 
                        src={video.thumbnail} 
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className={`absolute inset-0 bg-black ${video.thumbnail ? 'bg-opacity-30' : 'bg-opacity-50'} flex items-center justify-center`}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                          <Play className="w-5 h-5 mr-2" />
                          Play Video
                        </Button>
                      </a>
                    </div>
                    {video.duration && (
                      <Badge className="absolute top-2 right-2 bg-black bg-opacity-70">
                        {video.duration}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{video.title || "Video"}</h3>
                    {video.description && (
                      <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                    )}
                    <div className="flex gap-2">
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" className="w-full">
                          <Play className="w-4 h-4 mr-1" />
                          Watch Now
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {displayDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No documents available for this lesson.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {displayDocuments.map((doc: any) => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <File className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{doc.title || "Document"}</h3>
                        {doc.description && (
                          <p className="text-sm text-gray-600">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          {doc.type && <Badge variant="outline">{doc.type}</Badge>}
                          {doc.size && <span className="text-xs text-gray-500">{doc.size}</span>}
                        </div>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Media Tab - Images, Links, Embeds, Audio */}
        <TabsContent value="media" className="space-y-6">
          {/* Images */}
          {parsedImages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5" />
                Images
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {parsedImages.map((img: any) => (
                  <Card key={img.id} className="overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.alt || img.caption || "Lesson image"}
                      className="w-full h-48 object-cover"
                    />
                    {(img.caption || img.alt) && (
                      <CardContent className="p-3">
                        <p className="text-sm text-gray-600">{img.caption || img.alt}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {parsedLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                External Links
              </h3>
              <div className="grid gap-4">
                {parsedLinks.map((link: any) => (
                  <Card key={link.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{link.title || "External Link"}</h4>
                        {link.description && (
                          <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                        )}
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                        >
                          {link.url}
                        </a>
                      </div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Embeds */}
          {parsedEmbeds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Embedded Content
              </h3>
              <div className="grid gap-4">
                {parsedEmbeds.map((embed: any) => {
                  const getEmbedUrl = () => {
                    if (embed.embedType === 'youtube') {
                      const videoId = embed.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                      return videoId ? `https://www.youtube.com/embed/${videoId}` : embed.url;
                    }
                    if (embed.embedType === 'vimeo') {
                      const videoId = embed.url.match(/vimeo\.com\/(\d+)/)?.[1];
                      return videoId ? `https://player.vimeo.com/video/${videoId}` : embed.url;
                    }
                    return embed.url;
                  };

                  return (
                    <Card key={embed.id} className="p-4">
                      {embed.title && (
                        <h4 className="font-semibold mb-3">{embed.title}</h4>
                      )}
                      {embed.description && (
                        <p className="text-sm text-gray-600 mb-3">{embed.description}</p>
                      )}
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={getEmbedUrl()}
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audio */}
          {parsedAudio.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5" />
                Audio Files
              </h3>
              <div className="grid gap-4">
                {parsedAudio.map((audioItem: any) => (
                  <Card key={audioItem.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Music className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{audioItem.title || "Audio File"}</h4>
                          {audioItem.description && (
                            <p className="text-sm text-gray-600">{audioItem.description}</p>
                          )}
                          {audioItem.audioDuration && (
                            <span className="text-xs text-gray-500">Duration: {audioItem.audioDuration}</span>
                          )}
                        </div>
                      </div>
                      <audio controls className="max-w-xs">
                        <source src={audioItem.url} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {parsedImages.length === 0 && parsedLinks.length === 0 && parsedEmbeds.length === 0 && parsedAudio.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No media content available for this lesson.
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
              <div className="text-2xl font-bold text-blue-900">85%</div>
              <div className="text-sm text-blue-700">Complete</div>
            </div>
          </div>
          <div className="mt-3 bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
