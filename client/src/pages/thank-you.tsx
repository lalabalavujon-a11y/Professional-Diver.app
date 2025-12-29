import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen, GraduationCap, Brain, Users, Mail, ArrowRight } from "lucide-react";

export default function ThankYou() {
  const [location] = useLocation();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // Try to get email from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const storedEmail = localStorage.getItem("userEmail");
    setEmail(emailParam || storedEmail || "");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <Card className="mb-8 border-green-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Thank You for Your Purchase! 🎉
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Your subscription is now active
              </p>
              <p className="text-gray-500">
                Welcome to Professional Diver! You now have full access to our comprehensive commercial diving education platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Login Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Your Login Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              {email && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email:</p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{email}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Check your email for your password and full account details.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/signin">
                      Login to Your Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
              {!email && (
                <p className="text-gray-500">
                  Check your email for your login credentials.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Become a Partner */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Become a Partner & Earn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Love the platform? Become a partner and earn <strong>50% commission</strong> on every referral!
              </p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-bold text-amber-600">50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Payout:</span>
                  <span className="font-bold">$50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payout Schedule:</span>
                  <span className="font-bold">Monthly</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-100">
                <Link href="/affiliate">
                  Become a Partner Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Platform Navigation Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How to Navigate the Platform</CardTitle>
            <p className="text-gray-600 mt-2">
              Get the most out of your subscription with these quick guides:
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Learning Tracks */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Learning Tracks</h3>
                  <p className="text-gray-600 mb-3">
                    Explore comprehensive courses organized by specialty, including NDT Inspection, Life Support Technician, Commercial Dive Supervisor, and more.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/tracks" className="text-blue-600">
                      View All Learning Tracks <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Professional Exams */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Professional Exams</h3>
                  <p className="text-gray-600 mb-3">
                    Take timed mock examinations to test your knowledge and prepare for certifications. Get instant feedback and track your progress.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/dashboard" className="text-blue-600">
                      Take a Practice Exam <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* AI Learning Path */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">AI Learning Path</h3>
                  <p className="text-gray-600 mb-3">
                    Get personalized learning recommendations based on your goals and progress. Our AI creates a customized path just for you.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/learning-path" className="text-blue-600">
                      Get Your Personalized Learning Path <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* AI Tutor */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">AI Tutor & Support</h3>
                  <p className="text-gray-600 mb-3">
                    Get instant help from our AI-powered diving consultant anytime you need clarification or support. Available 24/7 in your dashboard.
                  </p>
                  <Button asChild variant="link" className="p-0 h-auto">
                    <Link href="/dashboard" className="text-blue-600">
                      Chat with AI Tutor <ArrowRight className="w-4 h-4 inline ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Button asChild size="lg" className="w-full">
                <Link href="/dashboard">
                  Start Learning Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="mt-6 bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is here to help you succeed:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><strong>Email:</strong> 1pull@professionaldiver.app</li>
              <li><strong>In-App Support:</strong> Use the chat feature in your dashboard</li>
              <li><strong>Platform Guide:</strong> Visit your dashboard for tutorials and tips</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





