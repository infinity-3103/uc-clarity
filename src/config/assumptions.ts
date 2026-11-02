import { ApplianceType, MarketplaceProduct } from '../domain/types';

// Expected lifespan in years per appliance type (illustrative)
export const EXPECTED_LIFE: Record<ApplianceType, number> = {
  AC: 12,       // illustrative
  FRIDGE: 13,   // illustrative
  WASHER: 10,   // illustrative
  GEYSER: 8,    // illustrative
  PURIFIER: 8,  // illustrative
};

// Benchmark price for a new replacement unit in INR
export const NEW_PRICE: Record<ApplianceType, number> = {
  AC: 48500,       // sourced midpoint of Rs 42,000 to 55,000 for 1.5 ton 5-star inverter AC
  FRIDGE: 28000,   // illustrative double-door frost-free
  WASHER: 32000,   // illustrative 7kg front load
  GEYSER: 9000,    // illustrative 15L 5-star storage
  PURIFIER: 18999, // illustrative RO+UV advanced purifier
};

// Urban Company Native brand purifiers catalogue
export const NATIVE_PURIFIERS = [
  { name: 'Native M0', price: 11999 }, // sourced
  { name: 'Native M1', price: 14999 }, // illustrative
  { name: 'Native M2', price: 18999 }, // illustrative
  { name: 'Native M3', price: 25199 }, // sourced
];

