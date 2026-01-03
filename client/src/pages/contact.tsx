import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import Footer from "@/components/footer";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium")
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      priority: "medium"
    },
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest(
        'POST',
        '/api/support/ticket',
        {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }
      );

      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours. Check your email for confirmation.",
        variant: "default",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us directly at support@diverwell.app",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="flex items-center space-x-3">
                <img 
                  src={diverWellLogo} 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                  <div className="text-xs text-slate-500">Diver Well Training</div>
                </div>
              </a>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className="text-slate-600 hover:text-slate-900 font-medium">
                  ← Back to Platform
                </a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Support</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get in touch with our professional diving education specialists. We're here to help 
            with technical support, course guidance, and any questions about our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Email Support</p>
                      <a 
                        href="mailto:support@diverwell.app" 
                        className="text-blue-600 hover:text-blue-700"
                      >
                        support@diverwell.app
                      </a>
                      <p className="text-sm text-slate-500">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Phone Support</p>
                      <p className="text-slate-700">+44 (0) 208 123 4567</p>
                      <p className="text-sm text-slate-500">Mon-Fri, 9AM-6PM GMT</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-slate-900">Office Location</p>
                      <p className="text-slate-700">London, United Kingdom</p>
                      <p className="text-sm text-slate-500">Remote-first team</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Quick Resources</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => window.open('/chat/diver-well', '_blank')}
                      className="block w-full text-left text-blue-600 hover:text-blue-700 text-sm"
                    >
                      → AI Consultant (Instant Help)
                    </button>
                    <Link href="/privacy">
                      <a className="block text-blue-600 hover:text-blue-700 text-sm">
                        → Privacy Policy
                      </a>
                    </Link>
                    <Link href="/trial-signup">
                      <a className="block text-blue-600 hover:text-blue-700 text-sm">
                        → Start Free Trial
                      </a>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <p className="text-slate-600">
                  Fill out the form below and we'll get back to you as soon as possible. 
                  For urgent matters, please call us directly.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                {...field} 
                                data-testid="input-contact-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                {...field} 
                                data-testid="input-contact-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Brief description of your inquiry" 
                                {...field} 
                                data-testid="input-contact-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-contact-priority">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low - General inquiry</SelectItem>
                                <SelectItem value="medium">Medium - Course support</SelectItem>
                                <SelectItem value="high">High - Technical issue</SelectItem>
                                <SelectItem value="urgent">Urgent - Cannot access platform</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please describe your question or issue in detail. Include any error messages or steps you've already tried."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Response Time:</strong> We typically respond within 24 hours during business days. 
                        For urgent technical issues affecting your learning, please call our support line.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                      data-testid="button-send-message"
                    >
                      {isSubmitting ? "Sending Message..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Professional Diving Education Support
            </h3>
            <p className="text-slate-600 max-w-4xl mx-auto">
              Our support team consists of qualified diving professionals and technical experts 
              who understand both the educational content and platform functionality. Whether you need 
              help with course material, technical issues, or have questions about commercial diving 
              certification, we're here to support your professional development journey.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}