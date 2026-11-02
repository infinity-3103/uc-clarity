import { describe, it, expect } from 'vitest';
import { evaluateNudgeRules, isCustomerEligibleForNudge } from '../domain/nudges';
import { Customer, Nudge } from '../domain/types';
import { useStore } from '../store/useStore';

describe('Campaign Nudges & Frequency Gating (Section 12, 17)', () => {
  const baseCustomer: Customer = {
    id: 'c-nudge',
    name: 'Nudge Tester',
    phone: '+91 9800000000',
    city: 'Mumbai',
    zoneId: 'z1',
    hasCreditHistory: true,
    consents: [
      { id: '1', customerId: 'c-nudge', purpose: 'MARKETING', granted: true, noticeVersion: 'v1', at: '' },
    ],
    appliances: [
      { id: 'a1', type: 'AC', brand: 'Voltas', ageYears: 9 },
    ],
  };

  it('Blocks nudges when MARKETING consent is false', () => {
    const unconsented = {
      ...baseCustomer,
      consents: [
        { id: '1', customerId: 'c-nudge', purpose: 'MARKETING' as const, granted: false, noticeVersion: 'v1', at: '' },
      ],
    };

    expect(isCustomerEligibleForNudge(unconsented, [])).toBe(false);
  });

  it('Enforces weekly frequency cap of maximum 2 nudges per week', () => {
    const existingNudges: Nudge[] = [
      { id: 'n1', customerId: 'c-nudge', ruleId: 'r1', title: 'T1', body: 'B1', sentAt: '2026-03-10' },
      { id: 'n2', customerId: 'c-nudge', ruleId: 'r2', title: 'T2', body: 'B2', sentAt: '2026-03-12' },
    ];

    expect(isCustomerEligibleForNudge(baseCustomer, existingNudges)).toBe(false);
  });

  it('Triggers Pre-summer rule in March for 8+ year old AC', () => {
    const context = {
      simulatedDate: '2026-03-10', // March
      temperatureByCity: { Mumbai: 34 },
      recentNudges: [],
      serviceRequests: [],
    };

    const nudge = evaluateNudgeRules(baseCustomer, context, 0); // 0% holdout for testing
    expect(nudge).not.toBeNull();
    expect(nudge?.ruleId).toBe('nudge-pre-summer');
    expect(nudge?.body).toContain('Summer is almost here');
  });

  it('Triggers Heatwave rule when temperature >= 40 C', () => {
    const context = {
      simulatedDate: '2026-05-15', // May (outside pre-summer Feb-Apr)
      temperatureByCity: { Mumbai: 42 }, // 42 C heatwave
      recentNudges: [],
      serviceRequests: [],
    };

    const nudge = evaluateNudgeRules(baseCustomer, context, 0);
    expect(nudge).not.toBeNull();
    expect(nudge?.ruleId).toBe('nudge-heatwave');
    expect(nudge?.body).toContain('42 C');
  });

  it('Triggers and dismisses active mobile push notifications', () => {
    const { triggerPushNotification, dismissPushNotification } = useStore.getState();
    triggerPushNotification({ title: 'Test Alert', body: 'Test Body' });
    expect(useStore.getState().activePushNotification?.title).toBe('Test Alert');
    expect(useStore.getState().activePushNotification?.body).toBe('Test Body');

    dismissPushNotification();
    expect(useStore.getState().activePushNotification).toBeNull();
  });
});
