export type ApplianceType = 'AC' | 'FRIDGE' | 'WASHER' | 'GEYSER' | 'PURIFIER';

export type City = 'Delhi' | 'Mumbai' | 'Pune' | 'Kolkata' | 'Bengaluru';

export type Language = 'en' | 'hi' | 'mr' | 'kn';

export type ConsentPurpose = 'DIAGNOSTICS' | 'MARKETING' | 'CREDIT_ASSESSMENT' | 'BANK_SHARING';

export interface OwnedAppliance {
  id: string;
  type: ApplianceType;
  brand: string;
  ageYears: number;
  notes?: string;
  noteKey?: string;
  noteParams?: Record<string, string | number>;
}

export interface ConsentRecord {
  id: string;
  customerId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  noticeVersion: string;
  at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: City;
  zoneId: string;
  hasCreditHistory: boolean;
  bureauScore?: number;
  monthlyIncomeHint?: number;
  consents: ConsentRecord[];
  appliances: OwnedAppliance[];
  lastSurveyDiscountAt?: string;
  deleted?: boolean;
}

export interface Professional {
  id: string;
  name: string;
  city: City;
  zoneId: string;
  skills: ApplianceType[];
  rating: number;
  salesModuleOptIn: boolean;
  trainingCompleted: boolean;
  serviceEarnings: number;
  referralEarnings: number;
  salesByCategory?: Partial<Record<ApplianceType, { unitsSold: number; opportunities: number }>>;
  online: boolean;
  status?: 'IDLE' | 'BUSY' | 'ON_JOB';
}

export interface Photo {
  id: string;
  name: string;
  dataUrl?: string;
  grade?: 1 | 2 | 3 | 4 | 5;
}

export interface Recommendation {
  score: number;
  lean: 'REPAIR' | 'BOTH_LEAN_REPAIR' | 'BOTH_LEAN_REPLACE' | 'REPLACE';
  headline?: string;
  reasons: string[];
  repairCost: number;
  newPrice: number;
  expectedRemainingLifeYears: number;
  rulePoints?: {
    agePoints: number;
    repairRatioPoints: number;
    repeatFaultPoints: number;
    efficiencyPoints: number;
    conditionPoints: number;
    partsPoints: number;
  };
}

export interface ExitSurveyItem {
  type: ApplianceType;
  ageBand: string;
  issue: string;
}

export interface ExitSurvey {
  id: string;
  completedAt: string;
  items: ExitSurveyItem[];
  discountAmount: number;
}

export type SurveyAgeBand = 'UNDER_1' | '1_TO_3' | '3_TO_5' | '5_TO_8' | 'OVER_8';
export type SurveyIssue = 'NOT_WORKING' | 'NOISY' | 'HIGH_BILL' | 'FREQUENT_REPAIR' | 'NONE';
export type SurveyReplaceInterest = 'YES' | 'MAYBE' | 'NO';

export interface SurveyAnswerItem {
  appliance: ApplianceType;
  ageBand: SurveyAgeBand;
  issues: SurveyIssue[];
  replaceInterest: SurveyReplaceInterest;
}

export interface SurveyResponse {
  id: string;
  customerId: string;
  city: City;
  zoneId: string;
  answers: SurveyAnswerItem[];
  timestamp: string;
  source: 'exit';
}

export interface SalesLead {
  id: string;
  appliance: ApplianceType;
  city: City;
  zoneId: string;
  customerId: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number;
  createdAt: string;
  surveyResponseId?: string;
  ageYearsBand?: string;
  issue?: string;
  replacementInterest?: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  applianceType: ApplianceType;
  brand: string;
  ageYears: number;
  customerAnswers: Record<string, string | boolean | number>;
  proReadings?: Record<string, string | boolean | number>;
  photos: Photo[];
  professionalId?: string;
  status:
    | 'BOOKED'
    | 'ASSIGNED'
    | 'INSPECTED'
    | 'COMPARISON_SHOWN'
    | 'REPAIR_CHOSEN'
    | 'REPLACE_CHOSEN'
    | 'COMPLETED'
    | 'CANCELLED';
  recommendation?: Recommendation;
  choice?: 'REPAIR' | 'REPLACE' | 'DEFER';
  serviceFee: number;
  createdAt: string;
  scheduledSlot?: string;
  exitSurvey?: ExitSurvey;
  discountApplied?: number;
  surveyDeclined?: boolean;
  deliveryStatus?: 'PENDING' | 'DELIVERED';
}

