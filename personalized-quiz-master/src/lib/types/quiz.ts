export type QuestionType = 'MCQ' | 'TrueFalse' | 'Input';

export interface Question {
  id: number | string;
  topic: string;
  tag?: string;
  type: QuestionType;
  q: string; // The question text
  options: string[];
  a: number; // Index of the correct answer
  explanation?: string;
}

export interface QuizConfig {
  topic: string; // "All" or specific topic
  mode: 'focus' | 'speed' | 'recall';
  questionCount: number; // e.g., 10, 20, or all
  timePerQuestion?: number; // in seconds, mainly for speed mode
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answers: Record<number, number>; // questionId -> selectedOptionIndex
  isFinished: boolean;
  startTime: number;
  endTime?: number;
}
