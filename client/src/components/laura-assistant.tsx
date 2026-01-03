import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ExternalLink } from "lucide-react";

export default function LauraAssistant() {
  const [isOpen, setIsOpen] = useState(false);

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
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-laura-assistant">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
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
              <div>
                <span className="text-xl">Laura</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Platform Oracle
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Your dedicated Platform Oracle for guidance, support, and Professional Diver expertise
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                Laura's Expertise
              </h4>
              
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Platform Guidance:</span>
                    <span className="text-slate-600 ml-1">Account management, technical support, feature navigation</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Professional Diver Expertise:</span>
                    <span className="text-slate-600 ml-1">Platform optimization, career advancement, partnership opportunities</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Affiliate Program:</span>
                    <span className="text-slate-600 ml-1">50% commission opportunities, partnership benefits</span>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <span className="font-medium text-slate-800">Industry Connections:</span>
                    <span className="text-slate-600 ml-1">Diving companies, academies, and Lead Recon AI system</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 flex items-start">
                  <svg className="w-4 h-4 text-amber-600 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span><strong>For diving operations questions:</strong> I'll connect you with our exclusive "Diver Well" AI consultant available within the platform.</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={() => {
                  setIsOpen(false);
                  window.open('/chat/laura', '_blank');
                }}
                data-testid="button-chat-laura-oracle"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Laura - Platform Oracle
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Need diving operational guidance?</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setIsOpen(false);
                    window.open('/chat/diver-well', '_blank');
                  }}
                  data-testid="button-diver-well-consultant"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Access Diver Well AI Consultant
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}