export interface AASummary {
  avgMonthlyCredits: number;
  avgMonthlyObligations: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  foir: number;
}

export type BankFeedbackType = 'FEEDBACK' | 'COMPLAINT';
export type BankFeedbackTopic =
  | 'LOAN_TERMS'
  | 'CHARGES'
  | 'COOLING_OFF'
  | 'REPAYMENT'
  | 'SERVICE'
  | 'OTHER';
export type BankFeedbackStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED';

export interface BankFeedback {
  id: string;
  loanId?: string;
  customerId: string;
  type: BankFeedbackType;
  topic: BankFeedbackTopic;
  rating?: number;
  message: string;
  createdAt: string;
  status: BankFeedbackStatus;
}

export interface LoanApplication {
  id: string;
  requestId: string;
  customerId: string;
  productId: string;
  productName: string;
  principal: number;
  tenorMonths: number;
  monthlyEMI: number;
  tradeInCredit: number;
  path: 'BUREAU' | 'AA';
  aaSummary?: AASummary;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasons: string[];
  kfsAcknowledgedAt?: string;
  status: 'SUBMITTED' | 'DECIDED' | 'DISBURSED' | 'COOLING_OFF' | 'CLOSED';
  createdAt: string;
  grievanceRaised?: boolean;
  grievanceNote?: string;
  coolingOffExited?: boolean;
}

export interface Nudge {
  id: string;
  customerId: string;
  ruleId: string;
  title: string;
  body: string;
  sentAt: string;
  opened?: boolean;
  holdout?: boolean;
}

export interface EventLogRecord {
  id: string;
  time: string;
  actor: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface DirectOrder {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  brand: string;
  category: ApplianceType;
  price: number;
  tradeInCredit: number;
  netAmountPaid: number;
  paymentMethod: 'FULL_UPI' | 'FULL_CARD' | 'FULL_NETBANKING' | 'NO_COST_EMI';
  tenorMonths?: number;
  monthlyEMI?: number;
  deliverySlot: string;
  status: 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED';
  createdAt: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  brand: string;
  category: ApplianceType;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  inverter: boolean;
  starRating: number;
  highlights: string[];
  badge?: string;
  deliveryDays: number;
  freeInstallation: boolean;
  warranty: string;
  imageType: string;
}

export interface Zone {
  id: string;
  name: string;
  city: City;
  x: number;
  y: number;
  demandHistory: Record<ApplianceType, number[]>;
  adjacentZones: { zoneId: string; travelMinutes: number }[];
}

export interface RepositionSuggestion {
  id: string;
  professionalId: string;
  professionalName: string;
  skill?: ApplianceType;
  fromZoneId: string;
  fromZoneName: string;
  toZoneId: string;
  toZoneName: string;
  travelMinutes: number;
  demandGap?: number;
  originCoveragePct?: number;
  destCoveragePct?: number;
  reason: string;
  applied: boolean;
}

export interface SalesDeployment {
  partnerId: string;
  partnerName: string;
  bestCategory: ApplianceType;
  fromZoneId: string;
  fromZoneName: string;
  toZoneId: string;
  toZoneName: string;
  rank: number;
  demandScore: number;
  reason: string;
}

export type DeploymentPlan = SalesDeployment[];

export interface NudgeRuleConfig {
  id: string;
  name: string;
  enabled: boolean;
  holdoutPct: number;
}

export interface OutcomeRecord {
  requestId: string;
  applianceType: ApplianceType;
  age: number;
  repairCost: number;
  score: number;
  lean: string;
  choice: 'REPAIR' | 'REPLACE' | 'DEFER';
  completedAt: string;
}

export interface DeletionRequest {
  id: string;
  customerId: string;
  customerName: string;
  requestedAt: string;
  completedAt: string;
  retainedRecords: string[];
}
