import { Link } from "wouter";
import { CheckCircle, Clock, BookOpen, Brain, BarChart3, Mic, ChevronRight, Star, Users, Trophy, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/footer";
import LauraAssistant from "@/components/laura-assistant";
// Logo import removed for build compatibility
import { useReferral } from "@/hooks/use-referral";
import { getPaymentLinkWithFallback } from "@/utils/payment-links";

export default function Landing() {
  // Capture referral code from URL if present
  useReferral();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                alt="Professional Diver - Diver Well Training" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <div className="text-xl font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Diver Well Training</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Clean sales page - no navigation links */}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Master Commercial Diving 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> Certification Exams</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Professional diving exam preparation platform with comprehensive practice tests, AI-powered tutors, 
              timed mock exams, and adaptive learning to ace your certification exams at certified diving schools.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/trial-signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  data-testid="button-start-free-trial"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Start 24-Hour Free Trial
                </Button>
              </Link>
              <p className="text-sm text-slate-500">No credit card required • Full platform access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Complete Professional Diving Exam Preparation
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              From NDT inspection to emergency medical response, prepare for all commercial diving certification exams with our comprehensive practice platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-slate-900">Written Exams + Voice</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Practice professional written examinations with voice-to-text dictation. Master essay questions with authentic exam conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-slate-900">Timed Mock Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Practice with authentic timed mock exams for all commercial diving levels with performance analytics and adaptive learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-slate-900">AI-Powered Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Instant detailed explanations with AI tutors plus spaced repetition algorithm for effective exam preparation and knowledge retention.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-slate-900">All Commercial Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Complete coverage of NDT inspection, commercial dive supervision, emergency medical response, and safety protocols.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-red-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-slate-900">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Comprehensive progress tracking across topics, difficulty levels, and exam formats. Identify weak areas effectively.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-cyan-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-cyan-600" />
                </div>
                <CardTitle className="text-slate-900">Voice Technology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Professional speech-to-text recording for written answers. Perfect for diving professionals who prefer verbal communication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🎯 Start Your 24-Hour Free Trial
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience full platform access • All exam formats • No credit card required
          </p>
          
          <Link href="/trial-signup">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all mb-8"
              data-testid="button-start-trial-cta"
            >
              Start Free Trial
            </Button>
          </Link>
          
          <p className="text-blue-200 text-sm">
            Access all features for 24 hours, then choose your plan
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
            <p className="text-lg text-slate-600">Professional diving education that fits your learning schedule</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 transition-all shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900">Monthly Subscription</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">$25/Month</div>
                <p className="text-slate-600 mt-2">Monthly billing • Full platform access • Cancel anytime</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Multiple Choice + Written Exams",
                    "Voice Dictation Technology", 
                    "500+ Professional Questions",
                    "AI Explanations & Tutors",
                    "All Commercial Diving Levels",
                    "Progress Analytics",
                    "Spaced Repetition Learning"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={getPaymentLinkWithFallback('MONTHLY')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold" data-testid="button-subscribe-monthly">
                    Subscribe Monthly
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white relative shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  BEST VALUE
                </div>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl font-bold text-slate-900">Yearly Subscription</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">$250/Year</div>
                <p className="text-slate-600 mt-2">Save over 15% • Full platform access • All exam formats included</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Multiple Choice + Written Exams",
                    "Voice Dictation Technology", 
                    "500+ Professional Questions",
                    "AI Explanations & Tutors",
                    "All Commercial Diving Levels",
                    "Priority Support",
                    "Advanced Analytics Dashboard"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={getPaymentLinkWithFallback('ANNUAL')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-lg font-semibold" data-testid="button-subscribe-yearly">
                    Subscribe Yearly
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Already Purchased */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Already Purchased?</h3>
          <p className="text-slate-600 mb-6">Access your study dashboard and continue your exam preparation journey</p>
          <Link href="/login">
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" data-testid="button-login-existing">
              <ChevronRight className="w-4 h-4 mr-2" />
              Login to Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Laura Assistant Chat Bubble */}
      <LauraAssistant />
    </div>
  );
}