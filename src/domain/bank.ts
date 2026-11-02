import { AASummary, Customer } from './types';
import { COOLING_OFF_DAYS } from '../config/assumptions';

export interface UnderwritingDecision {
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasons: string[];
  foir?: number;
  offeredTenor?: number;
}

// Guardrail G8: bank underwriting takes strictly consented financial inputs.
// No phone data, contacts, location logs or media are ever accepted or processed.
export function evaluateBureauApplication(
  bureauScore: number,
  aaSummary?: AASummary
): UnderwritingDecision {
  if (bureauScore >= 720) {
    return {
      decision: 'APPROVED',
      reasons: [
        `Credit bureau score of ${bureauScore} satisfies prime underwriting criteria.`,
        'Stable credit history verified via Aarambh Bank lending policy.',
      ],
    };
  }

  if (bureauScore >= 650) {
    if (aaSummary && aaSummary.foir <= 0.5) {
      return {
        decision: 'APPROVED',
        foir: aaSummary.foir,
        reasons: [
          `Credit bureau score ${bureauScore} complemented by verified cash flows.`,
          `Account Aggregator FOIR of ${(aaSummary.foir * 100).toFixed(1)}% confirms affordability.`,
        ],
      };
    }
    return {
      decision: 'MANUAL_REVIEW',
      reasons: [
        `Credit bureau score of ${bureauScore} requires secondary assessment.`,
        'Additional banking cash-flow statement or manual credit officer appraisal requested.',
      ],
    };
  }

  return {
    decision: 'REJECTED',
    reasons: [
      `Credit bureau score of ${bureauScore} is below minimum approval threshold of 650.`,
      'Unable to issue no-cost EMI credit line at this time under Aarambh Bank policy.',
    ],
  };
}

export function evaluateAAApplication(
  avgMonthlyCredits: number,
  avgMonthlyObligations: number,
  newMonthlyEMI: number
): UnderwritingDecision {
  if (avgMonthlyCredits <= 0) {
    return {
      decision: 'REJECTED',
      reasons: ['No verified recurring monthly credits detected in statement analysis.'],
      foir: 1.0,
    };
  }

  const foir = Math.round(((avgMonthlyObligations + newMonthlyEMI) / avgMonthlyCredits) * 1000) / 1000;

  if (foir <= 0.50) {
    return {
      decision: 'APPROVED',
      foir,
      reasons: [
        'Affordability criteria met based on 6-month statement cash flows.',
        `Total monthly debt obligations remain healthy at ${(foir * 100).toFixed(1)}% of verified credits.`,
      ],
    };
  }

  if (foir <= 0.65) {
    return {
      decision: 'MANUAL_REVIEW',
      foir,
      offeredTenor: 12,
      reasons: [
        `Monthly debt obligations reach ${(foir * 100).toFixed(1)}% of income on chosen tenor.`,
        'A longer 12-month repayment tenor can reduce monthly outflow to qualify.',
      ],
    };
  }

  return {
    decision: 'REJECTED',
    foir,
    reasons: [
      `Obligations exceed maximum allowable debt-to-income ceiling (${(foir * 100).toFixed(1)}% vs 65% limit).`,
      'Affordability guidelines not met for the requested loan quantum.',
    ],
  };
}

export interface KFSDetails {
  lenderName: string;
  lspName: string;
  productName: string;
  principal: number;
  tenorMonths: number;
  monthlyEMI: number;
  interestCharged: number;
  apr: number;
  processingFee: number;
  totalPayable: number;
  coolingOffDays: number;
  coolingOffNote: string;
  grievanceContact: string;
  dataSharedNote: string;
}

export function generateKFS(
  productName: string,
  principal: number,
  tenorMonths: number,
  monthlyEMI: number
): KFSDetails {
  return {
    lenderName: 'Aarambh Bank (fictional)',
    lspName: 'Urban Company (Lending Service Provider / UI Layer)',
    productName,
    principal,
    tenorMonths,
    monthlyEMI,
    interestCharged: 0,
    apr: 0.0,
    processingFee: 0,
    totalPayable: principal,
    coolingOffDays: COOLING_OFF_DAYS,
    coolingOffNote: `${COOLING_OFF_DAYS} day statutory cooling-off window to cancel loan without penalty (illustrative).`,
    grievanceContact: 'grievance.officer@aarambhbank.simulated | 1800-000-ARMB',
    dataSharedNote: 'Identity and banking transaction summary shared strictly with Aarambh Bank for credit evaluation.',
  };
}

export const DISBURSEMENT_CLAUSE =
  'Disbursed by Aarambh Bank directly to the seller account (lender to beneficiary). No Urban Company pool account.';
