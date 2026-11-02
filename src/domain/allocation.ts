import { Professional, ServiceRequest, Zone, RepositionSuggestion, SalesDeployment, ApplianceType, City } from './types';
import { computeZoneDemand, DemandContext } from './demand';
import { REPOSITION_MIN_GAP } from '../config/assumptions';

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
  city?: City | string,
  applianceFilter?: ApplianceType | 'ALL',
  demandContext?: DemandContext
): RepositionSuggestion[] {
  const citiesToProcess: City[] =
    city && city !== 'ALL'
      ? [city as City]
      : Array.from(new Set(zones.map((z) => z.city as City)));

  const allSuggestions: RepositionSuggestion[] = [];

  citiesToProcess.forEach((targetCity) => {
    const cityZones = zones.filter((z) => z.city === targetCity);
    if (cityZones.length < 2) return;

    const cityPros = pros.filter(
      (p) => p.city === targetCity && p.online && (p.status === 'IDLE' || !p.status)
    );
    if (cityPros.length === 0) return;

    const categories: ApplianceType[] =
      applianceFilter && applianceFilter !== 'ALL'
        ? [applianceFilter]
        : ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];

    const usedProIds = new Set<string>();
    const cityCandidates: RepositionSuggestion[] = [];

    categories.forEach((appliance) => {
      // Evaluate each potential destination zone in targetCity
      cityZones.forEach((destZone) => {
        const destDemand = computeZoneDemand(destZone, appliance, 90, demandContext).score;
        if (destDemand <= 0) return;

        const destProsSkilled = pros.filter(
          (p) => p.city === targetCity && p.zoneId === destZone.id && p.skills.includes(appliance)
        ).length;
        const destCoverage = destProsSkilled / destDemand;

        // Evaluate each potential origin zone in targetCity
        cityZones.forEach((origZone) => {
          if (origZone.id === destZone.id) return;

          const origDemand = computeZoneDemand(origZone, appliance, 90, demandContext).score;
          const demandGap = destDemand - origDemand;

          // Meaningful demand gap check (dest - orig >= REPOSITION_MIN_GAP)
          if (demandGap < REPOSITION_MIN_GAP) return;

          const origSkilledPros = pros.filter(
            (p) => p.city === targetCity && p.zoneId === origZone.id && p.skills.includes(appliance)
          );
          const origCoverage = origDemand > 0 ? origSkilledPros.length / origDemand : 1.0;

          // Coverage check: destination zone coverage ratio must be strictly worse than origin zone coverage ratio
          if (destCoverage >= origCoverage) return;

          // Origin must not be starved: removing 1 partner must leave at least 1 skilled partner
          if (origSkilledPros.length <= 1) return;

          // Travel time check: must be 45 minutes or less
          const adj = destZone.adjacentZones.find((a) => a.zoneId === origZone.id);
          const travelMinutes = adj ? adj.travelMinutes : 30;
          if (travelMinutes > 45) return;

          // Find an idle candidate skilled for this appliance who has not been suggested yet
          const candidate = cityPros.find(
            (p) =>
              p.zoneId === origZone.id &&
              p.skills.includes(appliance) &&
              !usedProIds.has(p.id)
          );
          if (!candidate) return;

          usedProIds.add(candidate.id);
          cityCandidates.push({
            id: `repo-${candidate.id}-${destZone.id}`,
            professionalId: candidate.id,
            professionalName: candidate.name,
            skill: appliance,
            fromZoneId: origZone.id,
            fromZoneName: origZone.name,
            toZoneId: destZone.id,
            toZoneName: destZone.name,
            travelMinutes,
            demandGap: Math.round(demandGap),
            originCoveragePct: Math.round(origCoverage * 100),
            destCoveragePct: Math.round(destCoverage * 100),
            reason: `High ${appliance} demand (+${Math.round(demandGap)} requests, coverage ${Math.round(destCoverage * 100)}% vs ${Math.round(origCoverage * 100)}%)`,
            applied: false,
          });
        });
      });
    });

    // Top 5 suggestions per city sorted by demand gap descending
    cityCandidates.sort((a, b) => (b.demandGap ?? 0) - (a.demandGap ?? 0));
    allSuggestions.push(...cityCandidates.slice(0, 5));
  });

  return allSuggestions;
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
