import { ApplianceType, Recommendation, Photo } from './types';
import { EXPECTED_LIFE, NEW_PRICE, FAULTS, PARTS_UNAVAILABLE } from '../config/assumptions';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface ScoringInputs {
  applianceType: ApplianceType;
  ageYears: number;
  likelyFault: string;
  repeatFaults?: number;
  inverter?: boolean;
  starRating?: string | number;
  photos?: Photo[];
  customRepairCost?: number;
}

// FUTURE: learning model trained on outcome data
// When longitudinal service outcome records accumulate in the store,
// this function can incorporate statistical hazard models or supervised classifiers.
export function evaluateRecommendation(inputs: ScoringInputs): Recommendation {
  const {
    applianceType,
    ageYears,
    likelyFault,
    repeatFaults = 0,
    inverter = true,
    starRating = 3,
    photos = [],
    customRepairCost,
  } = inputs;

  const expectedLife = EXPECTED_LIFE[applianceType] || 10;
  const newPrice = NEW_PRICE[applianceType] || 30000;
  const faultCatalog = FAULTS[applianceType] || {};
  let repairCost: number;
  if (customRepairCost !== undefined) {
    repairCost = customRepairCost;
  } else if (likelyFault && likelyFault.includes(',')) {
    const individualFaults = likelyFault.split(',').map((f) => f.trim());
    repairCost = individualFaults.reduce((sum, f) => {
      let cost = faultCatalog[f];
      if (cost === undefined) {
        const lower = f.toLowerCase();
        if (lower.includes('compressor')) cost = faultCatalog['Compressor'] ?? 8000;
        else if (lower.includes('pcb')) cost = faultCatalog['PCB'] ?? 4500;
        else if (lower.includes('gas')) cost = faultCatalog['Gas refill'] ?? 2500;
        else if (lower.includes('fan') || lower.includes('motor')) cost = faultCatalog['Fan motor'] ?? faultCatalog['Motor'] ?? 1800;
        else cost = faultCatalog['Other'] ?? 2000;
      }
      return sum + cost;
    }, 0);
  } else {
    let cost = faultCatalog[likelyFault];
    if (cost === undefined && likelyFault) {
      const lower = likelyFault.toLowerCase();
      if (lower.includes('compressor')) cost = faultCatalog['Compressor'];
      else if (lower.includes('pcb')) cost = faultCatalog['PCB'];
      else if (lower.includes('gas')) cost = faultCatalog['Gas refill'];
      else if (lower.includes('fan')) cost = faultCatalog['Fan motor'];
    }
    repairCost = cost ?? faultCatalog['Other'] ?? 2000;
  }

  const unavailableList = PARTS_UNAVAILABLE[applianceType] || [];
  const partsAvailable = !unavailableList.some((part) =>
    likelyFault.toLowerCase().includes(part.toLowerCase())
  );

  // Photo condition grade
  let avgGrade = 3;
  if (photos.length > 0) {
    const graded = photos.filter((p) => p.grade !== undefined);
    if (graded.length > 0) {
      avgGrade = graded.reduce((acc, p) => acc + (p.grade || 3), 0) / graded.length;
    }
  }

  // 1. Age points: clamp(age / expectedLife * 40, 0, 40)
  const agePoints = clamp((ageYears / expectedLife) * 40, 0, 40);

  // 2. Repair ratio points: clamp((repairCost / newPrice) / 0.5 * 30, 0, 30) (50% rule gives 30)
  const repairRatio = repairCost / newPrice;
  const repairRatioPoints = clamp((repairRatio / 0.5) * 30, 0, 30);

  // 3. Repeat fault points: min(repeatFaults * 8, 16)
  const repeatFaultPoints = Math.min(repeatFaults * 8, 16);

  // 4. Efficiency points (AC only): 8 if not inverter OR star rating is 3 or below, else 0
  let efficiencyPoints = 0;
  if (applianceType === 'AC') {
    const starNum = Number(starRating) || 3;
    if (!inverter || starNum <= 3) {
      efficiencyPoints = 8;
    }
  }

  // 5. Condition points: 6 if average photo grade is 2 or below, else 0
  const conditionPoints = avgGrade <= 2 ? 6 : 0;

  // 6. Parts points: 10 if part is not readily available, else 0
  const partsPoints = !partsAvailable ? 10 : 0;

  const sumPoints = agePoints + repairRatioPoints + repeatFaultPoints + efficiencyPoints + conditionPoints + partsPoints;
  const score = Math.round(clamp(sumPoints, 0, 100) * 10) / 10;

  // Hard rules applied after the score
  let lean: 'REPAIR' | 'BOTH_LEAN_REPAIR' | 'BOTH_LEAN_REPLACE' | 'REPLACE';

  const isHardReplace = (applianceType === 'AC' && ageYears >= 15) || ageYears >= 1.25 * expectedLife;
  const isHardRepair = ageYears <= 5 && repairRatio < 0.4;

  if (isHardReplace) {
    lean = 'REPLACE';
  } else if (isHardRepair) {
    lean = 'REPAIR';
  } else {
    if (score < 25) {
      lean = 'REPAIR';
    } else if (score < 50) {
      lean = 'BOTH_LEAN_REPAIR';
    } else if (score < 70) {
      lean = 'BOTH_LEAN_REPLACE';
    } else {
      lean = 'REPLACE';
    }
  }

  // Generate 2 to 5 plain sentences explaining the main contributors
  const reasons: string[] = [];

  // Age reason
  if (ageYears >= expectedLife) {
    reasons.push(`This ${applianceType} is ${ageYears} years old, exceeding typical design life of ${expectedLife} years (assumed).`);
  } else {
    reasons.push(`This ${applianceType} is ${ageYears} years old, compared to typical design life of ${expectedLife} years (assumed).`);
  }

  // Repair ratio reason
  const repairPct = (repairRatio * 100).toFixed(1);
  if (repairRatio < 0.25) {
    reasons.push(`The repair cost is ${repairPct}% of a new unit, well below the 50% benchmark.`);
  } else if (repairRatio < 0.5) {
    reasons.push(`The repair cost is ${repairPct}% of a new unit, within the acceptable 50% rule.`);
  } else {
    reasons.push(`The repair cost is ${repairPct}% of a new unit, approaching or exceeding the 50% rule.`);
  }

  // Energy / efficiency reason (for AC)
  if (applianceType === 'AC') {
    if (efficiencyPoints > 0) {
      reasons.push('Current unit is older non-inverter or lower star rated; modern 5-star inverter models reduce electricity consumption.');
    } else {
      reasons.push('Current unit has 5-star inverter technology with solid operational efficiency.');
    }
  }

  // Repeat faults reason
  if (repeatFaults > 0) {
    reasons.push(`Recorded ${repeatFaults} previous breakdown(s) in the past 12 months, indicating increasing component fatigue.`);
  }

  // Parts reason
  if (!partsAvailable) {
    reasons.push(`Replacement parts for ${likelyFault} have limited supply chain availability, increasing repair risk.`);
  }

  const expectedRemainingLifeYears = Math.max(1, expectedLife - ageYears);

  return {
    score,
    lean,
    reasons: reasons.slice(0, 5),
    repairCost,
    newPrice,
    expectedRemainingLifeYears,
    rulePoints: {
      agePoints: Math.round(agePoints * 10) / 10,
      repairRatioPoints: Math.round(repairRatioPoints * 10) / 10,
      repeatFaultPoints,
      efficiencyPoints,
      conditionPoints,
      partsPoints,
    },
  };
}