// Rich Amazon-style catalog for direct purchase & replacement marketplace
export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-ac-voltas',
    name: 'Voltas 1.5 Ton 5-Star Adjustable Inverter AC',
    brand: 'Voltas',
    category: 'AC',
    price: 44990,
    mrp: 54990,
    rating: 4.8,
    reviewCount: 3412,
    inverter: true,
    starRating: 5,
    highlights: ['hl_cooling_capacity_1_5t', 'hl_copper_condenser_100', 'hl_adjustable_4in1', 'hl_anti_dust_filter'],
    badge: 'badge_amazon_choice',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_ac_1',
    imageType: 'ac',
  },
  {
    id: 'prod-ac-daikin',
    name: 'Daikin 1.5 Ton 5-Star PM 2.5 Filter Inverter AC',
    brand: 'Daikin',
    category: 'AC',
    price: 48500,
    mrp: 58990,
    rating: 4.9,
    reviewCount: 2890,
    inverter: true,
    starRating: 5,
    highlights: ['hl_triple_display_dew_clean', 'hl_pm_2_5_filter', 'hl_copper_heat_exchanger', 'hl_quiet_29db'],
    badge: 'badge_top_rated',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_ac_2',
    imageType: 'ac',
  },
  {
    id: 'prod-ac-lg',
    name: 'LG 1.5 Ton 4-Star AI Dual Inverter Split AC',
    brand: 'LG',
    category: 'AC',
    price: 39990,
    mrp: 49990,
    rating: 4.7,
    reviewCount: 1845,
    inverter: true,
    starRating: 4,
    highlights: ['hl_ai_dual_inverter', 'hl_ocean_black_protection', 'hl_super_convertible_6in1', 'hl_low_gas_detection'],
    badge: 'badge_value_pick',
    deliveryDays: 2,
    freeInstallation: true,
    warranty: 'warranty_ac_3',
    imageType: 'ac',
  },
  {
    id: 'prod-fridge-lg',
    name: 'LG 260L 3-Star Smart Inverter Double Door Refrigerator',
    brand: 'LG',
    category: 'FRIDGE',
    price: 27990,
    mrp: 34990,
    rating: 4.8,
    reviewCount: 4120,
    inverter: true,
    starRating: 3,
    highlights: ['hl_frost_free_tech', 'hl_smart_inverter_compressor', 'hl_multi_air_flow', 'hl_toughened_glass_shelves'],
    badge: 'badge_best_seller',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_fridge_1',
    imageType: 'fridge',
  },
  {
    id: 'prod-fridge-samsung',
    name: 'Samsung 324L 5-in-1 Convertible Inverter Refrigerator',
    brand: 'Samsung',
    category: 'FRIDGE',
    price: 33490,
    mrp: 41990,
    rating: 4.8,
    reviewCount: 2150,
    inverter: true,
    starRating: 3,
    highlights: ['hl_twin_cooling_plus', 'hl_digital_inverter_20yr', 'hl_5_modes_flexible', 'hl_stabilizer_free'],
    badge: 'badge_amazon_choice',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_fridge_2',
    imageType: 'fridge',
  },
  {
    id: 'prod-washer-ifb',
    name: 'IFB 7 Kg 5-Star AI Powered Front Load Washing Machine',
    brand: 'IFB',
    category: 'WASHER',
    price: 31990,
    mrp: 38990,
    rating: 4.8,
    reviewCount: 1980,
    inverter: true,
    starRating: 5,
    highlights: ['hl_aqua_energie_filter', 'hl_cradle_wash', 'hl_steam_wash', 'hl_active_color_protection'],
    badge: 'badge_best_seller',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_washer_1',
    imageType: 'washer',
  },
  {
    id: 'prod-washer-bosch',
    name: 'Bosch 8 Kg 5-Star EcoSilence Front Load Washing Machine',
    brand: 'Bosch',
    category: 'WASHER',
    price: 36490,
    mrp: 44990,
    rating: 4.9,
    reviewCount: 1670,
    inverter: true,
    starRating: 5,
    highlights: ['hl_ecosilence_drive', 'hl_anti_tangle_anti_vibration', 'hl_speedperfect_65_faster', 'hl_activewater_plus'],
    badge: 'badge_top_rated',
    deliveryDays: 2,
    freeInstallation: true,
    warranty: 'warranty_washer_2',
    imageType: 'washer',
  },
  {
    id: 'prod-purifier-native-m2',
    name: 'UC Native M2 Smart RO+UV+Copper Alkaline Purifier',
    brand: 'Urban Company Native',
    category: 'PURIFIER',
    price: 18999,
    mrp: 24999,
    rating: 4.9,
    reviewCount: 5420,
    inverter: false,
    starRating: 5,
    highlights: ['hl_filter_change_2_years', 'hl_tds_up_to_2000', 'hl_copper_alkaline_infusion', 'hl_preset_water_dispenser'],
    badge: 'badge_uc_flagship',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_native_purifier',
    imageType: 'purifier',
  },
  {
    id: 'prod-purifier-native-m1',
    name: 'UC Native M1 RO+UV Rapid Pure Water Purifier',
    brand: 'Urban Company Native',
    category: 'PURIFIER',
    price: 14999,
    mrp: 19999,
    rating: 4.8,
    reviewCount: 3210,
    inverter: false,
    starRating: 4,
    highlights: ['hl_2_year_filter_guarantee', 'hl_10_stage_filtration', 'hl_in_tank_uv_sterilization', 'hl_fast_15l_flow_rate'],
    badge: 'badge_best_seller',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_zero_service_cost',
    imageType: 'purifier',
  },
  {
    id: 'prod-purifier-kent',
    name: 'Kent Grand Plus RO+UV+UF+TDS Controller Purifier',
    brand: 'Kent',
    category: 'PURIFIER',
    price: 17490,
    mrp: 21000,
    rating: 4.7,
    reviewCount: 4890,
    inverter: false,
    starRating: 4,
    highlights: ['hl_mineral_ro_retained', 'hl_zero_water_wastage', 'hl_9l_storage_tank', 'hl_auto_flush_system'],
    badge: 'badge_amazon_choice',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_purifier_kent',
    imageType: 'purifier',
  },
  {
    id: 'prod-geyser-aosmith',
    name: 'AO Smith HSE-VAS-X-015 15L 5-Star Storage Water Heater',
    brand: 'AO Smith',
    category: 'GEYSER',
    price: 8999,
    mrp: 12500,
    rating: 4.8,
    reviewCount: 2890,
    inverter: false,
    starRating: 5,
    highlights: ['hl_blue_diamond_tank', 'hl_glass_coated_heating', 'hl_high_scale_resistance', 'hl_bee_5_star'],
    badge: 'badge_amazon_choice',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_geyser_ao',
    imageType: 'geyser',
  },
  {
    id: 'prod-geyser-racold',
    name: 'Racold Omnis Lux Plus 25L Smart WiFi Storage Geyser',
    brand: 'Racold',
    category: 'GEYSER',
    price: 13490,
    mrp: 17990,
    rating: 4.7,
    reviewCount: 1120,
    inverter: false,
    starRating: 5,
    highlights: ['hl_smart_wifi_app_control', 'hl_titanium_plus_enamel', 'hl_silver_ion_anti_bacterial', 'hl_auto_power_off_eco'],
    badge: 'badge_smart_pick',
    deliveryDays: 1,
    freeInstallation: true,
    warranty: 'warranty_geyser_racold',
    imageType: 'geyser',
  },
];

