import { ApplianceType, City, DirectOrder, SalesLead, ServiceRequest, Zone } from './types';
import { LEAD_DEMAND_BOOST } from '../config/assumptions';

export type DemandBand = 'Low' | 'Medium' | 'High';

export interface DemandContext {
  temp?: number;
  humidity?: number;
  aqi?: number;
  tds?: number;
  voltage?: 'STABLE' | 'MODERATE' | 'SEVERE';
  serviceRequests?: ServiceRequest[];
  directOrders?: DirectOrder[];
  salesLeads?: SalesLead[];
}

export interface ZoneDemandResult {
  zoneId: string;
  zoneName: string;
  category: ApplianceType | 'ALL';
  rangeDays: number;
  score: number;
  level: DemandBand;
  multiplier: number;
  baseDemand: number;
  leadCount: number;
}

export interface CityDemandResult {
  city: City;
  rangeDays: number;
  appliances: Record<ApplianceType, { score: number; level: DemandBand }>;
  topZones: {
    zoneId: string;
    zoneName: string;
    score: number;
    level: DemandBand;
    leadCount: number;
  }[];
  overallScore: number;
  overallLevel: DemandBand;
}

export function getDemandLevel(score: number): DemandBand {
  if (score < 50) return 'Low';
  if (score < 70) return 'Medium';
  return 'High';
}

/**
 * Computes physics-based normalized demand score (15 to 100) for a specific zone.
 */
export function computeZoneDemand(
  zone: Zone,
  category: ApplianceType | 'ALL' = 'ALL',
  rangeDays: number = 90,
  context: DemandContext = {}
): ZoneDemandResult {
  const {
    temp = 32,
    humidity = 60,
    aqi = 150,
    tds = 350,
    voltage = 'STABLE',
    serviceRequests = [],
    directOrders = [],
    salesLeads = [],
  } = context;

  const validRangeDays = rangeDays <= 0 ? 90 : rangeDays;

  // 1. Base demand from historical logs
  const appTypes: ApplianceType[] =
    category === 'ALL'
      ? ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER']
      : [category];

  let baseSum = 0;
  appTypes.forEach((type) => {
    const hist = zone.demandHistory[type] || [12];
    const sliced = hist.slice(-validRangeDays);
    const avg = sliced.length > 0 ? sliced.reduce((a, b) => a + b, 0) / sliced.length : 12;
    baseSum += avg;
  });
  const avgBaseDemand = baseSum / appTypes.length;

  // 2. Weather and Environmental Multipliers
  let multiplier = 1.0;

  // Temperature impact (drives AC and Refrigerator load)
  if (category === 'ALL' || category === 'AC' || category === 'FRIDGE') {
    if (temp >= 40) multiplier += 0.85;
    else if (temp >= 36) multiplier += 0.45;
    else if (temp <= 22) multiplier -= 0.15;
  }

  // Humidity impact (drives AC dehumidification & Washing Machine laundry load)
  if (category === 'ALL' || category === 'WASHER' || category === 'AC') {
    if (humidity >= 80) multiplier += 0.55;
    else if (humidity >= 65) multiplier += 0.25;
  }

  // AQI impact (drives Air Purifier filter replacements & AMC)
  if (category === 'ALL' || category === 'PURIFIER') {
    if (aqi >= 300) multiplier += 0.75;
    else if (aqi >= 200) multiplier += 0.40;
  }

  // Water Hardness / TDS impact (drives Geyser scaling & RO purifier membrane load)
  if (category === 'ALL' || category === 'GEYSER' || category === 'PURIFIER') {
    if (tds >= 800) multiplier += 0.65;
    else if (tds >= 500) multiplier += 0.30;
  }

  // Grid Voltage Spikes impact (PCB & compressor burnouts)
  if (voltage === 'SEVERE') multiplier += 0.45;
  else if (voltage === 'MODERATE') multiplier += 0.20;

  // 3. Live Customer Activity Boost & Open Sales Leads
  const activeRequestsInZone = serviceRequests.filter(
    (r) => r.customerId && r.status !== 'COMPLETED' && (category === 'ALL' || r.applianceType === category)
  ).length;

  const recentOrdersInZone = directOrders.filter(
    (o) => category === 'ALL' || o.category === category
  ).length;

  const relevantLeads = salesLeads.filter(
    (l) => l.zoneId === zone.id && (category === 'ALL' || l.appliance === category)
  );
  const leadsBoost = relevantLeads.length * LEAD_DEMAND_BOOST;

  const liveBoost = activeRequestsInZone * 5 + recentOrdersInZone * 3 + leadsBoost;

  // 4. Final Normalized Score (15 to 100)
  const rawScore = Math.round(avgBaseDemand * 2.8 * multiplier + liveBoost);
  const demandScore = Math.min(100, Math.max(15, rawScore));

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    category,
    rangeDays: validRangeDays,
    score: demandScore,
    level: getDemandLevel(demandScore),
    multiplier: Number(multiplier.toFixed(2)),
    baseDemand: Number(avgBaseDemand.toFixed(1)),
    leadCount: relevantLeads.length,
  };
}

/**
 * Computes city-scoped demand summary across appliances and identifies the top 3 zones.
 */
export function computeCityDemand(
  city: City,
  rangeDays: number = 90,
  context: DemandContext = {},
  zones: Zone[] = []
): CityDemandResult {
  const cityZones = zones.filter((z) => z.city === city);

  const appliancesList: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];

  const applianceResults: Record<ApplianceType, { score: number; level: DemandBand }> = {
    AC: { score: 50, level: 'Medium' },
    FRIDGE: { score: 50, level: 'Medium' },
    WASHER: { score: 50, level: 'Medium' },
    GEYSER: { score: 50, level: 'Medium' },
    PURIFIER: { score: 50, level: 'Medium' },
  };

  appliancesList.forEach((app) => {
    if (cityZones.length === 0) return;
    const scores = cityZones.map((z) => computeZoneDemand(z, app, rangeDays, context).score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    applianceResults[app] = {
      score: avgScore,
      level: getDemandLevel(avgScore),
    };
  });

  // Calculate zone overall demand
  const evaluatedZones = cityZones.map((z) => {
    const res = computeZoneDemand(z, 'ALL', rangeDays, context);
    return {
      zoneId: z.id,
      zoneName: z.name,
      score: res.score,
      level: res.level,
      leadCount: res.leadCount,
    };
  });

  // Sort by score descending to get top 3
  evaluatedZones.sort((a, b) => b.score - a.score);
  const topZones = evaluatedZones.slice(0, 3);

  const overallAvg =
    evaluatedZones.length > 0
      ? Math.round(evaluatedZones.reduce((a, b) => a + b.score, 0) / evaluatedZones.length)
      : 50;

  return {
    city,
    rangeDays,
    appliances: applianceResults,
    topZones,
    overallScore: overallAvg,
    overallLevel: getDemandLevel(overallAvg),
  };
}
