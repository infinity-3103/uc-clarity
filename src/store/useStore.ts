import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ApplianceType,
  City,
  ConsentPurpose,
  Customer,
  DeletionRequest,
  DirectOrder,
  EventLogRecord,
  LoanApplication,
  Nudge,
  OutcomeRecord,
  Photo,
  Professional,
  Recommendation,
  RepositionSuggestion,
  ServiceRequest,
  Zone,
  Language,
  SurveyResponse,
  SalesLead,
  SurveyAnswerItem,
} from '../domain/types';
import { createSeedData } from '../data/seed';
import { evaluateRecommendation } from '../domain/scoring';
import { evaluateBureauApplication, evaluateAAApplication } from '../domain/bank';
import { performDataDeletion } from '../domain/consent';
import { findBestProfessional, generateRepositionSuggestions } from '../domain/allocation';
import { evaluateNudgeRules } from '../domain/nudges';
import { INCENTIVE_PCT, SURVEY_DISCOUNT_PCT, SIMULATED_TODAY, SERVICE_FEE } from '../config/assumptions';
import { playNotificationSound } from '../utils/sound';
import { assertAllAssignmentsOpenable } from '../domain/validation';
import { evaluateSurveyAnswerForLead } from '../domain/leads';

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  appTitle?: string;
  timestamp?: string;
}

export interface AppStoreState {
  currentRole: 'customer' | 'professional' | 'ops' | 'marketplace' | 'split';
  selectedCustomerId: string;
  selectedProfessionalId: string;
  activeRequestId: string | null;
  simulatedDate: string;
  simulatedCity: City;
  cityTemperatures: Record<City, number>;
  cityHumidity: Record<City, number>;
  cityAQI: Record<City, number>;
  cityWaterHardness: Record<City, number>;
  cityVoltageStability: Record<City, 'STABLE' | 'MODERATE' | 'SEVERE'>;
  isSimPanelOpen: boolean;

  zones: Zone[];
  customers: Customer[];
  professionals: Professional[];
  serviceRequests: ServiceRequest[];
  loanApplications: LoanApplication[];
  directOrders: DirectOrder[];
  deletionRequests: DeletionRequest[];
  nudges: Nudge[];
  outcomes: OutcomeRecord[];
  repositionSuggestions: RepositionSuggestion[];
  eventLog: EventLogRecord[];
  activePushNotification: PushNotificationPayload | null;
  currentLanguage: Language;
  surveyResponses: SurveyResponse[];
  salesLeads: SalesLead[];

  // Actions
  setRole: (role: 'customer' | 'professional' | 'ops' | 'marketplace' | 'split') => void;
  setLanguage: (lang: Language) => void;
  selectCustomer: (customerId: string) => void;
  selectProfessional: (proId: string) => void;
  setActiveRequestId: (requestId: string | null) => void;
  setSimulatedDate: (date: string) => void;
  setSimulatedCity: (city: City) => void;
  setCityTemperature: (city: City, temp: number) => void;
  setCityHumidity: (city: City, humidity: number) => void;
  setCityAQI: (city: City, aqi: number) => void;
  setCityWaterHardness: (city: City, hardness: number) => void;
  setCityVoltageStability: (city: City, stability: 'STABLE' | 'MODERATE' | 'SEVERE') => void;
  applySimulationScenario: (scenario: 'HEATWAVE' | 'MONSOON_HUMID' | 'SEVERE_POLLUTION' | 'HARD_WATER' | 'POWER_FLUCTUATION') => void;
  toggleSimPanel: () => void;
  triggerPushNotification: (notification: { title: string; body: string; appTitle?: string }) => void;
  dismissPushNotification: () => void;
  logEvent: (actor: string, type: string, payload: Record<string, unknown>) => void;

  placeDirectOrder: (orderData: {
    customerId: string;
    productId: string;
    productName: string;
    brand: string;
    category: ApplianceType;
    price: number;
    tradeInCredit?: number;
    paymentMethod: 'FULL_UPI' | 'FULL_CARD' | 'FULL_NETBANKING' | 'NO_COST_EMI';
    tenorMonths?: number;
    monthlyEMI?: number;
    deliverySlot?: string;
  }) => DirectOrder;

