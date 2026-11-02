import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { CustomerApp } from '../views/customer/CustomerApp';
import { ProfessionalApp } from '../views/professional/ProfessionalApp';
import { MarketplaceView } from '../views/marketplace/MarketplaceView';
import { SurveyForm } from '../components/SurveyForm';
import { useStore } from '../store/useStore';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';
import { mr } from '../i18n/mr';
import { kn } from '../i18n/kn';
import { fallbackLog, clearFallbackEvents } from '../i18n';
import { evaluateSurveyAnswerForLead } from '../domain/leads';
import { Language } from '../domain/types';

const ALLOWED_WORDS = new Set([
  // Brands and app names
  'urban', 'company', 'uc', 'native', 'clarity',
  // Appliance Brands
  'voltas', 'lg', 'daikin', 'samsung', 'whirlpool', 'ifb', 'bosch', 'havells', 'ao', 'smith', 'kent', 'aquaguard', 'racold',
  // Currency, Payments and Formats
  'rs', 'inr', 'upi', 'pdf', 'emi', 'pan', 'aa',
  // Units and specs
  'kg', 'ton', 'tons', 'bee', 'star', 'stars', 'ro', 'uv', 'uf', 'tds', 'inverter', 'wifi', 'iot', 'ppm',
  // Partner / Person names (seed data)
  'mahesh', 'surve', 'imran', 'khan', 'suresh', 'kumar', 'sanjay', 'verma', 'sheikh',
  'riya', 'mehta', 'arjun', 'aarav', 'ananya', 'rohan', 'sneha', 'vikram', 'pooja', 'aditya', 'divya',
  'karan', 'neha', 'rahul', 'priya', 'amit', 'tanvi', 'manish', 'simran', 'deepa', 'gaurav', 'isha',
  'sharma', 'patel', 'deshmukh', 'mukherjee', 'nair', 'iyer', 'gupta', 'banerjee', 'rao',
  'reddy', 'singh', 'kulkarni', 'joshi', 'chopra', 'malhotra', 'bose',
  // Locations
  'bandra', 'andheri', 'powai', 'dadar', 'borivali', 'thane', 'mumbai',
  // Product model names in marketplace catalogue & fallback brands
  'standard', 'hse', 'vas', 'heater',
  'pure', 'copper', 'plus', 'frost', 'free', 'smart', 'direct', 'cool', 'cooling', 'front', 'load',
  'top', 'storage', 'instant', 'prime', 'elite', 'max', 'neo', 'care', 'ultra',
  'adjustable', 'capacity', 'condenser', 'triple', 'display', 'dew', 'clean', 'tech', 'built',
  'dual', 'split', 'black', 'protection', 'against', 'rust', 'double', 'door', 'refrigerator',
  'technology', 'convertible', 'twin', 'system', 'digital', 'with', 'warranty', 'powered',
  'washing', 'machine', 'aqua', 'energie', 'hard', 'water', 'filter', 'cradle', 'wash', 'for',
  'delicates', 'ecosilence', 'drive', 'frictionless', 'motor', 'anti', 'tangle', 'vibration',
  'design', 'year', 'life', 'litres', 'alkaline', 'purifier', 'needs', 'change', 'only', 'once',
  'years', 'rapid', 'guarantee', 'stage', 'advanced', 'filtration', 'grand', 'controller',
  'mineral', 'retained', 'minerals', 'zero', 'wastage', 'blue', 'diamond', 'glass', 'lined',
  'inner', 'tank', 'coated', 'incoloy', 'heating', 'element', 'omnis', 'lux', 'geyser',
  'app', 'control', 'schedule', 'titanium', 'enamel', 'coating',
]);

function getDomTextWithoutSvg(node: Node): string {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.tagName.toLowerCase() === 'svg' || el.closest('svg')) {
      return '';
    }
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  let text = '';
  for (const child of Array.from(node.childNodes)) {
    text += ' ' + getDomTextWithoutSvg(child) + ' ';
  }
  return text;
}

function extractLatinWords(container: HTMLElement): string[] {
  // Extract all text content excluding vector SVG diagrams
  const text = getDomTextWithoutSvg(container);
  // Match words of 3 or more letters
  const matches = text.match(/[A-Za-z]{3,}/g) || [];
  const unauthorized: string[] = [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (!ALLOWED_WORDS.has(lower)) {
      unauthorized.push(m);
    }
  }
  return unauthorized;
}

