import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Headphones, MessageCircle, ExternalLink, User, Settings, HelpCircle, Wrench } from "lucide-react";

export default function DualAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          data-testid="button-ai-assistants"
          title="AI Assistants"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span className="hidden md:inline text-sm font-medium">AI Assistants</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-ai-assistants">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <span>Professional Diver AI Assistants</span>
          </DialogTitle>
          <DialogDescription>
            Choose your specialized AI assistant for personalized support and guidance
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Laura - Admin & Support Assistant */}
          <Card className="cursor-pointer border-purple-200 hover:border-purple-300 transition-colors group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Laura</CardTitle>
                    <CardDescription className="text-sm">Admin & Support</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Platform
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600 mb-4">
                Your dedicated platform assistant for account management, technical support, billing inquiries, and general platform guidance.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <User className="w-3 h-3" />
                  <span>Account Management</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Settings className="w-3 h-3" />
                  <span>Technical Support</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <HelpCircle className="w-3 h-3" />
                  <span>Platform Guidance</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  setIsOpen(false);
                  // Open embedded chat or redirect to internal Laura chat
                  const w = window.open('/chat/laura', '_blank');
                  if (!w) window.location.href = '/chat/laura';
                }}
                data-testid="button-chat-laura"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Laura
              </Button>
            </CardContent>
          </Card>

          {/* Diver Well AI Consultant - Diving Operations */}
          <Card className="cursor-pointer border-blue-200 hover:border-blue-300 transition-colors group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Diver Well AI</CardTitle>
                    <CardDescription className="text-sm">Diving Operations</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Exclusive
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600 mb-4">
                Your expert commercial diving consultant for dive plans, safety protocols, supervision guidance, and operational support.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <span>Dive Planning</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                  <span>Safety Protocols</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  <span>Supervision Training</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setIsOpen(false);
                  // Platform-exclusive access to ChatGPT consultant
                  const url = 'https://chatgpt.com/g/g-6897d42d3ba48191b48883a4839c09bf-diver-well-commercial-diver-ai-consultant';
                  const w = window.open(url, '_blank');
                  if (!w) window.location.href = url;
                }}
                data-testid="button-chat-diver-well"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Diver Well AI
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="border-t pt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">Platform-Exclusive Access</p>
                <p className="text-xs text-blue-700">
                  The Diver Well AI Consultant is exclusively available to Professional Diver platform members, providing specialized diving expertise you won't find anywhere else.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}