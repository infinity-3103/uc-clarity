import { Professional, ServiceRequest, Zone, RepositionSuggestion, SalesDeployment, ApplianceType } from './types';
import { computeZoneDemand, DemandContext } from './demand';

// Guardrail G5: Weights for job assignment score S = 0.35*(1-travelTimeNorm) + 0.25*skillMatch + 0.20*ratingNorm + 0.20*slaFit
// Conversion rate, past sales, and referral earnings are strictly excluded from allocation.
export const ALLOCATION_WEIGHTS = {
  travel: 0.35,
  skill: 0.25,
  rating: 0.20,
  sla: 0.20,
} as const;

export interface AllocationScoreBreakdown {
  professionalId: string;
  professionalName: string;
  score: number;
  travelMinutes: number;
  travelScore: number;
  skillMatch: number;
  ratingScore: number;
  slaFitScore: number;
  eligible: boolean;
}

export function computeAllocationScore(
  pro: Professional,
  job: ServiceRequest,
  travelMinutes: number,
  canArriveWithinSlot: boolean = true
): AllocationScoreBreakdown {
  const hasSkill = pro.skills.includes(job.applianceType);
  const skillMatch = hasSkill ? 1 : 0;

  if (skillMatch === 0) {
    return {
      professionalId: pro.id,
      professionalName: pro.name,
      score: 0,
      travelMinutes,
      travelScore: 0,
      skillMatch: 0,
      ratingScore: 0,
      slaFitScore: 0,
      eligible: false,
    };
  }

  const travelTimeNorm = Math.min(travelMinutes / 45, 1);
  const travelScore = 1 - travelTimeNorm;

  const ratingNorm = Math.max(0, Math.min(1, (pro.rating - 3.5) / 1.5));
  const slaFitScore = canArriveWithinSlot ? 1.0 : 0.5;

  const totalScore =
    ALLOCATION_WEIGHTS.travel * travelScore +
    ALLOCATION_WEIGHTS.skill * skillMatch +
    ALLOCATION_WEIGHTS.rating * ratingNorm +
    ALLOCATION_WEIGHTS.sla * slaFitScore;

  return {
    professionalId: pro.id,
    professionalName: pro.name,
    score: Math.round(totalScore * 1000) / 1000,
    travelMinutes,
    travelScore: Math.round(travelScore * 100) / 100,
    skillMatch,
    ratingScore: Math.round(ratingNorm * 100) / 100,
    slaFitScore,
    eligible: true,
  };
}

export function findBestProfessional(
  pros: Professional[],
  job: ServiceRequest,
  zones: Zone[]
): { bestPro?: Professional; breakdown: AllocationScoreBreakdown[] } {
  const jobZone = zones.find((z) => z.city === pros[0]?.city) || zones[0];

  const breakdown: AllocationScoreBreakdown[] = pros
    .filter((p) => p.city === job.customerAnswers.city || true)
    .map((pro) => {
      // Find travel time between pro zone and job zone
      let travelMinutes = 15;
      if (pro.zoneId === jobZone?.id) {
        travelMinutes = 10;
      } else {
        const adj = jobZone?.adjacentZones.find((a) => a.zoneId === pro.zoneId);
        travelMinutes = adj ? adj.travelMinutes : 30;
      }

      return computeAllocationScore(pro, job, travelMinutes, true);
    })
    .filter((b) => b.eligible)
    .sort((a, b) => b.score - a.score);

  const bestPro = breakdown.length > 0 ? pros.find((p) => p.id === breakdown[0].professionalId) : undefined;

  return { bestPro, breakdown };
}

