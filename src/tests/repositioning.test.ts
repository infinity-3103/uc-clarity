import { describe, it, expect } from 'vitest';
import { generateRepositionSuggestions } from '../domain/allocation';
import { Professional, Zone } from '../domain/types';
import { useStore } from '../store/useStore';
import { REPOSITION_MIN_GAP } from '../config/assumptions';

describe('Technician Repositioning Engine (Issue 7 & Section 11)', () => {
  const createMockZones = (): Zone[] => [
    {
      id: 'z-mum-andheri',
      name: 'Andheri',
      city: 'Mumbai',
      x: 100,
      y: 100,
      adjacentZones: [{ zoneId: 'z-mum-bandra', travelMinutes: 20 }],
      demandHistory: {
        AC: [10, 10, 10],
        FRIDGE: [5, 5, 5],
        WASHER: [5, 5, 5],
        GEYSER: [3, 3, 3],
        PURIFIER: [4, 4, 4],
      },
    },
    {
      id: 'z-mum-bandra',
      name: 'Bandra',
      city: 'Mumbai',
      x: 150,
      y: 150,
      adjacentZones: [{ zoneId: 'z-mum-andheri', travelMinutes: 20 }],
      demandHistory: {
        AC: [45, 50, 55],
        FRIDGE: [10, 10, 10],
        WASHER: [10, 10, 10],
        GEYSER: [5, 5, 5],
        PURIFIER: [8, 8, 8],
      },
    },
    {
      id: 'z-del-dwarka',
      name: 'Dwarka',
      city: 'Delhi',
      x: 200,
      y: 200,
      adjacentZones: [],
      demandHistory: {
        AC: [70, 75, 80],
        FRIDGE: [12, 12, 12],
        WASHER: [10, 10, 10],
        GEYSER: [5, 5, 5],
        PURIFIER: [15, 15, 15],
      },
    },
  ];

  const createMockPros = (): Professional[] => [
    {
      id: 'pro-mum-1',
      name: 'Ramesh Mumbai',
      city: 'Mumbai',
      zoneId: 'z-mum-andheri',
      skills: ['AC'],
      rating: 4.8,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 15000,
      referralEarnings: 2000,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-mum-2',
      name: 'Suresh Mumbai',
      city: 'Mumbai',
      zoneId: 'z-mum-andheri',
      skills: ['AC'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 12000,
      referralEarnings: 1500,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-del-1',
      name: 'Vikram Delhi',
      city: 'Delhi',
      zoneId: 'z-del-dwarka',
      skills: ['AC'],
      rating: 4.9,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 18000,
      referralEarnings: 3000,
      online: true,
      status: 'IDLE',
    },
  ];

  it('Strictly enforces intra-city repositioning (never cross-city)', () => {
    const zones = createMockZones();
    const pros = createMockPros();

    const suggestions = generateRepositionSuggestions(pros, zones);

    expect(suggestions.length).toBeGreaterThan(0);

    suggestions.forEach((s) => {
      const fromZone = zones.find((z) => z.id === s.fromZoneId);
      const toZone = zones.find((z) => z.id === s.toZoneId);
      const pro = pros.find((p) => p.id === s.professionalId);

      // Verify origin and destination are strictly in the same city
      expect(fromZone?.city).toBe(toZone?.city);
      // Verify professional is registered in that city
      expect(pro?.city).toBe(toZone?.city);
      // Ensure cross-city movements like Delhi to Mumbai never occur
      expect(s.fromZoneId).not.toBe('z-del-dwarka');
    });
  });

  it('Enforces meaningful demand gap (REPOSITION_MIN_GAP = 10)', () => {
    const zones = createMockZones();
    const pros = createMockPros();

    const suggestions = generateRepositionSuggestions(pros, zones, 'Mumbai');

    suggestions.forEach((s) => {
      expect(s.demandGap).toBeDefined();
      expect(s.demandGap!).toBeGreaterThanOrEqual(REPOSITION_MIN_GAP);
    });
  });

  it('Preserves origin zone coverage and guards against technician starvation', () => {
    const zones = createMockZones();
    // Only 1 pro in origin zone (z-mum-andheri)
    const singleProInOrigin: Professional[] = [
      {
        id: 'pro-mum-solo',
        name: 'Solo Tech',
        city: 'Mumbai',
        zoneId: 'z-mum-andheri',
        skills: ['AC'],
        rating: 4.9,
        salesModuleOptIn: false,
        trainingCompleted: false,
        serviceEarnings: 5000,
        referralEarnings: 0,
        online: true,
        status: 'IDLE',
      },
    ];

    const suggestions = generateRepositionSuggestions(singleProInOrigin, zones, 'Mumbai');

    // Should return 0 suggestions because moving the solo pro would leave origin starved (0 pros)
    expect(suggestions).toHaveLength(0);
  });

  it('Returns empty array when demand across zones is balanced', () => {
    const balancedZones: Zone[] = [
      {
        id: 'z-b1',
        name: 'Zone A',
        city: 'Pune',
        x: 100,
        y: 100,
        adjacentZones: [{ zoneId: 'z-b2', travelMinutes: 15 }],
        demandHistory: {
          AC: [20, 20, 20],
          FRIDGE: [10, 10, 10],
          WASHER: [10, 10, 10],
          GEYSER: [5, 5, 5],
          PURIFIER: [8, 8, 8],
        },
      },
      {
        id: 'z-b2',
        name: 'Zone B',
        city: 'Pune',
        x: 150,
        y: 150,
        adjacentZones: [{ zoneId: 'z-b1', travelMinutes: 15 }],
        demandHistory: {
          AC: [21, 20, 21],
          FRIDGE: [10, 10, 10],
          WASHER: [10, 10, 10],
          GEYSER: [5, 5, 5],
          PURIFIER: [8, 8, 8],
        },
      },
    ];

    const pros: Professional[] = [
      {
        id: 'p-pune-1',
        name: 'Pune Pro 1',
        city: 'Pune',
        zoneId: 'z-b1',
        skills: ['AC'],
        rating: 4.8,
        salesModuleOptIn: true,
        trainingCompleted: true,
        serviceEarnings: 10000,
        referralEarnings: 0,
        online: true,
        status: 'IDLE',
      },
      {
        id: 'p-pune-2',
        name: 'Pune Pro 2',
        city: 'Pune',
        zoneId: 'z-b1',
        skills: ['AC'],
        rating: 4.7,
        salesModuleOptIn: true,
        trainingCompleted: true,
        serviceEarnings: 10000,
        referralEarnings: 0,
        online: true,
        status: 'IDLE',
      },
    ];

    const suggestions = generateRepositionSuggestions(pros, balancedZones, 'Pune');
    expect(suggestions).toHaveLength(0);
  });

  it('Apply suggestion updates technician zone and Undo restores original zone', () => {
    const store = useStore.getState();
    const suggestions = store.repositionSuggestions;
    const targetSuggestion = suggestions.find((s) => !s.applied) || suggestions[0];

    expect(targetSuggestion).toBeDefined();

    const proId = targetSuggestion.professionalId;
    const initialPro = useStore.getState().professionals.find((p) => p.id === proId);
    expect(initialPro).toBeDefined();
    const originalZoneId = targetSuggestion.fromZoneId;

    // Apply suggestion
    store.applyRepositionSuggestion(targetSuggestion.id);

    const proAfterApply = useStore.getState().professionals.find((p) => p.id === proId);
    const suggestionAfterApply = useStore.getState().repositionSuggestions.find((s) => s.id === targetSuggestion.id);

    expect(proAfterApply?.zoneId).toBe(targetSuggestion.toZoneId);
    expect(suggestionAfterApply?.applied).toBe(true);

    // Undo suggestion
    store.undoRepositionSuggestion(targetSuggestion.id);

    const proAfterUndo = useStore.getState().professionals.find((p) => p.id === proId);
    const suggestionAfterUndo = useStore.getState().repositionSuggestions.find((s) => s.id === targetSuggestion.id);

    expect(proAfterUndo?.zoneId).toBe(originalZoneId);
    expect(suggestionAfterUndo?.applied).toBe(false);
  });
});
