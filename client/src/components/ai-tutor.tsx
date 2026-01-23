import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Brain, Lightbulb, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// AI Tutor data for each track
const AI_TUTORS = {
  "ndt-inspection": {
    name: "Diver Well",
    specialty: "NDT - a highly trained AI expert in the field of Non-Destructive Testing ready for real time Tutoring",
    avatar: "👩‍🔬",
    background: "Underwater inspection specialist with expertise in materials and corrosion assessment",
    traits: ["Detail-oriented", "Technical expert", "Patient teacher"],
    responses: {
      greeting: "I'm Diver Well, your AI tutor for underwater inspection and NDT. I've spent over 20 years perfecting underwater inspection techniques. What would you like to explore today?",
      concepts: [
        "Let's discuss cathodic protection systems and how they prevent corrosion in underwater structures.",
        "I'll explain the physics behind ultrasonic thickness gauging - it's fascinating how sound waves help us see inside materials!",
        "Would you like me to walk you through the magnetic particle inspection process step by step?"
      ],
      tips: [
        "💡 Always calibrate your thickness gauge in the same medium you'll be testing - water affects ultrasonic readings.",
        "⚠️ Remember: Visual inspection comes first, NDT methods confirm what we suspect.",
        "🔍 Document everything! Your inspection report could save lives and prevent millions in damage."
      ]
    }
  },
  "air-diver-certification": {
    name: "Diver Well",
    specialty: "Diving Physics - a highly trained AI expert in the field of Diving Physics and Decompression Theory ready for real time Tutoring",
    avatar: "👨‍🔬",
    background: "Diving physics specialist, decompression theory expert",
    traits: ["Physics expert", "Theory-focused", "Safety advocate"],
    responses: {
      greeting: "I'm Diver Well, your diving physics AI tutor. Understanding the physics behind diving is crucial for safe operations. Let's master the science that keeps divers safe!",
      concepts: [
        "Gas laws govern everything in diving - Boyle's, Charles's, and Dalton's laws are your foundation.",
        "Pressure effects on the human body determine safe diving limits and decompression requirements.",
        "Decompression theory helps us understand nitrogen absorption and elimination in body tissues."
      ],
      tips: [
        "📊 Always calculate gas requirements before diving - running out of air is not an option.",
        "⏰ Time and depth are your primary safety factors - respect both limits.",
        "🧮 Understanding gas laws helps you predict equipment behavior at different depths."
      ]
    }
  },
  "diver-medic": {
    name: "Diver Well",
    specialty: "DMT - a highly trained AI expert in the field of Dive Medicine ready for real time Tutoring",
    avatar: "👨‍⚕️",
    background: "Diving medicine and hyperbaric operations specialist",
    traits: ["Emergency-focused", "Clear communicator", "Life-saving expertise"],
    responses: {
      greeting: "I'm Diver Well, your medical AI tutor. As an emergency physician specializing in diving medicine, I'm here to help you master life-saving techniques. Ready to learn?",
      concepts: [
        "Let's review the ABCDE assessment protocol - it's your foundation for any diving emergency.",
        "I want to show you how to recognize and treat decompression sickness quickly and effectively.",
        "Understanding nitrogen narcosis symptoms could save a diver's life - let me explain the signs."
      ],
      tips: [
        "🚨 In diving emergencies, time is brain tissue - act fast but think faster.",
        "💨 High-flow oxygen is your best friend in almost every diving accident.",
        "📞 Always have emergency contact numbers memorized - seconds count in real emergencies."
      ]
    }
  },
  "commercial-supervisor": {
    name: "Diver Well",
    specialty: "Commercial Dive Supervisor Training - a highly trained AI expert in the field of Commercial Diving Operations ready for real time Tutoring",
    avatar: "👨‍✈️",
    background: "Commercial dive supervision and operations specialist",
    traits: ["Leadership-focused", "Safety-first", "Decision maker"],
    responses: {
      greeting: "I'm Diver Well, your Commercial Dive Supervisor tutor. I've supervised thousands of commercial dives. Leadership underwater requires split-second decisions and absolute safety focus. Let's build your command skills.",
      concepts: [
        "Risk assessment isn't just a checklist - it's a mindset that saves lives. Let me show you my approach.",
        "Communication protocols can make or break a dive operation. I'll teach you the standards that matter.",
        "Emergency response planning: Hope for the best, prepare for the worst. Here's how we do it."
      ],
      tips: [
        "🎯 A good supervisor is always thinking three steps ahead of the current operation.",
        "📋 Your pre-dive briefing sets the tone for safety - make every word count.",
        "⚡ When things go wrong, stay calm, communicate clearly, execute the plan."
      ]
    }
  },
  "air-diving-life-support-technician": {
    name: "Diver Well",
    specialty: "Assistant Life Support Technician - a highly trained AI expert in the field of Air Diving Life Support ready for real time Tutoring",
    avatar: "👩‍⚕️",
    background: "Life support systems specialist",
    traits: ["Systems-focused", "Safety expert", "Technical precision"],
    responses: {
      greeting: "I'm Diver Well, your life support AI tutor. I specialize in keeping divers alive through proper air systems management. Ready to master life support systems?",
      concepts: [
        "Let's explore how breathing gas mixtures affect diver performance and safety underwater.",
        "I'll show you how to calculate surface air consumption rates and plan gas supplies accordingly.",
        "Understanding compressor maintenance is critical - contaminated air kills divers."
      ],
      tips: [
        "🔧 Regular compressor maintenance isn't optional - it's life insurance for your divers.",
        "📊 Always monitor gas consumption rates - they tell you everything about diver stress and efficiency.",
        "⚠️ Never compromise on air quality testing - your reputation and lives depend on it."
      ]
    }
  },
  "lst": {
    name: "Diver Well", 
    specialty: "LST - a highly trained AI expert in the field of Limited Surface Supply ready for real time Tutoring",
    avatar: "👨‍🔧",
    background: "Surface supply specialist, tender operations expert",
    traits: ["Detail-oriented", "Communication expert", "Reliability-focused"],
    responses: {
      greeting: "I'm Diver Well, your surface supply AI tutor. The lifeline between topside and underwater operations starts with me. Let's ensure perfect communication and supply.",
      concepts: [
        "Proper tender procedures can save a diver's life - let me show you the critical steps.",
        "Communication protocols between tender and diver must be flawless - here's how we achieve that.",
        "Understanding umbilical management prevents entanglement and ensures continuous life support."
      ],
      tips: [
        "🎧 Clear communication saves lives - always confirm your messages are understood.",
        "🔄 Keep your umbilical organized - a tangled line can become a death trap.",
        "👁️ Watch your diver's bubbles - they tell you everything about their condition below."
      ]
    }
  },
  "saturation-diving": {
    name: "Diver Well",
    specialty: "Saturation Diving Systems - a highly trained AI expert in the field of Saturation Diving Operations ready for real time Tutoring",
    avatar: "👨‍🔬",
    background: "Saturation diving specialist, life support systems expert",
    traits: ["Systems-focused", "Technical precision", "Safety expert"],
    responses: {
      greeting: "I'm Diver Well, your saturation diving AI tutor. Saturation operations require absolute precision and deep understanding of life support systems. Let's master these critical skills together!",
      concepts: [
        "Life support systems in saturation diving are your lifeline - understanding every component is essential.",
        "Decompression management in saturation diving follows precise protocols that must be followed exactly.",
        "Human factors in confined environments require special psychological and physical preparation."
      ],
      tips: [
        "🔧 Regular system checks prevent catastrophic failures in saturation environments.",
        "⏰ Time management in saturation diving is critical - every minute counts.",
        "🧠 Mental preparation is as important as physical training for saturation operations."
      ]
    }
  },
  "underwater-welding": {
    name: "Diver Well",
    specialty: "Underwater Welding - a highly trained AI expert in the field of Underwater Welding Operations ready for real time Tutoring",
    avatar: "👨‍🔧",
    background: "Underwater welding specialist, marine construction expert",
    traits: ["Precision-focused", "Quality expert", "Safety advocate"],
    responses: {
      greeting: "I'm Diver Well, your underwater welding AI tutor. Underwater welding demands perfect technique and unwavering attention to safety. Let's build your expertise in this challenging field!",
      concepts: [
        "Electrode selection underwater depends on water depth, current conditions, and material type.",
        "Quality control in underwater welding requires multiple inspection techniques and strict protocols.",
        "Safety protocols in underwater welding protect both the welder and the integrity of the work."
      ],
      tips: [
        "⚡ Electrical safety underwater is paramount - never compromise on safety procedures.",
        "🔍 Visual inspection of welds underwater requires specialized techniques and equipment.",
        "📋 Documentation of welding parameters ensures quality and traceability."
      ]
    }
  },
  "hyperbaric-operations": {
    name: "Diver Well",
    specialty: "Hyperbaric Operations - a highly trained AI expert in the field of Hyperbaric Chamber Operations ready for real time Tutoring",
    avatar: "👨‍⚕️",
    background: "Hyperbaric medicine specialist, chamber operations expert",
    traits: ["Medical precision", "Patient safety", "Technical expertise"],
    responses: {
      greeting: "I'm Diver Well, your hyperbaric operations AI tutor. Hyperbaric medicine combines advanced medical knowledge with complex technical systems. Let's ensure you're ready for any situation!",
      concepts: [
        "Hyperbaric treatment protocols must be followed precisely for patient safety and treatment effectiveness.",
        "Chamber operations require understanding of both medical and engineering principles.",
        "Emergency procedures in hyperbaric chambers must be second nature for all operators."
      ],
      tips: [
        "🏥 Patient monitoring in hyperbaric chambers requires constant vigilance and quick response.",
        "🔧 Regular maintenance of hyperbaric equipment prevents dangerous malfunctions.",
        "📊 Accurate record-keeping in hyperbaric operations ensures patient safety and regulatory compliance."
      ]
    }
  },
  "alst": {
    name: "Diver Well",
    specialty: "Assistant Life Support Technician - a highly trained AI expert in the field of Assistant Life Support Operations ready for real time Tutoring",
    avatar: "👨‍⚕️",
    background: "Advanced life support specialist, saturation diving medical expert",
    traits: ["Advanced medical", "System expert", "Emergency response"],
    responses: {
      greeting: "I'm Diver Well, your Assistant Life Support Technician AI tutor. Assistant Life Support operations require the highest level of medical and technical expertise. Let's prepare you for the most challenging scenarios!",
      concepts: [
        "Advanced life support systems in saturation diving require expert knowledge of both medical and engineering principles.",
        "Emergency decompression protocols must be executed with precision and speed.",
        "Saturation diving medical procedures combine hyperbaric medicine with advanced life support techniques."
      ],
      tips: [
        "🚨 Emergency response in saturation environments requires split-second decision making.",
        "🔬 Advanced monitoring systems provide critical data for life support operations.",
        "👥 Team coordination in life support operations is essential for success."
      ]
    }
  },
  "content-editor": {
    name: "Diver Well",
    specialty: "Content Creation Assistant - a highly trained AI expert ready to help with content creation, editing, and professional diving education",
    avatar: "✍️",
    background: "Content creation and educational specialist",
    traits: ["Helpful", "Creative", "Detail-oriented"],
    responses: {
      greeting: "I'm Diver Well, your content creation assistant. I'm here to help you create professional, engaging, and accurate content for the Professional Diver Training Platform. How can I assist you today?",
      concepts: [
        "Effective content structure helps learners understand complex diving concepts step by step.",
        "Visual aids and examples make technical information more accessible and memorable.",
        "Clear, concise writing with proper formatting enhances learning outcomes."
      ],
      tips: [
        "💡 Use headings and subheadings to organize content logically.",
        "📝 Include real-world examples and scenarios to illustrate concepts.",
        "✅ Review content for accuracy and clarity before publishing."
      ]
    }
  }
};

