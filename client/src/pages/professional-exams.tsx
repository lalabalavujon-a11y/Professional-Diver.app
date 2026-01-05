import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, Mic, Brain, BarChart3, Award, CheckCircle, Play, Timer, Volume2 } from "lucide-react";
import { Link } from "wouter";

interface ExamTrack {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  srsQuestions: number;
  fullExamQuestions: number;
  srsTimeLimit: number;
  fullExamTimeLimit: number;
  passingScore: number;
  srsAttempts: number;
  fullExamAttempts: number;
  srsBestScore: number | null;
  fullExamBestScore: number | null;
  hasVoiceQuestions: boolean;
}

const professionalExamTracks: ExamTrack[] = [
  {
    id: "ndt-inspection",
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    description: "Practice visual inspection, magnetic particle testing, and ultrasonic testing exam preparation",
    difficulty: 'Advanced',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 30,
    fullExamTimeLimit: 120,
    passingScore: 80,
    srsAttempts: 2,
    fullExamAttempts: 1,
    srsBestScore: 87,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  },
  {
    id: "diver-medic",
    title: "Diver Medic Technician",
    slug: "diver-medic",
    description: "Practice emergency medical response, ABCDE assessment, and diving injury treatment exam prep",
    difficulty: 'Expert',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 25,
    fullExamTimeLimit: 90,
    passingScore: 85,
    srsAttempts: 1,
    fullExamAttempts: 0,
    srsBestScore: 92,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  },
  {
    id: "commercial-supervisor",
    title: "Commercial Dive Supervisor",
    slug: "commercial-supervisor",
    description: "Practice dive operations management, safety protocols, and emergency response exam prep",
    difficulty: 'Expert',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 30,
    fullExamTimeLimit: 150,
    passingScore: 80,
    srsAttempts: 0,
    fullExamAttempts: 0,
    srsBestScore: null,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  },
  {
    id: "saturation-diving",
    title: "Saturation Diving Systems",
    slug: "saturation-diving",
    description: "Saturation diving operations, life support systems, and decompression management",
    difficulty: 'Expert',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 30,
    fullExamTimeLimit: 135,
    passingScore: 85,
    srsAttempts: 0,
    fullExamAttempts: 0,
    srsBestScore: null,
    fullExamBestScore: null,
    hasVoiceQuestions: false
  },
  {
    id: "underwater-welding",
    title: "Advanced Underwater Welding",
    slug: "underwater-welding",
    description: "Professional underwater welding techniques, electrode selection, and quality control",
    difficulty: 'Advanced',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 25,
    fullExamTimeLimit: 100,
    passingScore: 80,
    srsAttempts: 1,
    fullExamAttempts: 0,
    srsBestScore: 78,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  },
  {
    id: "hyperbaric-operations",
    title: "Hyperbaric Chamber Operations",
    slug: "hyperbaric-operations",
    description: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring",
    difficulty: 'Intermediate',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 25,
    fullExamTimeLimit: 90,
    passingScore: 85,
    srsAttempts: 0,
    fullExamAttempts: 0,
    srsBestScore: null,
    fullExamBestScore: null,
    hasVoiceQuestions: false
  },
  {
    id: "alst",
    title: "Assistant Life Support Technician",
    slug: "alst",
    description: "Assistant life support operations, emergency response protocols, and life support system procedures",
    difficulty: 'Expert',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 30,
    fullExamTimeLimit: 120,
    passingScore: 85,
    srsAttempts: 0,
    fullExamAttempts: 0,
    srsBestScore: null,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  },
  {
    id: "lst",
    title: "Life Support Technician (LST)",
    slug: "lst",
    description: "Life support system operations, gas management, and emergency response procedures",
    difficulty: 'Advanced',
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 25,
    fullExamTimeLimit: 100,
    passingScore: 80,
    srsAttempts: 0,
    fullExamAttempts: 0,
    srsBestScore: null,
    fullExamBestScore: null,
    hasVoiceQuestions: true
  }
];

export default function ProfessionalExams() {
  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const totalQuestions = professionalExamTracks.reduce((sum, exam) => sum + exam.fullExamQuestions, 0);
  const completedExams = professionalExamTracks.filter(exam => exam.fullExamBestScore !== null).length;
  const allScores = [
    ...professionalExamTracks.map(exam => exam.srsBestScore).filter(score => score !== null),
    ...professionalExamTracks.map(exam => exam.fullExamBestScore).filter(score => score !== null)
  ];
  const averageScore = allScores.length > 0 
    ? allScores.reduce((sum, score) => sum + (score || 0), 0) / allScores.length 
    : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="text-exams-title">
            Professional Diving Exam Preparation
          </h1>
          <p className="text-lg text-slate-600">
            Practice tests and study materials to prepare for certification exams at certified diving schools
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Questions</p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-total-questions">{totalQuestions}+</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Exams Completed</p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-completed-exams">{completedExams}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Average Score</p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-average-score">
                    {averageScore > 0 ? `${Math.round(averageScore)}%` : 'N/A'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Voice Questions</p>
                  <p className="text-2xl font-bold text-slate-900" data-testid="text-voice-questions">
                    {professionalExamTracks.filter(exam => exam.hasVoiceQuestions).length}
                  </p>
                </div>
                <Mic className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {professionalExamTracks.map((exam) => (
            <Card key={exam.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-slate-900 mb-2">{exam.title}</CardTitle>
                    <p className="text-slate-600 text-sm leading-relaxed">{exam.description}</p>
                  </div>
                  <Badge className={getDifficultyColor(exam.difficulty)}>
                    {exam.difficulty}
                  </Badge>
                </div>
                
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Exam Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-slate-600">
                    <Award className="w-4 h-4 mr-2" />
                    {exam.passingScore}% to pass
                  </div>
                  {exam.hasVoiceQuestions && (
                    <div className="flex items-center text-slate-600">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Voice answers
                    </div>
                  )}
                </div>

                {/* SRS Learning Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-blue-600" />
                        SRS Learning
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{exam.srsQuestions} Questions • {exam.srsTimeLimit} minutes</p>
                    </div>
                    {exam.srsBestScore && (
                      <Badge variant="outline" className="text-xs">
                        Best: {exam.srsBestScore}%
                      </Badge>
                    )}
                  </div>
                  <Link href={`/exams/${exam.slug}/start?srs=true`} className="block">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid={`button-srs-exam-${exam.slug}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start SRS Test
                    </Button>
                  </Link>
                </div>

                {/* Full Exam Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-green-600" />
                        Full Exam
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{exam.fullExamQuestions} Questions • {exam.fullExamTimeLimit} minutes</p>
                    </div>
                    {exam.fullExamBestScore && (
                      <Badge variant="outline" className="text-xs">
                        Best: {exam.fullExamBestScore}%
                      </Badge>
                    )}
                  </div>
                  <Link href={`/exams/${exam.slug}/start`} className="block">
                    <Button 
                      variant="outline"
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
                      data-testid={`button-full-exam-${exam.slug}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Full Exam
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Highlight */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Professional Exam Preparation Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Brain className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-slate-900">AI Explanations</h4>
                  <p className="text-sm text-slate-600">Detailed feedback for every question with professional insights</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mic className="w-6 h-6 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-medium text-slate-900">Voice Dictation</h4>
                  <p className="text-sm text-slate-600">Professional speech-to-text for written responses</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-slate-900">Timed Assessments</h4>
                  <p className="text-sm text-slate-600">Authentic practice test conditions with performance analytics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}