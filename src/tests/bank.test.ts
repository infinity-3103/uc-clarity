import { describe, it, expect } from 'vitest';
import { evaluateBureauApplication, evaluateAAApplication, generateKFS } from '../domain/bank';

describe('Aarambh Bank Underwriting & Lending Rules (Section 9, 17)', () => {
  it('Bureau path boundary values: 720, 650 without AA, 650 with AA, and below 650', () => {
    // Score >= 720 -> APPROVED
    const prime = evaluateBureauApplication(720);
    expect(prime.decision).toBe('APPROVED');

    // Score 650 to 719 without AA -> MANUAL_REVIEW
    const borderline = evaluateBureauApplication(680);
    expect(borderline.decision).toBe('MANUAL_REVIEW');

    // Score 650 to 719 with healthy AA summary (FOIR <= 0.50) -> APPROVED
    const borderlineWithAA = evaluateBureauApplication(680, {
      avgMonthlyCredits: 40000,
      avgMonthlyObligations: 12000,
      volatility: 'LOW',
      foir: 0.45,
    });
    expect(borderlineWithAA.decision).toBe('APPROVED');

    // Score < 650 -> REJECTED
    const lowBureau = evaluateBureauApplication(649);
    expect(lowBureau.decision).toBe('REJECTED');
  });

  it('Account Aggregator (AA) path boundary values: FOIR <= 0.50, 0.50 to 0.65, and > 0.65', () => {
    // Case 1: Credits 40,000, Obligations 12,000, New EMI 4,000 -> FOIR = (12000 + 4000) / 40000 = 0.40 (40%) <= 0.50 -> APPROVED
    const approvedAA = evaluateAAApplication(40000, 12000, 4000);
    expect(approvedAA.decision).toBe('APPROVED');
    expect(approvedAA.foir).toBe(0.40);

    // Boundary at 0.50 -> APPROVED
    // (15000 + 5000) / 40000 = 20000 / 40000 = 0.50
    const edgeApproved = evaluateAAApplication(40000, 15000, 5000);
    expect(edgeApproved.decision).toBe('APPROVED');
    expect(edgeApproved.foir).toBe(0.50);

    // Case 2: Boundary 0.50 to 0.65 -> MANUAL_REVIEW (offers 12 months)
    // (18000 + 4000) / 40000 = 22000 / 40000 = 0.55
    const reviewAA = evaluateAAApplication(40000, 18000, 4000);
    expect(reviewAA.decision).toBe('MANUAL_REVIEW');
    expect(reviewAA.offeredTenor).toBe(12);
    expect(reviewAA.foir).toBe(0.55);

    // Case 3: FOIR > 0.65 -> REJECTED
    // (25000 + 4000) / 40000 = 29000 / 40000 = 0.725
    const rejectedAA = evaluateAAApplication(40000, 25000, 4000);
    expect(rejectedAA.decision).toBe('REJECTED');
    expect(rejectedAA.foir).toBe(0.725);
  });

  it('Key Fact Statement includes statutory LSP and zero-cost disclosure', () => {
    const kfs = generateKFS('AC Unit', 48500, 12, 4042);
    expect(kfs.lenderName).toContain('Aarambh Bank');
    expect(kfs.lspName).toContain('Urban Company');
    expect(kfs.apr).toBe(0.0);
    expect(kfs.interestCharged).toBe(0);
    expect(kfs.processingFee).toBe(0);
  });
});
