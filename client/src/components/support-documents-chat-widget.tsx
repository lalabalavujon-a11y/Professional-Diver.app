import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft, Send, MessageCircle, HelpCircle, User as UserIcon, Zap, BookOpen, Settings, Bug } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'laura';
  timestamp: Date;
}

interface SupportDocumentsChatWidgetProps {
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function SupportDocumentsChatWidget({ currentSection, onSectionChange }: SupportDocumentsChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Laura, your Platform Oracle. I'm here to help you understand the platform features and answer any questions you have. What would you like to know?",
      sender: 'laura',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickTopics = [
    { id: 'general', label: 'How do I...?', question: 'How do I get started with the platform?', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'account', label: 'Account Help', question: 'Help me with my account and subscription questions', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning Help', question: 'How do I use the training tracks and lessons?', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'technical', label: 'Technical Issues', question: 'I need help with a technical issue or error', icon: <Bug className="w-4 h-4" /> },
    { id: 'features', label: 'Feature Guide', question: 'Can you explain a specific platform feature?', icon: <Zap className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings Help', question: 'How do I configure my account settings?', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInputText('');
    setIsTyping(true);

    try {
      // Add context about current section if available
      const contextualMessage = currentSection 
        ? `${textToSend} (User is currently viewing the "${currentSection}" section of the support documents)`
        : textToSend;

      const response = await fetch('/api/laura-oracle/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contextualMessage,
          sessionId: `support-docs-${Date.now()}`,
          userContext: {
            currentSection: currentSection || 'general',
            page: 'support-documents',
            userRole: currentUser?.role || 'USER'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const lauraResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'laura',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, lauraResponse]);
      } else {
        throw new Error('Failed to get response from Laura');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or visit /chat/laura for the full chat interface.",
        sender: 'laura',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickTopic = (topic: typeof quickTopics[0]) => {
    handleSendMessage(topic.question);
  };

  return (
    <div className={`fixed right-0 top-20 bottom-0 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 h-12 w-12 rounded-l-lg rounded-r-none shadow-lg ${isOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        size="sm"
        aria-label={isOpen ? 'Close Laura chat' : 'Open Laura chat'}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </Button>

      {/* Chat Panel */}
      <Card className="h-full w-96 rounded-l-lg rounded-r-none shadow-xl border-r-2 flex flex-col m-0">
        <CardHeader className="border-b pb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Laura Oracle</CardTitle>
                <div className="flex items-center space-x-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-100">Online</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
              Support
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Quick Topic Buttons */}
          {messages.length <= 1 && (
            <div className="p-4 border-b bg-slate-50">
              <p className="text-xs font-medium text-slate-700 mb-2">Quick Help:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickTopics.slice(0, 4).map((topic) => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-2 justify-start border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleQuickTopic(topic)}
                  >
                    <span className="mr-1">{topic.icon}</span>
                    <span className="truncate">{topic.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className={message.sender === 'user' ? 'bg-blue-600 text-white text-xs' : 'bg-purple-600 text-white text-xs'}>
                        {message.sender === 'user' ? 'U' : 'L'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg px-3 py-2 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-purple-600 text-white text-xs">L</AvatarFallback>
                    </Avatar>
                    <div className="bg-slate-100 rounded-lg px-3 py-2">
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
          </ScrollArea>

          {/* All Quick Topics (when collapsed) */}
          {messages.length > 1 && (
            <div className="p-2 border-t bg-slate-50 max-h-32 overflow-y-auto">
              <ScrollArea>
                <div className="flex flex-wrap gap-1">
                  {quickTopics.map((topic) => (
                    <Button
                      key={topic.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => handleQuickTopic(topic)}
                    >
                      {topic.icon}
                      <span className="ml-1">{topic.label}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t bg-white">
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Laura anything..."
                className="flex-1"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Laura has access to comprehensive platform documentation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



