import React, { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timer, Mic, MicOff, Volume2, ChevronLeft, ChevronRight, Clock, Brain, FileText, ArrowLeft, Target } from "lucide-react";
import RoleBasedNavigation from "@/components/role-based-navigation";
// Import comprehensive exam questions for SRS (Spaced Repetition System)
// @ts-ignore - Content file import
import { examQuestions as fullExamQuestions } from '../../../content/exam-questions.js';

// Map UI slugs to content question keys and expand for SRS
const examQuestions = {
  "ndt-inspection": fullExamQuestions.ndt,
  "diver-medic": fullExamQuestions.dmt,
  "saturation-diving": fullExamQuestions.alst,
  "underwater-welding": fullExamQuestions["underwater-welding"],
  "commercial-supervisor": fullExamQuestions["commercial-supervisor"],
  "hyperbaric-operations": fullExamQuestions["hyperbaric-operations"],
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

// SRS Algorithm: Select questions based on spaced repetition principles
const getQuestionsForExam = (slug: string, mode?: string): ExamQuestion[] => {
  console.log('Getting questions for slug:', slug, 'mode:', mode);
  console.log('Available exam questions keys:', Object.keys(examQuestions));
  
  const allQuestions = examQuestions[slug as keyof typeof examQuestions];
  if (!allQuestions) {
    console.warn(`No questions found for exam slug: ${slug}`);
    return [];
  }
  
  // If SRS mode, return limited questions (15 max) for focused learning
  if (mode === 'srs') {
    const srsQuestions = allQuestions.slice(0, Math.min(15, allQuestions.length));
    console.log('SRS Mode: Returning', srsQuestions.length, 'questions for focused learning');
    // Shuffle questions for variety
    return srsQuestions.sort(() => Math.random() - 0.5);
  }
  
  // Full exam mode: return all questions
  console.log('Full Exam Mode: Returning full question set:', allQuestions.length);
  return allQuestions;
  
  // TODO: Implement full SRS algorithm:
  // 1. Get user's question performance history
  // 2. Calculate next review dates for each question
  // 3. Select questions due for review + new questions
  // 4. Shuffle and return optimized question set
};

export default function ExamInterface() {
  const [match, params] = useRoute("/exams/:slug/start");
  const [resultsMatch, resultsParams] = useRoute("/exams/:slug/results");
  const [location] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Get exam mode from URL query parameter
  const getExamMode = (): string => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') || 'full-exam';
    }
    // Fallback: try parsing from location string
    const queryString = location.includes('?') ? location.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('mode') || 'full-exam';
  };
  const examMode = getExamMode();

  // Get appropriate time limit based on exam type and mode (in seconds)
  const getTimeLimit = (slug: string, mode?: string): number => {
    const timeLimits: Record<string, number> = {
      'ndt-inspection': 7200,           // 120 minutes (2 hours) for NDT Inspection
      'diver-medic': 5400,              // 90 minutes for Diver Medic Technician
      'commercial-supervisor': 9000,    // 150 minutes (2.5 hours) for Commercial Supervisor
      'saturation-diving': 8100,        // 135 minutes for Saturation Diving
      'underwater-welding': 6000,       // 100 minutes for Underwater Welding
      'hyperbaric-operations': 5400,    // 90 minutes for Hyperbaric Operations
      'alst': 7200,                     // 120 minutes for Advanced Life Support Technician
      'lst': 6000                       // 100 minutes for Life Support Technician
    };
    
    const fullExamTime = timeLimits[slug] || 5400; // Default to 90 minutes
    
    // SRS mode: reduce time proportionally (15 questions vs full exam)
    // Estimate ~1 minute per question for SRS, minimum 20 minutes
    if (mode === 'srs') {
      const srsTime = Math.max(1200, Math.floor(fullExamTime * 0.2)); // 20% of full time, min 20 min
      return srsTime;
    }
    
    return fullExamTime;
  };

  const [timeRemaining, setTimeRemaining] = useState(
    match ? getTimeLimit(params.slug, examMode) : (resultsMatch ? getTimeLimit(resultsParams.slug, examMode) : 1800)
  );

  // Get questions based on exam slug and mode (for both start and results views)
  const currentSlug = match ? params.slug : (resultsMatch ? resultsParams.slug : '');
  
  // Use useMemo to ensure questions are recalculated when mode changes
  const questions = React.useMemo(() => {
    if (!currentSlug) return [];
    return getQuestionsForExam(currentSlug, examMode);
  }, [currentSlug, examMode]);
  
  // Debug logging
  useEffect(() => {
    console.log('=== EXAM DEBUG ===');
    console.log('Exam Mode:', examMode);
    console.log('Current Slug:', currentSlug);
    console.log('Total Questions:', questions.length);
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('URL Search:', typeof window !== 'undefined' ? window.location.search : 'N/A');
  }, [examMode, questions.length, currentSlug]);
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
      <div className="min-h-screen bg-gray-50">
        <RoleBasedNavigation />
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

  const handleSubmitExam = () => {
    setExamSubmitted(true);
    setShowExplanations(true);
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
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans overflow-x-hidden">
      <RoleBasedNavigation />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="w-full max-w-full overflow-x-hidden">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/exams">
            <button className="flex items-center text-slate-600 hover:text-slate-900 transition-colors" data-testid="button-back-to-exams">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Training</span>
            </button>
          </Link>
        </div>

        {/* Exam Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-exam-title">
                {currentSlug ? getExamTitle(currentSlug) : 'Professional Diving Practice Test'}
              </h1>
              <p className="text-slate-600">Prepare for Commercial Diving Certification Exams</p>
              <div className="flex items-center space-x-2 mt-2">
                {examMode === 'srs' ? (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                    🧠 SRS Learning Mode - {totalQuestions} Questions
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                    🎯 Full Exam Mode - {totalQuestions} Questions
                  </span>
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
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">
                  {Object.keys(answers).length > 0 
                    ? "Practice Test Completed Successfully" 
                    : "Exam Review & Study Guide"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  {Object.keys(answers).length > 0 
                    ? "Your practice test has been completed. Review the detailed explanations below to prepare for your certification exam."
                    : "Review all exam questions with detailed professional explanations. Take the exam to see your answers and track your progress."}
                </p>
                {Object.keys(answers).length === 0 && (
                  <div className="mt-4">
                    <Link href={`/exams/${currentSlug}/start?mode=full-exam`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Target className="w-4 h-4 mr-2" />
                        Start Full Exam
                      </Button>
                    </Link>
                    <Link href={`/exams/${currentSlug}/start?mode=srs`} className="ml-2">
                      <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        <Brain className="w-4 h-4 mr-2" />
                        Start SRS Learning
                      </Button>
                    </Link>
                  </div>
                )}
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
      </main>
    </div>
  );
}