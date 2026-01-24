import { Link } from "wouter";
import { CheckCircle, Star, Zap, Building2, Users, Rocket, Shield, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";
import LauraAssistant from "@/components/laura-assistant";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

/**
 * Comprehensive Pricing Page
 * Showcases all subscription tiers with features, benefits, and Early Bird Beta pricing
 * Built using Ralph Inspired Methodology: PLAN → EXECUTE → TEST → DEPLOY
 */

const PRICING_TIERS = [
  {
    id: "DIVER",
    name: "Individual Diver",
    tagline: "Perfect for professional divers preparing for certifications",
    icon: Users,
    monthlyPrice: 25,
    annualPrice: 250,
    annualSavings: "Save $50",
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-200",
    bgGradient: "from-blue-50 to-white",
    popular: false,
    stripeMonthly: "https://buy.stripe.com/8x24gzg9S2gG7WX4XugMw03",
    stripeAnnual: "https://buy.stripe.com/eVq8wP1eY2gG4KLblSgMw04",
    features: [
      "All training courses & learning tracks",
      "AI-powered tutors (Diver Well)",
      "Interactive lessons & practice scenarios",
      "Professional exams & quizzes",
      "Progress tracking & certificates",
      "Spaced Repetition System (SRS)",
      "Voice dictation technology",
      "Mobile app access",
      "Basic network profile",
      "Job search & alerts",
    ],
    benefits: [
      "Pass your certification exams with confidence",
      "Learn at your own pace, anytime, anywhere",
      "Get personalized AI assistance 24/7",
    ],
  },
  {
    id: "COMPANY",
    name: "Dive Company",
    tagline: "For dive companies managing team training",
    icon: Building2,
    monthlyPrice: 49.99,
    annualPrice: 499,
    annualSavings: "Save $100",
    color: "from-purple-500 to-purple-600",
    borderColor: "border-purple-200",
    bgGradient: "from-purple-50 to-white",
    popular: false,
    stripeMonthly: "#",
    stripeAnnual: "#",
    features: [
      "Everything in Individual Diver",
      "Team management dashboard",
      "Bulk user enrollment",
      "Team progress tracking",
      "Company branding options",
      "Advanced analytics",
      "Priority email support",
      "Company network profile",
      "Unlimited job postings",
      "Candidate management system",
    ],
    benefits: [
      "Train your entire team in one place",
      "Track compliance and certifications",
      "Hire top diving talent directly",
    ],
  },
  {
    id: "SERVICE_PROVIDER",
    name: "Service Provider",
    tagline: "For training schools & service providers",
    icon: Rocket,
    monthlyPrice: 79.99,
    annualPrice: 799,
    annualSavings: "Save $160",
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-200",
    bgGradient: "from-orange-50 to-white",
    popular: false,
    stripeMonthly: "#",
    stripeAnnual: "#",
    features: [
      "Everything in Company tier",
      "Custom content creation",
      "White-label training portal",
      "API access for integrations",
      "Advanced reporting dashboard",
      "Priority phone support",
      "Premium network listing",
      "Featured placement in search",
      "Lead generation tools",
      "Custom service categories",
    ],
    benefits: [
      "Grow your training business",
      "Deliver professional branded content",
      "Generate qualified leads automatically",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For large organizations with 50+ users",
    icon: Crown,
    monthlyPrice: 250,
    annualPrice: 2500,
    annualSavings: "Save $500",
    color: "from-gradient-to-r from-yellow-500 via-amber-500 to-orange-500",
    borderColor: "border-yellow-400",
    bgGradient: "from-yellow-50 via-amber-50 to-white",
    popular: true,
    stripeMonthly: "#",
    stripeAnnual: "#",
    features: [
      "Everything in Service Provider",
      "Unlimited team members",
      "Custom learning paths",
      "SSO/SAML integration",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "Compliance reporting",
      "Multi-location support",
      "Direct database access",
      "24/7 priority support",
      "Quarterly business reviews",
    ],
    benefits: [
      "Enterprise-grade security & compliance",
      "Dedicated support & onboarding",
      "Custom solutions for your organization",
    ],
  },
];

const PLATFORM_FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Learning",
    description: "Diver Well AI tutors provide instant feedback, explanations, and personalized learning paths.",
  },
  {
    icon: Shield,
    title: "Industry Certifications",
    description: "Prepare for NDT, Commercial Diving, Emergency Medical, and more with comprehensive exam prep.",
  },
  {
    icon: Star,
    title: "Spaced Repetition",
    description: "Our SRS algorithm ensures you retain knowledge long-term for exam success.",
  },
  {
    icon: Sparkles,
    title: "Voice Technology",
    description: "Professional speech-to-text for written examinations and hands-free learning.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="flex items-center space-x-3">
                <img 
                  src={diverWellLogo} 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <div className="text-xl font-bold text-slate-900">Professional Diver</div>
                  <div className="text-xs text-slate-500">Diver Well Training</div>
                </div>
              </a>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/trial-signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto text-center">
          {/* Early Bird Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">
              Early Bird Beta Pricing - Lock in these rates before prices increase!
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Simple, Transparent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include access to both our Training Platform 
            and Dive Connection Network. Start with a 24-hour free trial.
          </p>
        </div>
      </section>

      {/* Platform Features Strip */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PLATFORM_FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{feature.title}</h4>
                  <p className="text-xs text-slate-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_TIERS.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative overflow-hidden border-2 ${tier.popular ? 'border-yellow-400 shadow-2xl scale-105' : tier.borderColor} bg-gradient-to-br ${tier.bgGradient} hover:shadow-xl transition-all duration-300`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                    <tier.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{tier.name}</CardTitle>
                  <CardDescription className="text-slate-600">{tier.tagline}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">${tier.monthlyPrice}</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">or ${tier.annualPrice}/year</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {tier.annualSavings}
                      </Badge>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2">
                    <a 
                      href={tier.stripeMonthly}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        className={`w-full ${tier.popular ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
                      >
                        Subscribe Monthly
                      </Button>
                    </a>
                    <a 
                      href={tier.stripeAnnual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        Subscribe Yearly
                      </Button>
                    </a>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 text-sm">Features included:</h4>
                    <ul className="space-y-2">
                      {tier.features.slice(0, 8).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 8 && (
                        <li className="text-sm text-blue-600 font-medium">
                          + {tier.features.length - 8} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 text-sm">Key benefits:</h4>
                    <ul className="space-y-1">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Need a Custom Enterprise Solution?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Contact us for custom pricing, dedicated support, and tailored solutions for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:sales@professionaldiver.app">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold">
                Contact Sales
              </Button>
            </a>
            <Link href="/partner-inquiry">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Become a Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">What's included in the free trial?</h3>
              <p className="text-slate-600">
                You get full access to all features of the Individual Diver plan for 24 hours. No credit card required.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Can I upgrade or downgrade my plan?</h3>
              <p className="text-slate-600">
                Yes, you can change your plan anytime. Upgrades take effect immediately, downgrades at the end of your billing period.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Is this Early Bird pricing permanent?</h3>
              <p className="text-slate-600">
                Current subscribers lock in these rates. New subscriptions after our beta period will be at regular pricing.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Do you offer refunds?</h3>
              <p className="text-slate-600">
                Annual plans have a 30-day prorated refund policy. Monthly plans continue until the end of the billing period.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">What payment methods do you accept?</h3>
              <p className="text-slate-600">
                We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and PayPal through Stripe.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Can I become an affiliate partner?</h3>
              <p className="text-slate-600">
                Yes! Partners earn 50% commission on all referrals. Visit our affiliate program page to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Start Trial CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Professional Diving Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of diving professionals. Start your free 24-hour trial today.
          </p>
          <Link href="/trial-signup">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
      <LauraAssistant />
    </div>
  );
}
