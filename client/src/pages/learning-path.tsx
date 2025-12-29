import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Progress component not needed for this implementation
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Target, Clock, TrendingUp, ChevronRight, Lightbulb, Users, Award } from "lucide-react";
import { useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<LearningPathSuggestion[]>({
    queryKey: ["/api/learning-path/suggestions", userProfile],
    enabled: showSuggestions,
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/learning-path/generate",
        {
          preferences: {
            interests: userProfile.interests,
            experienceLevel: userProfile.experience,
            timeAvailable: userProfile.timeCommitment,
            learningStyle: "adaptive",
            goals: userProfile.goals,
            certifications: userProfile.certifications,
          },
          additionalInfo: additionalInfo,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      // Store suggestions and show them
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setGeneratedSuggestions(data.suggestions);
        setShowSuggestions(true);
        toast({
          title: "AI Analysis Complete",
          description: data?.message || "Your personalized learning path has been generated based on your profile.",
        });
      } else {
        toast({
          title: "Generation Complete",
          description: "Learning path generated, but no suggestions were returned.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Learning path generation error:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Unable to generate learning path suggestions. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const generateSuggestions = () => {
    if (!userProfile.experience || userProfile.goals.length === 0) {
      toast({
        title: "Profile Incomplete",
        description: "Please provide your experience level and select at least one goal.",
        variant: "destructive",
      });
      return;
    }
    generateSuggestionsMutation.mutate();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <RoleBasedNavigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">AI Learning Path</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get personalized training recommendations powered by AI. Our system analyzes your experience, 
            goals, and interests to create the optimal learning journey for your diving career.
          </p>
        </div>

        {!showSuggestions ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Setup Form */}
            <div className="space-y-6">
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
                    <Label htmlFor="experience" className="text-sm font-medium text-slate-700">
                      Experience Level *
                    </Label>
                    <Select value={userProfile.experience} onValueChange={(value) => 
                      setUserProfile(prev => ({...prev, experience: value}))
                    }>
                      <SelectTrigger className="mt-1" data-testid="select-experience">
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
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      Career Goals * (Select all that apply)
                    </Label>
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
                    <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                      Time Commitment
                    </Label>
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

            {/* AI Analysis Preview */}
            <div className="space-y-6">
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
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
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
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Track Matching</h4>
                      <p className="text-sm text-blue-700">
                        Matches you with relevant training tracks based on industry standards
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Optimal Sequencing</h4>
                      <p className="text-sm text-blue-700">
                        Creates the best learning order based on prerequisites and difficulty
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-blue-600 font-semibold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Personalized Recommendations</h4>
                      <p className="text-sm text-blue-700">
                        Provides detailed reasoning and timeline for your learning journey
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Button 
                    onClick={generateSuggestions}
                    disabled={generateSuggestionsMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    data-testid="button-generate"
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <>
                        <Brain className="w-5 h-5 mr-2 animate-pulse" />
                        AI Analyzing Your Profile...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Generate My Learning Path
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowSuggestions(false)}
              className="mb-6"
              data-testid="button-back"
            >
              ← Modify Profile
            </Button>

            {/* AI Suggestions */}
            {generateSuggestionsMutation.isPending ? (
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
            ) : (
              <div className="space-y-6">
                {generatedSuggestions.length > 0 ? (
                  generatedSuggestions.map((suggestion, index) => (
                    <Card key={suggestion.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge className="bg-blue-100 text-blue-800 mr-3">
                            Path {index + 1}
                          </Badge>
                          <div>
                            <CardTitle className="text-xl">{suggestion.title}</CardTitle>
                            <CardDescription className="mt-1">{suggestion.description}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-blue-600">{suggestion.confidence}% Match</div>
                          <div className="text-sm text-slate-500">{suggestion.estimatedWeeks} weeks</div>
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
                          <p className="text-blue-800 text-sm">{suggestion.reasoning}</p>
                        </div>

                        {/* Learning Tracks */}
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">Recommended Learning Sequence</h4>
                          <div className="space-y-3">
                            {suggestion.tracks.map((track, trackIndex) => (
                              <div key={track.id} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-blue-600 font-semibold text-sm">{track.order}</span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-slate-900">{track.title}</h5>
                                  <p className="text-sm text-slate-600">{track.reason}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setLocation(`/tracks/${track.slug}`)}
                                  data-testid={`button-start-${track.slug}`}
                                >
                                  Start Track
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
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
                          <Button variant="outline" data-testid={`button-save-path-${index}`}>
                            Save for Later
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-slate-600">No learning path suggestions available. Please try generating again.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}