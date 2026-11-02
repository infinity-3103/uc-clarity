import { describe, it, expect } from 'vitest';
import { calculateEMI, calculateTradeInCredit } from '../domain/comparison';

describe('Comparison & EMI Calculations (Section 8, 17)', () => {
  it('Calculates exact EMI for Rs 48,500 over 12, 9, and 6 months', () => {
    // 12 months = 48,500 / 12 = 4,041.66 -> 4,042
    const emi12 = calculateEMI(48500, 0, 12);
    expect(emi12.monthlyEMI).toBe(4042);
    expect(emi12.interestCharged).toBe(0);
    expect(emi12.totalPayable).toBe(48500);

    // 9 months = 48,500 / 9 = 5,388.88 -> 5,389
    const emi9 = calculateEMI(48500, 0, 9);
    expect(emi9.monthlyEMI).toBe(5389);

    // 6 months = 48,500 / 6 = 8,083.33 -> 8,083
    const emi6 = calculateEMI(48500, 0, 6);
    expect(emi6.monthlyEMI).toBe(8083);
  });

  it('Calculates EMI with trade-in credit: Rs 48,500 - 3,000 over 12 months = 3,792', () => {
    // Net: 45,500 / 12 = 3,791.66 -> 3,792
    const emiWithTradeIn = calculateEMI(48500, 3000, 12);
    expect(emiWithTradeIn.netPrice).toBe(45500);
    expect(emiWithTradeIn.monthlyEMI).toBe(3792);
  });

  it('Applies category factors to visual condition trade-in base valuations', () => {
    // Grade 3 AC: Base 2000 * 1.0 = 2000
    expect(calculateTradeInCredit('AC', 3)).toBe(2000);
    // Grade 3 Fridge: Base 2000 * 0.8 = 1600
    expect(calculateTradeInCredit('FRIDGE', 3)).toBe(1600);
    // Grade 3 Washer: Base 2000 * 0.7 = 1400
    expect(calculateTradeInCredit('WASHER', 3)).toBe(1400);
    // Grade 4 AC: Base 3000 * 1.0 = 3000
    expect(calculateTradeInCredit('AC', 4)).toBe(3000);
  });
});
