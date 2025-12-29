import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuizQuestionProps {
  question: {
    id: string;
    prompt: string;
    a: string;
    b: string;
    c: string;
    d: string;
    order: number;
  };
  currentQuestion: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
}

export default function QuizQuestion({
  question,
  currentQuestion,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onPrevious,
  onNext,
  onSubmit,
  canGoNext,
  canGoPrevious,
  isLastQuestion
}: QuizQuestionProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  const options = [
    { key: 'a', text: question.a },
    { key: 'b', text: question.b },
    { key: 'c', text: question.c },
    { key: 'd', text: question.d }
  ];

  return (
    <div className="p-6">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700" data-testid="text-question-progress">
            Question {currentQuestion} of {totalQuestions}
          </span>
          <span className="text-sm text-slate-500" data-testid="text-completion-percentage">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all" 
            style={{ width: `${progressPercentage}%` }}
            data-testid="progress-bar"
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4" data-testid="text-question-prompt">
          {question.prompt}
        </h3>
        
        <div className="space-y-3">
          {options.map((option) => (
            <label 
              key={option.key}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAnswer === option.key
                  ? "border-primary-200 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              data-testid={`option-${option.key}`}
            >
              <input 
                type="radio" 
                name={`question-${question.id}`}
                value={option.key}
                checked={selectedAnswer === option.key}
                onChange={() => onAnswerSelect(option.key)}
                className="sr-only"
              />
              <div className={`flex items-center justify-center w-5 h-5 border-2 rounded-full mr-4 ${
                selectedAnswer === option.key
                  ? "border-primary-500"
                  : "border-gray-300"
              }`}>
                {selectedAnswer === option.key && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-slate-700 ${selectedAnswer === option.key ? 'font-medium' : ''}`}>
                {option.text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center"
          data-testid="button-previous"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={i}
              className={`w-8 h-8 rounded-full text-sm font-medium ${
                i + 1 < currentQuestion
                  ? "bg-ocean-500 text-white"
                  : i + 1 === currentQuestion
                  ? "bg-primary-500 text-white"
                  : "border border-gray-300 text-slate-600 hover:border-gray-400"
              }`}
              data-testid={`button-question-${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        {isLastQuestion ? (
          <Button 
            onClick={onSubmit}
            disabled={!selectedAnswer}
            className="bg-ocean-500 hover:bg-ocean-600 text-white"
            data-testid="button-submit"
          >
            Submit Quiz
          </Button>
        ) : (
          <Button 
            onClick={onNext}
            disabled={!canGoNext}
            className="flex items-center bg-primary-500 hover:bg-primary-600 text-white"
            data-testid="button-next"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
