import { describe, it, expect } from 'vitest';
import { calculateUnitEconomics } from '../domain/economics';

describe('Unit Economics Module (Section 12, 17)', () => {
  it('Reproduces the exact 3% conversion row from Case 12 benchmark table', () => {
    // 3% conversion on 1,000 visits @ Rs 48,500
    const resUCBears = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.03,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: false,
    });

    expect(resUCBears.salesCount).toBe(30);
    expect(resUCBears.salesValue).toBe(1455000);
    expect(resUCBears.ucMargin).toBe(145500);
    expect(resUCBears.incentiveCost).toBe(43650);
    expect(resUCBears.subventionCost).toBe(58200);
    expect(resUCBears.netContribution).toBe(43650);

    const resBrandFunds = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.03,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: true,
    });
    expect(resBrandFunds.netContribution).toBe(101850);
  });

  it('Reproduces the exact 5% conversion row (default baseline)', () => {
    // 5% conversion on 1,000 visits @ Rs 48,500
    const resUCBears = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.05,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: false,
    });

    expect(resUCBears.salesCount).toBe(50);
    expect(resUCBears.salesValue).toBe(2425000);
    expect(resUCBears.ucMargin).toBe(242500);
    expect(resUCBears.incentiveCost).toBe(72750);
    expect(resUCBears.subventionCost).toBe(97000);
    expect(resUCBears.netContribution).toBe(72750);

    const resBrandFunds = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.05,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: true,
    });
    expect(resBrandFunds.netContribution).toBe(169750);
  });

  it('Reproduces the exact 8% conversion row', () => {
    // 8% conversion on 1,000 visits @ Rs 48,500
    const resUCBears = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.08,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: false,
    });

    expect(resUCBears.salesCount).toBe(80);
    expect(resUCBears.salesValue).toBe(3880000);
    expect(resUCBears.ucMargin).toBe(388000);
    expect(resUCBears.incentiveCost).toBe(116400);
    expect(resUCBears.subventionCost).toBe(155200);
    expect(resUCBears.netContribution).toBe(116400);

    const resBrandFunds = calculateUnitEconomics({
      eligibleVisits: 1000,
      conversionPct: 0.08,
      avgTicket: 48500,
      ucMarginPct: 0.10,
      incentivePct: 0.03,
      subventionPct: 0.04,
      brandFundsSubvention: true,
    });
    expect(resBrandFunds.netContribution).toBe(271600);
  });
});
