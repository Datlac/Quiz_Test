import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, LEVELS, MistakeRecord } from '@/lib/types/user';

interface UserState extends UserProfile {
  addXp: (amount: number) => void;
  updateStreak: (correct: boolean) => void;
  recordMistake: (questionId: number | string) => void;
  clearMistake: (questionId: number | string) => void;
  updateTopicProgress: (topicId: string, isCorrect: boolean) => void;
  resetProgress: () => void;
}

const INITIAL_STATE: UserProfile = {
  name: 'Learner',
  xp: 0,
  level: 1,
  rankTitle: 'Novice',
  streak: 0,
  totalQuizzesTaken: 0,
  totalCorrect: 0,
  topicProgress: {},
  mistakes: [],
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addXp: (amount) => {
        const { xp, level } = get();
        const newXp = xp + amount;
        
        // Check for level up
        let newLevel = level;
        let newRank = get().rankTitle;

        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (newXp >= LEVELS[i].xp) {
                newLevel = LEVELS[i].level;
                newRank = LEVELS[i].title;
                break;
            }
        }

        set({ xp: newXp, level: newLevel, rankTitle: newRank });
      },

      updateStreak: (correct) => {
        if (correct) {
          set((state) => ({ streak: state.streak + 1 }));
        } else {
          set({ streak: 0 });
        }
      },

      recordMistake: (questionId) => set((state) => {
        const existing = state.mistakes.find(m => m.questionId === questionId);
        if (existing) {
          return {
            mistakes: state.mistakes.map(m => 
              m.questionId === questionId ? { ...m, count: m.count + 1, timestamp: Date.now() } : m
            )
          };
        }
        return {
          mistakes: [...state.mistakes, { questionId, count: 1, timestamp: Date.now() }]
        };
      }),

      clearMistake: (questionId) => set((state) => ({
        mistakes: state.mistakes.filter(m => m.questionId !== questionId)
      })),

      updateTopicProgress: (topicId, isCorrect) => set((state) => {
        const current = state.topicProgress[topicId] || {
          topicId,
          totalQuestions: 0,
          correctAnswers: 0,
          masteryLevel: 0,
          lastPlayed: 0
        };

        const newTotal = current.totalQuestions + 1;
        const newCorrect = current.correctAnswers + (isCorrect ? 1 : 0);
        
        return {
          topicProgress: {
            ...state.topicProgress,
            [topicId]: {
              ...current,
              totalQuestions: newTotal,
              correctAnswers: newCorrect,
              masteryLevel: Math.round((newCorrect / newTotal) * 100),
              lastPlayed: Date.now()
            }
          }
        };
      }),

      resetProgress: () => set(INITIAL_STATE)
    }),
    {
      name: 'quiz-user-storage',
    }
  )
);
