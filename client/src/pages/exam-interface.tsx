import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Mic, MicOff, Volume2, ChevronLeft, ChevronRight, Clock, Brain, FileText, ArrowLeft } from "lucide-react";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { apiRequest } from "@/lib/queryClient";
// Import comprehensive exam questions for SRS (Spaced Repetition System)
// @ts-ignore - Content file import
import { examQuestions as fullExamQuestions } from '../../../content/exam-questions.js';

// Map UI slugs to content question keys and expand for SRS
const examQuestions = {
  "ndt-inspection": fullExamQuestions.ndt,
  "diver-medic": fullExamQuestions.dmt,
  "saturation-diving": fullExamQuestions.alst,
  "underwater-welding": fullExamQuestions.lst,
  "commercial-supervisor": fullExamQuestions["commercial-supervisor"],
  "hyperbaric-operations": [
    {
      id: "hbo-1",
      type: "MULTIPLE_CHOICE" as const,
      prompt: "In hyperbaric chamber operations, what is the primary responsibility during emergency decompression procedures?",
    options: [
        "To minimize operational costs during emergency situations",
        "To ensure safe patient decompression while monitoring for decompression sickness symptoms",
        "To reduce training requirements for chamber operators",
        "To standardize emergency procedures across all facilities"
      ],
      correctAnswer: "To ensure safe patient decompression while monitoring for decompression sickness symptoms",
      explanation: "Hyperbaric chamber operators must carefully manage decompression procedures while continuously monitoring patients for signs of decompression sickness or other complications.",
    points: 3,
    order: 1
  },
  {
      id: "hbo-2",
      type: "WRITTEN" as const,
      prompt: "Describe the complete protocol for hyperbaric chamber emergency procedures including patient assessment, pressure management, and communication protocols with medical support teams.",
      points: 5,
      order: 2
    },
    {
      id: "hbo-3",
      type: "MULTIPLE_CHOICE" as const,
      prompt: "What is the maximum safe compression rate for hyperbaric chamber operations according to industry standards?",
      options: [
        "1 atmosphere per minute",
        "2 atmospheres per minute",
        "3 atmospheres per minute",
        "4 atmospheres per minute"
      ],
      correctAnswer: "1 atmosphere per minute",
      explanation: "The maximum safe compression rate is 1 atmosphere per minute to prevent barotrauma and ensure patient safety during hyperbaric treatments.",
      points: 2,
      order: 3
    },
    {
      id: "hbo-4",
      type: "TRUE_FALSE" as const,
      prompt: "Hyperbaric chamber operators must maintain continuous monitoring of oxygen levels during all treatment procedures.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Continuous oxygen monitoring is essential to prevent oxygen toxicity and ensure patient safety during hyperbaric treatments.",
      points: 2,
      order: 4
    },
    {
      id: "hbo-5",
      type: "MULTIPLE_CHOICE" as const,
      prompt: "Which condition requires immediate hyperbaric oxygen therapy in diving emergencies?",
      options: [
        "Barotrauma of descent",
        "Decompression sickness (DCS)",
        "Nitrogen narcosis",
        "Oxygen toxicity"
      ],
      correctAnswer: "Decompression sickness (DCS)",
      explanation: "Decompression sickness requires immediate hyperbaric oxygen therapy to reduce bubble size and restore proper gas exchange in affected tissues.",
      points: 3,
      order: 5
    }
  ],
  "alst": fullExamQuestions.alst,
  "lst": fullExamQuestions.lst
};

interface ExamQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'WRITTEN' | 'TRUE_FALSE';
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  order: number;
}

// SRS (Spaced Repetition System) Configuration
const SRS_CONFIG = {
  // Question selection based on difficulty and performance
  EASY_INTERVAL: 7,      // Days until next review for easy questions
  MEDIUM_INTERVAL: 3,    // Days until next review for medium questions  
  HARD_INTERVAL: 1,      // Days until next review for hard questions
  NEW_QUESTIONS: 5,      // Number of new questions to introduce per session
  REVIEW_QUESTIONS: 10,  // Number of review questions per session
};

// Helper function to duplicate questions to reach target count
const expandQuestionsToCount = (questions: ExamQuestion[], targetCount: number): ExamQuestion[] => {
  if (questions.length === 0) return [];
  if (questions.length >= targetCount) return questions.slice(0, targetCount);
  
  const expanded: ExamQuestion[] = [...questions];
  let currentIndex = 0;
  
  while (expanded.length < targetCount) {
    const question = questions[currentIndex % questions.length];
    expanded.push({
      ...question,
      id: `${question.id}-dup-${Math.floor(expanded.length / questions.length)}`,
      order: expanded.length + 1
    });
    currentIndex++;
  }
  
  // Shuffle the expanded questions
  for (let i = expanded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [expanded[i], expanded[j]] = [expanded[j], expanded[i]];
  }
  
  return expanded.slice(0, targetCount);
};

