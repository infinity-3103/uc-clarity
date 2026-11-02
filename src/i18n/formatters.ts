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
 * Translates zone into localized display string.
 */
export function zoneLabel(zoneId: string | undefined, zones: Zone[] = [], t: TranslateFn): string {
  if (!zoneId) return '';
  const zone = zones.find((z) => z.id === zoneId);
  const rawName = zone?.name || zoneId;
  const key = `zone_${rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return t(key, undefined, rawName);
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
 * Translates status enum into localized display string.
 */
export function statusLabel(status: string | undefined, t: TranslateFn): string {
  if (!status) return '';
  const normalized = status.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const key = `status_${normalized}`;
  return t(key, undefined, status);
}

/**
 * Formats a list of appliance skills into localized display string.
 */
export function skillList(skills: (string | ApplianceType)[] = [], t: TranslateFn): string {
  if (!skills || skills.length === 0) return '';
  return skills.map((s) => applianceLabel(s, t)).join(', ');
}