export function generateRepositionSuggestions(
  pros: Professional[],
  zones: Zone[],
  simulatedTemperature: number = 32
): RepositionSuggestion[] {
  const suggestions: RepositionSuggestion[] = [];
  const idlePros = pros.filter((p) => p.online && (p.status === 'IDLE' || !p.status));

  // Determine hot zones where forecast demand exceeds pro presence
  zones.forEach((targetZone) => {
    // Temperature boost for AC demand
    const tempBoost = targetZone.city === 'Delhi' || targetZone.city === 'Mumbai' || simulatedTemperature >= 38 ? 1.4 : 1.0;
    const recentDemands = targetZone.demandHistory.AC || [10, 12, 14];
    const avgDemand = (recentDemands.slice(-3).reduce((a, b) => a + b, 0) / 3) * tempBoost;

    const prosInZone = pros.filter((p) => p.zoneId === targetZone.id && p.online).length;

    if (avgDemand > prosInZone * 3 + 2) {
      // Find eligible idle pro in adjacent zone within 25 min travel
      for (const candidate of idlePros) {
        if (candidate.zoneId === targetZone.id) continue;
        const candidateZone = zones.find((z) => z.id === candidate.zoneId);
        const adj = targetZone.adjacentZones.find((a) => a.zoneId === candidate.zoneId);
        const travelMinutes = adj ? adj.travelMinutes : 20;

        if (travelMinutes <= 25) {
          // Check if candidate zone retains minimum coverage (at least 1 pro)
          const remainingInOrigin = pros.filter((p) => p.zoneId === candidate.zoneId && p.online).length;
          if (remainingInOrigin > 1) {
            suggestions.push({
              id: `repo-${candidate.id}-${targetZone.id}`,
              professionalId: candidate.id,
              professionalName: candidate.name,
              fromZoneId: candidate.zoneId,
              fromZoneName: candidateZone?.name || 'Origin',
              toZoneId: targetZone.id,
              toZoneName: targetZone.name,
              travelMinutes,
              reason: `High AC service demand expected in ${targetZone.name} due to elevated temperatures (${simulatedTemperature}°C). Origin zone maintains minimum service safety buffer.`,
              applied: false,
            });
            break;
          }
        }
      }
    }
  });

  return suggestions;
}

export interface LeaderboardEntry {
  rank: number;
  partnerId: string;
  name: string;
  city: any;
  bestCategory: ApplianceType;
  unitsSold: number;
  opportunities: number;
  conversionRatePct: number;
  pro: Professional;
}