describe('Localization & Multilingual Audit Suite', () => {
  beforeEach(() => {
    clearFallbackEvents();
  });

  // 1. Key Parity and Non-empty across en, hi, mr, kn
  it('guarantees 100% key parity across en, hi, mr, kn with no empty string values', () => {
    const enKeys = Object.keys(en);
    const hiKeys = Object.keys(hi);
    const mrKeys = Object.keys(mr);
    const knKeys = Object.keys(kn);

    expect(hiKeys.length).toBe(enKeys.length);
    expect(mrKeys.length).toBe(enKeys.length);
    expect(knKeys.length).toBe(enKeys.length);

    for (const key of enKeys) {
      expect(hi).toHaveProperty(key);
      expect((hi as Record<string, string>)[key]).toBeTruthy();
      expect(typeof (hi as Record<string, string>)[key]).toBe('string');
      expect((hi as Record<string, string>)[key].trim().length).toBeGreaterThan(0);

      expect(mr).toHaveProperty(key);
      expect((mr as Record<string, string>)[key]).toBeTruthy();
      expect(typeof (mr as Record<string, string>)[key]).toBe('string');
      expect((mr as Record<string, string>)[key].trim().length).toBeGreaterThan(0);

      expect(kn).toHaveProperty(key);
      expect((kn as Record<string, string>)[key]).toBeTruthy();
      expect(typeof (kn as Record<string, string>)[key]).toBe('string');
      expect((kn as Record<string, string>)[key].trim().length).toBeGreaterThan(0);
    }
  });

  // 2. Survey submission consistency across all languages
  it('submitting identical survey answers in en, hi, mr, kn produces identical SalesLead records and priority scores', () => {
    const surveyInput = {
      appliance: 'AC' as const,
      ageBand: 'OVER_8' as const,
      issues: ['NOT_WORKING' as const, 'HIGH_BILL' as const],
      replaceInterest: 'YES' as const,
    };

    const leadEn = evaluateSurveyAnswerForLead(surveyInput, 'cust-1', 'Mumbai', 'zone-mumbai-andheri', 'srvy-en');
    const leadHi = evaluateSurveyAnswerForLead(surveyInput, 'cust-1', 'Mumbai', 'zone-mumbai-andheri', 'srvy-hi');
    const leadMr = evaluateSurveyAnswerForLead(surveyInput, 'cust-1', 'Mumbai', 'zone-mumbai-andheri', 'srvy-mr');
    const leadKn = evaluateSurveyAnswerForLead(surveyInput, 'cust-1', 'Mumbai', 'zone-mumbai-andheri', 'srvy-kn');

    expect(leadEn).not.toBeNull();
    expect(leadHi).not.toBeNull();
    expect(leadMr).not.toBeNull();
    expect(leadKn).not.toBeNull();

    // Priority scores and priorities are strictly identical
    expect(leadHi?.priorityScore).toBe(leadEn?.priorityScore);
    expect(leadMr?.priorityScore).toBe(leadEn?.priorityScore);
    expect(leadKn?.priorityScore).toBe(leadEn?.priorityScore);

    expect(leadHi?.priority).toBe(leadEn?.priority);
    expect(leadMr?.priority).toBe(leadEn?.priority);
    expect(leadKn?.priority).toBe(leadEn?.priority);

    expect(leadHi?.appliance).toBe(leadEn?.appliance);
    expect(leadMr?.appliance).toBe(leadEn?.appliance);
    expect(leadKn?.appliance).toBe(leadEn?.appliance);
  });

  // 3. Render checks for CustomerApp, ProfessionalApp, MarketplaceView, SurveyForm in hi, mr, kn
  const targetLanguages: Language[] = ['hi', 'mr', 'kn'];

  targetLanguages.forEach((lang) => {
    it(`renders CustomerApp in ${lang} with zero missing fallback events and no disallowed Latin tokens`, () => {
      useStore.getState().setLanguage(lang);
      clearFallbackEvents();

      const { container, unmount } = render(<CustomerApp />);
      const unauthorized = extractLatinWords(container);

      expect(fallbackLog.length).toBe(0);
      expect(unauthorized).toEqual([]);
      unmount();
    });

    it(`renders ProfessionalApp in ${lang} with zero missing fallback events and no disallowed Latin tokens`, () => {
      useStore.getState().setLanguage(lang);
      clearFallbackEvents();

      const { container, unmount } = render(<ProfessionalApp />);
      const unauthorized = extractLatinWords(container);

      expect(fallbackLog.length).toBe(0);
      expect(unauthorized).toEqual([]);
      unmount();
    });

    it(`renders MarketplaceView in ${lang} with zero missing fallback events and no disallowed Latin tokens`, () => {
      useStore.getState().setLanguage(lang);
      clearFallbackEvents();

      const { container, unmount } = render(<MarketplaceView />);
      const unauthorized = extractLatinWords(container);

      expect(fallbackLog.length).toBe(0);
      expect(unauthorized).toEqual([]);
      unmount();
    });

    it(`renders SurveyForm in ${lang} with zero missing fallback events and no disallowed Latin tokens`, () => {
      useStore.getState().setLanguage(lang);
      clearFallbackEvents();

      const { container, unmount } = render(
        <SurveyForm
          customerId="cust-riya"
          city="Mumbai"
          zoneId="zone-mumbai-andheri"
          source="checkout"
          onComplete={() => {}}
        />
      );
      const unauthorized = extractLatinWords(container);

      expect(fallbackLog.length).toBe(0);
      expect(unauthorized).toEqual([]);
      unmount();
    });
  });
});
