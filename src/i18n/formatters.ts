import { ApplianceType, City, Zone } from '../domain/types';

export type TranslateFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

/**
 * Translates city enum into localized display string.
 */
export function cityLabel(city: string | City | undefined, t: TranslateFn): string {
  if (!city) return '';
  const key = `city_${city.toLowerCase()}`;
  return t(key, undefined, city);
}

/**
 * Translates zone into localized display string, resolving IDs like zone-mumbai-andheri
 * gracefully even when the zones array is omitted or empty.
 */
export function zoneLabel(zoneId: string | undefined, zones: Zone[] = [], t: TranslateFn): string {
  if (!zoneId) return '';
  const zone = zones.find((z) => z.id === zoneId);
  if (zone?.name) {
    const key = `zone_${zone.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    return t(key, undefined, zone.name);
  }
  // Extract trailing name part from IDs like 'zone-mumbai-andheri' -> 'andheri'
  const stripped = zoneId.replace(/^zone-[a-z]+-/, '');
  const humanized = stripped
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const key = `zone_${stripped.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return t(key, undefined, humanized);
}

/**
 * Translates appliance type enum into localized display string.
 */
export function applianceLabel(type: string | ApplianceType | undefined, t: TranslateFn): string {
  if (!type) return '';
  const key = `appliance_${type.toLowerCase()}`;
  return t(key, undefined, type);
}

/**
 * Translates likely fault into localized display string.
 */
export function faultLabel(fault: string | undefined, t: TranslateFn): string {
  if (!fault) return '';
  const normalized = fault.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const key = `fault_${normalized}`;
  return t(key, undefined, fault);
}

/**
 * Translates status enum into localized display string with humanized fallback.
 */
export function statusLabel(status: string | undefined, t: TranslateFn): string {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const key = `status_${normalized}`;
  const humanized = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return t(key, undefined, humanized);
}

/**
 * Translates recommendation lean into localized display string.
 */
export function leanLabel(lean: string | undefined, t: TranslateFn): string {
  if (!lean) return '';
  switch (lean) {
    case 'REPAIR':
      return t('lean_label_repair', undefined, 'Repair');
    case 'BOTH_LEAN_REPAIR':
      return t('lean_label_both_repair', undefined, 'Both (Leans Repair)');
    case 'BOTH_LEAN_REPLACE':
      return t('lean_label_both_replace', undefined, 'Both (Leans Replace)');
    case 'REPLACE':
      return t('lean_label_replace', undefined, 'Replace');
    default:
      return t(`lean_${lean.toLowerCase()}`, undefined, lean);
  }
}

/**
 * Formats a raw service request or job ID into human-facing reference format like "Job #1042".
 */
export function formatJobReference(jobId: string | undefined): string {
  if (!jobId) return '';
  if (jobId.startsWith('Job #')) return jobId;
  const digits = jobId.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `Job #${digits.slice(-4)}`;
  }
  const parts = jobId.split('-');
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) {
    return `Job #${lastPart.padStart(4, '0')}`;
  }
  return `Job #${lastPart}`;
}

/**
 * Translates exit survey issue enums into localized display strings.
 */
export function issueLabel(issue: string | undefined, t: TranslateFn): string {
  if (!issue) return '';
  switch (issue) {
    case 'ISSUE_NONE':
      return t('survey_issue_none', undefined, 'Working fine');
    case 'ISSUE_NOT_WORKING':
      return t('survey_issue_not_working', undefined, 'Not working properly');
    case 'ISSUE_NOISY':
      return t('survey_issue_noisy', undefined, 'Noisy');
    case 'ISSUE_HIGH_POWER_BILL':
      return t('survey_issue_high_power_bill', undefined, 'High power bill');
    case 'ISSUE_FREQUENT_REPAIR':
      return t('survey_issue_frequent_repair', undefined, 'Needs frequent repair');
    default:
      return t(`issue_${issue.toLowerCase()}`, undefined, issue.replace(/_/g, ' '));
  }
}

/**
 * Translates form option values into localized strings when available.
 */
export function optionLabel(option: string | undefined, t: TranslateFn): string {
  if (!option) return '';
  const key = `opt_${option.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return t(key, undefined, option);
}

/**
 * Formats a list of appliance skills into localized display string.
 */
export function skillList(skills: (string | ApplianceType)[] = [], t: TranslateFn): string {
  if (!skills || skills.length === 0) return '';
  return skills.map((s) => applianceLabel(s, t)).join(', ');
}
