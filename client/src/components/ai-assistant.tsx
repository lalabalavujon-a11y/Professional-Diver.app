import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, X, ExternalLink, Bot, Headphones } from "lucide-react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenConsultant = () => {
    window.open('/chat/diver-well', '_blank');
  };

  const handleEmbedConsultant = () => {
    window.open('/chat/diver-well', '_blank');
  };

  return (
    <>
      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
          data-testid="button-ai-assistant"
        >
          <div className="flex flex-col items-center">
            <Bot className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
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

    </>
  );
}