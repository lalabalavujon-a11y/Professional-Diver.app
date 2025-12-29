import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function LauraAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  // Get current user data to check admin access
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  return (
    <>
      {/* Fixed position diving helmet chat bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          data-testid="button-laura-chat-bubble"
          title="Chat with Laura - Your Platform Oracle"
        >
          {/* KM37 Diving Helmet SVG */}
          <svg 
            className="w-9 h-9 text-white transition-transform group-hover:scale-110" 
            fill="currentColor" 
            viewBox="0 0 100 100"
          >
            {/* Helmet main body */}
            <ellipse cx="50" cy="45" rx="35" ry="28" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.9"/>
            
            {/* Front glass port */}
            <circle cx="50" cy="40" r="18" fill="rgba(255,255,255,0.3)" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="50" cy="40" r="14" fill="rgba(255,255,255,0.1)" stroke="currentColor" strokeWidth="1"/>
            
            {/* Side ports */}
            <circle cx="25" cy="42" r="6" fill="rgba(255,255,255,0.2)" stroke="currentColor" strokeWidth="1"/>
            <circle cx="75" cy="42" r="6" fill="rgba(255,255,255,0.2)" stroke="currentColor" strokeWidth="1"/>
            
            {/* Air supply connections */}
            <rect x="47" y="65" width="6" height="8" rx="2" fill="currentColor"/>
            <rect x="42" y="70" width="4" height="6" rx="1" fill="currentColor"/>
            <rect x="54" y="70" width="4" height="6" rx="1" fill="currentColor"/>
            
            {/* Helmet rim/collar */}
            <ellipse cx="50" cy="68" rx="38" ry="8" fill="none" stroke="currentColor" strokeWidth="2"/>
            
            {/* Communication equipment */}
            <rect x="20" y="38" width="8" height="4" rx="2" fill="currentColor"/>
            <rect x="72" y="38" width="8" height="4" rx="2" fill="currentColor"/>
          </svg>
          
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
        </Button>
        
        {/* Laura availability indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] mx-auto p-4 sm:p-6" data-testid="dialog-laura-assistant">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center space-x-3 flex-wrap">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                {/* KM37 Diving Helmet Icon */}
                <svg 
                  className="w-7 h-7 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 100 100"
                >
                  <ellipse cx="50" cy="45" rx="35" ry="28" fill="currentColor" opacity="0.9"/>
                  <circle cx="50" cy="40" r="18" fill="rgba(255,255,255,0.3)"/>
                  <circle cx="50" cy="40" r="14" fill="rgba(255,255,255,0.1)"/>
                  <circle cx="25" cy="42" r="6" fill="rgba(255,255,255,0.2)"/>
                  <circle cx="75" cy="42" r="6" fill="rgba(255,255,255,0.2)"/>
                  <rect x="47" y="65" width="6" height="8" rx="2" fill="currentColor"/>
                  <ellipse cx="50" cy="68" rx="38" ry="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xl font-semibold block">Laura</span>
                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs whitespace-nowrap">
                    Platform Oracle
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Your dedicated Platform Oracle for guidance, support, and Professional Diver expertise
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 sm:py-4 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              {/* Support Option */}
              <div className="border border-blue-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <h4 className="font-semibold text-slate-900 text-base">Support</h4>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs whitespace-nowrap flex-shrink-0">
                    Platform Help
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Platform guidance, account management, technical support, and feature navigation
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white min-h-[48px] text-sm sm:text-base whitespace-normal break-words"
                  onClick={() => {
                    setIsOpen(false);
                    window.open(isAdmin ? '/chat/laura' : '/chat/support', '_blank');
                  }}
                  data-testid="button-chat-laura-support"
                >
                  <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">{isAdmin ? "Laura Oracle (Admin)" : "Laura AI Assistant"}</span>
                </Button>
              </div>

              {/* Operations - Platform Integrated */}
              <div className="border border-teal-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-teal-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                    <h4 className="font-semibold text-slate-900 text-base">Operations</h4>
                  </div>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs whitespace-nowrap flex-shrink-0">
                    Platform
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  Diver Well AI Consultant - Dive planning, safety protocols, equipment guidance, and operational support
                </p>
                <div className="mb-4 p-3 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <svg className="w-3 h-3 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span className="break-words"><strong>Powered by LangChain & LangSmith:</strong> Constantly updating daily with the latest commercial diving knowledge and best practices</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white min-h-[48px] text-sm sm:text-base whitespace-normal break-words"
                  onClick={() => {
                    setIsOpen(false);
                    window.open('/chat/diver-well', '_blank');
                  }}
                  data-testid="button-diver-well-platform"
                >
                  <MessageCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">Diver Well AI Consultant (Platform)</span>
                </Button>
              </div>

              {/* Operations - OpenAI GPT */}
              <div className="border border-slate-200 rounded-lg p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                    <h4 className="font-semibold text-slate-900 text-base">Operations</h4>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs whitespace-nowrap flex-shrink-0">
                    OpenAI GPT
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Access the Diver Well AI Consultant via OpenAI's ChatGPT interface
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[48px] text-sm sm:text-base whitespace-normal break-words"
                  onClick={() => {
                    setIsOpen(false);
                    window.open('https://chatgpt.com/g/g-6897d42d3ba48191b48883a4839c09bf-diver-well-commercial-diver-ai-consultant', '_blank');
                  }}
                  data-testid="button-diver-well-openai"
                >
                  <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="break-words">Diver Well AI Consultant (OpenAI GPT)</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}