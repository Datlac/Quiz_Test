import questions from '@/data/initial-questions.json';
import { Question } from '@/lib/types/quiz';

export interface Topic {
  id: string;
  name: string;
  questionCount: number;
  isCustom?: boolean;
}

export function getAllTopics(): Topic[] {
  // 1. Get topics from static JSON
  const staticTopicsMap = new Map<string, number>();
  
  questions.forEach((q) => {
    const topic = q.topic;
    staticTopicsMap.set(topic, (staticTopicsMap.get(topic) || 0) + 1);
  });

  const topics: Topic[] = Array.from(staticTopicsMap.entries()).map(([name, count]) => ({
    id: name,
    name: name,
    questionCount: count,
    isCustom: false,
  }));

  // TODO: Merge with custom topics from localStorage (user store) if implemented
  
  return topics;
}

export function getQuestionsByTopic(topicId: string): Question[] {
  if (topicId === 'Review Mistakes') {
     // Handled separately by caller or special logic
     return [];
  }
  
  // Cast JSON data to Question[]
  const allQuestions = questions as unknown as Question[];
  
  return allQuestions.filter(q => q.topic === topicId);
}
