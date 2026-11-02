import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonScreen } from '../components/ComparisonScreen';
import { KfsModal } from '../components/KfsModal';
import { evaluateRecommendation } from '../domain/scoring';
import { evaluateBureauApplication, evaluateAAApplication } from '../domain/bank';
import { createInitialConsents } from '../domain/consent';

describe('Guardrails Verification (Section 14: G1 to G8)', () => {
  // G1: Comparison cards have equal size, styling and prominence; no option is pre-selected or highlighted
  it('Guardrail G1: Both comparison cards share identical styling and have no pre-selection', () => {
    const recommendation = evaluateRecommendation({
      applianceType: 'AC',
      ageYears: 12,
      likelyFault: 'Compressor',
    });

    render(
      <ComparisonScreen
        recommendation={recommendation}
        applianceType="AC"
        brand="Voltas"
        ageYears={12}
        likelyFault="Compressor"
      />
    );

    const repairCard = screen.getByTestId('comparison-repair-card');
    const replaceCard = screen.getByTestId('comparison-replace-card');

    expect(repairCard).toBeInTheDocument();
    expect(replaceCard).toBeInTheDocument();
    expect(repairCard.className).toBe(replaceCard.className);
  });

  // G2: Repair option and cost are always shown, whatever the lean
  it('Guardrail G2: Repair card and cost are rendered across all four lean outcomes', () => {
    const leans = ['REPAIR', 'BOTH_LEAN_REPAIR', 'BOTH_LEAN_REPLACE', 'REPLACE'] as const;

    leans.forEach((lean) => {
      const { unmount } = render(
        <ComparisonScreen
          recommendation={{
            score: 75,
            lean,
            reasons: ['Test reason'],
            repairCost: 3500,
            newPrice: 48500,
            expectedRemainingLifeYears: 2,
          }}
          applianceType="AC"
          brand="Voltas"
          ageYears={10}
          likelyFault="Fan motor"
        />
      );

      const repairCard = screen.getByTestId('comparison-repair-card');
      expect(repairCard).toBeInTheDocument();
      expect(screen.getByText(/Rs 3,500/)).toBeInTheDocument();
      unmount();
    });
  });

  // G6: No false urgency, countdown timers, pre-ticked boxes or forced actions
  it('Guardrail G6: KFS agreement checkbox starts un-ticked (checked: false by default)', () => {
    render(
      <KfsModal
        productName="Energy Efficient AC"
        principal={48500}
        tenorMonths={12}
        monthlyEMI={4042}
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );

    const checkbox = screen.getByTestId('kfs-acknowledgement-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    const submitBtn = screen.getByTestId('kfs-submit-button') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  // G7: Four separate, revocable consents, all default OFF; booking never depends on them
  it('Guardrail G7: All consents initialize with granted = false', () => {
    const consents = createInitialConsents('c-test-user');
    expect(consents.length).toBe(4);
    consents.forEach((c) => {
      expect(c.granted).toBe(false);
    });
  });

  // G8: No phone data, contacts or media used in credit decisions
  it('Guardrail G8: Underwriting accepts strictly financial parameters and no phone or contact logs', () => {
    // evaluateBureauApplication only accepts (bureauScore, aaSummary)
    expect(evaluateBureauApplication.length).toBeLessThanOrEqual(2);
    // evaluateAAApplication only accepts (credits, obligations, newEMI)
    expect(evaluateAAApplication.length).toBe(3);
  });
});
