import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Mic, MicOff, Volume2, VolumeX, Play, Pause, Headphones, Radio } from "lucide-react";
import { Link } from "wouter";
// Logo import removed for build compatibility

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'laura';
  timestamp: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function ChatSupport() {
  // Get current user data
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm Laura, your friendly AI assistant for Professional Diver Training Platform. I'm here to help you with platform navigation, course information, technical support, and answer any questions about your diving education journey. I can also help you connect with our affiliate program or schedule consultations with our admin team. How can I assist you today?`,
      sender: 'laura',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  // Initialize speech recognition with permission handling
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
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

  const playVoiceResponse = useCallback(async (text: string) => {
    if (!voiceEnabled) return;

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const response = await fetch('/api/chat-support/voice', {
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
      alert('Speech recognition is not supported in your browser.');
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

  const toggleVoiceToVoiceMode = () => {
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
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error('Error starting voice recognition:', e);
        }
      }
    } else {
      // Stop voice-to-voice mode: stop listening
      if (isListening) {
        try {
          recognitionRef.current.stop();
          setIsListening(false);
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    // Course and platform information
    if (lowerInput.includes('course') || lowerInput.includes('track') || lowerInput.includes('lesson')) {
      return "Our Professional Diver Training Platform offers comprehensive courses including Commercial Diving, Underwater Welding, NDT Inspection, and specialized certifications. You can access your learning tracks from the dashboard, track your progress, and take practice exams. Each course is designed by industry experts with real-world applications. Would you like me to guide you to a specific course or help you understand the learning path?";
    }

    // Technical support
    if (lowerInput.includes('problem') || lowerInput.includes('issue') || lowerInput.includes('error') || lowerInput.includes('bug')) {
      return "I'm here to help with any technical issues! Common solutions include: refreshing your browser, clearing cache, checking your internet connection, or trying a different browser. If you're having trouble with course access, quiz submissions, or video playback, I can guide you through troubleshooting steps. For persistent issues, I can also connect you with our technical support team. What specific problem are you experiencing?";
    }

    // Account and subscription
    if (lowerInput.includes('account') || lowerInput.includes('subscription') || lowerInput.includes('billing') || lowerInput.includes('payment')) {
      return "For account and subscription questions, I can help you understand our pricing tiers, upgrade options, and billing cycles. We offer Trial, Monthly, Annual, and Lifetime subscriptions with different access levels. If you need to update payment information or have billing concerns, I can direct you to the appropriate resources or schedule a consultation with our admin team. What account assistance do you need?";
    }

    // Affiliate program
    if (lowerInput.includes('affiliate') || lowerInput.includes('commission') || lowerInput.includes('referral') || lowerInput.includes('earn')) {
      return "Excellent! Our affiliate program offers 50% commission on all referrals - it's one of the most lucrative programs in the diving education industry! You can earn substantial income by referring students to our professional diving courses. I can guide you through the signup process, explain commission structures, and help you access marketing materials. Would you like me to walk you through getting started with our affiliate program?";
    }

    // Certification and career
    if (lowerInput.includes('certification') || lowerInput.includes('career') || lowerInput.includes('job') || lowerInput.includes('employment')) {
      return "Our certifications are industry-recognized and designed to advance your diving career! We offer pathways for Commercial Diving, Underwater Welding, NDT Inspection, and specialized roles like Dive Supervisor and Life Support Technician. Many of our graduates find employment with offshore companies, marine construction firms, and inspection services. I can help you understand which certifications align with your career goals. What type of diving career interests you most?";
    }

    // Admin consultation
    if (lowerInput.includes('admin') || lowerInput.includes('consultation') || lowerInput.includes('meeting') || 
        lowerInput.includes('speak to') || lowerInput.includes('talk to')) {
      return "I can absolutely help you schedule a consultation with our admin team! For complex account issues, business partnerships, custom training programs, or detailed career guidance, our administrators provide personalized support. Please let me know your preferred date/time and the nature of your inquiry, and I'll coordinate with our admin team to schedule your consultation. You can also reach out directly to 1pull@professionaldiver.app for immediate admin assistance.";
    }

    // Diving operations questions
    if (lowerInput.includes('diving') || lowerInput.includes('underwater') || lowerInput.includes('safety') || 
        lowerInput.includes('equipment') || lowerInput.includes('operation')) {
      return "For specific diving operations, safety protocols, and technical diving questions, I can connect you with our exclusive Diver Well AI Consultant - a specialized system designed for commercial diving operations. This consultant provides expert guidance on dive planning, safety procedures, equipment selection, and operational best practices. Would you like me to direct you to the Diver Well AI Consultant for detailed diving operations support?";
    }

    // Default helpful response
    return `Hello! I'm here to help you with anything related to Professional Diver Training Platform. I can assist with:

• Course information and navigation
• Technical support and troubleshooting  
• Account and subscription questions
• Our 50% commission affiliate program
• Career guidance and certifications
• Scheduling admin consultations
• Connecting you with specialized diving operations support

What would you like help with today? Feel free to ask me anything or use the microphone button to speak your question!`;
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
      // Call the support chat API
      const response = await fetch('/api/chat-support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: `support-session-${Date.now()}`,
          userContext: {
            userEmail: currentUser?.email
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
          timestamp: new Date()
        };
        setMessages(prev => [...prev, lauraResponse]);
        
        // Auto-play voice response if voice input was used OR voice is enabled
        if (data.response && (wasVoiceInput || voiceEnabled)) {
          await playVoiceResponse(data.response);
        }
      } else {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to get response from support chat`);
      }
    } catch (error) {
      console.error('Error calling support chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm experiencing a technical issue: ${errorMessage}. Please try again or contact 1pull@professionaldiver.app for assistance.`,
        sender: 'laura',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, usedVoiceInput, voiceEnabled, currentUser, voiceToVoiceMode, playVoiceResponse]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                alt="Professional Diver - Diver Well Training" 
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Laura - Support Assistant</div>
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
          {/* Laura Assistant Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white">
              <CardHeader className="text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-blue-200">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                    L
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-blue-900">Laura</CardTitle>
                <p className="text-sm text-blue-600">Support Assistant</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-4">
                    Your friendly AI assistant for platform support, course guidance, and general assistance.
                  </p>
                </div>

                {/* Voice Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Voice Response</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </div>

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
                </div>

                {/* Quick Help Topics */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">Quick Help</h4>
                  <div className="space-y-1">
                    {[
                      "Course Information",
                      "Technical Support", 
                      "Account Questions",
                      "Affiliate Program",
                      "Career Guidance",
                      "Admin Consultation"
                    ].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setInputText(`Tell me about ${topic.toLowerCase()}`)}
                        className="w-full text-left text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
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
                      {currentUser?.name || 'User'}
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
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
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
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
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
                      placeholder="Ask Laura anything about the platform..."
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
