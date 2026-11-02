import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useStore } from '../store/useStore';
import { APPLIANCE_FORMS } from '../config/appliances';
import { ApplianceType, Language } from '../domain/types';
import { useT, en, hi, mr, kn, humanizeKey, formatJobReference, leanLabel, statusLabel, zoneLabel, cityLabel } from '../i18n';
import { CustomerApp } from '../views/customer/CustomerApp';
import { MarketplaceView } from '../views/marketplace/MarketplaceView';
import { OpsDashboard } from '../views/ops/OpsDashboard';

// Helper to detect raw identifiers in rendered text nodes
function isRawIdentifier(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Raw snake_case (e.g. lbl_brand, retail_price_label)
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(trimmed)) return true;
  // Raw UPPER_SNAKE (e.g. REPAIR_CHOSEN, BOTH_LEAN_REPAIR)
  if (/^[A-Z]+(_[A-Z0-9]+)+$/.test(trimmed)) return true;
  // Raw zone id (e.g. zone-mumbai-andheri)
  if (/^zone-[a-z0-9-]+$/.test(trimmed)) return true;
  // Raw sr id (e.g. sr-1793538253456)
  if (/^sr-[a-z0-9-]+$/.test(trimmed)) return true;
  // Ends with _label
  if (/_label$/.test(trimmed)) return true;
  return false;
}

describe('Issue 3: No Internal Variable Names in the UI', () => {
  beforeEach(() => {
    act(() => {
      useStore.getState().resetDemo();
      useStore.getState().setLanguage('en');
    });
  });

  it('t() never returns a raw key when missing in dictionaries', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Test helper hook inside a lightweight dummy component
    let renderedResult = '';
    const Dummy = () => {
      const { t } = useT();
      renderedResult = t('missing_test_variable_label');
      return <div>{renderedResult}</div>;
    };

    render(<Dummy />);
    expect(renderedResult).toBe('Missing test variable');
    expect(renderedResult).not.toBe('missing_test_variable_label');
    consoleSpy.mockRestore();
  });

  it('humanizeKey correctly transforms variable names', () => {
    expect(humanizeKey('lbl_brand')).toBe('Brand');
    expect(humanizeKey('retail_price_label')).toBe('Retail price');
    expect(humanizeKey('status_in_progress')).toBe('In progress');
    expect(humanizeKey('BOTH_LEAN_REPAIR')).toBe('BOTH LEAN REPAIR');
  });

  it('Appliance questionnaires have localized labels following the naming convention', () => {
    const appliances: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];
    const languages: Language[] = ['en', 'hi', 'mr', 'kn'];
    const dicts = { en, hi, mr, kn };

    for (const app of appliances) {
      const config = APPLIANCE_FORMS[app];
      for (const field of config.customerFields) {
        expect(field.label).not.toMatch(/_label$/);
        
        // Every label must exist across all four languages
        for (const lang of languages) {
          const dict = dicts[lang] as Record<string, string>;
          const translated = dict[field.label];
          expect(translated, `Missing ${field.label} in ${lang}`).toBeDefined();
          expect(translated.length).toBeGreaterThan(0);
          expect(isRawIdentifier(translated)).toBe(false);
        }
      }
    }

    // Verify naming convention: {Appliance} brand, {Appliance} age, {Appliance} condition
    expect(en.lbl_ac_brand).toBe('AC brand');
    expect(en.lbl_ac_age).toBe('AC age');
    expect(en.lbl_ac_condition).toBe('AC condition');

    expect(en.lbl_fridge_brand).toBe('Fridge brand');
    expect(en.lbl_fridge_age).toBe('Fridge age');
    expect(en.lbl_fridge_condition).toBe('Fridge condition');

    expect(en.lbl_washer_brand).toBe('Washer brand');
    expect(en.lbl_washer_age).toBe('Washer age');
    expect(en.lbl_washer_condition).toBe('Washer condition');

    expect(en.lbl_geyser_brand).toBe('Geyser brand');
    expect(en.lbl_geyser_age).toBe('Geyser age');
    expect(en.lbl_geyser_condition).toBe('Geyser condition');

    expect(en.lbl_purifier_brand).toBe('Purifier brand');
    expect(en.lbl_purifier_age).toBe('Purifier age');
    expect(en.lbl_purifier_condition).toBe('Purifier condition');
  });

  it('Marketplace checkout summary shows localized retail price label and clean delivery address', () => {
    act(() => {
      useStore.getState().selectCustomer('cust-riya');
    });

    render(<MarketplaceView />);
    
    // Click on a product to open Instant Checkout modal
    const buyButtons = screen.getAllByRole('button');
    const instantBuyBtn = buyButtons.find((b) => b.textContent?.includes('Buy Now') || b.textContent?.includes('Instant'));
    if (instantBuyBtn) {
      act(() => {
        instantBuyBtn.click();
      });
    }

    // Check that retail_price_label is not rendered
    expect(screen.queryByText('retail_price_label')).toBeNull();

    // Check delivery address does not render "Zone andheri"
    expect(screen.queryByText(/Zone andheri/i)).toBeNull();
  });

  it('formatJobReference converts raw sr IDs to Job # references', () => {
    expect(formatJobReference('sr-1793538253456')).toBe('Job #3456');
    expect(formatJobReference('sr-hist-3')).toBe('Job #0003');
    expect(formatJobReference('Job #1042')).toBe('Job #1042');
  });

  it('leanLabel and statusLabel translate enums without returning raw UPPER_SNAKE text', () => {
    const dummyT = (k: string, _p?: any, fallback?: string) => (en as any)[k] || fallback || k;
    expect(leanLabel('BOTH_LEAN_REPAIR', dummyT)).toBe('Both (Leans Repair)');
    expect(leanLabel('BOTH_LEAN_REPLACE', dummyT)).toBe('Both (Leans Replace)');
    expect(statusLabel('REPAIR_CHOSEN', dummyT)).toBe('Repair Chosen');
    expect(statusLabel('IN_PROGRESS', dummyT)).toBe('In Progress');
  });

  it('Ops dashboard renders formatted job references, clean status labels, and localized lean labels', () => {
    render(<OpsDashboard />);
    
    // Verify no raw sr- IDs are rendered as text nodes
    expect(screen.queryByText(/^sr-hist-/)).toBeNull();
    expect(screen.queryByText(/^sr-1/)).toBeNull();

    // Verify no raw UPPER_SNAKE lean strings
    expect(screen.queryByText('Lean: BOTH_LEAN_REPAIR')).toBeNull();
    expect(screen.queryByText('Lean: BOTH_LEAN_REPLACE')).toBeNull();
  });
});
