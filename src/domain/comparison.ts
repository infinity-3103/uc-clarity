import { ApplianceType } from './types';
import { TRADE_IN_BASE, TRADE_IN_FACTOR } from '../config/assumptions';

export interface EMICalculation {
  principal: number;
  tradeInCredit: number;
  netPrice: number;
  tenorMonths: number;
  monthlyEMI: number;
  totalPayable: number;
  interestCharged: number;
}

export function calculateTradeInCredit(applianceType: ApplianceType, grade: number = 3): number {
  const base = TRADE_IN_BASE[grade] ?? 2000;
  const factor = TRADE_IN_FACTOR[applianceType] ?? 1.0;
  return Math.round(base * factor);
}

export function calculateEMI(
  principal: number,
  tradeInCredit: number,
  tenorMonths: number
): EMICalculation {
  const netPrice = Math.max(0, principal - tradeInCredit);
  const monthlyEMI = Math.round(netPrice / tenorMonths);
  return {
    principal,
    tradeInCredit,
    netPrice,
    tenorMonths,
    monthlyEMI,
    totalPayable: netPrice,
    interestCharged: 0,
  };
}

export function getLeanSummaryText(lean: 'REPAIR' | 'BOTH_LEAN_REPAIR' | 'BOTH_LEAN_REPLACE' | 'REPLACE'): string {
  switch (lean) {
    case 'REPAIR':
      return 'Based on age and repair cost, repair looks more economical.';
    case 'BOTH_LEAN_REPAIR':
      return 'Both options are viable; repair offers lower immediate cash expenditure.';
    case 'BOTH_LEAN_REPLACE':
      return 'Both options are viable; replacement offers comprehensive warranty and modern efficiency.';
    case 'REPLACE':
      return 'Based on appliance age and component condition, replacement offers superior long-term value.';
  }
}

export const AC_ENERGY_NOTE =
  'A newer 5-star inverter model can save about Rs 4,000 to 6,000 a year in electricity in high-usage homes (indicative). Over the price of a new unit this offsets part of the cost, not all of it.';
