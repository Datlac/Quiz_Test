export function calculateXp(score: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  
  const percentage = (score / totalQuestions) * 100;
  
  // Base XP = Score * 10
  // Bonus = Percentage > 80 ? 50 : 0
  const bonus = percentage >= 80 ? 50 : 0;
  
  return (score * 10) + bonus;
}

export function calculateMastery(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