// Catalogue of representative faults and typical repair cost (INR)
export const FAULTS: Record<ApplianceType, Record<string, number>> = {
  AC: {
    'Fan motor': 1800,   // sourced range 1,200 to 2,500
    'Capacitor': 1200,   // illustrative
    'Gas refill': 2500,  // illustrative
    'PCB': 4500,         // illustrative
    'Compressor': 8000,  // sourced
    'Other': 2000,       // illustrative
  },
  FRIDGE: {
    'Compressor': 7500,  // illustrative
    'Thermostat': 1200,  // illustrative
    'Gas refill': 2800,  // illustrative
    'Evaporator': 4000,  // illustrative
    'Other': 1500,       // illustrative
  },
  WASHER: {
    'Motor': 4500,       // illustrative
    'Drain pump': 1800,  // illustrative
    'PCB': 5000,         // illustrative
    'Bearing': 3500,     // illustrative
    'Other': 1500,       // illustrative
  },
  GEYSER: {
    'Heating element': 1200, // illustrative
    'Thermostat': 800,       // illustrative
    'Tank': 4500,            // illustrative
    'Other': 900,            // illustrative
  },
  PURIFIER: {
    'Membrane': 2200,    // illustrative
    'Pump': 1800,        // illustrative
    'PCB': 1500,         // illustrative
    'Other': 1000,       // illustrative
  },
};

// Parts currently flagged as unavailable in market supply chain
export const PARTS_UNAVAILABLE: Record<ApplianceType, string[]> = {
  AC: ['PCB'],           // illustrative
  FRIDGE: [],            // illustrative
  WASHER: ['PCB'],       // illustrative
  GEYSER: [],            // illustrative
  PURIFIER: [],          // illustrative
};

// Base trade-in valuation by visual condition grade 1 to 5 (illustrative, AC reference)
export const TRADE_IN_BASE: Record<number, number> = {
  1: 500,
  2: 1000,
  3: 2000,
  4: 3000,
  5: 4500,
};

// Category factor applied to trade-in base valuation
export const TRADE_IN_FACTOR: Record<ApplianceType, number> = {
  AC: 1.0,       // illustrative
  FRIDGE: 0.8,   // illustrative
  WASHER: 0.7,   // illustrative
  GEYSER: 0.4,   // illustrative
  PURIFIER: 0.3, // illustrative
};

// Supported no-cost EMI tenors in months
export const EMI_TENORS = [3, 6, 9, 12];

// Service professional referral incentive percentage on completed sales
export const INCENTIVE_PCT = 0.03; // assumed, range 2% to 4%

// Urban Company channel margin percentage on sales
export const UC_MARGIN_PCT = 0.10; // assumed, range 8% to 12%

// Bank subvention cost percentage for no-cost EMI
export const SUBVENTION_PCT = 0.04; // assumed

// Baseline visit-to-sale conversion percentage
export const CONVERSION_PCT = 0.05; // assumed, range 3% to 8%

// Discount percentage off service fee for completing the exit survey
export const SURVEY_DISCOUNT_PCT = 0.10; // assumed, 10% of service fee just paid

// Cooldown period in months between survey discounts per customer
export const SURVEY_COOLDOWN_MONTHS = 6;

// Target consent rate for post-visit appliance exit survey
export const EXIT_SURVEY_TARGET_CONSENT = 0.40; // assumed

// First service discount for buyers purchasing via in-visit recommendation
export const BUYER_FIRST_SERVICE_DISCOUNT_PCT = 0.15; // illustrative

// Maximum marketing nudges allowed per customer per week
export const NUDGE_MAX_PER_WEEK = 2;

// Cooling-off period in days for Aarambh Bank loans
export const COOLING_OFF_DAYS = 1; // illustrative, to be confirmed with lender

// Base illustrative service booking fees
export const SERVICE_FEE: Record<ApplianceType, number> = {
  AC: 499,
  FRIDGE: 399,
  WASHER: 399,
  GEYSER: 299,
  PURIFIER: 349,
};

// Default simulated reference date
export const SIMULATED_TODAY = '2026-03-15';

// Shared demand and sales leads boost
export const LEAD_DEMAND_BOOST = 2; // +2 per open sales lead in zone & category


// Survey Lead Scoring weights
export const REPOSITION_MIN_GAP = 10; // Minimum demand gap required to suggest technician repositioning

export const LEAD_AGE_POINTS: Record<string, number> = {
  UNDER_1: 0,
  '1_TO_3': 0,
  '3_TO_5': 1,
  '5_TO_8': 2,
  OVER_8: 3,
};

export const LEAD_ISSUE_POINTS = 2; // +2 if any issue other than "no issues"

export const LEAD_INTEREST_POINTS: Record<string, number> = {
  YES: 3,
  MAYBE: 1,
  NO: 0,
};

export const LEAD_PRIORITY_THRESHOLDS = {
  HIGH: 5,
  MEDIUM: 3,
};
