import { City, Customer, SalesLead, SurveyAnswerItem } from './types';
import {
  LEAD_AGE_POINTS,
  LEAD_ISSUE_POINTS,
  LEAD_INTEREST_POINTS,
  LEAD_PRIORITY_THRESHOLDS,
  SURVEY_COOLDOWN_MONTHS,
} from '../config/assumptions';

/**
 * Evaluates a survey item to check if it qualifies as a SalesLead.
 * Rule: Qualifies if age is 5+ years ('5_TO_8' or 'OVER_8'),
 * OR any issue other than 'NONE' is present,
 * OR replacement interest is 'YES' or 'MAYBE'.
 */
export function evaluateSurveyAnswerForLead(
  item: SurveyAnswerItem,
  customerId: string,
  city: City,
  zoneId: string,
  surveyResponseId: string
): SalesLead | null {
  const hasAge5Plus = item.ageBand === '5_TO_8' || item.ageBand === 'OVER_8';
  const hasIssues = item.issues.some((iss) => iss !== 'NONE');
  const hasReplaceInterest = item.replaceInterest === 'YES' || item.replaceInterest === 'MAYBE';

  if (!hasAge5Plus && !hasIssues && !hasReplaceInterest) {
    return null;
  }

  // Priority score calculation
  const agePoints = LEAD_AGE_POINTS[item.ageBand] ?? 0;
  const issuePoints = hasIssues ? LEAD_ISSUE_POINTS : 0;
  const interestPoints = LEAD_INTEREST_POINTS[item.replaceInterest] ?? 0;
  const priorityScore = agePoints + issuePoints + interestPoints;

  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (priorityScore >= LEAD_PRIORITY_THRESHOLDS.HIGH) {
    priority = 'HIGH';
  } else if (priorityScore >= LEAD_PRIORITY_THRESHOLDS.MEDIUM) {
    priority = 'MEDIUM';
  }

  return {
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    appliance: item.appliance,
    city,
    zoneId,
    customerId,
    priority,
    priorityScore,
    createdAt: new Date().toISOString(),
    surveyResponseId,
    ageYearsBand: item.ageBand.replace(/_/g, ' ').toLowerCase(),
    issue: item.issues.filter((iss) => iss !== 'NONE').join(', ') || 'No issues',
    replacementInterest: item.replaceInterest.toLowerCase(),
  };
}

export function getSurveyDiscountAvailableDate(customer: Customer): Date | null {
  if (!customer.lastSurveyDiscountAt) return null;
  const d = new Date(customer.lastSurveyDiscountAt);
  d.setMonth(d.getMonth() + SURVEY_COOLDOWN_MONTHS);
  return d;
}

export function isSurveyDiscountEligible(
  customer: Customer | null | undefined,
  now?: string | Date
): boolean {
  if (!customer) return false;
  if (!customer.lastSurveyDiscountAt) return true;
  const nowDate = now ? new Date(now) : new Date();
  const availableDate = getSurveyDiscountAvailableDate(customer);
  if (!availableDate) return true;
  return nowDate.getTime() >= availableDate.getTime();
}

export function formatSurveyDiscountDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

