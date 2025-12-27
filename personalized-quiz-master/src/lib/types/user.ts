export interface TopicProgress {
  topicId: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryLevel: number; // 0-100%
  lastPlayed: number; // timestamp
}

export interface MistakeRecord {
  questionId: number | string;
  timestamp: number;
  count: number; // how many times missed
}

export interface UserProfile {
  name: string;
  xp: number;
  level: number;
  rankTitle: string;
  streak: number;
  totalQuizzesTaken: number;
  totalCorrect: number;
  topicProgress: Record<string, TopicProgress>;
  mistakes: MistakeRecord[];
}

export const LEVELS = [
  { level: 1, xp: 0, title: 'Novice' },
  { level: 2, xp: 100, title: 'Apprentice' },
  { level: 3, xp: 300, title: 'Scholar' },
  { level: 4, xp: 600, title: 'Expert' },
  { level: 5, xp: 1000, title: 'Master' },
  { level: 6, xp: 2000, title: 'Grandmaster' },
];