interface AITutorProps {
  trackSlug: string;
  lessonTitle?: string;
}

export default function AITutor({ trackSlug, lessonTitle }: AITutorProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "concepts" | "tips">("chat");
  const [messages, setMessages] = useState<Array<{ type: "tutor" | "user"; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<{
    stop(): void;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tutor = AI_TUTORS[trackSlug as keyof typeof AI_TUTORS];

  // Cleanup: stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!tutor) {
    return null;
  }

  const playVoiceResponse = async (text: string) => {
    if (!voiceEnabled) return;

    try {
      // Call OpenAI TTS API (voice is handled server-side, defaults to Alloy)
      const response = await fetch('/api/diver-well/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing voice response:', error);
      setIsSpeaking(false);
    }
  };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      // Start voice recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        interface SpeechRecognitionConstructor {
          new (): {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            start(): void;
            stop(): void;
            onstart: (() => void) | null;
            onresult: ((event: { resultIndex: number; results: Array<{ isFinal: boolean; [index: number]: { transcript: string } }> }) => void) | null;
            onerror: ((event: { error: string }) => void) | null;
            onend: (() => void) | null;
          };
        }
        const SpeechRecognition = ((window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition || 
          (window as typeof window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
        
        if (!SpeechRecognition) {
          alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
          return;
        }
        
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onstart = () => {
          setIsRecording(true);
        };
        
        recognitionInstance.onresult = (event: { resultIndex: number; results: Array<{ isFinal: boolean; [index: number]: { transcript: string } }> }) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }
          
          // Update the input text with transcribed speech
          if (finalTranscript) {
            setInputMessage((prev) => prev + finalTranscript.trim());
          }
        };
        
        recognitionInstance.onerror = (event: { error: string }) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error !== 'no-speech') {
            alert('Speech recognition error. Please try again.');
          }
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        
        recognitionInstance.start();
        recognitionRef.current = recognitionInstance;
      } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      }
    } else {
      // Stop voice recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsRecording(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");

    // Add user message immediately
    const userMessageObj = { type: "user" as const, content: userMessage };
    setMessages(prev => [...prev, userMessageObj]);

    // Add loading message
    const loadingMessage = { type: "tutor" as const, content: "Thinking..." };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Map trackSlug to discipline for the API
      const disciplineMap: Record<string, string> = {
        'ndt-inspection': 'NDT',
        'diver-medic': 'DMT',
        'commercial-supervisor': 'Commercial Dive Supervisor',
        'saturation-diving': 'Saturation Diving',
        'underwater-welding': 'Underwater Welding',
        'hyperbaric-operations': 'Hyperbaric Operations',
        'alst': 'Assistant Life Support Technician',
        'lst': 'LST',
        'air-diver-certification': 'Air Diver Certification'
      };

      const discipline = disciplineMap[trackSlug] || 'NDT';

      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discipline,
          message: userMessage,
          sessionId: `session-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [...withoutLoading, { type: "tutor" as const, content: data.response }];
      });

      // Play voice response if enabled
      if (voiceEnabled && data.response) {
        await playVoiceResponse(data.response);
      }

    } catch (error) {
      console.error('Error calling AI Tutor API:', error);
      
      // Remove loading message and add fallback response
      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        return [...withoutLoading, { 
          type: "tutor" as const, 
          content: generateTutorResponse(userMessage, tutor, lessonTitle) 
        }];
      });
    }
  };

  const startConversation = () => {
    if (messages.length === 0) {
      setMessages([{ type: "tutor", content: tutor.responses.greeting }]);
      setActiveTab("chat");
    }
  };

  return (
    <Card className="mt-8 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{tutor.avatar}</div>
          <div>
            <CardTitle className="text-xl text-blue-900" data-testid="text-tutor-name">
              {tutor.name}
            </CardTitle>
            <p className="text-blue-700 font-medium">{tutor.specialty}</p>
            <p className="text-sm text-blue-600">{tutor.background}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {tutor.traits.map((trait, index) => (
            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
              {trait}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("chat")}
            className="flex items-center gap-2"
            data-testid="button-chat-tab"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
          <Button
            variant={activeTab === "concepts" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("concepts")}
            className="flex items-center gap-2"
            data-testid="button-concepts-tab"
          >
            <Brain className="w-4 h-4" />
            Key Concepts
          </Button>
          <Button
            variant={activeTab === "tips" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("tips")}
            className="flex items-center gap-2"
            data-testid="button-tips-tab"
          >
            <Lightbulb className="w-4 h-4" />
            Pro Tips
          </Button>
        </div>

        {activeTab === "chat" && (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-blue-400 mb-4" />
                <p className="text-blue-700 mb-4">Start a conversation with your AI tutor!</p>
                <Button onClick={startConversation} data-testid="button-start-chat">
                  Begin Learning Session
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.type === "tutor"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-white text-slate-900 ml-8"
                    }`}
                    data-testid={`message-${message.type}`}
                  >
                    <strong>{message.type === "tutor" ? tutor.name : "You"}:</strong> {message.content}
                  </div>
                ))}
              </div>
            )}
            
            {messages.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask your tutor a question..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={toggleVoiceRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    title={isRecording ? "Stop Recording" : "Start Voice Input"}
                    data-testid="button-voice-input"
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button onClick={handleSendMessage} data-testid="button-send-message">
                    Send
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      variant={voiceEnabled ? "default" : "outline"}
                      size="sm"
                      title={voiceEnabled ? "Disable Voice Output" : "Enable Voice Output"}
                      data-testid="button-voice-toggle"
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    {isSpeaking && (
                      <Button
                        onClick={stopVoice}
                        variant="outline"
                        size="sm"
                        title="Stop Speaking"
                        data-testid="button-stop-voice"
                      >
                        Stop
                      </Button>
                    )}
                  </div>
                  {voiceEnabled && (
                    <span className="text-xs text-slate-500">Voice enabled (Alloy)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "concepts" && (
          <div className="space-y-3">
            {tutor.responses.concepts.map((concept, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <Brain className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {concept}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {activeTab === "tips" && (
          <div className="space-y-3">
            {tutor.responses.tips.map((tip, index) => (
              <Alert key={index} className="border-amber-200 bg-amber-50">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {tip}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Generate contextual responses based on user input and lesson content
function generateTutorResponse(userInput: string, tutor: any, lessonTitle?: string): string {
  const input = userInput.toLowerCase();
  
  // Context-aware responses based on lesson title and user input
  if (input.includes("help") || input.includes("explain")) {
    return `I'd be happy to help! Based on what we're covering${lessonTitle ? ` in "${lessonTitle}"` : ""}, here's my explanation: ${tutor.responses.concepts[0]}`;
  }
  
  if (input.includes("emergency") || input.includes("danger")) {
    return "Emergency situations require immediate, methodical response. Remember your training: assess the situation, ensure safety, then act decisively. What specific emergency scenario would you like to discuss?";
  }
  
  if (input.includes("equipment") || input.includes("tool")) {
    return "Equipment knowledge is crucial for safety and efficiency. Each tool has its specific purpose and limitations. What equipment would you like to learn more about?";
  }
  
  if (input.includes("safety") || input.includes("risk")) {
    return "Safety is paramount in our field. Every procedure, every decision, every action should be evaluated through the lens of risk management. What safety concern can I help address?";
  }
  
  // Default encouraging response
  const encouragingResponses = [
    "That's a great question! Let me share my experience with that topic.",
    "I appreciate your curiosity. In my years of experience, I've found that...",
    "Excellent thinking! This is exactly the kind of question that shows you're developing professional judgment.",
    "Your question demonstrates good awareness. Here's what I've learned over the years..."
  ];
  
  return encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)] + " Feel free to ask me more specific questions about the techniques and procedures we're covering.";
}