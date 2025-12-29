import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink } from "lucide-react";

export default function DiverWellAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Fixed position diving helmet chat bubble */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
          data-testid="button-diver-well-chat-bubble"
          title="Chat with Diver Well - Commercial Diving Operations Consultant"
        >
          {/* Diving Helmet SVG - Teal theme */}
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
          <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20"></div>
        </Button>
        
        {/* Diver Well availability indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-diver-well-assistant">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center">
                {/* Diving Helmet Icon */}
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
              <div>
                <span className="text-xl">Diver Well</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">
                    Operations Consultant
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Your expert commercial diving consultant for dive plans, safety protocols, supervision guidance, and operational support
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gradient-to-br from-teal-50 to-slate-50 p-4 rounded-lg border border-teal-100">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Diver Well's Expertise
              </h4>
              
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Dive Planning:</span>
                    <span className="text-slate-600 ml-1">Risk assessment, dive plans, operational protocols</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Safety Protocols:</span>
                    <span className="text-slate-600 ml-1">Emergency procedures, safety standards, compliance</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Equipment Guidance:</span>
                    <span className="text-slate-600 ml-1">Selection, maintenance, inspection procedures</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Operations Support:</span>
                    <span className="text-slate-600 ml-1">Commercial diving operations, best practices, supervision</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-xs text-teal-800 flex items-start">
                  <svg className="w-4 h-4 text-teal-600 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span><strong>Powered by LangChain & LangSmith:</strong> Diver Well continuously learns from commercial diving operations and safety protocols to provide expert guidance.</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={() => {
                  setIsOpen(false);
                  window.open('/chat/diver-well', '_blank');
                }}
                data-testid="button-chat-diver-well"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Diver Well (Integrated)
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Prefer the OpenAI GPT version?</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-teal-200 text-teal-600 hover:bg-teal-50"
                  onClick={() => {
                    setIsOpen(false);
                    window.open('https://chatgpt.com/g/g-6897d42d3ba48191b48883a4839c09bf-diver-well-commercial-diver-ai-consultant', '_blank');
                  }}
                  data-testid="button-diver-well-openai-gpt"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open OpenAI GPT Version
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

