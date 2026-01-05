import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  Award,
  MapPin,
  Zap,
  BookOpen,
  Users,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNavigation from "@/components/role-based-navigation";

interface LearningPathSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tracks: {
    trackId: string;
    trackTitle: string;
    priority: number;
    reason: string;
    estimatedWeeks: number;
  }[];
  personalizedMessage: string;
  nextSteps: string[];
  prerequisites: string[];
  careerBenefits: string[];
}

interface LearningAnalysis {
  preferredStyle: 'visual' | 'hands-on' | 'theoretical' | 'mixed';
  confidence: number;
  recommendations: string[];
}

interface CareerAdvice {
  careerPath: string;
  nextCertifications: string[];
  marketDemand: string;
  salaryProjection: string;
  timeToGoal: string;
}

export default function LearningPathSuggestions() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("suggestions");

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

  // Fetch learning path suggestions
  const { data: learningPath, isLoading: loadingPath } = useQuery({
    queryKey: ["/api/learning-path/suggestions", currentUser?.id],
    queryFn: async () => {
      const response = await fetch('/api/learning-path/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'demo-user',
          skillLevel: 'intermediate',
          goals: ['certification', 'career advancement'],
          timeAvailable: 10,
          preferredLearningStyle: 'mixed'
        })
      });
      if (!response.ok) throw new Error('Failed to fetch learning path');
      return response.json();
    },
    enabled: !!currentUser
  });

  // Fetch learning style analysis
  const { data: learningAnalysis } = useQuery({
    queryKey: ["/api/learning-path/analysis", currentUser?.id],
    queryFn: async () => {
      const response = await fetch('/api/learning-path/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedLessons: [],
          quizScores: [85, 92, 78, 95]
        })
      });
      if (!response.ok) throw new Error('Failed to analyze learning style');
      return response.json();
    },
    enabled: !!currentUser
  });

  // Fetch career advice
  const { data: careerAdvice } = useQuery({
    queryKey: ["/api/learning-path/career-advice", currentUser?.id],
    queryFn: async () => {
      const response = await fetch('/api/learning-path/career-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'demo-user',
          skillLevel: 'intermediate',
          goals: ['certification', 'career advancement'],
          certificationGoals: ['NDT Inspector', 'Dive Supervisor']
        })
      });
      if (!response.ok) throw new Error('Failed to fetch career advice');
      return response.json();
    },
    enabled: !!currentUser
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLearningStyleIcon = (style: string) => {
    switch (style) {
      case 'visual': return <Star className="w-4 h-4" />;
      case 'hands-on': return <Zap className="w-4 h-4" />;
      case 'theoretical': return <BookOpen className="w-4 h-4" />;
      case 'mixed': return <Users className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your learning data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">AI Learning Path Suggestions</h1>
          </div>
          <p className="text-lg text-slate-600">
            Personalized recommendations powered by AI to accelerate your diving career
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Learning Path</TabsTrigger>
            <TabsTrigger value="analysis">Learning Style</TabsTrigger>
            <TabsTrigger value="career">Career Guidance</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-6">
            {loadingPath ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI is analyzing your profile and generating personalized recommendations...</p>
                </CardContent>
              </Card>
            ) : learningPath ? (
              <div className="space-y-6">
                {/* Main Learning Path Card */}
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center space-x-2 text-xl">
                          <Target className="w-6 h-6 text-blue-600" />
                          <span>{learningPath.title}</span>
                        </CardTitle>
                        <CardDescription className="mt-2 text-slate-700">
                          {learningPath.description}
                        </CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(learningPath.difficulty)}>
                        {learningPath.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-600">Duration: {learningPath.estimatedDuration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-600">{learningPath.tracks.length} Training Tracks</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-600">Career Focused</span>
                      </div>
                    </div>

                    <div className="bg-blue-100 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-blue-900 mb-2">Personalized Message</h4>
                      <p className="text-blue-800">{learningPath.personalizedMessage}</p>
                    </div>

                    {/* Recommended Tracks */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900">Recommended Training Tracks</h4>
                      {learningPath.tracks.map((track: any, index: number) => (
                        <Card key={track.trackId} className="border-slate-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Priority {track.priority}
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    ~{track.estimatedWeeks} weeks
                                  </span>
                                </div>
                                <h5 className="font-medium text-slate-900">{track.trackTitle}</h5>
                                <p className="text-sm text-slate-600 mt-1">{track.reason}</p>
                              </div>
                              <Link href={`/tracks/${track.slug || track.trackId}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  data-testid={`button-start-track-${track.trackId}`}
                                >
                                  <ArrowRight className="w-4 h-4 mr-1" />
                                  Start Training
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Next Steps</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {learningPath.nextSteps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-slate-400 mt-1">•</span>
                            <span className="text-sm text-slate-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        <span>Career Benefits</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {learningPath.careerBenefits.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-slate-400 mt-1">•</span>
                            <span className="text-sm text-slate-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {learningPath.prerequisites.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-800">
                        <Lightbulb className="w-5 h-5" />
                        <span>Prerequisites</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {learningPath.prerequisites.map((prereq: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span className="text-sm text-orange-800">{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-slate-600">Unable to generate learning path suggestions at this time.</p>
                  <Button className="mt-4" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {learningAnalysis ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getLearningStyleIcon(learningAnalysis.preferredStyle)}
                      <span>Your Learning Style Analysis</span>
                    </CardTitle>
                    <CardDescription>
                      AI-powered analysis of your learning preferences and patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Preferred Style: {learningAnalysis.preferredStyle}
                          </span>
                          <Badge className={getDifficultyColor('intermediate')}>
                            {Math.round(learningAnalysis.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <Progress value={learningAnalysis.confidence * 100} className="h-2" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Personalized Recommendations</h4>
                        <div className="space-y-3">
                          {learningAnalysis.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                              <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                              <span className="text-sm text-slate-700">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Analyzing your learning patterns...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="career" className="space-y-6">
            {careerAdvice ? (
              <div className="space-y-6">
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-800">
                      <TrendingUp className="w-6 h-6" />
                      <span>Career Path Guidance</span>
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      AI-powered career advice based on industry trends and your goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-green-100 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Recommended Career Path</h4>
                        <p className="text-green-800">{careerAdvice.careerPath}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span>Next Certifications</span>
                          </h4>
                          <ul className="space-y-2">
                            {careerAdvice.nextCertifications.map((cert: string, index: number) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-slate-700">{cert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <span>Salary Projection</span>
                          </h4>
                          <p className="text-lg font-medium text-green-600 mb-2">{careerAdvice.salaryProjection}</p>
                          <p className="text-sm text-slate-600">With recommended certifications</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <span>Market Demand</span>
                          </h4>
                          <p className="text-sm text-slate-700">{careerAdvice.marketDemand}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-purple-500" />
                            <span>Timeline to Goal</span>
                          </h4>
                          <p className="text-lg font-medium text-purple-600">{careerAdvice.timeToGoal}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Generating career guidance...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </>
  );
}