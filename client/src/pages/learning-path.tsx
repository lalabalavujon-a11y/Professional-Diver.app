import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Target, Clock, TrendingUp, ChevronRight, Lightbulb, Users, Award, HelpCircle, Download, Share2, Save, BookOpen, Info, ArrowLeft, CheckCircle2, Loader2, Phone, Mail, MessageSquare } from "lucide-react";
import { useLocation, Link } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LearningPathContactPanel from "@/components/learning-path-contact-panel";
import LearningPathValueProps from "@/components/learning-path-value-props";
import LearningPathComparison from "@/components/learning-path-comparison";
import LearningPathDecisionMatrix from "@/components/learning-path-decision-matrix";

interface LearningPathSuggestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedWeeks: number;
  tracks: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    reason: string;
  }>;
  confidence: number;
  reasoning: string;
}

interface UserProfile {
  experience: string;
  goals: string[];
  timeCommitment: string;
  certifications: string[];
  interests: string[];
}

export default function LearningPath() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    experience: '',
    goals: [],
    timeCommitment: '',
    certifications: [],
    interests: []
  });
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedPaths, setSavedPaths] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPathForAction, setSelectedPathForAction] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<LearningPathSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    let completed = 0;
    let total = 5; // experience, goals, timeCommitment, certifications, interests
    
    if (userProfile.experience) completed++;
    if (userProfile.goals.length > 0) completed++;
    if (userProfile.timeCommitment) completed++;
    if (userProfile.certifications.length > 0) completed++;
    if (userProfile.interests.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const handleSavePath = async (pathId: string) => {
    const path = suggestions.find(p => p.id === pathId);
    if (!path) return;

    try {
      await apiRequest("POST", "/api/learning-path/save", {
        userId: "current-user",
        pathId,
        pathData: path,
      });
      setSavedPaths(prev => new Set([...prev, pathId]));
      toast({
        title: "Path Saved",
        description: "Your learning path has been saved for later review.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save path. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSharePath = async (pathId: string) => {
    const path = suggestions.find(p => p.id === pathId);
    if (!path) return;

    try {
      const response = await apiRequest("POST", "/api/learning-path/share", {
        pathId,
        pathData: path,
      });
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.origin + response.shareUrl);
        toast({
          title: "Link Copied",
          description: "Share link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to generate share link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPath = async (pathId: string) => {
    const path = suggestions.find(p => p.id === pathId);
    if (!path) return;

    try {
      const response = await apiRequest("POST", "/api/learning-path/download", {
        pathData: path,
      });
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(path, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-path-${pathId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: "Your learning path has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download path. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      // Validate profile before making request
      if (!userProfile.experience || !userProfile.goals || userProfile.goals.length === 0) {
        throw new Error('Please provide your experience level and select at least one career goal.');
      }

      try {
        const response = await apiRequest(
          "POST",
          "/api/learning-path/generate",
          {
            profile: {
              experience: userProfile.experience,
              goals: userProfile.goals,
              timeCommitment: userProfile.timeCommitment || undefined,
              certifications: userProfile.certifications || [],
              interests: userProfile.interests || [],
            },
            additionalInfo: additionalInfo || undefined,
          }
        );
        
        // Parse JSON response
        const data = await response.json();
        
        // Check for error in response
        if (data?.error) {
          throw new Error(data.message || data.error || 'Failed to generate learning path');
        }
        
        return data;
      } catch (err: any) {
        // Improve error handling
        console.error('API request error:', err);
        
        // Handle fetch/network errors
        if (err?.message) {
          // Check if it's a network error or API error
          if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
          }
          throw err;
        } else {
          throw new Error('An unexpected error occurred. Please try again or contact support.');
        }
      }
    },
    onSuccess: (data) => {
      setIsLoadingSuggestions(false);
      setError(null);
      if (data?.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
        toast({
          title: "AI Analysis Complete",
          description: `Found ${data.suggestions.length} personalized learning path${data.suggestions.length > 1 ? 's' : ''} for you.`,
        });
      } else {
        setError("No learning paths were generated. Please provide more details about your goals and experience.");
        toast({
          title: "No Paths Generated",
          description: "Please provide more details about your goals and experience.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setIsLoadingSuggestions(false);
      const errorMessage = error?.message || "Unable to generate learning path suggestions. Please try again or contact support.";
      setError(errorMessage);
      console.error('Path generation error:', error);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const generateSuggestions = () => {
    if (!userProfile.experience || userProfile.goals.length === 0) {
      toast({
        title: "Profile Incomplete",
        description: "Please provide your experience level and select at least one goal.",
        variant: "destructive",
      });
      return;
    }
    setError(null);
    setIsLoadingSuggestions(true);
    
    // Log for debugging
    console.log('Generating learning path with profile:', {
      experience: userProfile.experience,
      goals: userProfile.goals,
      timeCommitment: userProfile.timeCommitment,
      certificationsCount: userProfile.certifications.length,
      interestsCount: userProfile.interests.length,
    });
    
    generateSuggestionsMutation.mutate();
  };

  const handleGoalToggle = (goal: string) => {
    setUserProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleCertificationToggle = (cert: string) => {
    setUserProfile(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setUserProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };


  const experienceOptions = [
    "Beginner - New to diving",
    "Recreational - Basic diving experience",
    "Advanced - Some commercial diving experience", 
    "Professional - Experienced commercial diver",
    "Expert - Senior professional with certifications"
  ];

  const goalOptions = [
    "Commercial Diving Career",
    "Underwater Inspection",
    "Diving Medicine & Safety",
    "Life Support Systems",
    "Dive Supervision & Management",
    "Saturation Diving",
    "Offshore Operations",
    "Career Advancement"
  ];

  const certificationOptions = [
    "ADCI Commercial Diver",
    "IMCA Surface Supplied Diver",
    "PADI/NAUI Recreational",
    "Scientific Diving",
    "Public Safety Diving",
    "Military Diving",
    "Hyperbaric Medicine",
    "NDT Certifications"
  ];

  const interestOptions = [
    "Underwater Welding",
    "Hull Inspection",
    "Pipeline Work",
    "Offshore Platforms",
    "Marine Biology",
    "Salvage Operations",
    "Emergency Response",
    "Technical Innovation"
  ];

  const timeOptions = [
    "1-2 hours per week",
    "3-5 hours per week", 
    "6-10 hours per week",
    "11-15 hours per week",
    "16+ hours per week"
  ];

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Value Props */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-slate-900">AI Learning Path</h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-6">
              Discover your personalized training journey powered by AI. Our intelligent system analyzes your experience, 
              goals, and interests to create the optimal learning path for your commercial diving career.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Industry-Standard Paths
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Personalized Recommendations
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Expert Advisor Support
              </div>
            </div>
          </div>
          
          {/* Value Props Section */}
          {!showSuggestions && <LearningPathValueProps />}
        </div>

        {!showSuggestions ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Setup Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Progress */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Profile Completion</span>
                    <span className="text-sm font-semibold text-blue-600">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  <p className="text-xs text-slate-500 mt-2">
                    Complete your profile to get the most accurate recommendations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-600" />
                    Your Profile
                  </CardTitle>
                  <CardDescription>
                    Tell us about your diving background and goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Experience Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="experience" className="text-sm font-medium text-slate-700">
                        Experience Level *
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Your current experience level helps us recommend the right starting point and ensure prerequisite requirements are met.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={userProfile.experience} onValueChange={(value) => 
                      setUserProfile(prev => ({...prev, experience: value}))
                    }>
                      <SelectTrigger className="mt-1" data-testid="select-experience" aria-label="Select experience level">
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Goals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-sm font-medium text-slate-700">
                        Career Goals * (Select all that apply)
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Select all career goals that align with your aspirations. This helps match you with the most relevant training tracks.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {goalOptions.map((goal) => (
                        <Badge
                          key={goal}
                          variant={userProfile.goals.includes(goal) ? "default" : "outline"}
                          className="cursor-pointer text-center py-2 hover:bg-blue-100"
                          onClick={() => handleGoalToggle(goal)}
                          data-testid={`badge-goal-${goal.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Time Commitment */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                        Time Commitment
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Your available time per week helps us estimate realistic completion timelines for each learning path.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={userProfile.timeCommitment} onValueChange={(value) => 
                      setUserProfile(prev => ({...prev, timeCommitment: value}))
                    }>
                      <SelectTrigger className="mt-1" data-testid="select-time">
                        <SelectValue placeholder="How much time can you dedicate?" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Certifications */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Current Certifications
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {certificationOptions.map((cert) => (
                        <Badge
                          key={cert}
                          variant={userProfile.certifications.includes(cert) ? "default" : "outline"}
                          className="cursor-pointer text-center py-2 hover:bg-green-100"
                          onClick={() => handleCertificationToggle(cert)}
                          data-testid={`badge-cert-${cert.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Areas of Interest */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Areas of Interest
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {interestOptions.map((interest) => (
                        <Badge
                          key={interest}
                          variant={userProfile.interests.includes(interest) ? "default" : "outline"}
                          className="cursor-pointer text-center py-2 hover:bg-purple-100"
                          onClick={() => handleInterestToggle(interest)}
                          data-testid={`badge-interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <Label htmlFor="additional" className="text-sm font-medium text-slate-700">
                      Additional Information
                    </Label>
                    <Textarea
                      id="additional"
                      placeholder="Tell us about your specific goals, challenges, or any other relevant information..."
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="mt-1"
                      rows={4}
                      data-testid="textarea-additional"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Contact Panel and AI Preview */}
            <div className="space-y-6">
              {/* Contact Panel */}
              <LearningPathContactPanel />
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Analysis Preview
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    How our AI creates your personalized learning path
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Profile Analysis</h4>
                      <p className="text-sm text-blue-700">
                        Analyzes your experience level, certifications, and career goals
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Track Matching</h4>
                      <p className="text-sm text-blue-700">
                        Matches you with relevant training tracks based on industry standards (IMCA, ADCI)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Optimal Sequencing</h4>
                      <p className="text-sm text-blue-700">
                        Creates the best learning order based on prerequisites and difficulty progression
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Personalized Recommendations</h4>
                      <p className="text-sm text-blue-700">
                        Provides detailed reasoning, confidence scores, and timeline for your learning journey
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Info className="w-3 h-3" />
                      <span>Based on industry standards and thousands of successful career paths</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={generateSuggestions}
                    disabled={generateSuggestionsMutation.isPending || profileCompletion < 40}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    size="lg"
                    data-testid="button-generate"
                    aria-label="Generate personalized learning path"
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <>
                        <Brain className="w-5 h-5 mr-2 animate-pulse" aria-hidden="true" />
                        AI Analyzing Your Profile...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-5 h-5 mr-2" aria-hidden="true" />
                        Generate My Learning Path
                      </>
                    )}
                  </Button>
                  {profileCompletion < 40 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      Complete at least 40% of your profile to generate paths
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Breadcrumbs and Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Link href="/learning-path" className="hover:text-blue-600">
                  AI Learning Path
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-900 font-medium">Your Recommendations</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSuggestions(false);
                  setShowComparison(false);
                }}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Modify Profile
              </Button>
            </div>

            {/* View Toggle and Actions */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Personalized Learning Paths
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={showComparison ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? "Hide Comparison" : "Compare Paths"}
                </Button>
                <Link href="/tracks">
                  <Button variant="outline" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View All Tracks
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decision Matrix */}
            {suggestions.length > 0 && !showComparison && (
              <LearningPathDecisionMatrix 
                suggestions={suggestions}
                userProfile={userProfile}
              />
            )}

            {/* Comparison View */}
            {showComparison && suggestions.length > 0 && (
              <LearningPathComparison
                suggestions={suggestions}
                onSelectPath={(pathId) => setSelectedPathForAction(pathId)}
              />
            )}

            {/* Error Display */}
            {error && !isLoadingSuggestions && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">Unable to Generate Paths</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateSuggestions}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Try Again
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/contact')}
                        >
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {isLoadingSuggestions || generateSuggestionsMutation.isPending ? (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Analyzing Your Profile</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Our AI is analyzing your experience, goals, and preferences to create personalized learning paths...
                    </p>
                    <Progress value={undefined} className="h-2" />
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : !showComparison && !error && (
              <div className="space-y-6">
                {suggestions?.map((suggestion, index) => (
                  <Card key={suggestion.id} className="hover:shadow-lg transition-shadow duration-200 border-blue-100">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              Path {index + 1}
                            </Badge>
                            <Badge variant="outline" className={
                              suggestion.difficulty === "Beginner" ? "bg-green-50 text-green-700" :
                              suggestion.difficulty === "Intermediate" ? "bg-yellow-50 text-yellow-700" :
                              suggestion.difficulty === "Advanced" ? "bg-orange-50 text-orange-700" :
                              "bg-red-50 text-red-700"
                            }>
                              {suggestion.difficulty}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {suggestion.confidence}% Match
                            </Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">{suggestion.title}</CardTitle>
                          <CardDescription>{suggestion.description}</CardDescription>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="flex items-center gap-2 md:justify-end mb-1">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">{suggestion.estimatedWeeks} weeks</span>
                          </div>
                          <div className="flex items-center gap-2 md:justify-end">
                            <Award className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-500">{suggestion.tracks.length} tracks</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-6">
                        {/* AI Reasoning */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <Brain className="w-4 h-4 mr-2" />
                            AI Analysis
                          </h4>
                          <p className="text-blue-800 text-sm leading-relaxed">{suggestion.reasoning}</p>
                        </div>

                        {/* Learning Tracks */}
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                            <Target className="w-4 h-4 mr-2 text-blue-600" />
                            Recommended Learning Sequence
                          </h4>
                          <div className="space-y-3">
                            {suggestion.tracks.map((track) => (
                              <div key={track.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-semibold text-sm">{track.order}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-slate-900 mb-1">{track.title}</h5>
                                  <p className="text-sm text-slate-600">{track.reason}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/tracks/${track.slug}`)}
                                  data-testid={`button-start-${track.slug}`}
                                  className="flex-shrink-0"
                                >
                                  View Track
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                const firstTrack = suggestion.tracks[0];
                                if (firstTrack) {
                                  setLocation(`/tracks/${firstTrack.slug}`);
                                }
                              }}
                              data-testid={`button-start-path-${index}`}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Start This Path
                            </Button>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSavePath(suggestion.id)}
                                data-testid={`button-save-path-${index}`}
                                className={savedPaths.has(suggestion.id) ? "bg-green-50 border-green-200" : ""}
                              >
                                {savedPaths.has(suggestion.id) ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSharePath(suggestion.id)}
                              >
                                <Share2 className="w-4 h-4 mr-1" />
                                Share
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPath(suggestion.id)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Help Section */}
            {suggestions.length > 0 && !showComparison && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2">
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Still Need Help Choosing?
                      </h3>
                      <p className="text-slate-700 mb-4">
                        Our diving education specialists are here to help you make the best decision for your career. 
                        Get personalized guidance based on your unique situation.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open('tel:+442081234567')}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Advisor
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLocation('/contact')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email Support
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLocation('/chat/diver-well')}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat with Laura
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <LearningPathContactPanel />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
    </>
  );
}