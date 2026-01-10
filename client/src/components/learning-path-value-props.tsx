import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Award, Users, CheckCircle, Target } from "lucide-react";

export default function LearningPathValueProps() {
  const valueMetrics = [
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      label: "Time Saved",
      value: "40%",
      description: "Optimized training sequence",
    },
    {
      icon: <Award className="w-5 h-5 text-green-600" />,
      label: "Industry Standards",
      value: "100%",
      description: "IMCA & ADCI aligned",
    },
    {
      icon: <Users className="w-5 h-5 text-purple-600" />,
      label: "Trusted By",
      value: "10,000+",
      description: "Professional divers",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
      label: "Success Rate",
      value: "94%",
      description: "Career advancement",
    },
  ];

  const benefits = [
    "Personalized learning paths based on your unique profile",
    "Industry-standard certifications recognized globally",
    "Optimal sequence based on prerequisites and career goals",
    "Save time with AI-optimized training recommendations",
    "Career-focused paths aligned with industry demand",
    "Expert advisor support available at every step",
  ];

  return (
    <div className="space-y-6">
      {/* Value Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {valueMetrics.map((metric, index) => (
          <Card key={index} className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">{metric.icon}</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</div>
              <div className="text-sm font-medium text-slate-700 mb-1">{metric.label}</div>
              <div className="text-xs text-slate-500">{metric.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits List */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start mb-4">
            <Target className="w-6 h-6 text-blue-600 mr-2 mt-1" />
            <h3 className="text-lg font-semibold text-slate-900">Why Use AI Learning Path?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Recognition */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Badge variant="outline" className="px-4 py-2">
          <Award className="w-4 h-4 mr-2" />
          IMCA Recognized
        </Badge>
        <Badge variant="outline" className="px-4 py-2">
          <Award className="w-4 h-4 mr-2" />
          ADCI Certified
        </Badge>
        <Badge variant="outline" className="px-4 py-2">
          <CheckCircle className="w-4 h-4 mr-2" />
          Industry Standard
        </Badge>
      </div>
    </div>
  );
}





