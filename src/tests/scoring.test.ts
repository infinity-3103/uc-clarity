import { describe, it, expect } from 'vitest';
import { evaluateRecommendation } from '../domain/scoring';

describe('Scoring Engine v1 (Section 7)', () => {
  it('Case 1: 3-year-old AC, fan motor (1800), inverter 5-star -> score ~12.2, lean REPAIR', () => {
    const res = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 3,
      likelyFault: 'Fan motor',
      inverter: true,
      starRating: 5,
    });

    expect(res.score).toBeCloseTo(12.2, 1);
    expect(res.lean).toBe('REPAIR');
  });

  it('Case 2: 6-year-old AC, compressor (8000), inverter 5-star -> score ~29.9, lean BOTH_LEAN_REPAIR', () => {
    const res = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 6,
      likelyFault: 'Compressor',
      inverter: true,
      starRating: 5,
    });

    expect(res.score).toBeCloseTo(29.9, 1);
    expect(res.lean).toBe('BOTH_LEAN_REPAIR');
  });

  it('Case 3: 12-year-old AC, compressor (8000), non-inverter 3-star -> score ~57.9, lean BOTH_LEAN_REPLACE', () => {
    const res = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 12,
      likelyFault: 'Compressor',
      inverter: false,
      starRating: 3,
    });

    expect(res.score).toBeCloseTo(57.9, 1);
    expect(res.lean).toBe('BOTH_LEAN_REPLACE');
  });

  it('Case 4: 16-year-old AC, any major fault -> lean REPLACE (hard rule)', () => {
    const res = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 16,
      likelyFault: 'Capacitor',
    });

    expect(res.lean).toBe('REPLACE');
  });

  it('Case 5: Compressor-only fault never gives lean REPLACE unless age >= 15 or score >= 70', () => {
    const res = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 10,
      likelyFault: 'Compressor',
      inverter: true,
      starRating: 5,
    });

    expect(res.lean).not.toBe('REPLACE');
    expect(res.lean).toBe('BOTH_LEAN_REPAIR');
  });

  it('Asserts that all scores are clamped between 0 and 100', () => {
    const testAges = [0, 1, 5, 10, 15, 25, 40];
    testAges.forEach((age) => {
      const res = evaluateRecommendation({
        applianceType: 'AC',
        ageYears: age,
        likelyFault: 'Compressor',
      });
      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).toBeLessThanOrEqual(100);
    });
  });
});
