import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type QuizQuestion = {
  id: string;
  prompt: string;
  a: string;
  b: string;
  c: string;
  d: string;
  order: number;
};

type QuizWithQuestions = {
  id: string;
  title: string;
  timeLimit: number;
  questions: QuizQuestion[];
};

interface KnowledgeCheckProps {
  lessonId: string;
}

export default function KnowledgeCheck({ lessonId }: KnowledgeCheckProps) {
  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: ["/api/quizzes/lesson", lessonId],
    enabled: !!lessonId,
  });

  if (isLoading) {
    return (
      <Card className="mt-8" data-testid="knowledge-check-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="w-5 h-5 text-primary-500" />
            Knowledge Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const previewQuestions = quiz.questions.slice(0, 5);

  return (
    <Card className="mt-8" data-testid="knowledge-check-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="w-5 h-5 text-primary-500" />
          Knowledge Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-slate-600">
          Review the key points from this lesson. Then complete the full quiz to confirm mastery.
        </p>
        <ol className="space-y-4 list-decimal list-inside text-slate-800">
          {previewQuestions.map((question) => (
            <li key={question.id} className="space-y-2">
              <div className="font-medium">{question.prompt}</div>
              <ul className="space-y-1 text-sm text-slate-600">
                {[question.a, question.b, question.c, question.d]
                  .filter(Boolean)
                  .map((option, index) => (
                    <li key={`${question.id}-opt-${index}`} className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span>{option}</span>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="flex justify-end">
          <Link href={`/lessons/${lessonId}/quiz`}>
            <Button className="bg-primary-500 hover:bg-primary-600 text-white" data-testid="button-start-knowledge-check">
              Take Full Quiz
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
