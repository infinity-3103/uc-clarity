import { describe, it, expect } from 'vitest';
import { createSeedData } from '../data/seed';
import { validateCoverage, assertAllAssignmentsOpenable } from '../domain/validation';
import { evaluateSurveyAnswerForLead } from '../domain/leads';
import { computeZoneDemand, computeCityDemand } from '../domain/demand';
import { planSalesDeployment, getPartnerLeaderboard } from '../domain/allocation';
import { City, ApplianceType, Professional } from '../domain/types';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';
import { mr } from '../i18n/mr';
import { kn } from '../i18n/kn';

describe('UC Clarity Upgrades and Verification Suite', () => {
  const seed = createSeedData();
  const cities: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];
  const appliances: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];

  // Test 1: Coverage validation passes for all 25 city x appliance pairs
  it('passes coverage validation for all 25 city x appliance pairs (>= 2 partners each)', () => {
    expect(() => validateCoverage(seed.professionals)).not.toThrow();

    // Check each pair individually
    for (const city of cities) {
      for (const appliance of appliances) {
        const count = seed.professionals.filter(
          (p) => p.city === city && p.skills.includes(appliance)
        ).length;
        expect(count).toBeGreaterThanOrEqual(2);
      }
    }
  });

  // Test 2: assertAllAssignmentsOpenable passes after a new booking in each of the 5 cities
  it('assertAllAssignmentsOpenable passes for initial seed and after simulated bookings across all 5 cities', () => {
    // 1. Initial seed check
    expect(() =>
      assertAllAssignmentsOpenable({
        professionals: seed.professionals,
        serviceRequests: seed.serviceRequests,
      })
    ).not.toThrow();

    // 2. Simulated booking in each city
    const updatedRequests = [...seed.serviceRequests];
    for (const city of cities) {
      const cityPros = seed.professionals.filter((p) => p.city === city && p.skills.includes('AC'));
      expect(cityPros.length).toBeGreaterThanOrEqual(2);

      const assignedPro = cityPros[0];
      updatedRequests.push({
        id: `sr-test-${city.toLowerCase()}`,
        customerId: 'cust-riya',
        applianceType: 'AC',
        brand: 'Voltas',
        ageYears: 4,
        customerAnswers: { city },
        photos: [],
        professionalId: assignedPro.id,
        status: 'ASSIGNED',
        serviceFee: 299,
        createdAt: new Date().toISOString(),
      });
    }

    expect(() =>
      assertAllAssignmentsOpenable({
        professionals: seed.professionals,
        serviceRequests: updatedRequests,
      })
    ).not.toThrow();
  });

  // Test 3: Lead generation rule creates leads with correct priority
  it('creates sales leads with correct priority scoring thresholds', () => {
    // High Priority: score >= 5
    // OVER_8 (3 pts) + NOT_WORKING (2 pts) + YES (3 pts) = 8 pts
    const highLead = evaluateSurveyAnswerForLead(
      {
        appliance: 'AC',
        ageBand: 'OVER_8',
        issues: ['NOT_WORKING'],
        replaceInterest: 'YES',
      },
      'cust-1',
      'Mumbai',
      'zone-mumbai-andheri',
      'srvy-1'
    );
    expect(highLead).not.toBeNull();
    expect(highLead?.priority).toBe('HIGH');
    expect(highLead?.priorityScore).toBe(8);

    // Medium Priority: score 3 to 4
    // 5_TO_8 (2 pts) + NONE (0 pts) + MAYBE (1 pt) = 3 pts
    const medLead = evaluateSurveyAnswerForLead(
      {
        appliance: 'FRIDGE',
        ageBand: '5_TO_8',
        issues: ['NONE'],
        replaceInterest: 'MAYBE',
      },
      'cust-2',
      'Delhi',
      'zone-delhi-dwarka',
      'srvy-2'
    );
    expect(medLead).not.toBeNull();
    expect(medLead?.priority).toBe('MEDIUM');
    expect(medLead?.priorityScore).toBe(3);

    // Low Priority: score < 3
    // 3_TO_5 (1 pt) + NONE (0 pts) + MAYBE (1 pt) = 2 pts
    const lowLead = evaluateSurveyAnswerForLead(
      {
        appliance: 'WASHER',
        ageBand: '3_TO_5',
        issues: ['NONE'],
        replaceInterest: 'MAYBE',
      },
      'cust-3',
      'Pune',
      'zone-pune-wakad',
      'srvy-3'
    );
    expect(lowLead).not.toBeNull();
    expect(lowLead?.priority).toBe('LOW');
    expect(lowLead?.priorityScore).toBe(2);

    // Disqualified: UNDER_1 (0 pts) + NONE (0 pts) + NO (0 pts)
    const disqLead = evaluateSurveyAnswerForLead(
      {
        appliance: 'GEYSER',
        ageBand: 'UNDER_1',
        issues: ['NONE'],
        replaceInterest: 'NO',
      },
      'cust-4',
      'Bengaluru',
      'zone-bengaluru-whitefield',
      'srvy-4'
    );
    expect(disqLead).toBeNull();
  });

  // Test 4: Partner demand tab contains only the partner's city
  it('guarantees partner demand is strictly scoped to partner city', () => {
    for (const city of cities) {
      const cityDemand = computeCityDemand(
        city,
        90,
        {
          serviceRequests: seed.serviceRequests,
          salesLeads: seed.salesLeads,
        },
        seed.zones
      );

      expect(cityDemand.city).toBe(city);

      // Verify all topZones belong to this city only
      const cityZoneIds = seed.zones.filter((z) => z.city === city).map((z) => z.id);
      for (const topZ of cityDemand.topZones) {
        expect(cityZoneIds).toContain(topZ.zoneId);
      }

      // Verify no foreign zones leak in
      const foreignZoneIds = seed.zones.filter((z) => z.city !== city).map((z) => z.id);
      for (const topZ of cityDemand.topZones) {
        expect(foreignZoneIds).not.toContain(topZ.zoneId);
      }
    }
  });

  // Test 5: Deployment output uses the same ranks as the leaderboard
  it('ensures sales deployment ranks match the partner leaderboard category ranks', () => {
    const deployments = planSalesDeployment(seed.professionals, seed.zones, seed.salesLeads);

    expect(deployments.length).toBeGreaterThan(0);

    for (const dep of deployments) {
      const catLeaderboard = getPartnerLeaderboard(seed.professionals, dep.bestCategory);
      const entry = catLeaderboard.find((e) => e.partnerId === dep.partnerId);

      expect(entry).toBeDefined();
      expect(dep.rank).toBe(entry?.rank);
    }
  });

  // Test 6: Heatmap and partner demand both match computeZoneDemand
  it('ensures heatmap and partner demand calculations both match computeZoneDemand identically', () => {
    const context = {
      temp: 34,
      humidity: 65,
      serviceRequests: seed.serviceRequests,
      directOrders: seed.directOrders,
      salesLeads: seed.salesLeads,
    };

    const mumbaiZones = seed.zones.filter((z) => z.city === 'Mumbai');
    const cityDemand = computeCityDemand('Mumbai', 90, context, seed.zones);

    for (const zone of mumbaiZones) {
      const directDemand = computeZoneDemand(zone, 'ALL', 90, context);

      const fromCityDemand = cityDemand.topZones.find((tz) => tz.zoneId === zone.id);
      if (fromCityDemand) {
        expect(fromCityDemand.score).toBe(directDemand.score);
        expect(fromCityDemand.level).toBe(directDemand.level);
      }
    }
  });

  // Test 7: i18n key parity across en, hi, mr, kn
  it('guarantees complete i18n key parity across English, Hindi, Marathi, and Kannada', () => {
    const enKeys = Object.keys(en);
    const hiKeys = Object.keys(hi);
    const mrKeys = Object.keys(mr);
    const knKeys = Object.keys(kn);

    expect(enKeys.length).toBeGreaterThan(0);

    // Every key in en must exist in hi
    for (const key of enKeys) {
      expect(hi).toHaveProperty(key);
      expect((hi as Record<string, string>)[key]).toBeTruthy();
    }

    // Every key in en must exist in mr
    for (const key of enKeys) {
      expect(mr).toHaveProperty(key);
      expect((mr as Record<string, string>)[key]).toBeTruthy();
    }

    // Every key in en must exist in kn
    for (const key of enKeys) {
      expect(kn).toHaveProperty(key);
      expect((kn as Record<string, string>)[key]).toBeTruthy();
    }

    // Parity of key sets
    expect(hiKeys.length).toBe(enKeys.length);
    expect(mrKeys.length).toBe(enKeys.length);
    expect(knKeys.length).toBe(enKeys.length);

    // Verify Marathi uses authentic Marathi terms, not identical to Hindi
    expect(mr.p_tab_jobs).toBe('कामे');
    expect(mr.p_tab_sales).toBe('विक्री');
    expect(mr.p_tab_earnings).toBe('कमाई');
    expect(hi.p_tab_jobs).toBe('काम');
    expect(hi.p_tab_sales).toBe('बिक्री');
  });
});
