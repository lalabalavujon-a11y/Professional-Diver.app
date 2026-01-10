import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Award, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
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

interface LearningPathComparisonProps {
  suggestions: LearningPathSuggestion[];
  onSelectPath: (pathId: string) => void;
}

export default function LearningPathComparison({ suggestions, onSelectPath }: LearningPathComparisonProps) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const togglePathSelection = (pathId: string) => {
    const newSelected = new Set(selectedPaths);
    if (newSelected.has(pathId)) {
      newSelected.delete(pathId);
    } else {
      newSelected.add(pathId);
    }
    setSelectedPaths(newSelected);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">Compare Learning Paths</h3>
        <Badge variant="outline">{suggestions.length} Path{suggestions.length > 1 ? 's' : ''} Available</Badge>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Path</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Duration</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Difficulty</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Tracks</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Match</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((path, index) => (
                  <tr key={path.id} className="border-b hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{path.title}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {path.description}
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-1 text-slate-500" />
                        <span>{path.estimatedWeeks} weeks</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Badge className={getDifficultyColor(path.difficulty)}>
                        {path.difficulty}
                      </Badge>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="font-medium">{path.tracks.length}</span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {path.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <Button
                        size="sm"
                        variant={selectedPaths.has(path.id) ? "default" : "outline"}
                        onClick={() => {
                          togglePathSelection(path.id);
                          onSelectPath(path.id);
                        }}
                      >
                        {selectedPaths.has(path.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Toggle */}
      <div className="space-y-3">
        {suggestions.map((path) => (
          <Card key={path.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <Badge className={getDifficultyColor(path.difficulty)}>
                      {path.difficulty}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {path.confidence}% Match
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{path.description}</p>
                </div>
                <Button variant="ghost" size="icon">
                  {expandedPath === path.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {expandedPath === path.id && (
              <CardContent className="border-t bg-slate-50">
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-xs text-slate-500">Duration</div>
                        <div className="font-medium">{path.estimatedWeeks} weeks</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-xs text-slate-500">Tracks</div>
                        <div className="font-medium">{path.tracks.length} training tracks</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="font-medium">{path.confidence}% match</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                    <p className="text-sm text-blue-800">{path.reasoning}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Learning Sequence</h4>
                    <div className="space-y-2">
                      {path.tracks.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">{track.order}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{track.title}</div>
                            <div className="text-sm text-slate-600">{track.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

