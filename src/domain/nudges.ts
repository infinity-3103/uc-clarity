import { Customer, Nudge, ServiceRequest } from './types';
import { NUDGE_MAX_PER_WEEK } from '../config/assumptions';

export interface NudgeRuleContext {
  simulatedDate: string; // YYYY-MM-DD
  temperatureByCity: Record<string, number>;
  recentNudges: Nudge[];
  serviceRequests: ServiceRequest[];
}

export function isCustomerEligibleForNudge(
  customer: Customer,
  recentNudges: Nudge[]
): boolean {
  if (customer.deleted) return false;

  const marketingConsent = customer.consents.find((c) => c.purpose === 'MARKETING')?.granted;
  if (!marketingConsent) return false;

  // Frequency cap: maximum 2 nudges per week (past 7 days)
  const customerPastWeekNudges = recentNudges.filter((n) => n.customerId === customer.id);
  if (customerPastWeekNudges.length >= NUDGE_MAX_PER_WEEK) {
    return false;
  }

  return true;
}

export function evaluateNudgeRules(
  customer: Customer,
  context: NudgeRuleContext,
  holdoutPct: number = 10
): Nudge | null {
  if (!isCustomerEligibleForNudge(customer, context.recentNudges)) {
    return null;
  }

  // Safe cross-browser date parsing without timezone offset shifts
  let month = 0;
  let day = 1;
  if (context.simulatedDate.includes('-')) {
    const parts = context.simulatedDate.split('-');
    if (parts.length >= 3) {
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  } else {
    const dateObj = new Date(context.simulatedDate);
    month = dateObj.getUTCMonth();
    day = dateObj.getUTCDate();
  }
  const cityTemp = context.temperatureByCity[customer.city] ?? 32;

  const acAppliance = customer.appliances.find((a) => a.type === 'AC');
  const fridgeAppliance = customer.appliances.find((a) => a.type === 'FRIDGE');
  const washerAppliance = customer.appliances.find((a) => a.type === 'WASHER');
  const nativeAppliance = customer.appliances.find((a) => a.brand.toLowerCase().includes('native'));

  let generatedNudge: { ruleId: string; title: string; body: string } | null = null;

  // 1. Pre-summer rule: Month is Feb (1), Mar (2), or Apr (3) AND customer owns an AC aged >= 8 or past AC fault
  if ((month === 1 || month === 2 || month === 3) && acAppliance) {
    const hasPastFault = context.serviceRequests.some(
      (r) => r.customerId === customer.id && r.applianceType === 'AC'
    );
    if (acAppliance.ageYears >= 8 || hasPastFault) {
      generatedNudge = {
        ruleId: 'nudge-pre-summer',
        title: 'Pre-summer AC Health Check',
        body: 'Summer is almost here. Is your AC ready? Book a check or see replacement offers with no-cost EMI.',
      };
    }
  }

  // 2. Heatwave rule: Outside temperature >= 40 C and owns AC
  if (!generatedNudge && cityTemp >= 40 && acAppliance) {
    generatedNudge = {
      ruleId: 'nudge-heatwave',
      title: 'Heatwave Alert in ' + customer.city,
      body: `It is ${cityTemp} C out there. Quick AC check slots are open today.`,
    };
  }

  // 3. Festive / New Year rule: Between 20 Dec and 5 Jan, owns fridge or washer aged >= 8
  const isFestive = (month === 11 && day >= 20) || (month === 0 && day <= 5);
  if (!generatedNudge && isFestive) {
    if ((fridgeAppliance && fridgeAppliance.ageYears >= 8) || (washerAppliance && washerAppliance.ageYears >= 8)) {
      generatedNudge = {
        ruleId: 'nudge-festive',
        title: 'Holiday Season Refresh',
        body: 'Party season! Keep the drinks chilled. See refrigerator offers.',
      };
    }
  }

  // 4. Post-warranty AMC: owns Native product past warranty (age >= 1)
  if (!generatedNudge && nativeAppliance && nativeAppliance.ageYears >= 1) {
    generatedNudge = {
      ruleId: 'nudge-amc',
      title: 'Maintain Your Native Purifier',
      body: 'Your Native warranty has ended. Keep it running with an AMC at Rs 5,000 a year.',
    };
  }

  // 5. Declined-to-buy reminder: 7 simulated days after declined comparison
  if (!generatedNudge) {
    const declinedReq = context.serviceRequests.find(
      (r) =>
        r.customerId === customer.id &&
        r.status === 'COMPLETED' &&
        r.choice === 'REPAIR' &&
        r.recommendation &&
        (r.recommendation.lean === 'BOTH_LEAN_REPLACE' || r.recommendation.lean === 'REPLACE')
    );
    if (declinedReq) {
      generatedNudge = {
        ruleId: 'nudge-declined-reminder',
        title: 'Still Considering an Upgrade?',
        body: 'Flexible no-cost EMI options starting from Rs 4,042 per month are available if you decide to replace.',
      };
    }
  }

  if (!generatedNudge) return null;

  // Deterministic holdout check based on customerId hash
  const hash = customer.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isHoldout = hash % 100 < holdoutPct;

  return {
    id: `nudge-${Date.now()}-${customer.id}`,
    customerId: customer.id,
    ruleId: generatedNudge.ruleId,
    title: generatedNudge.title,
    body: generatedNudge.body,
    sentAt: context.simulatedDate,
    opened: false,
    holdout: isHoldout,
  };
}
