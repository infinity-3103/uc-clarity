import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { isSurveyDiscountEligible, getSurveyDiscountAvailableDate, evaluateSurveyAnswerForLead } from '../domain/leads';
import { useStore } from '../store/useStore';
import { Customer, ServiceRequest } from '../domain/types';
import { MarketplaceView } from '../views/marketplace/MarketplaceView';
import { CustomerApp } from '../views/customer/CustomerApp';
import { SURVEY_DISCOUNT_PCT, SURVEY_COOLDOWN_MONTHS } from '../config/assumptions';

describe('Issue 1: Survey Discount Belongs to Service Fees Only', () => {
  beforeEach(() => {
    useStore.getState().resetDemo();
  });

  // 1. Eligibility boundary (exactly 6 months)
  it('enforces exact 6-month eligibility boundary for survey discount', () => {
    const baseCustomer: Customer = {
      id: 'cust-test',
      name: 'Test Customer',
      phone: '+91 9999999999',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      hasCreditHistory: true,
      consents: [],
      appliances: [],
      lastSurveyDiscountAt: '2025-09-15T12:00:00.000Z',
    };

    // Exactly 6 months later
    const exactBoundary = new Date('2026-03-15T12:00:00.000Z');
    expect(isSurveyDiscountEligible(baseCustomer, exactBoundary)).toBe(true);

    // 1 millisecond before boundary (ineligible)
    const justBefore = new Date('2026-03-15T11:59:59.999Z');
    expect(isSurveyDiscountEligible(baseCustomer, justBefore)).toBe(false);

    // After boundary (eligible)
    const afterBoundary = new Date('2026-03-16T12:00:00.000Z');
    expect(isSurveyDiscountEligible(baseCustomer, afterBoundary)).toBe(true);

    // Customer with no prior discount is eligible
    const newCustomer: Customer = { ...baseCustomer, lastSurveyDiscountAt: undefined };
    expect(isSurveyDiscountEligible(newCustomer, exactBoundary)).toBe(true);

    // Null/undefined customer is not eligible
    expect(isSurveyDiscountEligible(null)).toBe(false);
  });

  // 2. Discount applied once and only on serviceFee
  it('applies 10% discount once and only on serviceFee of service request', () => {
    const store = useStore.getState();
    const reqId = store.bookService({
      customerId: 'cust-riya',
      applianceType: 'AC',
      brand: 'Voltas',
      ageYears: 5,
      customerAnswers: {},
      scheduledSlot: '14:00 - 16:00 Today',
    });

    const initialReq = useStore.getState().serviceRequests.find((r) => r.id === reqId)!;
    const initialFee = initialReq.serviceFee; // 499 for AC
    expect(initialFee).toBe(499);
    expect(initialReq.discountApplied).toBeFalsy();

    // Submit survey
    const surveyItems = [
      {
        appliance: 'FRIDGE' as const,
        ageBand: '5_TO_8' as const,
        issues: ['NOISY' as const],
        replaceInterest: 'YES' as const,
      },
    ];
    useStore.getState().submitExitSurvey(reqId, surveyItems);

    const updatedReq = useStore.getState().serviceRequests.find((r) => r.id === reqId)!;
    const expectedDiscount = Math.round(initialFee * SURVEY_DISCOUNT_PCT); // 50
    expect(updatedReq.discountApplied).toBe(expectedDiscount);
    expect(updatedReq.serviceFee).toBe(initialFee - expectedDiscount); // 449

    // Customer lastSurveyDiscountAt should be updated to simulatedDate
    const customer = useStore.getState().customers.find((c) => c.id === 'cust-riya')!;
    expect(customer.lastSurveyDiscountAt).toBe(useStore.getState().simulatedDate);

    // Trying to apply survey discount again on the same request should not double-discount
    useStore.getState().submitExitSurvey(reqId, surveyItems);
    const reCheckedReq = useStore.getState().serviceRequests.find((r) => r.id === reqId)!;
    expect(reCheckedReq.serviceFee).toBe(initialFee - expectedDiscount);
    expect(reCheckedReq.discountApplied).toBe(expectedDiscount);
  });

  // 3. No survey UI anywhere in checkout flows
  it('does not render survey discount opt-in or discount row in Marketplace checkout', () => {
    render(<MarketplaceView />);
    expect(screen.queryByText(/Fill a short survey for a 10% discount/i)).toBeNull();
    expect(screen.queryByText(/10% Survey Discount Applied/i)).toBeNull();
  });

  it('does not render checkout survey UI in mobile CustomerApp', () => {
    render(<CustomerApp />);
    expect(screen.queryByText(/Fill a short survey for a 10% discount/i)).toBeNull();
  });

  // 4. Leads still created from survey answers
  it('creates SalesLead records with correct scoring from exit survey submission', () => {
    const beforeCount = useStore.getState().salesLeads.length;

    useStore.getState().submitSurveyResponse({
      customerId: 'cust-riya',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      source: 'exit',
      answers: [
        {
          appliance: 'AC',
          ageBand: 'OVER_8',
          issues: ['HIGH_BILL', 'FREQUENT_REPAIR'],
          replaceInterest: 'YES',
        },
      ],
    });

    const afterCount = useStore.getState().salesLeads.length;
    expect(afterCount).toBe(beforeCount + 1);

    const latestLead = useStore.getState().salesLeads[0];
    expect(latestLead.appliance).toBe('AC');
    expect(latestLead.priority).toBe('HIGH');
    expect(latestLead.priorityScore).toBe(3 + 2 + 3); // OVER_8(3) + issues(2) + YES(3) = 8
  });
});
