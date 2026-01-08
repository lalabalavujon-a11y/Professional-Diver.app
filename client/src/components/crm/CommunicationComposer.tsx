import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Send,
  RefreshCw,
} from "lucide-react";

interface CommunicationComposerProps {
  clientId: string;
  clientEmail?: string;
  clientPhone?: string;
  clientName?: string;
  defaultType?: "email" | "phone" | "sms" | "whatsapp" | "note";
  trigger?: React.ReactNode;
}

export default function CommunicationComposer({
  clientId,
  clientEmail,
  clientPhone,
  clientName,
  defaultType = "email",
  trigger,
}: CommunicationComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"email" | "phone" | "sms" | "whatsapp" | "note">(defaultType);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [to, setTo] = useState(clientEmail || "");
  const [phoneNumber, setPhoneNumber] = useState(clientPhone || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/communications`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/communications`] });
      toast({
        title: "Communication Sent",
        description: `Your ${type} has been sent successfully.`,
      });
      setSubject("");
      setContent("");
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (type === "email" && !to.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if ((type === "phone" || type === "sms" || type === "whatsapp") && !phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number.",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      type,
      direction: "outbound",
      content: content.trim(),
    };

    if (type === "email") {
      data.subject = subject.trim() || `Message for ${clientName || "Client"}`;
      data.to = to.trim();
    } else if (type === "phone") {
      data.phoneNumber = phoneNumber.trim();
      data.status = "sent";
    } else if (type === "sms" || type === "whatsapp") {
      data.phoneNumber = phoneNumber.trim();
      data.status = "sent";
    }

    sendMutation.mutate(data);
  };

  const getTypeIcon = () => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "sms":
      case "whatsapp":
        return <MessageSquare className="w-4 h-4" />;
      case "note":
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getTypeIcon()}
            <span>
              {type === "email" && "Send Email"}
              {type === "phone" && "Log Phone Call"}
              {type === "sms" && "Send SMS"}
              {type === "whatsapp" && "Send WhatsApp"}
              {type === "note" && "Add Note"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {type === "note"
              ? "Add a note to this client's communication history"
              : `Send a ${type} to ${clientName || "this client"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Communication Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>Phone Call</span>
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS</span>
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </div>
                </SelectItem>
                <SelectItem value="note">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Note</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "email" && (
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
          )}

          {(type === "phone" || type === "sms" || type === "whatsapp") && (
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+44 7448 320513"
              />
            </div>
          )}

          {type === "email" && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          )}

          <div>
            <Label htmlFor="content">
              {type === "email" && "Message"}
              {type === "phone" && "Call Notes"}
              {(type === "sms" || type === "whatsapp") && "Message"}
              {type === "note" && "Note Content"}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === "email"
                  ? "Enter your email message..."
                  : type === "phone"
                  ? "Enter call notes..."
                  : type === "note"
                  ? "Enter your note..."
                  : "Enter your message..."
              }
              rows={6}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {type === "note" ? "Add Note" : "Send"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

