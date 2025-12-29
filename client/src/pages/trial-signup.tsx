import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
// Logo reference - using public path since file is served from public directory
const officialLogo = "/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

const trialSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

type TrialSignupForm = z.infer<typeof trialSignupSchema>;

export default function TrialSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<TrialSignupForm>({
    resolver: zodResolver(trialSignupSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: TrialSignupForm) => {
      return apiRequest("POST", "/api/trial-signup", data);
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: "Welcome to Professional Diver!",
        description: "Your 24-hour free trial has started. Redirecting to dashboard...",
      });
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TrialSignupForm) => {
    signupMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Professional Diver!</h2>
            <p className="text-slate-600 mb-4">
              Your 24-hour free trial has started successfully.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="flex items-center space-x-3" data-testid="link-home">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
                <div className="flex items-center space-x-2">
                  <img 
                    src={officialLogo}
                    alt="Professional Diver - Diver Well Training"
                    className="w-8 h-8 rounded-lg"
                  />
                  <span className="text-lg font-bold text-slate-900">Professional Diver</span>
                </div>
              </a>
            </Link>
            <div className="text-sm text-slate-600">Already have an account? 
              <Link href="/login">
                <a className="text-blue-600 hover:text-blue-700 ml-1 font-medium" data-testid="link-login">
                  Sign in
                </a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Start Your 24-Hour Free Trial
              </CardTitle>
              <p className="text-slate-600 mt-2">
                Get instant access to all professional diving courses, mock exams, and AI tutors.
              </p>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-name"
                            {...field} 
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
                        <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address"
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            data-testid="input-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={signupMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-lg font-semibold"
                    data-testid="button-start-trial"
                  >
                    {signupMutation.isPending ? "Starting Trial..." : "Start My Free Trial"}
                  </Button>
                </form>
              </Form>

              {/* Trial Benefits */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4">What's included in your trial:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  {[
                    "Full access to all commercial diving courses",
                    "Timed mock exams with detailed explanations", 
                    "AI-powered tutors and instant feedback",
                    "Voice dictation for written examinations",
                    "Progress analytics and performance tracking",
                    "All NDT inspection and emergency protocols"
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 text-center">
                  <strong>No credit card required.</strong> After your trial, choose a plan that works for you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}