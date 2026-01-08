import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, BookOpen, Award, CheckCircle, ArrowRight, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";

interface Track {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  isPublished: boolean;
  createdAt: string;
  aiTutor: {
    id: string;
    name: string;
    specialty: string;
    description: string;
  } | null;
}

// Mock data for tracks - All 8 Professional Diving Subjects
const mockTracks = [
  {
    id: "ndt-inspection",
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    summary: "Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.",
    description: "Comprehensive training in non-destructive testing methods for underwater structural inspection and quality assurance.",
    level: "Advanced",
    duration: "8 weeks",
    lessons: 15,
    students: 1247,
    progress: 0,
    completed: false,
    category: "Inspection & Testing"
  },
  {
    id: "diver-medic",
    title: "Diver Medic Technician (DMT)",
    slug: "diver-medic",
    summary: "Emergency medical response, ABCDE assessment, and diving injury treatment certification.",
    description: "Professional medical training for diving emergencies, decompression sickness treatment, and hyperbaric medicine.",
    level: "Expert",
    duration: "12 weeks",
    lessons: 20,
    students: 892,
    progress: 0,
    completed: false,
    category: "Medical & Emergency"
  },
  {
    id: "commercial-supervisor",
    title: "Commercial Dive Supervisor",
    slug: "commercial-supervisor",
    summary: "Dive operations management, safety protocols, and emergency response leadership.",
    description: "Advanced leadership training for commercial dive supervisors, project management, and safety coordination.",
    level: "Expert",
    duration: "10 weeks",
    lessons: 18,
    students: 623,
    progress: 0,
    completed: false,
    category: "Management & Leadership"
  },
  {
    id: "saturation-diving",
    title: "Saturation Diving Systems",
    slug: "saturation-diving",
    summary: "Saturation diving operations, life support systems, and decompression management.",
    description: "Comprehensive training for saturation diving systems, life support operations, and extended underwater missions.",
    level: "Expert",
    duration: "16 weeks",
    lessons: 24,
    students: 456,
    progress: 0,
    completed: false,
    category: "Advanced Operations"
  },
  {
    id: "underwater-welding",
    title: "Advanced Underwater Welding",
    slug: "underwater-welding",
    summary: "Professional underwater welding techniques, electrode selection, and quality control.",
    description: "Specialized training in underwater welding methods, marine welding procedures, and quality assurance protocols.",
    level: "Advanced",
    duration: "12 weeks",
    lessons: 18,
    students: 1456,
    progress: 0,
    completed: false,
    category: "Specialized Skills"
  },
  {
    id: "hyperbaric-operations",
    title: "Hyperbaric Chamber Operations",
    slug: "hyperbaric-operations",
    summary: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring.",
    description: "Professional training in hyperbaric chamber operations, decompression therapy, and medical gas management.",
    level: "Intermediate",
    duration: "6 weeks",
    lessons: 12,
    students: 734,
    progress: 0,
    completed: false,
    category: "Medical Operations"
  },
  {
    id: "alst",
    title: "Assistant Life Support Technician",
    slug: "alst",
    summary: "Assistant life support operations, emergency response protocols, and life support system procedures.",
    description: "Comprehensive training in life support systems, emergency response procedures, and life support operations.",
    level: "Expert",
    duration: "14 weeks",
    lessons: 22,
    students: 567,
    progress: 0,
    completed: false,
    category: "Life Support Systems"
  },
  {
    id: "lst",
    title: "Life Support Technician (LST)",
    slug: "lst",
    summary: "Life support system operations, gas management, and emergency response procedures.",
    description: "Professional training in life support systems, gas management, and emergency response for diving operations.",
    level: "Advanced",
    duration: "10 weeks",
    lessons: 16,
    students: 1023,
    progress: 0,
    completed: false,
    category: "Life Support Systems"
  }
];

const levelColors: { [key: string]: string } = {
  "Beginner": "bg-green-100 text-green-800",
  "Intermediate": "bg-blue-100 text-blue-800", 
  "Advanced": "bg-orange-100 text-orange-800",
  "Expert": "bg-red-100 text-red-800"
};

export default function Tracks() {
  const [, setLocation] = useLocation();
  const { data: apiTracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  // Use API data if available, otherwise fall back to mock data
  const tracks = apiTracks && apiTracks.length > 0 ? 
    apiTracks.map(track => ({
      id: track.id,
      title: track.title,
      slug: track.slug,
      summary: track.summary || "Professional diving training course",
      description: track.summary || "Professional diving training course",
      level: "Intermediate", // Default level
      duration: "8 weeks",
      lessons: 12,
      students: Math.floor(Math.random() * 2000) + 500,
      progress: Math.floor(Math.random() * 100),
      completed: false,
      category: "Professional Training",
      aiTutor: track.aiTutor
    })) : mockTracks.map(track => ({
      ...track,
      aiTutor: undefined
    }));

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 pt-20" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Learning Tracks</h1>
          <p className="text-lg text-slate-600">
            Comprehensive professional diving education tracks designed for career advancement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{mockTracks.length}</p>
                  <p className="text-sm text-slate-600">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {mockTracks.reduce((sum, track) => sum + track.students, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">Active Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {mockTracks.reduce((sum, track) => sum + track.lessons, 0)}
                  </p>
                  <p className="text-sm text-slate-600">Total Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">0%</p>
                  <p className="text-sm text-slate-600">Your Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tracks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
            <Card key={track.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={levelColors[track.level]}>{track.level}</Badge>
                  <Badge variant="outline">{track.category}</Badge>
                </div>
                <CardTitle className="text-xl">{track.title}</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {track.description}
                </CardDescription>
                
                {/* AI Tutor Information for API tracks */}
                {track.aiTutor && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">AI Tutor</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {track.aiTutor.description}
                    </p>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="text-slate-900 font-medium">{track.progress}%</span>
                    </div>
                    <Progress value={track.progress} className="h-2" />
                  </div>

                  {/* Track Stats */}
                  <div className="flex justify-between text-sm text-slate-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{track.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      <span>{track.lessons} lessons</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{track.students.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => setLocation(`/tracks/${track.slug}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    data-testid={`button-start-track-${track.id}`}
                  >
                    {track.progress > 0 ? (
                      <>
                        Continue Track
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Start Track
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Ready to Advance Your Diving Career?
              </h3>
              <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
                Join thousands of professional divers who have advanced their careers with our comprehensive training tracks. 
                Get personalized recommendations with our AI Learning Path system.
              </p>
              <div className="space-x-4">
                <Link href="/learning-path">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Get AI Recommendations
                  </Button>
                </Link>
                <Link href="/affiliate">
                  <Button size="lg" variant="outline">
                    Join Partner Program
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </>
  );
}