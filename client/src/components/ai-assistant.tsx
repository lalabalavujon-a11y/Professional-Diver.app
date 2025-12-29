import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, X, ExternalLink, Bot, Headphones } from "lucide-react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  const consultantUrl = "/chat/diver-well";

  const handleOpenConsultant = () => {
    window.open(consultantUrl, '_blank');
  };

  const handleEmbedConsultant = () => {
    setShowIframe(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating AI Assistant Button - Mobile optimized */}
      <div className="fixed bottom-6 right-6 z-50 md:bottom-6 md:right-6">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 md:w-14 md:h-14 min-w-[56px] min-h-[56px] rounded-full bg-primary-500 hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation"
          data-testid="button-ai-assistant"
        >
          <div className="flex flex-col items-center">
            <Bot className="w-6 h-6 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
        </Button>
      </div>

      {/* AI Assistant Options Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-600" />
              Diver Well AI Consultant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Connect with your Commercial Diving AI Consultant for expert guidance, safety protocols, and professional diving advice.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleOpenConsultant}
                className="w-full justify-start bg-primary-500 hover:bg-primary-600 text-white"
                data-testid="button-open-consultant"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open AI Consultant (New Window)
              </Button>
              
              <Button
                onClick={handleEmbedConsultant}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-embed-consultant"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat Here (Embedded)
              </Button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Headphones className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Your AI Diving Expert:</strong> Get instant answers about diving safety, equipment, regulations, emergency procedures, and commercial diving best practices.
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded ChatGPT Dialog */}
      <Dialog open={showIframe} onOpenChange={setShowIframe}>
        <DialogContent className="sm:max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-600" />
                Diver Well - Commercial Diving AI Consultant
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIframe(false)}
                data-testid="button-close-embedded"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 p-6 pt-2">
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <Bot className="w-12 h-12 text-primary-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">AI Consultant Loading...</h3>
                  <p className="text-sm text-slate-600 max-w-md">
                    For the best experience, we recommend opening the AI consultant in a new window.
                  </p>
                  <Button
                    onClick={handleOpenConsultant}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Window
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}