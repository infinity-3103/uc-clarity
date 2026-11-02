export interface EconomicsInputs {
  eligibleVisits: number;
  conversionPct: number; // e.g. 0.05 for 5%
  avgTicket: number;     // e.g. 48500
  ucMarginPct: number;   // e.g. 0.10 for 10%
  incentivePct: number;  // e.g. 0.03 for 3%
  subventionPct: number; // e.g. 0.04 for 4%
  brandFundsSubvention: boolean;
}

export interface EconomicsOutputs {
  salesCount: number;
  salesValue: number;
  ucMargin: number;
  incentiveCost: number;
  subventionCost: number;
  netContribution: number;
}

export function calculateUnitEconomics(inputs: EconomicsInputs): EconomicsOutputs {
  const salesCount = Math.round(inputs.eligibleVisits * inputs.conversionPct);
  const salesValue = salesCount * inputs.avgTicket;
  const ucMargin = salesValue * inputs.ucMarginPct;
  const incentiveCost = salesValue * inputs.incentivePct;
  const subventionCost = inputs.brandFundsSubvention ? 0 : salesValue * inputs.subventionPct;
  const netContribution = ucMargin - incentiveCost - subventionCost;

  return {
    salesCount,
    salesValue,
    ucMargin,
    incentiveCost,
    subventionCost,
    netContribution,
  };
}

// Indian number formatting: 1455000 -> "14,55,000"
export function formatIndianCurrency(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.round(Math.abs(num));
  const s = absNum.toString();

  if (s.length <= 3) {
    return (isNegative ? '-Rs ' : 'Rs ') + s;
  }

  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return (isNegative ? '-Rs ' : 'Rs ') + `${formattedOther},${lastThree}`;
}

export const ECONOMICS_DISCLAIMER =
  'Excludes build cost, bank referral fee, AMC revenue, survey discounts and training cost. Illustrative, not a forecast.';