  // Booking & Service lifecycle
  bookService: (data: {
    customerId: string;
    applianceType: ApplianceType;
    brand: string;
    ageYears: number;
    customerAnswers: Record<string, string | boolean | number>;
    scheduledSlot?: string;
  }) => string;
  assignProfessional: (requestId: string, proId: string) => void;
  submitProInspection: (
    requestId: string,
    readings: Record<string, string | boolean | number>,
    photos: Photo[],
    likelyFault: string
  ) => void;
  selectCustomerChoice: (requestId: string, choice: 'REPAIR' | 'REPLACE' | 'DEFER') => void;
  completeServiceJob: (requestId: string) => void;
  submitExitSurvey: (requestId: string, items: { type: ApplianceType; ageBand: string; issue: string }[]) => void;
  submitSurveyResponse: (data: {
    customerId: string;
    city: City;
    zoneId: string;
    answers: SurveyAnswerItem[];
    source: 'checkout' | 'exit';
  }) => void;

  // Consent & privacy
  updateCustomerConsent: (customerId: string, purpose: ConsentPurpose, granted: boolean) => void;
  deleteCustomerData: (customerId: string) => void;

  // Banking & Lending
  submitLoanApplication: (data: {
    requestId: string;
    customerId: string;
    productId: string;
    productName: string;
    principal: number;
    tenorMonths: number;
    tradeInCredit: number;
    path: 'BUREAU' | 'AA';
  }) => LoanApplication;
  advanceLoanCoolingOff: (loanId: string) => void;
  exitLoanCoolingOff: (loanId: string) => void;
  raiseGrievance: (loanId: string, note: string) => void;
  manualUnderwriteDecision: (loanId: string, decision: 'APPROVED' | 'REJECTED', reason: string) => void;

  // Professional programme
  toggleSalesModuleOptIn: (proId: string, optIn: boolean) => void;
  completeSalesTraining: (proId: string) => void;
  applyRepositionSuggestion: (suggestionId: string) => void;

  // Campaign console
  sendCampaignNudges: (ruleId: string, holdoutPct?: number) => number;
  triggerManualNudge: (customerId: string, title: string, body: string, ruleId: string) => void;

  // Reset
  resetDemo: () => void;
}

const initialSeed = createSeedData();

