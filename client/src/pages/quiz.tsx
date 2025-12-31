import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import QuizQuestion from "@/components/quiz-question";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Question = {
  id: string;
  prompt: string;
  a: string;
  b: string;
  c: string;
  d: string;
  answer: string;
  order: number;
};

type QuizWithQuestions = {
  id: string;
  title: string;
  timeLimit: number;
  questions: Question[];
};

export default function Quiz() {
  const [, params] = useRoute("/lessons/:id/quiz");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: ["/api/quizzes/lesson", params?.id],
    enabled: !!params?.id,
  });

  // Initialize timer when quiz data is loaded
  useEffect(() => {
    if (quiz && !quizStarted && timeRemaining === null) {
      const timeLimit = quiz.timeLimit || 30; // Default 30 minutes
      setTimeRemaining(timeLimit * 60); // Convert to seconds
    }
  }, [quiz, quizStarted, timeRemaining]);

  const submitAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      return apiRequest("POST", "/api/quiz-attempts", attemptData);
    },
    onSuccess: () => {
      toast({
        title: "Quiz Submitted!",
        description: "Your quiz has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/quiz"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-submit quiz function
  const autoSubmitQuiz = useCallback(() => {
    if (!quizSubmitted) {
      const score = Object.entries(answers).reduce((correct, [questionId, answer]) => {
        const question = quiz?.questions.find((q: any) => q.id === questionId);
        return question?.answer === answer ? correct + 1 : correct;
      }, 0);

      submitAttemptMutation.mutate({
        userId: "current-user",
        quizId: quiz?.id,
        score,
        answers: JSON.stringify(answers),
      });
      
      toast({
        title: "Time's Up!",
        description: "Quiz has been automatically submitted.",
        variant: "destructive",
      });
    }
  }, [quizSubmitted, answers, quiz, submitAttemptMutation, toast]);

  // Timer countdown effect
  useEffect(() => {
    if (!quizStarted || timeRemaining === null || timeRemaining <= 0 || quizSubmitted) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          autoSubmitQuiz();
          return 0;
        }
        
        // Show warning at 5 minutes (300 seconds)
        if (prev === 301) {
          setShowTimeWarning(true);
          toast({
            title: "Time Warning!",
            description: "5 minutes remaining in your exam.",
            variant: "destructive",
          });
        }
        
        // Show final warning at 1 minute (60 seconds)
        if (prev === 61) {
          toast({
            title: "Final Warning!",
            description: "1 minute remaining in your exam.",
            variant: "destructive",
          });
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining, quizSubmitted, autoSubmitQuiz, toast]);

  // Start quiz function
  const startQuiz = () => {
    setQuizStarted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-quiz-not-found">
              Quiz not available for this lesson.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion - 1];
  const selectedAnswer = answers[currentQuestionData.id];
  const totalQuestions = quiz.questions.length;
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionData.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const score = Object.entries(answers).reduce((correct, [questionId, answer]) => {
      const question = quiz.questions.find((q: any) => q.id === questionId);
      return question?.answer === answer ? correct + 1 : correct;
    }, 0);

    submitAttemptMutation.mutate({
      userId: "current-user", // This would come from auth context
      quizId: quiz.id,
      score,
      answers: JSON.stringify(answers),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900" data-testid="text-quiz-title">
                  {quiz.title}
                </h2>
                <p className="text-sm text-slate-500" data-testid="text-quiz-meta">
                  {totalQuestions} questions • {quiz.timeLimit || 10} minutes
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Time Remaining</div>
                <div className="text-lg font-mono font-semibold text-slate-900" data-testid="text-time-remaining">
                  {formatTime(timeRemaining || 0)}
                </div>
              </div>
            </div>
          </div>
          
          <QuizQuestion
            question={currentQuestionData}
            currentQuestion={currentQuestion}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            canGoNext={!!selectedAnswer}
            canGoPrevious={currentQuestion > 1}
            isLastQuestion={currentQuestion === totalQuestions}
          />
        </section>
      </main>
    </div>
  );
}