export function getPartnerLeaderboard(
  pros: Professional[],
  filterCategory: ApplianceType | 'Overall' = 'Overall'
): LeaderboardEntry[] {
  const eligiblePros = pros.filter((p) => p.salesModuleOptIn);

  const entries = eligiblePros.map((pro) => {
    let bestCat: ApplianceType = pro.skills[0] || 'AC';
    let maxSold = -1;
    let maxConv = -1;

    Object.entries(pro.salesByCategory || {}).forEach(([cat, stats]) => {
      const sold = stats?.unitsSold || 0;
      const opps = stats?.opportunities || 1;
      const conv = opps > 0 ? sold / opps : 0;

      if (sold > maxSold || (sold === maxSold && conv > maxConv)) {
        bestCat = cat as ApplianceType;
        maxSold = sold;
        maxConv = conv;
      }
    });

    const bestStats = pro.salesByCategory?.[bestCat];
    const unitsSold = bestStats?.unitsSold ?? Math.max(0, maxSold);
    const opportunities = bestStats?.opportunities ?? 1;
    const conversionRatePct = opportunities > 0 ? Math.round((unitsSold / opportunities) * 100) : 0;

    return {
      partnerId: pro.id,
      name: pro.name,
      city: pro.city,
      bestCategory: bestCat,
      unitsSold,
      opportunities,
      conversionRatePct,
      pro,
    };
  });

  const filtered =
    filterCategory === 'Overall'
      ? entries
      : entries.filter((e) => e.bestCategory === filterCategory);

  filtered.sort((a, b) => {
    if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
    return b.conversionRatePct - a.conversionRatePct;
  });

  return filtered.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Pure function to derive strategic sales deployments for opted-in partners.
 * Completely separate from repair dispatch allocation (Guardrail G5 maintained).
 */
export function planSalesDeployment(
  pros: Professional[],
  zones: Zone[],
  leads: any[] = [],
  demandContext?: DemandContext
): SalesDeployment[] {
  const deployments: SalesDeployment[] = [];
  const ctx: DemandContext = {
    ...demandContext,
    salesLeads: leads && leads.length > 0 ? leads : demandContext?.salesLeads,
  };

  // Filter opted-in, training-completed partners who have sales stats
  const eligiblePros = pros.filter(
    (p) => p.salesModuleOptIn && p.trainingCompleted && p.salesByCategory
  );

  // Determine each partner's best category based on unitsSold
  const proMeta = eligiblePros.map((pro) => {
    let bestCat: ApplianceType = pro.skills[0] || 'AC';
    let maxSold = -1;
    let maxConv = -1;

    Object.entries(pro.salesByCategory || {}).forEach(([cat, stats]) => {
      const sold = stats?.unitsSold || 0;
      const opps = stats?.opportunities || 1;
      const conv = sold / opps;

      if (sold > maxSold || (sold === maxSold && conv > maxConv)) {
        bestCat = cat as ApplianceType;
        maxSold = sold;
        maxConv = conv;
      }
    });

    return {
      pro,
      bestCategory: bestCat,
      unitsSold: Math.max(0, maxSold),
      conversionRate: Math.max(0, maxConv),
    };
  });

  // Group by category to establish ranks
  const categories: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];
  const deploymentsByZone: Record<string, number> = {};
  const ZONE_CAPACITY_CAP = 2; // maximum 2 deployed partners per zone

  categories.forEach((cat) => {
    const prosInCat = proMeta.filter((pm) => pm.bestCategory === cat);

    // Rank partners by unitsSold descending, then conversionRate descending
    prosInCat.sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      return b.conversionRate - a.conversionRate;
    });

    prosInCat.forEach((rankedPartner, idx) => {
      const partnerRank = idx + 1;
      const pro = rankedPartner.pro;
      const city = pro.city;

      // Only deploy within partner's own city
      const cityZones = zones.filter((z) => z.city === city);
      const originZone = cityZones.find((z) => z.id === pro.zoneId) || cityZones[0];
      if (!originZone) return;

      // Evaluate demand for each zone in that city for this specific category
      const zoneDemands = cityZones.map((z) => ({
        zone: z,
        demand: computeZoneDemand(z, cat, 90, ctx),
      }));

      // Sort zones by demand score descending
      zoneDemands.sort((a, b) => b.demand.score - a.demand.score);

      // Origin zone demand
      const originDemand = computeZoneDemand(originZone, cat, 90, ctx).score;

      // Find top destination zone
      for (const zd of zoneDemands) {
        const destZone = zd.zone;
        if (destZone.id === originZone.id) continue;

        // Only deploy if destination demand exceeds origin demand
        if (zd.demand.score <= originDemand) continue;

        // Check destination zone capacity cap
        const currentZoneDeployments = deploymentsByZone[destZone.id] || 0;
        if (currentZoneDeployments >= ZONE_CAPACITY_CAP) continue;

        // Origin zone safety constraint: never leave origin zone coverage at zero
        const remainingInOrigin = pros.filter(
          (p) => p.zoneId === originZone.id && !deployments.some((d) => d.partnerId === p.id)
        ).length;
        if (remainingInOrigin <= 1) continue;

        // City coverage constraint: never reduce city x appliance pair below 1 partner
        const remainingInCity = pros.filter(
          (p) => p.city === city && p.skills.includes(cat)
        ).length;
        if (remainingInCity < 1) continue;

        // Valid deployment target found
        deploymentsByZone[destZone.id] = currentZoneDeployments + 1;
        deployments.push({
          partnerId: pro.id,
          partnerName: pro.name,
          bestCategory: cat,
          fromZoneId: originZone.id,
          fromZoneName: originZone.name,
          toZoneId: destZone.id,
          toZoneName: destZone.name,
          rank: partnerRank,
          demandScore: zd.demand.score,
          reason: `Rank ${partnerRank} in ${cat}, zone ${cat} demand ${zd.demand.score}`,
        });

        break;
      }
    });
  });

  return deployments;
}
