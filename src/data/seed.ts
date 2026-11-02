import {
  Customer,
  Professional,
  ServiceRequest,
  LoanApplication,
  Zone,
  ConsentRecord,
  ApplianceType,
  City,
  DeletionRequest,
  Nudge,
  EventLogRecord,
  OutcomeRecord,
  DirectOrder,
  SurveyResponse,
  SalesLead,
} from '../domain/types';
import { NEW_PRICE, FAULTS, EXPECTED_LIFE } from '../config/assumptions';
import { validateCoverage } from '../domain/validation';

// Seeded mulberry32 random generator for repeatable simulation
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeedData() {
  const rand = mulberry32(42);

  // 1. Cities and schematic zones
  const cityZoneConfigs: { city: City; zones: string[] }[] = [
    { city: 'Mumbai', zones: ['Andheri', 'Bandra', 'Powai', 'Thane', 'Navi Mumbai', 'Borivali'] },
    { city: 'Delhi', zones: ['Dwarka', 'Rohini', 'Saket', 'Lajpat Nagar', 'Noida', 'Gurugram'] },
    { city: 'Pune', zones: ['Kothrud', 'Wakad', 'Hinjewadi', 'Hadapsar', 'Baner'] },
    { city: 'Kolkata', zones: ['Salt Lake', 'New Town', 'Howrah', 'Behala', 'Dum Dum'] },
    { city: 'Bengaluru', zones: ['Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Electronic City'] },
  ];

  const zones: Zone[] = [];
  let zoneIdx = 0;

  cityZoneConfigs.forEach(({ city, zones: zNames }) => {
    const cityZones: Zone[] = [];
    zNames.forEach((name, i) => {
      zoneIdx++;
      const z: Zone = {
        id: `zone-${city.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        city,
        x: 100 + (i % 3) * 140 + Math.floor(rand() * 20),
        y: 80 + Math.floor(i / 3) * 140 + Math.floor(rand() * 20),
        demandHistory: {
          AC: Array.from({ length: 90 }, () => Math.floor(10 + rand() * 25)),
          FRIDGE: Array.from({ length: 90 }, () => Math.floor(6 + rand() * 12)),
          WASHER: Array.from({ length: 90 }, () => Math.floor(5 + rand() * 10)),
          GEYSER: Array.from({ length: 90 }, () => Math.floor(4 + rand() * 8)),
          PURIFIER: Array.from({ length: 90 }, () => Math.floor(8 + rand() * 15)),
        },
        adjacentZones: [],
      };
      cityZones.push(z);
      zones.push(z);
    });

    // Populate intra-city adjacency
    cityZones.forEach((z1, i) => {
      cityZones.forEach((z2, j) => {
        if (i !== j) {
          const travelMinutes = 10 + Math.abs(i - j) * 8 + Math.floor(rand() * 5);
          z1.adjacentZones.push({ zoneId: z2.id, travelMinutes });
        }
      });
    });
  });

  // 2. Customers (40 total, 10 thin-file)
  const customers: Customer[] = [];

  // Demo Persona 1: Riya Mehta (Mumbai, Andheri)
  const riyaConsents: ConsentRecord[] = [
    { id: 'c-riya-diag', customerId: 'cust-riya', purpose: 'DIAGNOSTICS', granted: false, noticeVersion: 'v1', at: '2026-03-01T10:00:00Z' },
    { id: 'c-riya-mktg', customerId: 'cust-riya', purpose: 'MARKETING', granted: false, noticeVersion: 'v1', at: '2026-03-01T10:00:00Z' },
    { id: 'c-riya-credit', customerId: 'cust-riya', purpose: 'CREDIT_ASSESSMENT', granted: false, noticeVersion: 'v1', at: '2026-03-01T10:00:00Z' },
    { id: 'c-riya-bank', customerId: 'cust-riya', purpose: 'BANK_SHARING', granted: false, noticeVersion: 'v1', at: '2026-03-01T10:00:00Z' },
  ];

  customers.push({
    id: 'cust-riya',
    name: 'Riya Mehta',
    phone: '+91 98201 12345',
    city: 'Mumbai',
    zoneId: 'zone-mumbai-andheri',
    hasCreditHistory: true,
    bureauScore: 742,
    monthlyIncomeHint: 95000,
    consents: riyaConsents,
    appliances: [
      {
        id: 'app-riya-ac',
        type: 'AC',
        brand: 'Voltas',
        ageYears: 12,
        notes: 'note_ac_failing_compressor',
        noteKey: 'note_ac_failing_compressor',
      },
      {
        id: 'app-riya-purifier',
        type: 'PURIFIER',
        brand: 'Native M1',
        ageYears: 2,
        notes: 'note_purifier_valid_history',
        noteKey: 'note_purifier_valid_history',
      },
    ],
  });

  // Demo Persona 2: Arjun Verma (Pune, Wakad)
  const arjunConsents: ConsentRecord[] = [
    { id: 'c-arjun-diag', customerId: 'cust-arjun', purpose: 'DIAGNOSTICS', granted: false, noticeVersion: 'v1', at: '2026-03-02T11:00:00Z' },
    { id: 'c-arjun-mktg', customerId: 'cust-arjun', purpose: 'MARKETING', granted: false, noticeVersion: 'v1', at: '2026-03-02T11:00:00Z' },
    { id: 'c-arjun-credit', customerId: 'cust-arjun', purpose: 'CREDIT_ASSESSMENT', granted: false, noticeVersion: 'v1', at: '2026-03-02T11:00:00Z' },
    { id: 'c-arjun-bank', customerId: 'cust-arjun', purpose: 'BANK_SHARING', granted: false, noticeVersion: 'v1', at: '2026-03-02T11:00:00Z' },
  ];

  customers.push({
    id: 'cust-arjun',
    name: 'Arjun Verma',
    phone: '+91 97654 32109',
    city: 'Pune',
    zoneId: 'zone-pune-wakad',
    hasCreditHistory: false,
    monthlyIncomeHint: 30000,
    consents: arjunConsents,
    lastSurveyDiscountAt: '2026-01-15T10:00:00Z', // 2 months ago: not eligible
    appliances: [
      {
        id: 'app-arjun-fridge',
        type: 'FRIDGE',
        brand: 'LG',
        ageYears: 9,
        notes: 'note_fridge_noisy_cooling',
        noteKey: 'note_fridge_noisy_cooling',
      },
      {
        id: 'app-arjun-geyser',
        type: 'GEYSER',
        brand: 'Bajaj',
        ageYears: 4,
        notes: 'note_geyser_tripping',
        noteKey: 'note_geyser_tripping',
      },
    ],
  });

  // Additional 38 customers
  const firstNames = ['Aarav', 'Ananya', 'Rohan', 'Sneha', 'Vikram', 'Pooja', 'Aditya', 'Divya', 'Karan', 'Neha', 'Rahul', 'Priya', 'Amit', 'Tanvi', 'Manish', 'Simran', 'Suresh', 'Deepa', 'Gaurav', 'Isha'];
  const lastNames = ['Sharma', 'Patel', 'Deshmukh', 'Mukherjee', 'Nair', 'Iyer', 'Gupta', 'Banerjee', 'Rao', 'Reddy', 'Singh', 'Kulkarni', 'Joshi', 'Chopra', 'Malhotra', 'Bose'];
  const applianceTypesList: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];

  for (let i = 3; i <= 40; i++) {
    const isThinFile = i % 4 === 0;
    const cityObj = cityZoneConfigs[i % cityZoneConfigs.length];
    const zoneName = cityObj.zones[i % cityObj.zones.length];
    const cZoneId = `zone-${cityObj.city.toLowerCase()}-${zoneName.toLowerCase().replace(/\s+/g, '-')}`;
    const custId = `cust-${i}`;

    const numAppliances = 1 + Math.floor(rand() * 3);
    const ownedApps = [];
    for (let k = 0; k < numAppliances; k++) {
      const aType = applianceTypesList[(i + k) % applianceTypesList.length];
      ownedApps.push({
        id: `app-${custId}-${k}`,
        type: aType,
        brand: aType === 'PURIFIER' && k === 0 ? 'Native M2' : 'Samsung',
        ageYears: 2 + Math.floor(rand() * 14),
      });
    }

    customers.push({
      id: custId,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      phone: `+91 98${Math.floor(10000000 + rand() * 89999999)}`,
      city: cityObj.city,
      zoneId: cZoneId,
      hasCreditHistory: !isThinFile,
      bureauScore: !isThinFile ? 600 + Math.floor(rand() * 250) : undefined,
      monthlyIncomeHint: 25000 + Math.floor(rand() * 80000),
      consents: [
        { id: `c-${custId}-diag`, customerId: custId, purpose: 'DIAGNOSTICS', granted: rand() > 0.6, noticeVersion: 'v1', at: '2026-02-15T09:00:00Z' },
        { id: `c-${custId}-mktg`, customerId: custId, purpose: 'MARKETING', granted: rand() > 0.7, noticeVersion: 'v1', at: '2026-02-15T09:00:00Z' },
        { id: `c-${custId}-credit`, customerId: custId, purpose: 'CREDIT_ASSESSMENT', granted: false, noticeVersion: 'v1', at: '2026-02-15T09:00:00Z' },
        { id: `c-${custId}-bank`, customerId: custId, purpose: 'BANK_SHARING', granted: false, noticeVersion: 'v1', at: '2026-02-15T09:00:00Z' },
      ],
      appliances: ownedApps,
      lastSurveyDiscountAt: i === 3 ? '2025-08-15T10:00:00Z' : undefined, // 7 months ago: eligible
    });
  }

  // 3. Professionals (30 total: exactly 6 per city, providing >= 2 partners per city x appliance pair)
  const professionals: Professional[] = [
    // --- MUMBAI (6 professionals) ---
    {
      id: 'pro-imran',
      name: 'Imran Sheikh',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      skills: ['AC', 'FRIDGE'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 42500,
      referralEarnings: 8730,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 6, opportunities: 8 },
        FRIDGE: { unitsSold: 2, opportunities: 5 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-4',
      name: 'Rajesh Kumar',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-powai',
      skills: ['FRIDGE', 'WASHER'],
      rating: 4.5,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 31000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-suresh',
      name: 'Suresh Nair',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-bandra',
      skills: ['WASHER', 'GEYSER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 36000,
      referralEarnings: 6200,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        WASHER: { unitsSold: 5, opportunities: 7 },
        GEYSER: { unitsSold: 1, opportunities: 3 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-5',
      name: 'Deepak More',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-thane',
      skills: ['GEYSER', 'PURIFIER'],
      rating: 4.3,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 29500,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      // Mahesh Surve: strictly Mumbai, zone-mumbai-andheri
      id: 'pro-17',
      name: 'Mahesh Surve',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      skills: ['PURIFIER', 'AC'],
      rating: 4.8,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 45000,
      referralEarnings: 9400,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        PURIFIER: { unitsSold: 7, opportunities: 9 },
        AC: { unitsSold: 3, opportunities: 5 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-6',
      name: 'Manoj Tiwari',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-borivali',
      skills: ['AC', 'WASHER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 34000,
      referralEarnings: 5100,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 4, opportunities: 6 },
        WASHER: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },

    // --- DELHI (6 professionals) ---
    {
      id: 'pro-7',
      name: 'Sunil Jadhav',
      city: 'Delhi',
      zoneId: 'zone-delhi-dwarka',
      skills: ['AC', 'FRIDGE'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 41000,
      referralEarnings: 7500,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 5, opportunities: 7 },
        FRIDGE: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-8',
      name: 'Nitin Sawant',
      city: 'Delhi',
      zoneId: 'zone-delhi-rohini',
      skills: ['FRIDGE', 'WASHER'],
      rating: 4.2,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 28000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-9',
      name: 'Arvind Pandey',
      city: 'Delhi',
      zoneId: 'zone-delhi-saket',
      skills: ['WASHER', 'GEYSER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 37500,
      referralEarnings: 5800,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        GEYSER: { unitsSold: 4, opportunities: 6 },
        WASHER: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-10',
      name: 'Vijay Kamble',
      city: 'Delhi',
      zoneId: 'zone-delhi-lajpat-nagar',
      skills: ['GEYSER', 'PURIFIER'],
      rating: 4.4,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 32000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-11',
      name: 'Pradeep Shinde',
      city: 'Delhi',
      zoneId: 'zone-delhi-noida',
      skills: ['PURIFIER', 'AC'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 43000,
      referralEarnings: 6900,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        PURIFIER: { unitsSold: 4, opportunities: 6 },
        AC: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-12',
      name: 'Anil Gaikwad',
      city: 'Delhi',
      zoneId: 'zone-delhi-gurugram',
      skills: ['AC', 'WASHER'],
      rating: 4.5,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 33500,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },

    // --- PUNE (6 professionals) ---
    {
      id: 'pro-rahul-pune',
      name: 'Rahul Shinde',
      city: 'Pune',
      zoneId: 'zone-pune-wakad',
      skills: ['FRIDGE', 'AC'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 39500,
      referralEarnings: 4350,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        FRIDGE: { unitsSold: 4, opportunities: 6 },
        AC: { unitsSold: 1, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-16',
      name: 'Ganesh Kadam',
      city: 'Pune',
      zoneId: 'zone-pune-hinjewadi',
      skills: ['FRIDGE', 'WASHER'],
      rating: 4.3,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 30000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-sanjay',
      name: 'Sanjay Patil',
      city: 'Pune',
      zoneId: 'zone-pune-wakad',
      skills: ['WASHER', 'GEYSER'],
      rating: 4.5,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 38200,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-18',
      name: 'Santosh Mane',
      city: 'Pune',
      zoneId: 'zone-pune-hadapsar',
      skills: ['GEYSER', 'PURIFIER'],
      rating: 4.4,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 29000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-15',
      name: 'Sachin Pawar',
      city: 'Pune',
      zoneId: 'zone-pune-kothrud',
      skills: ['PURIFIER', 'AC'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 41000,
      referralEarnings: 4800,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        PURIFIER: { unitsSold: 3, opportunities: 5 },
        AC: { unitsSold: 1, opportunities: 3 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-19',
      name: 'Vikas Chavan',
      city: 'Pune',
      zoneId: 'zone-pune-baner',
      skills: ['AC', 'WASHER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 36000,
      referralEarnings: 4200,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 3, opportunities: 5 },
        WASHER: { unitsSold: 1, opportunities: 3 },
      },
      online: true,
      status: 'IDLE',
    },

    // --- KOLKATA (6 professionals) ---
    {
      id: 'pro-20',
      name: 'Ramesh Yadav',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-salt-lake',
      skills: ['AC', 'FRIDGE'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 38000,
      referralEarnings: 5500,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        FRIDGE: { unitsSold: 4, opportunities: 6 },
        AC: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-21',
      name: 'Pravin Kale',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-new-town',
      skills: ['FRIDGE', 'WASHER'],
      rating: 4.2,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 27500,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-22',
      name: 'Amol Jagtap',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-howrah',
      skills: ['WASHER', 'GEYSER'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 40000,
      referralEarnings: 6100,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        WASHER: { unitsSold: 4, opportunities: 6 },
        GEYSER: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-23',
      name: 'Nilesh Bhosale',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-behala',
      skills: ['GEYSER', 'PURIFIER'],
      rating: 4.3,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 29000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-24',
      name: 'Ajay Kulkarni',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-dum-dum',
      skills: ['PURIFIER', 'AC'],
      rating: 4.4,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 31500,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-25',
      name: 'Hemant Deshpande',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-salt-lake',
      skills: ['AC', 'WASHER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 35000,
      referralEarnings: 4500,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 3, opportunities: 5 },
        WASHER: { unitsSold: 1, opportunities: 3 },
      },
      online: true,
      status: 'IDLE',
    },

    // --- BENGALURU (6 professionals) ---
    {
      id: 'pro-26',
      name: 'Siddharth Roy',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-whitefield',
      skills: ['AC', 'FRIDGE'],
      rating: 4.8,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 46000,
      referralEarnings: 7800,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        AC: { unitsSold: 5, opportunities: 8 },
        FRIDGE: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-27',
      name: 'Subhash Sen',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-koramangala',
      skills: ['FRIDGE', 'WASHER'],
      rating: 4.3,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 29000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-28',
      name: 'Debashis Pal',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-hsr-layout',
      skills: ['WASHER', 'GEYSER'],
      rating: 4.6,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 38500,
      referralEarnings: 5900,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        GEYSER: { unitsSold: 4, opportunities: 6 },
        WASHER: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-29',
      name: 'Somenath Ghosh',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-indiranagar',
      skills: ['GEYSER', 'PURIFIER'],
      rating: 4.4,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 32000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-30',
      name: 'Karthik Raja',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-electronic-city',
      skills: ['PURIFIER', 'AC'],
      rating: 4.7,
      salesModuleOptIn: true,
      trainingCompleted: true,
      serviceEarnings: 44000,
      referralEarnings: 7200,
      // Synthetic sales performance stats calibrated with referralEarnings
      salesByCategory: {
        PURIFIER: { unitsSold: 5, opportunities: 7 },
        AC: { unitsSold: 2, opportunities: 4 },
      },
      online: true,
      status: 'IDLE',
    },
    {
      id: 'pro-31',
      name: 'Venkatesh Murthy',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-whitefield',
      skills: ['AC', 'WASHER'],
      rating: 4.5,
      salesModuleOptIn: false,
      trainingCompleted: false,
      serviceEarnings: 34000,
      referralEarnings: 0,
      online: true,
      status: 'IDLE',
    },
  ];

  // Validate coverage strictly at seed initialization
  validateCoverage(professionals);

  // 4. Historical Service Requests (150 requests with outcomes)
  const serviceRequests: ServiceRequest[] = [];
  const outcomes: OutcomeRecord[] = [];

  for (let i = 1; i <= 150; i++) {
    const cust = customers[i % customers.length];
    const appType = applianceTypesList[i % applianceTypesList.length];
    const age = 3 + Math.floor(rand() * 12);
    const faultKeys = Object.keys(FAULTS[appType]);
    const fault = faultKeys[i % faultKeys.length];
    const rCost = FAULTS[appType][fault] || 2000;
    const nPrice = NEW_PRICE[appType];
    const scoreVal = Math.round(Math.min(95, Math.max(12, (age / EXPECTED_LIFE[appType]) * 40 + (rCost / nPrice) * 60)) * 10) / 10;
    const choiceType: 'REPAIR' | 'REPLACE' | 'DEFER' = scoreVal > 60 ? (rand() > 0.4 ? 'REPLACE' : 'REPAIR') : 'REPAIR';

    // Find eligible professional in customer's city
    const eligiblePros = professionals.filter(
      (p) => p.city === cust.city && p.skills.includes(appType)
    );
    const assigned = eligiblePros[i % eligiblePros.length] || professionals[i % professionals.length];

    const reqId = `sr-hist-${i}`;
    serviceRequests.push({
      id: reqId,
      customerId: cust.id,
      applianceType: appType,
      brand: 'Standard',
      ageYears: age,
      customerAnswers: { symptom: 'sym_performance_degradation', ageYears: age, city: cust.city },
      proReadings: { likelyFault: fault, repeatFaults: i % 3 === 0 ? 1 : 0 },
      photos: [
        { id: `ph-${reqId}-1`, name: 'Nameplate', grade: 3 },
        { id: `ph-${reqId}-2`, name: 'Internal Assembly', grade: 3 },
      ],
      professionalId: assigned.id,
      status: 'COMPLETED',
      recommendation: {
        score: scoreVal,
        lean: scoreVal < 25 ? 'REPAIR' : scoreVal < 50 ? 'BOTH_LEAN_REPAIR' : scoreVal < 70 ? 'BOTH_LEAN_REPLACE' : 'REPLACE',
        reasons: [`Diagnostic check completed for ${appType}.`, `Evaluated repair cost against standard life.`],
        repairCost: rCost,
        newPrice: nPrice,
        expectedRemainingLifeYears: Math.max(1, EXPECTED_LIFE[appType] - age),
      },
      choice: choiceType,
      serviceFee: 499,
      createdAt: new Date(Date.now() - (150 - i) * 86400000).toISOString(),
      scheduledSlot: '10:00 - 12:00',
    });

    outcomes.push({
      requestId: reqId,
      applianceType: appType,
      age,
      repairCost: rCost,
      score: scoreVal,
      lean: scoreVal < 25 ? 'REPAIR' : scoreVal < 50 ? 'BOTH_LEAN_REPAIR' : scoreVal < 70 ? 'BOTH_LEAN_REPLACE' : 'REPLACE',
      choice: choiceType,
      completedAt: new Date(Date.now() - (150 - i) * 86400000 + 7200000).toISOString(),
    });
  }

  // 5. Loan Applications (25 historical records)
  const loanApplications: LoanApplication[] = [];
  for (let i = 1; i <= 25; i++) {
    const cust = customers[i % customers.length];
    const isAA = !cust.hasCreditHistory;
    const isApproved = isAA ? true : (cust.bureauScore || 0) >= 700;

    loanApplications.push({
      id: `loan-hist-${i}`,
      requestId: `sr-hist-${i}`,
      customerId: cust.id,
      productId: 'prod-ac-voltas',
      productName: 'Voltas 1.5 Ton Inverter AC',
      principal: 38000,
      tenorMonths: 9,
      monthlyEMI: 4222,
      tradeInCredit: 3000,
      path: isAA ? 'AA' : 'BUREAU',
      aaSummary: isAA
        ? {
            avgMonthlyCredits: 30000,
            avgMonthlyObligations: 9750,
            volatility: 'LOW',
            foir: 0.421,
          }
        : undefined,
      decision: isApproved ? 'APPROVED' : 'REJECTED',
      reasons: isApproved
        ? [isAA ? 'Cash flow verified via Account Aggregator. FOIR within 45% limit.' : 'Bureau score 740+ meets benchmark.']
        : ['Risk criteria not met.'],
      kfsAcknowledgedAt: new Date(Date.now() - (25 - i) * 86400000 + 3600000).toISOString(),
      status: 'DISBURSED',
      createdAt: new Date(Date.now() - (25 - i) * 86400000).toISOString(),
    });
  }

  // 6. Direct Orders seed
  const directOrders: DirectOrder[] = [];

  // 7. Data Deletion Requests seed (5 historical records)
  const deletionRequests: DeletionRequest[] = [];
  for (let i = 1; i <= 5; i++) {
    deletionRequests.push({
      id: `del-req-${i}`,
      customerId: `cust-del-${i}`,
      customerName: 'Deleted user',
      requestedAt: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
      completedAt: new Date(Date.now() - (20 - i) * 86400000 + 120000).toISOString(),
      retainedRecords: ['Key Fact Statement retained under RBI Master Directions.'],
    });
  }

  // 8. Historical Nudges (40 records)
  const nudges: Nudge[] = [];
  for (let i = 1; i <= 40; i++) {
    const cust = customers[i % customers.length];
    nudges.push({
      id: `nudge-hist-${i}`,
      customerId: cust.id,
      ruleId: i % 2 === 0 ? 'nudge-pre-summer' : 'nudge-heatwave',
      title: i % 2 === 0 ? 'nudge_pre_summer_title' : 'nudge_heatwave_title',
      body: 'nudge_service_availability_body',
      sentAt: new Date(Date.now() - (40 - i) * 43200000).toISOString(),
      opened: rand() > 0.4,
      holdout: i % 10 === 0,
    });
  }

  // 9. Event log seed
  const eventLog: EventLogRecord[] = [
    {
      id: 'evt-init',
      time: '2026-03-15T08:00:00.000Z',
      actor: 'SYSTEM',
      type: 'SEED_INITIALIZED',
      payload: { message: 'UC Clarity simulation state initialized with seeded data' },
    },
  ];

  // 10. Synthetic Survey Responses (clearly labeled synthetic data for Ops)
  const surveyResponses: SurveyResponse[] = [
    {
      id: 'srvy-seed-1',
      customerId: 'cust-riya',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      answers: [
        {
          appliance: 'AC',
          ageBand: 'OVER_8',
          issues: ['HIGH_BILL', 'NOT_WORKING'],
          replaceInterest: 'YES',
        },
        {
          appliance: 'PURIFIER',
          ageBand: '1_TO_3',
          issues: ['NONE'],
          replaceInterest: 'NO',
        },
      ],
      timestamp: '2026-03-10T14:30:00Z',
      source: 'exit',
    },
    {
      id: 'srvy-seed-2',
      customerId: 'cust-arjun',
      city: 'Pune',
      zoneId: 'zone-pune-wakad',
      answers: [
        {
          appliance: 'FRIDGE',
          ageBand: '5_TO_8',
          issues: ['NOISY'],
          replaceInterest: 'YES',
        },
      ],
      timestamp: '2026-03-11T16:00:00Z',
      source: 'exit',
    },
    {
      id: 'srvy-seed-3',
      customerId: 'cust-3',
      city: 'Delhi',
      zoneId: 'zone-delhi-dwarka',
      answers: [
        {
          appliance: 'WASHER',
          ageBand: '5_TO_8',
          issues: ['FREQUENT_REPAIR'],
          replaceInterest: 'MAYBE',
        },
      ],
      timestamp: '2026-03-12T10:15:00Z',
      source: 'exit',
    },
    {
      id: 'srvy-seed-4',
      customerId: 'cust-4',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-whitefield',
      answers: [
        {
          appliance: 'PURIFIER',
          ageBand: '3_TO_5',
          issues: ['NOT_WORKING'],
          replaceInterest: 'YES',
        },
      ],
      timestamp: '2026-03-12T11:45:00Z',
      source: 'exit',
    },
    {
      id: 'srvy-seed-5',
      customerId: 'cust-5',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-salt-lake',
      answers: [
        {
          appliance: 'GEYSER',
          ageBand: 'OVER_8',
          issues: ['HIGH_BILL'],
          replaceInterest: 'YES',
        },
      ],
      timestamp: '2026-03-13T09:20:00Z',
      source: 'exit',
    },
  ];

  // 11. Synthetic Sales Leads derived from survey responses
  const salesLeads: SalesLead[] = [
    {
      id: 'lead-seed-1',
      appliance: 'AC',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-andheri',
      customerId: 'cust-riya',
      priority: 'HIGH',
      priorityScore: 8,
      createdAt: '2026-03-10T14:31:00Z',
      surveyResponseId: 'srvy-seed-1',
      ageYearsBand: 'over 8 yrs',
      issue: 'Frequent breakdown, noisy',
      replacementInterest: 'yes',
    },
    {
      id: 'lead-seed-2',
      appliance: 'FRIDGE',
      city: 'Pune',
      zoneId: 'zone-pune-wakad',
      customerId: 'cust-arjun',
      priority: 'HIGH',
      priorityScore: 7,
      createdAt: '2026-03-11T16:01:00Z',
      surveyResponseId: 'srvy-seed-2',
      ageYearsBand: '5 to 8 yrs',
      issue: 'Cooling issues, high bill',
      replacementInterest: 'yes',
    },
    {
      id: 'lead-seed-3',
      appliance: 'WASHER',
      city: 'Delhi',
      zoneId: 'zone-delhi-dwarka',
      customerId: 'cust-3',
      priority: 'HIGH',
      priorityScore: 5,
      createdAt: '2026-03-12T10:16:00Z',
      surveyResponseId: 'srvy-seed-3',
      ageYearsBand: '5 to 8 yrs',
      issue: 'Vibration, noisy',
      replacementInterest: 'maybe',
    },
    {
      id: 'lead-seed-4',
      appliance: 'PURIFIER',
      city: 'Bengaluru',
      zoneId: 'zone-bengaluru-whitefield',
      customerId: 'cust-4',
      priority: 'HIGH',
      priorityScore: 6,
      createdAt: '2026-03-12T11:46:00Z',
      surveyResponseId: 'srvy-seed-4',
      ageYearsBand: '3 to 5 yrs',
      issue: 'Filter choke, bad taste',
      replacementInterest: 'yes',
    },
    {
      id: 'lead-seed-5',
      appliance: 'GEYSER',
      city: 'Kolkata',
      zoneId: 'zone-kolkata-salt-lake',
      customerId: 'cust-5',
      priority: 'HIGH',
      priorityScore: 8,
      createdAt: '2026-03-13T09:21:00Z',
      surveyResponseId: 'srvy-seed-5',
      ageYearsBand: 'over 8 yrs',
      issue: 'Water leakage, tripping',
      replacementInterest: 'yes',
    },
    {
      id: 'lead-seed-6',
      appliance: 'AC',
      city: 'Mumbai',
      zoneId: 'zone-mumbai-bandra',
      customerId: 'cust-6',
      priority: 'MEDIUM',
      priorityScore: 4,
      createdAt: '2026-03-13T12:00:00Z',
      ageYearsBand: '3 to 5 yrs',
      issue: 'Minor gas leak',
      replacementInterest: 'maybe',
    },
    {
      id: 'lead-seed-7',
      appliance: 'PURIFIER',
      city: 'Delhi',
      zoneId: 'zone-delhi-rohini',
      customerId: 'cust-7',
      priority: 'MEDIUM',
      priorityScore: 3,
      createdAt: '2026-03-14T15:00:00Z',
      ageYearsBand: '1 to 3 yrs',
      issue: 'High bill',
      replacementInterest: 'maybe',
    },
  ];

  return {
    zones,
    customers,
    professionals,
    serviceRequests,
    loanApplications,
    directOrders,
    deletionRequests,
    nudges,
    outcomes,
    eventLog,
    surveyResponses,
    salesLeads,
  };
}