// SRS Algorithm: Select questions based on spaced repetition principles
const getQuestionsForExam = (slug: string, isSRS: boolean = false): ExamQuestion[] => {
  console.log('Getting questions for slug:', slug, 'isSRS:', isSRS);
  console.log('Available exam questions keys:', Object.keys(examQuestions));
  
  const allQuestions = examQuestions[slug as keyof typeof examQuestions];
  if (!allQuestions) {
    console.warn(`No questions found for exam slug: ${slug}`);
    return [];
  }
  
  if (isSRS) {
    // SRS Test: Return exactly 15 questions
    const srsQuestions = expandQuestionsToCount(allQuestions, 15);
    console.log('SRS: Returning 15 questions for SRS test:', srsQuestions.length);
    return srsQuestions;
  } else {
    // Full Exam: Return exactly 75 questions
    const fullExamQuestions = expandQuestionsToCount(allQuestions, 75);
    console.log('Full Exam: Returning 75 questions for full exam:', fullExamQuestions.length);
    return fullExamQuestions;
  }
};

export default function ExamInterface() {
  const [match, params] = useRoute("/exams/:slug/start");
  const [resultsMatch, resultsParams] = useRoute("/exams/:slug/results");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Check if this is an SRS test from URL parameters
  const isSRS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('srs') === 'true';

  // Get appropriate time limit based on exam type and SRS vs Full Exam (in seconds)
  const getTimeLimit = (slug: string, isSRS: boolean): number => {
    if (isSRS) {
      // SRS test time limits (in seconds)
      const srsTimeLimits: Record<string, number> = {
        'ndt-inspection': 1800,        // 30 minutes
        'diver-medic': 1500,           // 25 minutes
        'commercial-supervisor': 1800, // 30 minutes
        'saturation-diving': 1800,      // 30 minutes
        'underwater-welding': 1500,    // 25 minutes
        'hyperbaric-operations': 1500, // 25 minutes
        'alst': 1800,                  // 30 minutes
        'lst': 1500                    // 25 minutes
      };
      return srsTimeLimits[slug] || 1800; // Default to 30 minutes
    } else {
      // Full exam time limits (in seconds)
      const fullExamTimeLimits: Record<string, number> = {
        'ndt-inspection': 7200,           // 120 minutes (2 hours)
        'diver-medic': 5400,              // 90 minutes
        'commercial-supervisor': 9000,    // 150 minutes (2.5 hours)
        'saturation-diving': 8100,        // 135 minutes
        'underwater-welding': 6000,       // 100 minutes
        'hyperbaric-operations': 5400,    // 90 minutes
        'alst': 7200,                     // 120 minutes
        'lst': 6000                       // 100 minutes
      };
      return fullExamTimeLimits[slug] || 5400; // Default to 90 minutes
    }
  };

  // Get questions based on exam slug (for both start and results views)
  const currentSlug = match ? params.slug : (resultsMatch ? resultsParams.slug : '');
  
  // Initialize questions only once when component mounts or slug/SRS changes
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  
  useEffect(() => {
    if (currentSlug) {
      const examQuestions = getQuestionsForExam(currentSlug, isSRS);
      setQuestions(examQuestions);
    } else {
      setQuestions([]);
    }
  }, [currentSlug, isSRS]);
  
  const [timeRemaining, setTimeRemaining] = useState(
    currentSlug ? getTimeLimit(currentSlug, isSRS) : 1800
  );
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Get exam title based on slug
  const getExamTitle = (slug: string): string => {
    const titles: Record<string, string> = {
      'ndt-inspection': 'NDT Inspection & Testing Practice Test',
      'diver-medic': 'Diver Medic Technician Practice Test',
      'commercial-supervisor': 'Commercial Dive Supervisor Practice Test',
      'saturation-diving': 'Saturation Diving Systems Practice Test',
      'underwater-welding': 'Advanced Underwater Welding Practice Test',
      'hyperbaric-operations': 'Hyperbaric Chamber Operations Practice Test',
      'alst': 'Assistant Life Support Technician Practice Test',
      'lst': 'Life Support Technician (LST) Practice Test'
    };
    return titles[slug] || 'Professional Diving Practice Test';
  };

  // Timer countdown - MUST be before any conditional returns
  useEffect(() => {
    if (timeRemaining > 0 && !examSubmitted) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitExam();
    }
  }, [timeRemaining, examSubmitted]);

  // Handle case when no questions are found
  if ((match || resultsMatch) && totalQuestions === 0) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
              <p className="text-gray-600 mb-6">
                No questions found for the exam: {currentSlug}
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start voice recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsRecording(true);
        };
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update the answer with the transcribed text
          if (finalTranscript) {
            const currentAnswer = answers[currentQuestion.id] || '';
            setAnswers(prev => ({
              ...prev,
              [currentQuestion.id]: currentAnswer + finalTranscript
            }));
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognition.start();
      } else {
        alert('Speech recognition not supported in this browser. Please type your answer manually.');
      }
    } else {
      // Stop recording
      setIsRecording(false);
    }
  };

  const handleSubmitExam = async () => {
    setExamSubmitted(true);
    setShowExplanations(true);

    try {
      // Auto-grade only questions that have a correctAnswer.
      const gradableQuestions = questions.filter((q) => typeof q.correctAnswer === "string" && q.correctAnswer.length > 0);
      const totalGradable = gradableQuestions.length;
      const correct = gradableQuestions.reduce((sum, q) => {
        const userAnswer = answers[q.id];
        return userAnswer && userAnswer === q.correctAnswer ? sum + 1 : sum;
      }, 0);

      if (currentSlug) {
        await apiRequest("POST", "/api/exam-attempts", {
          userId: "current-user",
          examSlug: currentSlug,
          score: correct,
          totalQuestions: totalGradable,
          answers: JSON.stringify(answers),
        });
      }
    } catch (error) {
      console.error("Failed to persist exam attempt:", error);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return <FileText className="w-4 h-4" />;
      case 'WRITTEN': return <Mic className="w-4 h-4" />;
      case 'TRUE_FALSE': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const answeredQuestions = Object.keys(answers).length;
  const timeIsLow = timeRemaining < 600; // Less than 10 minutes

  if (!match && !resultsMatch) return null;

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Header */}
        <div className="mb-6">
          <div className="mb-4">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                className="mb-4 text-slate-600 hover:text-slate-900"
                data-testid="button-back-to-exams"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Professional Exams
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-exam-title">
                {currentSlug ? getExamTitle(currentSlug) : 'Professional Diving Practice Test'}
              </h1>
              <p className="text-slate-600">Prepare for Commercial Diving Certification Exams</p>
              <div className="flex items-center space-x-2 mt-2">
                {isSRS ? (
                  <>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      🧠 SRS Learning Test
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      {totalQuestions} Questions
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                      📝 Full Exam
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      {totalQuestions} Questions
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              timeIsLow ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span data-testid="text-time-remaining">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-slate-600">
                {answeredQuestions}/{totalQuestions} answered
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {(!examSubmitted && !resultsMatch) ? (
          /* Question Interface */
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getQuestionTypeIcon(currentQuestion.type)}
                  <Badge variant="outline">
                    {currentQuestion.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Question Prompt */}
              <h3 className="text-lg font-semibold text-slate-900 mb-6" data-testid="text-question-prompt">
                {currentQuestion.prompt}
              </h3>

              {/* Answer Interface */}
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options?.map((option, index) => (
                    <label 
                      key={index}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mt-1 mr-3"
                        data-testid={`radio-option-${index}`}
                      />
                      <span className="text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'TRUE_FALSE' && (
                <div className="space-y-3 mb-6">
                  {['True', 'False'].map((option) => (
                    <label 
                      key={option}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mr-3"
                        data-testid={`radio-${option.toLowerCase()}`}
                      />
                      <span className="text-slate-700 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'WRITTEN' && (
                <div className="space-y-4 mb-6">
                  <Textarea
                    placeholder="Type your detailed response here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="min-h-[200px] text-base"
                    data-testid="textarea-written-answer"
                  />
                  
                  {/* Voice Recording */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-slate-600" />
                      <span className="text-slate-700 font-medium">Voice Dictation Available</span>
                    </div>
                    <Button
                      onClick={toggleRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      data-testid="button-voice-recording"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                  data-testid="button-previous"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="space-x-3">
                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <Button
                      onClick={handleSubmitExam}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-submit-exam"
                    >
                      Complete Practice Test
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      data-testid="button-next"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Results Interface */
          <div className="space-y-6">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Practice Test Completed Successfully</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">
                  Your practice test has been completed. Review the detailed explanations below to prepare for your certification exam.
                </p>
              </CardContent>
            </Card>

            {/* Question Review with AI Explanations */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI-Powered Detailed Explanations
              </h2>
              
              {questions.map((question: ExamQuestion, index: number) => (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Question {index + 1}: {question.type.replace('_', ' ')}
                      </h3>
                      <Badge variant="outline">{question.points} pts</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-slate-700">{question.prompt}</p>
                    
                    {question.explanation && (
                      <div className="bg-blue-50 border-l-4 border-l-blue-400 p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Professional Explanation:</h4>
                        <p className="text-blue-700">{question.explanation}</p>
                      </div>
                    )}

                    {answers[question.id] && (
                      <div className="bg-slate-50 p-3 rounded">
                        <h4 className="font-medium text-slate-800 mb-1">Your Answer:</h4>
                        <p className="text-slate-700">{answers[question.id]}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}