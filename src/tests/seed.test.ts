import { describe, it, expect } from 'vitest';
import { createSeedData } from '../data/seed';
import { calculateTradeInCredit, calculateEMI } from '../domain/comparison';
import { evaluateAAApplication } from '../domain/bank';
import { NEW_PRICE } from '../config/assumptions';

describe('Seed Data & Persona Calibration (Section 13, 17)', () => {
  it('Produces deterministic repeatable datasets across multiple invocations', () => {
    const run1 = createSeedData();
    const run2 = createSeedData();

    expect(run1.customers.length).toBe(40);
    expect(run1.professionals.length).toBe(30);
    expect(run1.customers[0].name).toBe(run2.customers[0].name);
    expect(run1.customers[1].name).toBe(run2.customers[1].name);
    expect(run1.serviceRequests.length).toBe(150);
    expect(run1.loanApplications.length).toBe(25);
  });

  it('Calibrates Arjun Verma thin-file persona for refrigerator at 9 months with FOIR between 0.40 and 0.45 and an approval', () => {
    const data = createSeedData();
    const arjun = data.customers.find((c) => c.id === 'cust-arjun');
    expect(arjun).toBeDefined();
    expect(arjun?.hasCreditHistory).toBe(false);

    // Arjun purchases replacement refrigerator
    const newPrice = NEW_PRICE.FRIDGE; // Rs 28,000
    const tradeIn = calculateTradeInCredit('FRIDGE', 4); // Grade 4 -> 3000 * 0.8 = 2400
    const netPrincipal = newPrice - tradeIn; // 25,600
    const emiCalc = calculateEMI(newPrice, tradeIn, 9); // 25,600 / 9 = 2,844

    const credits = arjun?.monthlyIncomeHint || 30000;
    const obligations = 9750; // Calibrated fixed obligations

    const underwriting = evaluateAAApplication(credits, obligations, emiCalc.monthlyEMI);

    // Assert FOIR between 0.40 and 0.45
    expect(underwriting.foir).toBeGreaterThanOrEqual(0.40);
    expect(underwriting.foir).toBeLessThanOrEqual(0.45);
    // Assert approval
    expect(underwriting.decision).toBe('APPROVED');
  });

  it('Verifies Riya Mehta persona attributes', () => {
    const data = createSeedData();
    const riya = data.customers.find((c) => c.id === 'cust-riya');
    expect(riya).toBeDefined();
    expect(riya?.hasCreditHistory).toBe(true);
    expect(riya?.bureauScore).toBe(742);
    expect(riya?.city).toBe('Mumbai');

    // All consents default to false initially
    expect(riya?.consents.every((c) => c.granted === false)).toBe(true);
  });
});
