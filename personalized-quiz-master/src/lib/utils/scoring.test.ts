import { calculateXp, calculateMastery } from './scoring';

describe('Scoring Logic', () => {
  describe('calculateXp', () => {
    it('should calculate base XP correctly', () => {
      // 5 correct out of 10 = 50% (< 80%), so 5 * 10 = 50 XP
      expect(calculateXp(5, 10)).toBe(50);
    });

    it('should add bonus XP for high scores', () => {
      // 9 correct out of 10 = 90% (>= 80%), so (9 * 10) + 50 = 140 XP
      expect(calculateXp(9, 10)).toBe(140);
    });

    it('should handle perfect score', () => {
      // 10/10 = 100%, (10*10) + 50 = 150
      expect(calculateXp(10, 10)).toBe(150);
    });

    it('should handle zero score', () => {
      expect(calculateXp(0, 10)).toBe(0);
    });
  });

  describe('calculateMastery', () => {
    it('should return percentage integer', () => {
      expect(calculateMastery(5, 10)).toBe(50);
      expect(calculateMastery(1, 3)).toBe(33); // Math.round(33.33) -> 33
    });
  });
});
