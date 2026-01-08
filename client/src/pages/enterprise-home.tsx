import { Link } from "wouter";
import { 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Brain, 
  BarChart3, 
  Mic, 
  ChevronRight, 
  Star, 
  Users, 
  Trophy, 
  Shield,
  LogIn,
  Calendar,
  Package,
  HeartPulse,
  Navigation,
  Waves,
  Settings,
  Zap,
  Globe,
  FileText,
  TrendingUp,
  Bot,
  Layers,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/footer";
import LauraAssistant from "@/components/laura-assistant";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

export default function EnterpriseHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={diverWellLogo} 
                alt="Professional Diver - Diver Well Training" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <div className="text-xl font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Enterprise Operations Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/training">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Training
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  data-testid="button-header-login"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Complete Enterprise Platform for 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> Commercial Diving Operations</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              All-in-one platform for commercial diving operations: exam preparation & training, operations management, 
              equipment tracking, medical operations, AI-powered consultation, and nautical navigation.
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
              <Link href="/training">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Explore Training
                </Button>
              </Link>
              <p className="text-sm text-slate-500">No credit card required • Full platform access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Complete Enterprise Solution
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Everything you need to manage commercial diving operations from training to field operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Training & Education */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-slate-900">Exam Preparation & Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  <strong className="text-slate-900">Brand-neutral exam preparation</strong> to prepare for professional certification exams. 
                  Comprehensive practice tests and AI-powered tutors to help you succeed on the real exams from accredited certification bodies.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-900 font-semibold mb-1">⚠️ Preparation Only</p>
                  <p className="text-xs text-blue-800">
                    We prepare you for certifications issued by separate accredited organizations. We do not issue certifications.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Professional exam preparation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Brand-neutral content
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    AI-powered learning
                  </li>
                </ul>
                <Link href="/training">
                  <Button variant="link" className="p-0 mt-4 text-blue-600">
                    Learn more <ChevronRight className="w-4 h-4 inline ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Operations Management */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-slate-900">Operations Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Complete dive operations planning, scheduling, tracking, and team coordination.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Dive operations calendar
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Team coordination
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Inspection reports
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Equipment Management */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-slate-900">Equipment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Track, maintain, and schedule equipment with comprehensive inventory management.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Equipment inventory
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Maintenance scheduling
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Usage tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Medical Operations */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-red-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <HeartPulse className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-slate-900">Medical Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Complete medical facility management, DMT operations, and emergency response coordination.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Medical facilities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    DMT operations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Incident reporting
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI Consultation */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-slate-900">AI-Powered Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Expert AI assistants for operations planning, safety protocols, and platform administration.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Diver Well AI Consultant
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Laura Oracle Platform Assistant
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Discipline-specific tutors
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Nautical Navigation */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-cyan-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                  <Navigation className="w-6 h-6 text-cyan-600" />
                </div>
                <CardTitle className="text-slate-900">Nautical Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Professional nautical charts, waypoints, routes, weather, and tides integration.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Nautical charts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Weather & tides
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Route planning
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics & Reporting */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-indigo-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-slate-900">Analytics & Reporting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Comprehensive analytics, performance tracking, and business intelligence.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Performance metrics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Custom reports
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Revenue tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CRM Integration */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-pink-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-slate-900">CRM & Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Integrated CRM for lead management, customer relations, and affiliate tracking.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Lead qualification
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Customer management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Affiliate system
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Dive Supervisor Tools */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-amber-50 to-white">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-slate-900">Dive Supervisor Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Specialized tools for dive supervisors including team management and safety protocols.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Team management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Safety protocols
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Control dashboard
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose Our Platform?</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Built specifically for commercial diving operations with enterprise-grade features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Integrated Platform</h3>
              <p className="text-sm text-slate-600">All tools in one unified platform</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-slate-600">Intelligent assistance at every step</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Enterprise Security</h3>
              <p className="text-sm text-slate-600">Role-based access and compliance</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Cloud-Based</h3>
              <p className="text-sm text-slate-600">Access from anywhere, anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            🚀 Start Your 24-Hour Free Trial
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the complete enterprise platform • All features included • No credit card required
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
            Access all enterprise features for 24 hours, then choose your plan
          </p>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Perfect For</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Commercial diving operations teams, training departments, and equipment managers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Operations Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Plan and manage dive operations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Coordinate teams and schedules</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Track equipment and maintenance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Generate inspection reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Training Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Brand-neutral certification exam preparation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>AI-powered learning assistance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Track student progress</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Equipment Managers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Complete equipment inventory</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Automated maintenance schedules</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Usage tracking and reporting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Compliance documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Already Purchased */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Already Have an Account?</h3>
          <p className="text-slate-600 mb-6">Access your enterprise dashboard and continue managing your operations</p>
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