export const useStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      currentRole: 'split',
      selectedCustomerId: 'cust-riya',
      selectedProfessionalId: 'pro-imran',
      activeRequestId: null,
      simulatedDate: SIMULATED_TODAY,
      simulatedCity: 'Mumbai',
      cityTemperatures: {
        Mumbai: 34,
        Delhi: 36,
        Pune: 33,
        Kolkata: 35,
        Bengaluru: 29,
      },
      cityHumidity: {
        Mumbai: 78,
        Delhi: 42,
        Pune: 55,
        Kolkata: 82,
        Bengaluru: 62,
      },
      cityAQI: {
        Delhi: 310,
        Mumbai: 165,
        Pune: 125,
        Kolkata: 220,
        Bengaluru: 85,
      },
      cityWaterHardness: {
        Delhi: 750,
        Mumbai: 240,
        Pune: 450,
        Kolkata: 380,
        Bengaluru: 850,
      },
      cityVoltageStability: {
        Delhi: 'SEVERE',
        Mumbai: 'STABLE',
        Pune: 'MODERATE',
        Kolkata: 'MODERATE',
        Bengaluru: 'MODERATE',
      },
      isSimPanelOpen: false,

      zones: initialSeed.zones,
      customers: initialSeed.customers,
      professionals: initialSeed.professionals,
      serviceRequests: initialSeed.serviceRequests,
      loanApplications: initialSeed.loanApplications,
      directOrders: [],
      deletionRequests: initialSeed.deletionRequests,
      nudges: initialSeed.nudges,
      outcomes: initialSeed.outcomes,
      repositionSuggestions: generateRepositionSuggestions(initialSeed.professionals, initialSeed.zones, 34),
      eventLog: initialSeed.eventLog,
      activePushNotification: null,
      currentLanguage: 'en',
      surveyResponses: initialSeed.surveyResponses || [],
      salesLeads: initialSeed.salesLeads || [],

      setRole: (role) => set({ currentRole: role }),
      setLanguage: (lang) => set({ currentLanguage: lang }),
      selectCustomer: (customerId) => set({ selectedCustomerId: customerId }),
      selectProfessional: (proId) => set({ selectedProfessionalId: proId }),
      setActiveRequestId: (requestId) => set({ activeRequestId: requestId }),
      setSimulatedDate: (date) => set({ simulatedDate: date }),
      setSimulatedCity: (city) => set({ simulatedCity: city }),
      setCityTemperature: (city, temp) => {
        set((state) => ({
          cityTemperatures: { ...state.cityTemperatures, [city]: temp },
        }));
        if (temp >= 40) {
          get().triggerPushNotification({
            title: `Heatwave Alert in ${city}`,
            body: `It is ${temp} C out there. Quick AC check slots & cooling offers are open today.`,
            appTitle: 'Urban Company',
          });
        }
      },

      setCityHumidity: (city, humidity) => {
        set((state) => ({ cityHumidity: { ...state.cityHumidity, [city]: humidity } }));
        if (humidity >= 80) {
          get().triggerPushNotification({
            title: `High Humidity Surge in ${city}`,
            body: `Relative humidity has reached ${humidity}%. Heavy laundry load & AC dehumidification checks active.`,
            appTitle: 'Urban Company',
          });
        }
      },

      setCityAQI: (city, aqi) => {
        set((state) => ({ cityAQI: { ...state.cityAQI, [city]: aqi } }));
        if (aqi >= 300) {
          get().triggerPushNotification({
            title: `Hazardous AQI (${aqi}) in ${city}`,
            body: `Severe air pollution detected. UC Native purifier filter replacement & AMC check slots open.`,
            appTitle: 'Urban Company',
          });
        }
      },

      setCityWaterHardness: (city, hardness) => {
        set((state) => ({ cityWaterHardness: { ...state.cityWaterHardness, [city]: hardness } }));
        if (hardness >= 800) {
          get().triggerPushNotification({
            title: `Hard Water Alert (${hardness} ppm TDS)`,
            body: `High scaling mineral levels in ${city}. RO membrane replacements & geyser tank descaling advised.`,
            appTitle: 'Urban Company',
          });
        }
      },

      setCityVoltageStability: (city, stability) => {
        set((state) => ({ cityVoltageStability: { ...state.cityVoltageStability, [city]: stability } }));
        if (stability === 'SEVERE') {
          get().triggerPushNotification({
            title: `Severe Grid Voltage Spikes in ${city}`,
            body: `Power fluctuations detected. Protect appliance inverter PCBs and compressor capacitors from surge damage.`,
            appTitle: 'Urban Company',
          });
        }
      },

      applySimulationScenario: (scenario) => {
        const city = get().simulatedCity;
        switch (scenario) {
          case 'HEATWAVE':
            set((state) => ({
              simulatedDate: '2026-03-10',
              cityTemperatures: { ...state.cityTemperatures, [city]: 42 },
              cityHumidity: { ...state.cityHumidity, [city]: 38 },
            }));
            get().updateCustomerConsent('cust-riya', 'MARKETING', true);
            get().triggerPushNotification({
              title: `Heatwave Alert in ${city}`,
              body: `It is 42 C out there. Quick AC check slots & cooling replacement offers open today.`,
              appTitle: 'Urban Company',
            });
            break;
          case 'MONSOON_HUMID':
            set((state) => ({
              simulatedDate: '2026-07-20',
              cityTemperatures: { ...state.cityTemperatures, [city]: 32 },
              cityHumidity: { ...state.cityHumidity, [city]: 92 },
              cityVoltageStability: { ...state.cityVoltageStability, [city]: 'SEVERE' },
            }));
            get().triggerPushNotification({
              title: `Monsoon Surge in ${city}`,
              body: `92% relative humidity with power trips. Washing machine drying slots and AC mold checks available.`,
              appTitle: 'Urban Company',
            });
            break;
          case 'SEVERE_POLLUTION':
            set((state) => ({
              simulatedDate: '2026-11-15',
              cityTemperatures: { ...state.cityTemperatures, [city]: 24 },
              cityAQI: { ...state.cityAQI, [city]: 385 },
            }));
            get().triggerPushNotification({
              title: `Severe AQI Alert (${city})`,
              body: `Air Quality Index is 385 (Hazardous). Keep your indoor air clean with Native purifier AMC.`,
              appTitle: 'Urban Company',
            });
            break;
          case 'HARD_WATER':
            set((state) => ({
              cityWaterHardness: { ...state.cityWaterHardness, [city]: 950 },
            }));
            get().triggerPushNotification({
              title: `Hard Water Alert (${city})`,
              body: `TDS levels at 950 ppm. Schedule water purifier RO membrane swap & geyser descaling today.`,
              appTitle: 'Urban Company',
            });
            break;
          case 'POWER_FLUCTUATION':
            set((state) => ({
              cityVoltageStability: { ...state.cityVoltageStability, [city]: 'SEVERE' },
            }));
            get().triggerPushNotification({
              title: `Severe Voltage Spikes in ${city}`,
              body: `Fluctuating voltages risk damaging AC and fridge PCBs. Book an electrical safety check.`,
              appTitle: 'Urban Company',
            });
            break;
        }
      },
      toggleSimPanel: () => set((state) => ({ isSimPanelOpen: !state.isSimPanelOpen })),

      triggerPushNotification: ({ title, body, appTitle = 'Urban Company' }) => {
        const payload: PushNotificationPayload = {
          id: `push-${Date.now()}`,
          title,
          body,
          appTitle,
          timestamp: 'now',
        };
        set({ activePushNotification: payload });
        playNotificationSound();
      },

      dismissPushNotification: () => set({ activePushNotification: null }),

      logEvent: (actor, type, payload) => {
        const newRecord: EventLogRecord = {
          id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          time: new Date().toISOString(),
          actor,
          type,
          payload,
        };
        set((state) => ({ eventLog: [newRecord, ...state.eventLog] }));
      },

      bookService: (data) => {
        const newReqId = `sr-${Date.now()}`;
        const baseFee = SERVICE_FEE[data.applianceType] || 499;

        // Auto assign best professional strictly within customer's city
        const pros = get().professionals;
        const zones = get().zones;
        const customer = get().customers.find((c) => c.id === data.customerId) || get().customers[0];
        const customerCity = (data.customerAnswers.city as City) || customer.city;
        const customerZoneId = (data.customerAnswers.zoneId as string) || customer.zoneId;

        const tempJob: ServiceRequest = {
          id: newReqId,
          customerId: data.customerId,
          applianceType: data.applianceType,
          brand: data.brand,
          ageYears: data.ageYears,
          customerAnswers: { ...data.customerAnswers, city: customerCity, zoneId: customerZoneId },
          photos: [],
          status: 'BOOKED',
          serviceFee: baseFee,
          createdAt: get().simulatedDate,
          scheduledSlot: data.scheduledSlot || '14:00 - 16:00 Today',
        };

        // Filter professionals in the customer's city with matching skill
        const cityProsWithSkill = pros.filter(
          (p) => p.city === customerCity && p.skills.includes(data.applianceType)
        );

        // Find best professional among matching city partners
        const { bestPro } = findBestProfessional(cityProsWithSkill, tempJob, zones);

        let assignedProId = '';
        if (bestPro && bestPro.city === customerCity) {
          assignedProId = bestPro.id;
        } else if (cityProsWithSkill.length > 0) {
          // If no partner in exact zone, widen to other zones in the same city
          const sameZonePros = cityProsWithSkill.filter((p) => p.zoneId === customerZoneId);
          if (sameZonePros.length > 0) {
            assignedProId = sameZonePros[0].id;
          } else {
            // Widen to other zones in the same city
            assignedProId = cityProsWithSkill[0].id;
          }
        } else {
          // Never assign across cities: fallback strictly to any pro in that city
          const cityFallback = pros.find((p) => p.city === customerCity) || pros[0];
          assignedProId = cityFallback.id;
        }

        const newReq: ServiceRequest = {
          ...tempJob,
          professionalId: assignedProId,
          status: 'ASSIGNED',
        };

        set((state) => ({
          serviceRequests: [newReq, ...state.serviceRequests],
          activeRequestId: newReqId,
        }));

        assertAllAssignmentsOpenable(get());

        get().logEvent('Customer', 'SERVICE_BOOKED', {
          requestId: newReqId,
          customerId: data.customerId,
          appliance: data.applianceType,
          assignedTo: assignedProId,
          city: customerCity,
        });

        return newReqId;
      },

      assignProfessional: (requestId, proId) => {
        set((state) => ({
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === requestId ? { ...r, professionalId: proId, status: 'ASSIGNED' } : r
          ),
        }));
        get().logEvent('Ops', 'PROFESSIONAL_REASSIGNED', { requestId, proId });
      },

      submitProInspection: (requestId, readings, photos, likelyFault) => {
        const req = get().serviceRequests.find((r) => r.id === requestId);
        if (!req) return;

        const recommendation: Recommendation = evaluateRecommendation({
          applianceType: req.applianceType,
          ageYears: req.ageYears,
          likelyFault,
          repeatFaults: Number(readings.repeatFaults) || 0,
          inverter: req.customerAnswers.inverter !== false,
          starRating: (req.customerAnswers.starRating as string | number) || 3,
          photos,
        });

        set((state) => ({
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  proReadings: readings,
                  photos,
                  recommendation,
                  status: 'COMPARISON_SHOWN',
                }
              : r
          ),
        }));

        get().logEvent('Professional', 'INSPECTION_SUBMITTED', {
          requestId,
          likelyFault,
          score: recommendation.score,
          lean: recommendation.lean,
        });
      },

      selectCustomerChoice: (requestId, choice) => {
        set((state) => ({
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  choice,
                  status: choice === 'REPLACE' ? 'REPLACE_CHOSEN' : 'REPAIR_CHOSEN',
                }
              : r
          ),
        }));

        get().logEvent('Customer', 'CHOICE_SELECTED', { requestId, choice });
      },

      completeServiceJob: (requestId) => {
        const req = get().serviceRequests.find((r) => r.id === requestId);
        if (!req) return;

        const outcome: OutcomeRecord = {
          requestId,
          applianceType: req.applianceType,
          age: req.ageYears,
          repairCost: req.recommendation?.repairCost || 2000,
          score: req.recommendation?.score || 50,
          lean: req.recommendation?.lean || 'REPAIR',
          choice: req.choice || 'REPAIR',
          completedAt: get().simulatedDate,
        };

        set((state) => ({
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'COMPLETED' } : r
          ),
          outcomes: [outcome, ...state.outcomes],
        }));

        get().logEvent('Professional', 'JOB_COMPLETED', { requestId, choice: req.choice });
      },

      submitExitSurvey: (requestId, items) => {
        const req = get().serviceRequests.find((r) => r.id === requestId);
        if (!req) return;

        const discountAmount = Math.round(req.serviceFee * SURVEY_DISCOUNT_PCT);
        const newFee = Math.max(0, req.serviceFee - discountAmount);

        set((state) => ({
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  discountApplied: discountAmount,
                  serviceFee: newFee,
                  exitSurvey: {
                    id: `survey-${Date.now()}`,
                    completedAt: get().simulatedDate,
                    items,
                    discountAmount,
                  },
                }
              : r
          ),
        }));

        get().logEvent('Customer', 'EXIT_SURVEY_COMPLETED', {
          requestId,
          discountAmount,
          itemCount: items.length,
        });
      },

      submitSurveyResponse: (data) => {
        const surveyId = `srvy-${Date.now()}`;
        const newResponse: SurveyResponse = {
          id: surveyId,
          customerId: data.customerId,
          city: data.city,
          zoneId: data.zoneId,
          answers: data.answers,
          timestamp: new Date().toISOString(),
          source: data.source,
        };

        const newLeads: SalesLead[] = [];
        data.answers.forEach((item) => {
          const lead = evaluateSurveyAnswerForLead(
            item,
            data.customerId,
            data.city,
            data.zoneId,
            surveyId
          );
          if (lead) {
            newLeads.push(lead);
          }
        });

        set((state) => ({
          surveyResponses: [newResponse, ...state.surveyResponses],
          salesLeads: [...newLeads, ...state.salesLeads],
        }));

        get().logEvent('Customer', 'SURVEY_SUBMITTED', {
          surveyId,
          customerId: data.customerId,
          source: data.source,
          itemCount: data.answers.length,
          leadsCreated: newLeads.length,
        });
      },

      placeDirectOrder: (orderData) => {
        const orderId = `ord-${Date.now()}`;
        const customer = get().customers.find((c) => c.id === orderData.customerId);
        const tradeInCredit = orderData.tradeInCredit || 0;
        const netAmountPaid = Math.max(0, orderData.price - tradeInCredit);

        const newOrder: DirectOrder = {
          id: orderId,
          customerId: orderData.customerId,
          customerName: customer ? customer.name : 'Customer',
          productId: orderData.productId,
          productName: orderData.productName,
          brand: orderData.brand,
          category: orderData.category,
          price: orderData.price,
          tradeInCredit,
          netAmountPaid,
          paymentMethod: orderData.paymentMethod,
          tenorMonths: orderData.tenorMonths,
          monthlyEMI: orderData.monthlyEMI,
          deliverySlot: orderData.deliverySlot || 'Tomorrow, 11:00 AM - 2:00 PM',
          status: 'CONFIRMED',
          createdAt: get().simulatedDate,
        };

        set((state) => ({
          directOrders: [newOrder, ...state.directOrders],
        }));

        get().logEvent('Customer', 'DIRECT_ORDER_PLACED', {
          orderId,
          product: orderData.productName,
          paymentMethod: orderData.paymentMethod,
          netAmount: netAmountPaid,
        });

        get().triggerPushNotification({
          title: 'Order Confirmed!',
          body: `Order for ${orderData.productName} confirmed (${orderData.paymentMethod.replace(/_/g, ' ')}: Rs ${netAmountPaid.toLocaleString('en-IN')}). Delivery tomorrow!`,
          appTitle: 'Urban Company',
        });

        return newOrder;
      },

      updateCustomerConsent: (customerId, purpose, granted) => {
        const now = new Date().toISOString();
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const existing = c.consents.find((cr) => cr.purpose === purpose);
            const updated = existing
              ? c.consents.map((cr) => (cr.purpose === purpose ? { ...cr, granted, at: now } : cr))
              : [...c.consents, { id: `c-${customerId}-${purpose}`, customerId, purpose, granted, noticeVersion: 'v1', at: now }];
            return { ...c, consents: updated };
          }),
        }));

        get().logEvent('Customer', 'CONSENT_UPDATED', { customerId, purpose, granted });
      },

      deleteCustomerData: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return;

        const hasActiveLoan = get().loanApplications.some((l) => l.customerId === customerId);
        const { updatedCustomer, deletionRecord } = performDataDeletion(customer, hasActiveLoan);

        set((state) => ({
          customers: state.customers.map((c) => (c.id === customerId ? updatedCustomer : c)),
          deletionRequests: [deletionRecord, ...state.deletionRequests],
          // Purge active nudges for this user
          nudges: state.nudges.filter((n) => n.customerId !== customerId),
        }));

        get().logEvent('Customer', 'DATA_DELETED', { customerId });
      },

      submitLoanApplication: (data) => {
        const customer = get().customers.find((c) => c.id === data.customerId);
        const netPrincipal = Math.max(0, data.principal - data.tradeInCredit);
        const monthlyEMI = Math.round(netPrincipal / data.tenorMonths);

        let decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' = 'APPROVED';
        let reasons: string[] = [];
        let foir: number | undefined;

        if (data.path === 'BUREAU') {
          const bureauScore = customer?.bureauScore || 700;
          const res = evaluateBureauApplication(bureauScore);
          decision = res.decision;
          reasons = res.reasons;
        } else {
          // AA path
          // For Arjun Verma, calibrated for FOIR between 0.40 and 0.45
          const credits = customer?.monthlyIncomeHint || 30000;
          const obligations = customer?.id === 'cust-arjun' ? 9750 : 8000;
          const res = evaluateAAApplication(credits, obligations, monthlyEMI);
          decision = res.decision;
          reasons = res.reasons;
          foir = res.foir;
        }

        const newLoan: LoanApplication = {
          id: `loan-${Date.now()}`,
          requestId: data.requestId,
          customerId: data.customerId,
          productId: data.productId,
          productName: data.productName,
          principal: netPrincipal,
          tenorMonths: data.tenorMonths,
          monthlyEMI,
          tradeInCredit: data.tradeInCredit,
          path: data.path,
          aaSummary:
            data.path === 'AA'
              ? {
                  avgMonthlyCredits: customer?.monthlyIncomeHint || 30000,
                  avgMonthlyObligations: customer?.id === 'cust-arjun' ? 9750 : 8000,
                  volatility: 'LOW',
                  foir: foir || 0.42,
                }
              : undefined,
          decision,
          reasons,
          kfsAcknowledgedAt: new Date().toISOString(),
          status: decision === 'APPROVED' ? 'COOLING_OFF' : 'DECIDED',
          createdAt: get().simulatedDate,
        };

        // If approved and professional was opted in, add pending referral earnings
        const req = get().serviceRequests.find((r) => r.id === data.requestId);
        if (decision === 'APPROVED' && req?.professionalId) {
          const pro = get().professionals.find((p) => p.id === req.professionalId);
          if (pro && pro.salesModuleOptIn) {
            const incentiveAmt = Math.round(data.principal * INCENTIVE_PCT);
            set((state) => ({
              professionals: state.professionals.map((p) =>
                p.id === pro.id ? { ...p, referralEarnings: p.referralEarnings + incentiveAmt } : p
              ),
            }));
          }
        }

        set((state) => ({
          loanApplications: [newLoan, ...state.loanApplications],
          serviceRequests: state.serviceRequests.map((r) =>
            r.id === data.requestId ? { ...r, status: 'REPLACE_CHOSEN', choice: 'REPLACE' } : r
          ),
        }));

        get().logEvent('Bank', 'LOAN_SUBMITTED', {
          loanId: newLoan.id,
          customerId: data.customerId,
          decision,
          path: data.path,
        });

        return newLoan;
      },

      advanceLoanCoolingOff: (loanId) => {
        set((state) => ({
          loanApplications: state.loanApplications.map((l) =>
            l.id === loanId ? { ...l, status: 'DISBURSED' } : l
          ),
        }));
        get().logEvent('Bank', 'COOLING_OFF_ADVANCED', { loanId });
      },

      exitLoanCoolingOff: (loanId) => {
        set((state) => ({
          loanApplications: state.loanApplications.map((l) =>
            l.id === loanId ? { ...l, status: 'CLOSED', coolingOffExited: true } : l
          ),
        }));
        get().logEvent('Customer', 'COOLING_OFF_EXIT', { loanId });
      },

      raiseGrievance: (loanId, note) => {
        set((state) => ({
          loanApplications: state.loanApplications.map((l) =>
            l.id === loanId ? { ...l, grievanceRaised: true, grievanceNote: note } : l
          ),
        }));
        get().logEvent('Customer', 'GRIEVANCE_RAISED', { loanId, note });
      },

      manualUnderwriteDecision: (loanId, decision, reason) => {
        set((state) => ({
          loanApplications: state.loanApplications.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  decision,
                  status: decision === 'APPROVED' ? 'COOLING_OFF' : 'DECIDED',
                  reasons: [...l.reasons, `Manual Review (${decision}): ${reason}`],
                }
              : l
          ),
        }));
        get().logEvent('Bank', 'MANUAL_UNDERWRITE_DECISION', { loanId, decision, reason });
      },

      toggleSalesModuleOptIn: (proId, optIn) => {
        set((state) => ({
          professionals: state.professionals.map((p) =>
            p.id === proId ? { ...p, salesModuleOptIn: optIn } : p
          ),
        }));
        get().logEvent('Professional', 'SALES_OPT_IN_TOGGLED', { proId, optIn });
      },

      completeSalesTraining: (proId) => {
        set((state) => ({
          professionals: state.professionals.map((p) =>
            p.id === proId ? { ...p, trainingCompleted: true, salesModuleOptIn: true } : p
          ),
        }));
        get().logEvent('Professional', 'SALES_TRAINING_COMPLETED', { proId });
      },

      applyRepositionSuggestion: (suggestionId) => {
        const suggestion = get().repositionSuggestions.find((s) => s.id === suggestionId);
        if (!suggestion) return;

        set((state) => ({
          professionals: state.professionals.map((p) =>
            p.id === suggestion.professionalId ? { ...p, zoneId: suggestion.toZoneId } : p
          ),
          repositionSuggestions: state.repositionSuggestions.map((s) =>
            s.id === suggestionId ? { ...s, applied: true } : s
          ),
        }));

        get().logEvent('Ops', 'REPOSITION_APPLIED', { suggestionId, proId: suggestion.professionalId });
      },

      sendCampaignNudges: (ruleId, holdoutPct = 10) => {
        const customers = get().customers;
        const currentNudges = get().nudges;
        const context = {
          simulatedDate: get().simulatedDate,
          temperatureByCity: get().cityTemperatures,
          recentNudges: currentNudges,
          serviceRequests: get().serviceRequests,
        };

        const newNudges: Nudge[] = [];
        customers.forEach((cust) => {
          const nudge = evaluateNudgeRules(cust, context, holdoutPct);
          if (nudge && nudge.ruleId === ruleId) {
            newNudges.push(nudge);
          }
        });

        if (newNudges.length > 0) {
          set((state) => ({ nudges: [...newNudges, ...state.nudges] }));
          get().logEvent('Ops', 'CAMPAIGN_NUDGES_SENT', { ruleId, count: newNudges.length });

          const sample = newNudges.find((n) => n.customerId === get().selectedCustomerId) || newNudges[0];
          get().triggerPushNotification({
            title: sample.title,
            body: sample.body,
            appTitle: 'Urban Company',
          });
        }

        return newNudges.length;
      },

      triggerManualNudge: (customerId, title, body, ruleId) => {
        const nudge: Nudge = {
          id: `nudge-man-${Date.now()}`,
          customerId,
          ruleId,
          title,
          body,
          sentAt: get().simulatedDate,
          opened: false,
          holdout: false,
        };

        set((state) => ({ nudges: [nudge, ...state.nudges] }));
        get().logEvent('Ops', 'MANUAL_NUDGE_TRIGGERED', { customerId, ruleId });

        get().triggerPushNotification({
          title,
          body,
          appTitle: 'Urban Company',
        });
      },

      resetDemo: () => {
        const fresh = createSeedData();
        set({
          currentRole: 'split',
          selectedCustomerId: 'cust-riya',
          selectedProfessionalId: 'pro-imran',
          activeRequestId: null,
          simulatedDate: SIMULATED_TODAY,
          simulatedCity: 'Mumbai',
          cityTemperatures: {
            Mumbai: 34,
            Delhi: 36,
            Pune: 33,
            Kolkata: 35,
            Bengaluru: 29,
          },
          cityHumidity: {
            Mumbai: 78,
            Delhi: 42,
            Pune: 55,
            Kolkata: 82,
            Bengaluru: 62,
          },
          cityAQI: {
            Delhi: 310,
            Mumbai: 165,
            Pune: 125,
            Kolkata: 220,
            Bengaluru: 85,
          },
          cityWaterHardness: {
            Delhi: 750,
            Mumbai: 240,
            Pune: 450,
            Kolkata: 380,
            Bengaluru: 850,
          },
          cityVoltageStability: {
            Delhi: 'SEVERE',
            Mumbai: 'STABLE',
            Pune: 'MODERATE',
            Kolkata: 'MODERATE',
            Bengaluru: 'MODERATE',
          },
          isSimPanelOpen: false,
          activePushNotification: null,
          currentLanguage: 'en',
          directOrders: [],
          zones: fresh.zones,
          customers: fresh.customers,
          professionals: fresh.professionals,
          serviceRequests: fresh.serviceRequests,
          loanApplications: fresh.loanApplications,
          deletionRequests: fresh.deletionRequests,
          nudges: fresh.nudges,
          outcomes: fresh.outcomes,
          repositionSuggestions: generateRepositionSuggestions(fresh.professionals, fresh.zones, 34),
          eventLog: fresh.eventLog,
          surveyResponses: fresh.surveyResponses || [],
          salesLeads: fresh.salesLeads || [],
        });
      },
    }),
    {
      name: 'uc-clarity-store-v4',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          return undefined;
        }
        return persistedState;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);
