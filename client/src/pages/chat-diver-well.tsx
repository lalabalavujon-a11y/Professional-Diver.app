import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Volume2, VolumeX, Pause, Mic, MicOff, Waves } from "lucide-react";
import { Link } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'diverwell';
  timestamp: Date;
}

export default function ChatDiverWell() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Diver Well, your AI Diving Consultant, How can I help you today?",
      sender: 'diverwell',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  // Cleanup: stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const playVoiceResponse = async (text: string) => {
    if (!voiceEnabled) return;

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const response = await fetch('/api/diver-well/voice', {
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
      // Call the Diver Well API
      const response = await fetch('/api/diver-well/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: `session-${Date.now()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const diverWellResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'diverwell',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, diverWellResponse]);

        // Play voice response if enabled
        if (voiceEnabled && data.response) {
          await playVoiceResponse(data.response);
        }
      } else {
        throw new Error('Failed to get response from Diver Well');
      }
    } catch (error) {
      console.error('Error calling Diver Well:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing a technical issue. Please try again or contact support.",
        sender: 'diverwell',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
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
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
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
          if (event.error !== 'no-speech') {
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
          {/* Diver Well Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-blue-200 bg-gradient-to-b from-blue-50 to-white">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Waves className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Diver Well</CardTitle>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
                  Commercial Diving AI Consultant
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">Expertise Areas:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Waves className="w-3 h-3" />
                        <span>Dive Planning & Risk Assessment</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Waves className="w-3 h-3" />
                        <span>Safety Protocols & Procedures</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Waves className="w-3 h-3" />
                        <span>Operational Guidance</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Waves className="w-3 h-3" />
                        <span>Equipment Recommendations</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Waves className="w-3 h-3" />
                        <span>Emergency Response Procedures</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Volume2 className="w-3 h-3" />
                        <span>Voice Communication (Alloy)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                      <Waves className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Chat with Diver Well</span>
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
                          <AvatarFallback className={message.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600'}>
                            {message.sender === 'user' ? 'U' : 'DW'}
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
                          {message.sender === 'diverwell' && voiceEnabled && (
                            <div className="mt-2 flex items-center space-x-1">
                              <Volume2 className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">Voice available</span>
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
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600">DW</AvatarFallback>
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
                      placeholder="Ask Diver Well about dive planning, safety protocols, operational procedures..."
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
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
          </div>
        </div>
        </main>
      </div>
    </>
  );
}

