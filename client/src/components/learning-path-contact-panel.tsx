import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, Calendar, HelpCircle, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import CallingButton from "@/components/calling-button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LearningPathContactPanelProps {
  className?: string;
}

export default function LearningPathContactPanel({ className }: LearningPathContactPanelProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isBookingConsultation, setIsBookingConsultation] = useState(false);

  const handleBookConsultation = async () => {
    setIsBookingConsultation(true);
    try {
      const response = await apiRequest("POST", "/api/learning-path/consultation", {
        email: localStorage.getItem('userEmail') || '',
        name: localStorage.getItem('userName') || 'User',
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        message: "Interested in learning path consultation",
      });

      toast({
        title: "Consultation Requested",
        description: "We'll contact you within 24 hours to schedule your consultation.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to book consultation. Please try calling us directly.",
        variant: "destructive",
      });
    } finally {
      setIsBookingConsultation(false);
    }
  };

  const faqs = [
    {
      question: "How accurate are the AI recommendations?",
      answer: "Our AI analyzes industry standards (IMCA, ADCI), your experience level, and career goals to provide personalized paths with 85-95% confidence ratings. Recommendations are based on thousands of successful career paths.",
    },
    {
      question: "Can I customize a learning path?",
      answer: "Yes! After viewing your recommendations, you can work with one of our advisors to create a custom path tailored to your specific needs and timeline.",
    },
    {
      question: "How long does it take to complete a path?",
      answer: "Most paths range from 12-24 weeks depending on your time commitment. Each path shows estimated duration based on the tracks included.",
    },
    {
      question: "What if I already have some certifications?",
      answer: "The AI takes your existing certifications into account when generating paths. You can mark completed certifications in your profile to get more accurate recommendations.",
    },
    {
      question: "Are these certifications industry-recognized?",
      answer: "Yes! All tracks align with IMCA, ADCI, and other recognized industry standards. Certifications are recognized globally in commercial diving operations.",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
          Need Help Choosing?
        </CardTitle>
        <CardDescription>
          Get personalized guidance from our diving education specialists
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Methods */}
        <div className="space-y-3">
          <CallingButton
            phoneNumber="+442081234567"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            showLabel={true}
            defaultProvider="phone"
          />
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open('mailto:support@diverwell.app?subject=Learning Path Inquiry', '_blank')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Support
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setLocation('/chat/diver-well')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Laura AI
          </Button>

          <Button
            variant="default"
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleBookConsultation}
            disabled={isBookingConsultation}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isBookingConsultation ? "Booking..." : "Book Free Consultation"}
          </Button>
        </div>

        {/* Contact Info */}
        <div className="pt-4 border-t space-y-2 text-sm">
          <div className="flex items-center text-slate-600">
            <Phone className="w-4 h-4 mr-2 text-blue-600" />
            <span>+44 (0) 208 123 4567</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Mail className="w-4 h-4 mr-2 text-blue-600" />
            <a href="mailto:support@diverwell.app" className="text-blue-600 hover:underline">
              support@diverwell.app
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Mon-Fri, 9AM-6PM GMT
          </p>
        </div>

        {/* Quick FAQ */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-3">Frequently Asked Questions</h4>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-none">
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 pb-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}





