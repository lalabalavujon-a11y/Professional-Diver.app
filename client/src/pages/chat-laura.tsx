import { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Mic, MicOff, Volume2, VolumeX, Pause, Headphones, BarChart3, Users, Shield, Zap, Database, Radio } from "lucide-react";
import { Link } from "wouter";

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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME' | 'PARTNER_ADMIN' | 'AFFILIATE';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function ChatLaura() {
  const isMobile = useIsMobile();
  
  // Get current user data to check admin access
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Check if user has admin access
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PARTNER_ADMIN';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Laura, your AI assistant for the Professional Diver Training Platform. I'm here to help you with anything regarding this platform - whether it's questions about features, technical support, account management, or general guidance. How can I assist you today?",
      sender: 'laura',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceToVoiceMode, setVoiceToVoiceMode] = useState(false); // Continuous voice-to-voice conversation
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [usedVoiceInput, setUsedVoiceInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendMessageRef = useRef<((overrideText?: string) => Promise<void>) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load platform analytics when user data is available
  useEffect(() => {
    if (currentUser && isAdmin) {
      loadPlatformAnalytics();
    }
  }, [currentUser, isAdmin]);

  // Initialize speech recognition with permission handling
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        setUsedVoiceInput(true); // Mark that voice input was used
        
        // In voice-to-voice mode, automatically send the message
        if (voiceToVoiceMode && transcript.trim() && handleSendMessageRef.current) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            handleSendMessageRef.current?.(transcript);
          }, 100);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
        
        // Handle specific error types
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // Don't show error for no-speech, just restart if in voice-to-voice mode
          if (voiceToVoiceMode && !isPlaying) {
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                } catch (e) {
                  console.error('Error restarting recognition:', e);
                }
              }
            }, 1000);
          }
        } else if (event.error === 'aborted') {
          // User stopped, don't restart
        } else {
          // For other errors, restart if in voice-to-voice mode
          if (voiceToVoiceMode && !isPlaying) {
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                } catch (e) {
                  console.error('Error restarting recognition:', e);
                }
              }
            }, 1000);
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // In voice-to-voice mode, restart listening after speech ends (if not playing audio)
        if (voiceToVoiceMode && !isPlaying) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                console.error('Error restarting recognition:', e);
              }
            }
          }, 500);
        }
      };
    }

    // Cleanup: stop recognition when component unmounts
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping recognition
        }
      }
    };
  }, [voiceToVoiceMode, isPlaying]);

  const loadPlatformAnalytics = async () => {
    try {
      const response = await fetch(`/api/laura-oracle/analytics?email=${currentUser?.email || 'lalabalavu.jon@gmail.com'}`);
      if (response.ok) {
        const data = await response.json();
        setPlatformAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading platform analytics:', error);
    }
  };

  const playVoiceResponse = useCallback(async (text: string) => {
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
        // Check if response is JSON (error) or audio blob
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Voice API error:', errorData);
          throw new Error(errorData.message || 'Voice generation failed');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setCurrentAudio(audio);
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          
          // In voice-to-voice mode, restart listening after Laura finishes speaking
          if (voiceToVoiceMode && recognitionRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                // Ignore errors when restarting
              }
            }, 300);
          }
        };

        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          
          // In voice-to-voice mode, restart listening even on error
          if (voiceToVoiceMode && recognitionRef.current) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (e) {
                // Ignore errors when restarting
              }
            }, 300);
          }
        };

        await audio.play();
      } else {
        // Handle non-OK responses
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Voice API error response:', errorData);
        throw new Error(errorData.message || `Voice service error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error playing voice response:', error);
      setIsPlaying(false);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Voice generation failed';
      if (errorMessage.includes('API key') || errorMessage.includes('unavailable')) {
        console.warn('⚠️ Voice service unavailable - OpenAI API key may not be configured');
        // Don't show error to user, just log it - text response is still available
      }
      
      // In voice-to-voice mode, restart listening even on error
      if (voiceToVoiceMode && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            // Ignore errors when restarting
          }
        }, 300);
      }
    }
  }, [voiceEnabled, voiceToVoiceMode, currentAudio]);

  const stopVoice = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const toggleMicrophone = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please type your message instead.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setVoiceToVoiceMode(false); // Disable voice-to-voice mode when manually stopping
      } catch (e) {
        console.error('Error stopping recognition:', e);
        setIsListening(false);
      }
    } else {
      try {
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (permError) {
            alert('Microphone permission is required for voice input. Please enable microphone access in your browser settings.');
            return;
          }
        }
        
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.error('Error starting recognition:', e);
        if (e.error === 'not-allowed' || e.name === 'NotAllowedError') {
          alert('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else {
          alert('Failed to start voice recognition. Please try again or type your message.');
        }
        setIsListening(false);
      }
    }
  };

  const toggleVoiceToVoiceMode = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please type your message instead.');
      return;
    }

    const newMode = !voiceToVoiceMode;
    setVoiceToVoiceMode(newMode);

    if (newMode) {
      // Start voice-to-voice mode: enable voice, start listening
      setVoiceEnabled(true);
      if (!isListening && !isPlaying) {
        try {
          // Request microphone permission first
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (permError) {
              alert('Microphone permission is required for voice-to-voice mode. Please enable microphone access in your browser settings.');
              setVoiceToVoiceMode(false); // Revert the toggle
              return;
            }
          }
          
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Error starting voice recognition:', e);
          setVoiceToVoiceMode(false); // Revert the toggle on error
          alert('Failed to start voice recognition. Please try again.');
        }
      }
    } else {
      // Stop voice-to-voice mode: stop listening
      if (isListening) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    }
  };

  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const messageText = overrideText || inputText;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = messageText;
    const wasVoiceInput = usedVoiceInput || !!overrideText;
    setInputText('');
    setUsedVoiceInput(false); // Reset for next message
    setIsTyping(true);

    try {
      // Call the real Laura Oracle API
      const response = await fetch('/api/laura-oracle/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || 'lalabalavu.jon@gmail.com',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: `session-${Date.now()}`,
          userContext: {
            hasAnalytics: !!platformAnalytics
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if the response has an error field
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        
        const lauraResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || data.message || 'No response received',
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

        // Auto-play voice response if voice input was used OR voice is enabled
        if (data.response && (wasVoiceInput || voiceEnabled)) {
          await playVoiceResponse(data.response);
        }
      } else {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to get response from Laura Oracle`);
      }
    } catch (error) {
      console.error('Error calling Laura Oracle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
  }, [inputText, usedVoiceInput, voiceEnabled, currentUser, platformAnalytics, voiceToVoiceMode, playVoiceResponse]);

  // Update the ref whenever handleSendMessage changes
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img 
                  src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-10 h-10 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                  <div className="text-xs text-slate-500">Access Restricted</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
            <p className="text-lg text-slate-600 mb-8">
              The Laura Super Platform Oracle is restricted to administrators only.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                alt="Professional Diver - Diver Well Training" 
                className="w-10 h-10 rounded-lg"
                onError={(e) => {
                  console.error('Logo failed to load');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Laura - Super Platform Oracle</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Laura Oracle Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-purple-200 bg-gradient-to-b from-purple-50 to-white">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-purple-200">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl font-bold">
                    L
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-purple-900">Laura</CardTitle>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 mt-1">
                  Super Platform Oracle
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Your AI assistant for platform administration, analytics, user management, and system optimization.
                  </p>
                </div>

                {/* Voice Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Voice Response</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="text-purple-600 hover:bg-purple-100"
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Voice-to-Voice Mode Toggle */}
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    voiceToVoiceMode ? 'bg-green-50 border-2 border-green-300' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Radio className={`w-4 h-4 ${voiceToVoiceMode ? 'text-green-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${voiceToVoiceMode ? 'text-green-900' : 'text-slate-700'}`}>
                        Voice-to-Voice Mode
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVoiceToVoiceMode}
                      className={voiceToVoiceMode ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-100'}
                      title={voiceToVoiceMode ? 'Disable continuous voice conversation' : 'Enable continuous voice conversation'}
                    >
                      {voiceToVoiceMode ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {voiceToVoiceMode && (
                    <p className="text-xs text-green-700 px-3">
                      🎤 Continuous conversation active - speak naturally, Laura will respond and listen again automatically
                    </p>
                  )}

                  {isPlaying && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Laura is speaking...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopVoice}
                        className="text-green-600 hover:bg-green-100"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick Help Topics - Admin Specific */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Quick Help</h4>
                  <div className="space-y-1">
                    {[
                      "Platform Analytics",
                      "User Management", 
                      "Content Management",
                      "System Health",
                      "Revenue & Affiliates",
                      "Performance Metrics"
                    ].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setInputText(`Tell me about ${topic.toLowerCase()}`)}
                        className="w-full text-left text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 p-2 rounded transition-colors flex items-center space-x-2"
                      >
                        {topic === "Platform Analytics" && <BarChart3 className="w-3 h-3" />}
                        {topic === "User Management" && <Users className="w-3 h-3" />}
                        {topic === "Content Management" && <Database className="w-3 h-3" />}
                        {topic === "System Health" && <Shield className="w-3 h-3" />}
                        {topic === "Revenue & Affiliates" && <Zap className="w-3 h-3" />}
                        {topic === "Performance Metrics" && <BarChart3 className="w-3 h-3" />}
                        <span>{topic}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Stats Summary */}
                {platformAnalytics && (
                  <div className="space-y-2 pt-2 border-t border-purple-200">
                    <h4 className="text-sm font-semibold text-slate-900">Platform Overview</h4>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-semibold">{platformAnalytics.users.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users:</span>
                        <span className="font-semibold">{platformAnalytics.users.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Content Tracks:</span>
                        <span className="font-semibold">{platformAnalytics.content.totalTracks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>System Status:</span>
                        <span className={`font-semibold ${
                          platformAnalytics.health.databaseStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {platformAnalytics.health.databaseStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">Chat with Laura</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">
                      {currentUser?.name || 'Admin'}
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={
                          message.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
                        }>
                          {message.sender === 'user' ? 'U' : 'L'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                          L
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-slate-100 rounded-lg p-3">
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
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isListening ? "Listening..." : "Ask Laura about platform administration, analytics, or optimization..."}
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMicrophone}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                        isListening ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isListening ? 'Stop recording' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isTyping}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {recognitionRef.current ? 'Click the microphone to speak or type your message' : 'Type your message (speech recognition not available)'}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
