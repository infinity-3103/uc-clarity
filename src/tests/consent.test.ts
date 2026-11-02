import { describe, it, expect } from 'vitest';
import { createInitialConsents, hasConsent, performDataDeletion } from '../domain/consent';
import { Customer } from '../domain/types';

describe('Consent, Privacy & Deletion (Section 10, 17)', () => {
  it('Initializes 4 separate consents, all default to OFF (granted: false)', () => {
    const consents = createInitialConsents('c-test');
    expect(consents.length).toBe(4);
    expect(consents.map((c) => c.purpose)).toEqual([
      'DIAGNOSTICS',
      'MARKETING',
      'CREDIT_ASSESSMENT',
      'BANK_SHARING',
    ]);
    expect(consents.every((c) => c.granted === false)).toBe(true);
  });

  it('Withdrawal of MARKETING consent prevents marketing nudges immediately', () => {
    const customer: Customer = {
      id: 'c-test',
      name: 'Test Customer',
      phone: '+91 9999999999',
      city: 'Mumbai',
      zoneId: 'z1',
      hasCreditHistory: true,
      consents: [
        { id: '1', customerId: 'c-test', purpose: 'MARKETING', granted: false, noticeVersion: 'v1', at: '' },
      ],
      appliances: [],
    };

    expect(hasConsent(customer, 'MARKETING')).toBe(false);
  });

  it('Data deletion erases personal identifiers while retaining statutory lending records', () => {
    const customer: Customer = {
      id: 'c-test',
      name: 'Riya Mehta',
      phone: '+91 98201 12345',
      city: 'Mumbai',
      zoneId: 'z1',
      hasCreditHistory: true,
      consents: [
        { id: '1', customerId: 'c-test', purpose: 'DIAGNOSTICS', granted: true, noticeVersion: 'v1', at: '' },
      ],
      appliances: [
        { id: 'a1', type: 'AC', brand: 'Voltas', ageYears: 12, notes: 'Failing compressor' },
      ],
    };

    const { updatedCustomer, deletionRecord } = performDataDeletion(customer, true);

    // Personal identifiers erased
    expect(updatedCustomer.name).toBe('Deleted user');
    expect(updatedCustomer.phone).toBe('XXXXXXXXXX');
    expect(updatedCustomer.deleted).toBe(true);
    expect(updatedCustomer.consents.every((c) => c.granted === false)).toBe(true);
    expect(updatedCustomer.appliances[0].notes).toBeUndefined();

    // Audit log records retained statutory banking records
    expect(deletionRecord.customerName).toBe('Deleted user');
    expect(deletionRecord.retainedRecords.length).toBeGreaterThan(0);
    expect(deletionRecord.retainedRecords[0]).toContain('retained for statutory banking compliance');
  });
});
