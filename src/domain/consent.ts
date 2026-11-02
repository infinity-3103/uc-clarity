import { ConsentPurpose, ConsentRecord, Customer, DeletionRequest } from './types';

export const CONSENT_PURPOSES: {
  purpose: ConsentPurpose;
  title: string;
  description: string;
}[] = [
  {
    purpose: 'DIAGNOSTICS',
    title: 'Appliance Diagnostics & Health Records',
    description:
      'Allow Urban Company to store technical diagnostic parameters and inspection photos to track appliance health and improve service recommendations.',
  },
  {
    purpose: 'MARKETING',
    title: 'Preventive Maintenance Reminders',
    description:
      'Receive seasonal service alerts, pre-summer AC health check notifications, and relevant upgrade offers (maximum 2 messages per week).',
  },
  {
    purpose: 'CREDIT_ASSESSMENT',
    title: 'Credit Line Assessment',
    description:
      'Allow Aarambh Bank to evaluate eligibility for zero-cost installment payment plans on replacement appliances.',
  },
  {
    purpose: 'BANK_SHARING',
    title: 'Bank Statement Sharing via Account Aggregator',
    description:
      'Permit secure transmission of cash flow summaries directly from your bank to Aarambh Bank without revealing credentials.',
  },
];

export function createInitialConsents(customerId: string): ConsentRecord[] {
  const now = new Date().toISOString();
  // Guardrail G7: All 4 consents default to OFF (granted: false). Never pre-ticked.
  return CONSENT_PURPOSES.map((item) => ({
    id: `consent-${customerId}-${item.purpose}`,
    customerId,
    purpose: item.purpose,
    granted: false,
    noticeVersion: 'v1',
    at: now,
  }));
}

export function hasConsent(customer: Customer, purpose: ConsentPurpose): boolean {
  if (customer.deleted) return false;
  const record = customer.consents.find((c) => c.purpose === purpose);
  return record ? record.granted : false;
}

export function performDataDeletion(
  customer: Customer,
  hasActiveLoan: boolean = false
): { updatedCustomer: Customer; deletionRecord: DeletionRequest } {
  const now = new Date().toISOString();

  const retainedRecords: string[] = [];
  if (hasActiveLoan) {
    retainedRecords.push('Loan application and Key Fact Statement (KFS) retained for statutory banking compliance.');
  }

  const updatedCustomer: Customer = {
    ...customer,
    name: 'Deleted user',
    phone: 'XXXXXXXXXX',
    deleted: true,
    consents: customer.consents.map((c) => ({
      ...c,
      granted: false,
      at: now,
    })),
    // Clear survey/personal answers
    appliances: customer.appliances.map((a) => ({
      ...a,
      notes: undefined,
    })),
  };

  const deletionRecord: DeletionRequest = {
    id: `del-${Date.now()}-${customer.id}`,
    customerId: customer.id,
    customerName: 'Deleted user',
    requestedAt: now,
    completedAt: now,
    retainedRecords,
  };

  return { updatedCustomer, deletionRecord };
}
