import { Link, useLocation } from "wouter";
import { Clock, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/footer";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

interface ComingSoonProps {
  featureName?: string;
  featureDescription?: string;
}

export default function ComingSoon({ featureName, featureDescription }: ComingSoonProps) {
  const [location] = useLocation();
  
  // Determine feature details from URL or props
  const getFeatureInfo = () => {
    if (featureName && featureDescription) {
      return { name: featureName, description: featureDescription };
    }
    
    // Default based on common routes
    if (location === "/" || location.includes("enterprise")) {
      return {
        name: "Enterprise Platform",
        description: "Complete enterprise operations platform for commercial diving operations"
      };
    }
    
    if (location.includes("network") || location.includes("connection")) {
      return {
        name: "Dive Connection Network",
        description: "Connect with divers, dive companies, and service providers"
      };
    }
    
    return {
      name: "This Feature",
      description: "We're working hard to bring you this exciting new feature"
    };
  };

  const { name, description } = getFeatureInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/training" className="flex items-center space-x-3">
              <img 
                src={diverWellLogo} 
                alt="Professional Diver - Diver Well Training" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <div className="text-xl font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Training Platform</div>
              </div>
            </Link>
            <Link href="/training">
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <BookOpen className="w-4 h-4 mr-2" />
                Go to Training
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-6">
                  <Clock className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Coming Soon
              </h1>
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 mb-4">
              {name}
            </h2>

            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              {description}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-slate-700 mb-4">
                We're working hard to bring you this feature. In the meantime, you can:
              </p>
              <ul className="text-left text-sm text-slate-600 space-y-2 max-w-md mx-auto">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Access our comprehensive training platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Prepare for professional diving certifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Use AI-powered tutors and learning tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Track your progress and exam preparation</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/training">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Explore Training Platform
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-slate-300">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 mt-8">
              Want to be notified when this feature launches?{" "}
              <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">
                Contact us
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
