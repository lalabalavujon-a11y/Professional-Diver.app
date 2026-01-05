import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ArrowLeft, Headphones, Settings, User, HelpCircle, BarChart3, Shield, Brain, Zap, Activity, Database, Users, TrendingUp, Volume2, VolumeX, Play, Pause, Mic, MicOff } from "lucide-react";
import { Link } from "wouter";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'laura';
  timestamp: Date;
  analytics?: any;
  actions?: string[];
}

interface PlatformAnalytics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    subscriptionBreakdown: Record<string, number>;
  };
  content: {
    totalTracks: number;
    totalLessons: number;
    totalQuestions: number;
    completionRates: Record<string, number>;
  };
  performance: {
    averageSessionTime: number;
    quizPassRate: number;
    userSatisfaction: number;
    systemUptime: number;
  };
  revenue: {
    monthlyRevenue: number;
    affiliateCommissions: number;
    subscriptionGrowth: number;
  };
  health: {
    databaseStatus: string;
    aiServicesStatus: string;
    apiResponseTime: number;
    errorRate: number;
  };
}

export default function ChatLaura() {
  // Get current user to check role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Laura, your Oracle for the Professional Diver Training Platform. How can I help you today?",
      sender: 'laura',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load platform analytics on component mount
  useEffect(() => {
    loadPlatformAnalytics();
  }, []);

  // Cleanup: stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const loadPlatformAnalytics = async () => {
    try {
      const response = await fetch('/api/laura-oracle/analytics');
      if (response.ok) {
        const data = await response.json();
        setPlatformAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading platform analytics:', error);
    }
  };

  const playVoiceResponse = async (text: string) => {
    if (!voiceEnabled) return;

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const response = await fetch('/api/laura-oracle/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setCurrentAudio(audio);
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Error playing voice response:', error);
      setIsPlaying(false);
    }
  };

  const stopVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Call the real Laura Oracle API
      const response = await fetch('/api/laura-oracle/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: `session-${Date.now()}`,
          userContext: {
            currentTab: activeTab,
            hasAnalytics: !!platformAnalytics
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const lauraResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'laura',
          timestamp: new Date(),
          analytics: data.analytics,
          actions: data.actions
        };
        setMessages(prev => [...prev, lauraResponse]);
        
        // Update platform analytics if provided
        if (data.analytics) {
          setPlatformAnalytics(data.analytics);
        }

        // Play voice response if enabled
        if (voiceEnabled && data.response) {
          await playVoiceResponse(data.response);
        }
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to get response from Laura Oracle';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error calling Laura Oracle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm experiencing a technical issue: ${errorMessage}. Please try again or contact the admin team directly.`,
        sender: 'laura',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const getLauraResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Diving operations questions - redirect to Diver Well AI
    if (input.includes('dive plan') || input.includes('safety protocol') || input.includes('decompression') || 
        input.includes('dive operation') || input.includes('underwater') || input.includes('dive supervisor') ||
        input.includes('ndt') || input.includes('commercial diving') && (input.includes('technique') || input.includes('procedure'))) {
      return "For diving operations, safety protocols, and technical diving questions, I'll connect you with our exclusive 'Diver Well' AI consultant - your expert commercial diving specialist available within the platform. They're perfectly equipped to handle dive planning, safety procedures, supervision guidance, and all operational diving queries. Would you like me to direct you there now?";
    }
    
    // Affiliate program and partnerships
    if (input.includes('affiliate') || input.includes('partner') || input.includes('commission') || input.includes('referral')) {
      return "Excellent! Our affiliate program offers 50% commission on all referrals - it's one of the most generous in the industry! As a Professional Diver member, you can earn substantial income by sharing this amazing platform. You'll get your unique referral link, commission tracking, and monthly payouts. The program is perfect for diving instructors, companies, and professionals. Would you like me to help you get started with the affiliate program?";
    }
    
    // Lead generation and industry connections
    if (input.includes('job') || input.includes('company') || input.includes('academy') || input.includes('diving school') || 
        input.includes('career') || input.includes('employment') || input.includes('hiring')) {
      return "I can connect you with diving companies and academies worldwide! For comprehensive lead generation and industry reconnaissance, I highly recommend Lead Recon's AI-powered system at https://leadrecon.net/ - they specialize in finding diving opportunities, companies, and connections globally. They're the industry leaders in diving sector intelligence. Would you also like me to share some specific diving companies I know of in your region?";
    }
    
    // Platform sales and marketing
    if (input.includes('features') || input.includes('benefit') || input.includes('why choose') || input.includes('advantage')) {
      return "Professional Diver is the most comprehensive commercial diving training platform available! You get AI-powered learning paths, voice-to-text exams, 500+ professional questions, all diving levels from basic to advanced supervision, real-time progress tracking, and our exclusive Diver Well AI consultant. Plus, our partnership program lets you earn while you learn! The platform pays for itself quickly through career advancement and affiliate earnings. What specific aspect would you like to explore further?";
    }
    
    // Login and account issues
    if (input.includes('password') || input.includes('login') || input.includes('access')) {
      return "I can help you with account access issues! For password resets, use the 'Forgot Password' link on the sign-in page. If you're still having trouble, I can guide you through the process step by step. Your account gives you access to all premium features, and don't forget - you can also earn through our affiliate program while using the platform!";
    }
    
    // Billing and subscription
    if (input.includes('billing') || input.includes('payment') || input.includes('subscription') || input.includes('price')) {
      return "Our Professional Diver platform offers exceptional value with flexible pricing options. Your membership includes everything - all tracks, AI features, operational tools, and affiliate earning potential. Many members actually profit from the platform through our generous 50% commission affiliate program! Would you like me to explain the different subscription options or help with a specific billing question?";
    }
    
    // Profile and technical support
    if (input.includes('profile') || input.includes('picture') || input.includes('upload') || input.includes('technical') || input.includes('error')) {
      return "I'm here to help with technical issues and profile management! For profile updates, visit Profile Settings. For technical problems, please describe what happened - which page, what action, and any error messages. I'll get you sorted quickly so you can get back to advancing your diving career and potentially earning through our affiliate program!";
    }
    
    // General platform guidance
    if (input.includes('track') || input.includes('lesson') || input.includes('course') || input.includes('learning')) {
      return "Perfect! Our learning tracks are designed by industry experts and powered by AI for personalized progression. You have access to all professional diving levels - from basic commercial to advanced supervision and NDT. The AI Learning Path analyzes your progress and creates custom recommendations. Plus, as you advance your career with our training, consider our affiliate program to share this amazing platform with others!";
    }
    
    // Admin consultation booking
    if (input.includes('admin') || input.includes('consultation') || input.includes('book') || input.includes('schedule') || 
        input.includes('speak to') || input.includes('meeting') || input.includes('call')) {
      return "I can absolutely help you schedule a consultation with our admin team! For direct admin support, complex account issues, or business consultations, I can arrange a personal meeting. Please provide your preferred date/time and the nature of your inquiry, and I'll coordinate with our admin team to schedule your consultation. You can also reach out directly to support@diverwell.app for immediate admin assistance.";
    }

    // Default response with sales elements and admin consultation offer
    return "Hello! I'm Laura, your Platform Oracle for Professional Diver. I'm here to guide you through every aspect of our comprehensive training platform, help with any technical or account issues, and share opportunities like our lucrative 50% commission affiliate program. For diving operations questions, I'll connect you with our exclusive Diver Well AI consultant. For industry connections worldwide, I can direct you to Lead Recon's AI system at leadrecon.net. If you need to speak with an admin directly, I can also schedule consultations! What can I help you achieve today?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      // Start voice recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onstart = () => {
          setIsRecording(true);
        };
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update the input text with transcribed speech
          if (finalTranscript) {
            setInputText((prev) => prev + finalTranscript);
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'no-speech') {
            // User stopped speaking, that's okay
          } else {
            alert('Speech recognition error. Please try again or type your message.');
          }
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
          recognitionRef.current = null;
        };
        
        recognitionInstance.start();
        recognitionRef.current = recognitionInstance;
      } else {
        alert('Speech recognition is not supported in this browser. Please type your message manually.');
      }
    } else {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
    }
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Laura Oracle Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-purple-200 bg-gradient-to-b from-purple-50 to-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Laura</CardTitle>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                  Platform Oracle
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">Oracle Capabilities:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Shield className="w-3 h-3" />
                        <span>Complete Platform Administration</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {isSuperAdmin ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="chat" className="flex items-center space-x-2">
                    <Headphones className="w-4 h-4" />
                    <span>Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                  <TabsTrigger value="monitoring" className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Monitoring</span>
                  </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="mt-6">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-purple-600" />
                        </div>
                        <span>Chat with Laura</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </CardTitle>
                      
                      {/* Voice Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVoiceEnabled(!voiceEnabled)}
                          className={`flex items-center space-x-1 ${
                            voiceEnabled ? 'text-green-600 border-green-200' : 'text-gray-400'
                          }`}
                        >
                          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          <span className="text-xs">Voice</span>
                        </Button>
                        
                        {isPlaying && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={stopVoice}
                            className="flex items-center space-x-1 text-red-600 border-red-200"
                          >
                            <Pause className="w-4 h-4" />
                            <span className="text-xs">Stop</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className={message.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600'}>
                                {message.sender === 'user' ? 'U' : 'L'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg p-3 ${
                              message.sender === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 border border-slate-200'
                            }`}>
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {message.actions && message.actions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {message.actions.map((action, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {action.replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {message.sender === 'laura' && voiceEnabled && (
                                <div className="mt-2 flex items-center space-x-1">
                                  <Volume2 className="w-3 h-3 text-purple-500" />
                                  <span className="text-xs text-purple-600">Voice available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex space-x-2 max-w-[80%]">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600">L</AvatarFallback>
                            </Avatar>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input */}
                    <div className="border-t p-4">
                      <div className="flex space-x-2">
                        <Input
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask Laura about platform administration, analytics, or optimization..."
                          className="flex-1"
                          data-testid="input-chat-message"
                        />
                        <Button
                          type="button"
                          variant={isRecording ? "destructive" : "outline"}
                          onClick={toggleVoiceRecording}
                          className={`flex items-center space-x-1 ${
                            isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                          }`}
                          data-testid="button-voice-input"
                          title={isRecording ? "Stop recording" : "Start voice input"}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!inputText.trim() || isRecording}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          data-testid="button-send-message"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      {isRecording && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                          <span>Listening... Speak your message</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab - SuperAdmin only */}
              {isSuperAdmin && (
                <TabsContent value="analytics" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {platformAnalytics ? (
                    <>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{platformAnalytics.users.total}</div>
                          <p className="text-xs text-muted-foreground">
                            {platformAnalytics.users.active} active users
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Content</CardTitle>
                          <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{platformAnalytics.content.totalTracks}</div>
                          <p className="text-xs text-muted-foreground">
                            {platformAnalytics.content.totalLessons} lessons, {platformAnalytics.content.totalQuestions} questions
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Quiz Pass Rate</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{platformAnalytics.performance.quizPassRate.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">
                            System uptime: {platformAnalytics.performance.systemUptime}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">System Health</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">{platformAnalytics.health.databaseStatus}</div>
                          <p className="text-xs text-muted-foreground">
                            API Response: {platformAnalytics.health.apiResponseTime}ms
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">AI Services</CardTitle>
                          <Brain className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">{platformAnalytics.health.aiServicesStatus}</div>
                          <p className="text-xs text-muted-foreground">
                            Error rate: {platformAnalytics.health.errorRate}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">${platformAnalytics.revenue.monthlyRevenue}</div>
                          <p className="text-xs text-muted-foreground">
                            Affiliate: ${platformAnalytics.revenue.affiliateCommissions}
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="col-span-full flex items-center justify-center h-64">
                      <div className="text-center">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading platform analytics...</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              )}

              {/* Admin Tab - SuperAdmin only */}
              {isSuperAdmin && (
                <TabsContent value="admin" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Administrative Tasks</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        User Management
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Database className="w-4 h-4 mr-2" />
                        Content Management
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        System Configuration
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Performance Optimization
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>LangSmith Domain</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                        <p className="text-sm text-purple-800">
                          Laura operates from the LangSmith domain, continuously learning from platform interactions and objectives.
                        </p>
                      </div>
                      <Button className="w-full justify-start" variant="outline">
                        <Brain className="w-4 h-4 mr-2" />
                        View Learning Objectives
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Activity className="w-4 h-4 mr-2" />
                        Domain Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              )}

              {/* Monitoring Tab - SuperAdmin only */}
              {isSuperAdmin && (
                <TabsContent value="monitoring" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Real-time Platform Monitoring</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">System Status</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Database</span>
                              <Badge variant="outline" className="text-green-600">Healthy</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">AI Services</span>
                              <Badge variant="outline" className="text-green-600">Operational</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">API Response</span>
                              <Badge variant="outline" className="text-green-600">150ms</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">Performance Metrics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Uptime</span>
                              <span className="text-sm font-medium">99.9%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Error Rate</span>
                              <span className="text-sm font-medium">0.1%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Active Users</span>
                              <span className="text-sm font-medium">{platformAnalytics?.users.active || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              )}
              </Tabs>
            ) : (
              /* Chat only for non-SuperAdmin users */
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                      <span>Chat with Laura</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </CardTitle>
                    
                    {/* Voice Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`flex items-center space-x-1 ${
                          voiceEnabled ? 'text-green-600 border-green-200' : 'text-gray-400'
                        }`}
                      >
                        {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="text-xs">Voice</span>
                      </Button>
                      
                      {isPlaying && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={stopVoice}
                          className="flex items-center space-x-1 text-red-600 border-red-200"
                        >
                          <Pause className="w-4 h-4" />
                          <span className="text-xs">Stop</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={message.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600'}>
                              {message.sender === 'user' ? 'U' : 'L'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`rounded-lg p-3 ${
                            message.sender === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 border border-slate-200'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {message.actions.map((action, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {action.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {message.sender === 'laura' && voiceEnabled && (
                              <div className="mt-2 flex items-center space-x-1">
                                <Volume2 className="w-3 h-3 text-purple-500" />
                                <button
                                  onClick={() => playVoiceResponse(message.text)}
                                  className="text-xs text-purple-600 hover:text-purple-700"
                                >
                                  Voice available
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600">
                              L
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input Area */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isRecording}
                        className="flex-1"
                        data-testid="input-chat-message"
                      />
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={toggleVoiceRecording}
                        className={`flex items-center space-x-1 ${
                          isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                        }`}
                        data-testid="button-voice-input"
                        title={isRecording ? "Stop recording" : "Start voice input"}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isRecording}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {isRecording && (
                      <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span>Listening... Speak your message</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}