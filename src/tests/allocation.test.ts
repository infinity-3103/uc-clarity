import { describe, it, expect } from 'vitest';
import { ALLOCATION_WEIGHTS, computeAllocationScore } from '../domain/allocation';
import { Professional, ServiceRequest } from '../domain/types';

describe('Job Allocation Engine (Section 11 & Guardrail G5)', () => {
  it('Allocation weights sum exactly to 1.0', () => {
    const totalWeight = Object.values(ALLOCATION_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(totalWeight).toBeCloseTo(1.0, 5);
  });

  it('Strictly excludes conversion, sales, and referral earnings from allocation keys', () => {
    const keys = Object.keys(ALLOCATION_WEIGHTS);
    expect(keys).not.toContain('conversion');
    expect(keys).not.toContain('sales');
    expect(keys).not.toContain('referral');
    expect(keys).toEqual(['travel', 'skill', 'rating', 'sla']);
  });

  it('Computes score S based solely on travel, skill, rating, and SLA fit', () => {
    const mockPro: Professional = {
      id: 'p1',
      name: 'Test Pro',
      city: 'Mumbai',
      zoneId: 'z1',
      skills: ['AC'],
      rating: 5.0,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 10000,
      referralEarnings: 50000, // Large referral earnings
      online: true,
    };

    const mockPro2: Professional = {
      ...mockPro,
      id: 'p2',
      salesModuleOptIn: false,
      trainingCompleted: false,
      referralEarnings: 0, // Zero referral earnings
    };

    const mockJob: ServiceRequest = {
      id: 'j1',
      customerId: 'c1',
      applianceType: 'AC',
      brand: 'Voltas',
      ageYears: 5,
      customerAnswers: {},
      photos: [],
      status: 'BOOKED',
      serviceFee: 499,
      createdAt: '2026-03-15',
    };

    // Both pros have identical operational parameters (15m travel, 5.0 rating, AC skill)
    const score1 = computeAllocationScore(mockPro, mockJob, 15, true);
    const score2 = computeAllocationScore(mockPro2, mockJob, 15, true);

    // Guardrail G5 verification: Scores must be strictly identical regardless of sales/referral earnings
    expect(score1.score).toBe(score2.score);
  });
});
