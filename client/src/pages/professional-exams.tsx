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
  questionsCount: number;
  timeLimit: number;
  passingScore: number;
  attempts: number;
  maxAttempts: number;
  bestScore: number | null;
  completed: boolean;
  hasVoiceQuestions: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

const professionalExamTracks: ExamTrack[] = [
  {
    id: "ndt-inspection",
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    description: "Practice visual inspection, magnetic particle testing, and ultrasonic testing exam preparation",
    questionsCount: 75,
    timeLimit: 120,
    passingScore: 80,
    attempts: 2,
    maxAttempts: 3,
    bestScore: 87,
    completed: false,
    hasVoiceQuestions: true,
    difficulty: 'Advanced'
  },
  {
    id: "diver-medic",
    title: "Diver Medic Technician",
    slug: "diver-medic",
    description: "Practice emergency medical response, ABCDE assessment, and diving injury treatment exam prep",
    questionsCount: 65,
    timeLimit: 90,
    passingScore: 85,
    attempts: 1,
    maxAttempts: 3,
    bestScore: 92,
    completed: true,
    hasVoiceQuestions: true,
    difficulty: 'Expert'
  },
  {
    id: "commercial-supervisor",
    title: "Commercial Dive Supervisor",
    slug: "commercial-supervisor",
    description: "Practice dive operations management, safety protocols, and emergency response exam prep",
    questionsCount: 80,
    timeLimit: 150,
    passingScore: 80,
    attempts: 0,
    maxAttempts: 3,
    bestScore: null,
    completed: false,
    hasVoiceQuestions: true,
    difficulty: 'Expert'
  },
  {
    id: "saturation-diving",
    title: "Saturation Diving Systems",
    slug: "saturation-diving",
    description: "Saturation diving operations, life support systems, and decompression management",
    questionsCount: 70,
    timeLimit: 135,
    passingScore: 85,
    attempts: 0,
    maxAttempts: 3,
    bestScore: null,
    completed: false,
    hasVoiceQuestions: false,
    difficulty: 'Expert'
  },
  {
    id: "underwater-welding",
    title: "Advanced Underwater Welding",
    slug: "underwater-welding",
    description: "Professional underwater welding techniques, electrode selection, and quality control",
    questionsCount: 60,
    timeLimit: 100,
    passingScore: 80,
    attempts: 1,
    maxAttempts: 3,
    bestScore: 78,
    completed: false,
    hasVoiceQuestions: true,
    difficulty: 'Advanced'
  },
  {
    id: "hyperbaric-operations",
    title: "Hyperbaric Chamber Operations",
    slug: "hyperbaric-operations",
    description: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring",
    questionsCount: 55,
    timeLimit: 90,
    passingScore: 85,
    attempts: 0,
    maxAttempts: 3,
    bestScore: null,
    completed: false,
    hasVoiceQuestions: false,
    difficulty: 'Intermediate'
  },
  {
    id: "alst",
    title: "Assistant Life Support Technician",
    slug: "alst",
    description: "Assistant life support operations, emergency response protocols, and life support system procedures",
    questionsCount: 70,
    timeLimit: 120,
    passingScore: 85,
    attempts: 0,
    maxAttempts: 3,
    bestScore: null,
    completed: false,
    hasVoiceQuestions: true,
    difficulty: 'Expert'
  },
  {
    id: "lst",
    title: "Life Support Technician (LST)",
    slug: "lst",
    description: "Life support system operations, gas management, and emergency response procedures",
    questionsCount: 60,
    timeLimit: 100,
    passingScore: 80,
    attempts: 0,
    maxAttempts: 3,
    bestScore: null,
    completed: false,
    hasVoiceQuestions: true,
    difficulty: 'Advanced'
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

  const totalQuestions = professionalExamTracks.reduce((sum, exam) => sum + exam.questionsCount, 0);
  const completedExams = professionalExamTracks.filter(exam => exam.completed).length;
  const averageScore = professionalExamTracks
    .filter(exam => exam.bestScore !== null)
    .reduce((sum, exam) => sum + (exam.bestScore || 0), 0) / 
    professionalExamTracks.filter(exam => exam.bestScore !== null).length || 0;

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
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans" data-sidebar-content="true">
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
                
                {exam.completed && (
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Practice Complete
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Exam Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-slate-600">
                    <FileText className="w-4 h-4 mr-2" />
                    {exam.questionsCount} Questions
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Timer className="w-4 h-4 mr-2" />
                    {exam.timeLimit} minutes
                  </div>
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

                {/* Progress & Attempts */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Attempts: {exam.attempts}/{exam.maxAttempts}</span>
                    {exam.bestScore && (
                      <span className="font-medium text-slate-900">Best: {exam.bestScore}%</span>
                    )}
                  </div>
                  {exam.bestScore && (
                    <Progress value={exam.bestScore} className="h-2" />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {exam.attempts < exam.maxAttempts && (
                    <Link href={`/exams/${exam.slug}/start`} className="flex-1">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid={`button-start-exam-${exam.slug}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {exam.attempts === 0 ? 'Start Practice Test' : 'Retake Practice Test'}
                      </Button>
                    </Link>
                  )}
                  
                  {exam.attempts > 0 && (
                    <Link href={`/exams/${exam.slug}/results`}>
                      <Button 
                        variant="outline" 
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        data-testid={`button-view-results-${exam.slug}`}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Results
                      </Button>
                    </Link>
                  )}
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