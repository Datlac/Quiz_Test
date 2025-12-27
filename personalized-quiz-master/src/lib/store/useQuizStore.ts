import { create } from 'zustand';
import { Question } from '@/lib/types/quiz';

interface QuizStore {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answers: Record<number, number>; // questionId -> selectedOptionIndex
  isFinished: boolean;
  startTime: number;
  
  startQuiz: (questions: Question[]) => void;
  answerQuestion: (questionId: number | string, optionIndex: number) => void;
  nextQuestion: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  answers: {},
  isFinished: false,
  startTime: 0,

  startQuiz: (questions) => set({
    questions,
    currentQuestionIndex: 0,
    score: 0,
    answers: {},
    isFinished: false,
    startTime: Date.now()
  }),

  answerQuestion: (questionId, optionIndex) => set((state) => {
    const question = state.questions[state.currentQuestionIndex];
    const isCorrect = question.a === optionIndex;
    const newScore = isCorrect ? state.score + 1 : state.score;

    return {
       answers: { ...state.answers, [questionId as number]: optionIndex },
       score: newScore
    };
  }),

  nextQuestion: () => set((state) => {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex >= state.questions.length) {
      return { isFinished: true };
    }
    return { currentQuestionIndex: nextIndex };
  }),

  endQuiz: () => set({ isFinished: true }),

  resetQuiz: () => set({
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    answers: {},
    isFinished: false,
    startTime: 0
  })
}));
