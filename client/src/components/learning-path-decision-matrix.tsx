import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, TrendingUp, Award, CheckCircle } from "lucide-react";
interface LearningPathSuggestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedWeeks: number;
  tracks: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    reason: string;
  }>;
  confidence: number;
  reasoning: string;
}

interface LearningPathDecisionMatrixProps {
  suggestions: LearningPathSuggestion[];
  userProfile: {
    experience: string;
    goals: string[];
    timeCommitment: string;
  };
}

export default function LearningPathDecisionMatrix({ suggestions, userProfile }: LearningPathDecisionMatrixProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const evaluatePath = (path: LearningPathSuggestion) => {
    const scores = {
      careerAlignment: path.confidence,
      timeEfficiency: calculateTimeEfficiency(path.estimatedWeeks, userProfile.timeCommitment),
      certificationValue: calculateCertificationValue(path),
      prerequisiteFit: calculatePrerequisiteFit(path, userProfile),
    };

    const overallScore = Math.round(
      (scores.careerAlignment * 0.4 +
       scores.timeEfficiency * 0.25 +
       scores.certificationValue * 0.2 +
       scores.prerequisiteFit * 0.15)
    );

    return { ...scores, overallScore };
  };

  const calculateTimeEfficiency = (weeks: number, timeCommitment: string): number => {
    // Simple heuristic: if time commitment is high, shorter paths score better
    const timeHours = parseTimeCommitment(timeCommitment);
    if (timeHours >= 16) return weeks <= 12 ? 100 : weeks <= 20 ? 80 : 60;
    if (timeHours >= 6) return weeks <= 20 ? 100 : weeks <= 30 ? 80 : 60;
    return weeks <= 30 ? 100 : 70;
  };

  const parseTimeCommitment = (commitment: string): number => {
    const match = commitment.match(/(\d+)[-+]?\s*hours/);
    return match ? parseInt(match[1]) : 5;
  };

  const calculateCertificationValue = (path: LearningPathSuggestion): number => {
    // More tracks = higher certification value, but with diminishing returns
    const trackCount = path.tracks.length;
    if (trackCount >= 4) return 100;
    if (trackCount === 3) return 90;
    if (trackCount === 2) return 75;
    return 60;
  };

  const calculatePrerequisiteFit = (path: LearningPathSuggestion, profile: any): number => {
    // Check if path difficulty matches experience
    const experienceLevel = profile.experience?.toLowerCase() || '';
    const pathDifficulty = path.difficulty?.toLowerCase() || '';
    
    if (experienceLevel.includes('beginner') && pathDifficulty.includes('beginner')) return 100;
    if (experienceLevel.includes('expert') && pathDifficulty.includes('expert')) return 100;
    if (experienceLevel.includes('professional') && ['intermediate', 'advanced', 'expert'].includes(pathDifficulty)) return 90;
    return 70;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-900">
          <Target className="w-5 h-5 mr-2" />
          Decision Matrix Analysis
        </CardTitle>
        <p className="text-sm text-blue-700 mt-2">
          Comprehensive scoring breakdown to help you make an informed decision
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {suggestions.map((path, index) => {
            const evaluation = evaluatePath(path);
            return (
              <div key={path.id} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-900">{path.title}</h4>
                    <Badge variant="outline" className="mt-1">
                      Path {index + 1}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                      {evaluation.overallScore}
                    </div>
                    <div className="text-xs text-slate-500">Overall Score</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Career Alignment</span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(evaluation.careerAlignment)}`}>
                        {evaluation.careerAlignment}%
                      </span>
                    </div>
                    <Progress value={evaluation.careerAlignment} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Time Efficiency</span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(evaluation.timeEfficiency)}`}>
                        {evaluation.timeEfficiency}%
                      </span>
                    </div>
                    <Progress value={evaluation.timeEfficiency} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Certification Value</span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(evaluation.certificationValue)}`}>
                        {evaluation.certificationValue}%
                      </span>
                    </div>
                    <Progress value={evaluation.certificationValue} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Prerequisite Fit</span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(evaluation.prerequisiteFit)}`}>
                        {evaluation.prerequisiteFit}%
                      </span>
                    </div>
                    <Progress value={evaluation.prerequisiteFit} className="h-2" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Based on: {path.tracks.length} tracks • {path.estimatedWeeks} weeks</span>
                    <Badge variant="outline" className={getScoreColor(evaluation.overallScore)}>
                      {evaluation.overallScore >= 90 ? 'Highly Recommended' : 
                       evaluation.overallScore >= 75 ? 'Recommended' : 
                       evaluation.overallScore >= 60 ? 'Good Fit' : 'Consider Alternatives'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>How to use this matrix:</strong> The overall score combines career alignment (40%), 
            time efficiency (25%), certification value (20%), and prerequisite fit (15%). 
            Higher scores indicate better alignment with your profile and goals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

