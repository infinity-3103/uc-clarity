import React, { useState } from 'react';
import { Recommendation, ApplianceType } from '../domain/types';
import { calculateEMI, calculateTradeInCredit, getLeanSummaryText } from '../domain/comparison';
import { EMI_TENORS } from '../config/assumptions';
import { ChevronDown, ChevronUp, Info, Wrench, ShoppingBag } from 'lucide-react';
import { useT, applianceLabel, faultLabel } from '../i18n';

interface ComparisonScreenProps {
  recommendation: Recommendation;
  applianceType: ApplianceType;
  brand: string;
  ageYears: number;
  likelyFault: string;
  isProfessionalView?: boolean;
  onSelectRepair?: () => void;
  onSelectReplace?: (tenor: number, tradeInCredit: number) => void;
  onSelectFullPayment?: (tradeInCredit: number) => void;
  onSelectDecideLater?: () => void;
}

function getLocalizedLeanSummary(lean: 'REPAIR' | 'BOTH_LEAN_REPAIR' | 'BOTH_LEAN_REPLACE' | 'REPLACE', t: (k: string) => string): string {
  switch (lean) {
    case 'REPAIR':
      return t('lean_repair');
    case 'BOTH_LEAN_REPAIR':
      return t('lean_both_repair');
    case 'BOTH_LEAN_REPLACE':
      return t('lean_both_replace');
    case 'REPLACE':
      return t('lean_replace');
  }
}

export const ComparisonScreen: React.FC<ComparisonScreenProps> = ({
  recommendation,
  applianceType,
  brand,
  ageYears,
  likelyFault,
  isProfessionalView = false,
  onSelectRepair,
  onSelectReplace,
  onSelectFullPayment,
  onSelectDecideLater,
}) => {
  const { t } = useT();
  const [paymentMode, setPaymentMode] = useState<'EMI' | 'FULL'>('EMI');
  const [selectedTenor, setSelectedTenor] = useState<number>(9);
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(false);

  const handleSelectEmi = () => setPaymentMode('EMI');
  const handleSelectFull = () => setPaymentMode('FULL');

  const tradeInCredit = calculateTradeInCredit(applianceType, 3);
  const emiCalc = calculateEMI(recommendation.newPrice, tradeInCredit, selectedTenor);

  const cardBaseClasses =
    'p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4';

  return (
    <div className="p-4 space-y-4 text-slate-800">
      {/* Header Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">
            {brand} {applianceLabel(applianceType, t)} {t('diagnostic_assessment_title')}
          </span>
          <span className="text-[11px] text-slate-500">{t('age_years_param', { n: ageYears })}</span>
        </div>
        <p className="text-slate-600">
          {t('inspection_fault_detected', { fault: faultLabel(likelyFault, t) })}
        </p>
        {isProfessionalView && (
          <div className="pt-1 mt-1 border-t border-slate-200 text-indigo-700 font-medium flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5" />
            <span>{t('read_only_verification')}</span>
          </div>
        )}
      </div>

      {/* Side-by-Side (or stacked on mobile) Comparison Cards: Equal styling & prominence (Guardrail G1 & G2) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Card 1: Repair */}
        <div data-testid="comparison-repair-card" className={cardBaseClasses}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">{t('repair_option')}</h3>
              </div>
              <span className="text-xs text-slate-500">{t('service_visit')}</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-2xl font-bold text-slate-900">
                Rs {recommendation.repairCost.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500 ml-1">{t('illustrative')}</span>
              </div>
              <p className="text-xs text-slate-600">
                {t('repair_description_param', { fault: faultLabel(likelyFault, t) })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{t('estimated_remaining_life')}</span>
                <span className="font-medium text-slate-800">
                  {t('years_estimate_param', { n: recommendation.expectedRemainingLifeYears })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('warranty_on_repaired_part')}</span>
                <span className="font-medium text-slate-800">{t('warranty_days_param', { n: 90 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Buy New Replacement (Full Payment or No-Cost EMI) */}
        <div data-testid="comparison-replace-card" className={cardBaseClasses}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">{t('buy_new_replacement')}</h3>
              </div>
              <span className="text-xs text-slate-500">
                {paymentMode === 'EMI' ? t('aarambh_bank_emi') : t('one_time_payment')}
              </span>
            </div>

            {/* Payment Choice Toggle: No-Cost EMI vs Full Payment */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={handleSelectEmi}
                className={`py-1.5 px-2 rounded-md transition-all ${
                  paymentMode === 'EMI'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('no_cost_emi_tab')}
              </button>
              <button
                type="button"
                onClick={handleSelectFull}
                className={`py-1.5 px-2 rounded-md transition-all ${
                  paymentMode === 'FULL'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('pay_in_full_tab')}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">{t('retail_price')}</span>
                <span className="text-xs text-slate-700">Rs {recommendation.newPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-baseline justify-between text-emerald-700">
                <span className="text-xs">{t('trade_in_credit_label')}</span>
                <span className="text-xs font-medium">-Rs {tradeInCredit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
                <span className="text-xs">{t('net_price')}</span>
                <span className="text-sm">Rs {emiCalc.netPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {paymentMode === 'EMI' ? (
              <>
                {/* Tenor Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs text-slate-600 font-medium block">{t('select_repayment_tenor')}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {EMI_TENORS.map((tenor) => (
                      <button
                        key={tenor}
                        type="button"
                        onClick={() => setSelectedTenor(tenor)}
                        className={`py-1 text-xs rounded border transition-colors ${
                          selectedTenor === tenor
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {t('months_short_param', { n: tenor })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{t('monthly_installment')}</span>
                    <span>{t('per_month_param', { amount: emiCalc.monthlyEMI.toLocaleString('en-IN') })}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] space-y-0.5">
                    <div>{t('interest_charged_note', { total: emiCalc.totalPayable.toLocaleString('en-IN') })}</div>
                    <div className="text-slate-500 italic">{t('interest_covered_note')}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{t('one_time_settlement')}</span>
                  <span>Rs {emiCalc.netPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <div>{t('full_pay_convenience_note')}</div>
                  <div className="text-slate-500 italic">{t('free_unboxing_note')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Energy Note for AC only */}
      {applianceType === 'AC' && (
        <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold block mb-0.5">{t('energy_efficiency_context')}</span>
          {t('ac_energy_note')}
        </div>
      )}

      {/* Scoring Engine Recommendation & Reasons (Neutral sentence) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">{t('why_we_suggest_this')}</span>
          <span className="text-[11px] text-slate-500">{t('score_param', { score: recommendation.score })}</span>
        </div>
        <p className="font-medium text-slate-800 leading-snug">
          {recommendation.headline === 'Based on appliance age and component condition, replacement offers superior long-term value.'
            ? t('reason_age_and_condition')
            : recommendation.headline
            ? t(recommendation.headline, undefined, getLocalizedLeanSummary(recommendation.lean, t))
            : getLocalizedLeanSummary(recommendation.lean, t)}
        </p>
        <ul className="space-y-1 text-slate-600 list-disc list-inside">
          {recommendation.reasons.map((r, idx) => {
            let rendered = r;
            if (r === 'Evaluated repair cost against standard life.') {
              rendered = t('reason_repair_cost_evaluated');
            } else {
              const diagMatch = r.match(/^Diagnostic check completed for (\w+)\.?$/);
              if (diagMatch) {
                rendered = t('reason_diagnostic_completed', { appliance: applianceLabel(diagMatch[1] as ApplianceType, t) });
              } else {
                rendered = t(r, undefined, r);
              }
            }
            return (
              <li key={idx} className="leading-tight">{rendered}</li>
            );
          })}
        </ul>
      </div>

      {/* Expandable Breakdown: How this was calculated */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
        <button
          type="button"
          onClick={() => setShowCalculationDetails(!showCalculationDetails)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium"
        >
          <span>{t('how_calculated_btn')}</span>
          {showCalculationDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCalculationDetails && recommendation.rulePoints && (
          <div className="p-3.5 space-y-2 border-t border-slate-200 bg-white">
            <p className="text-[11px] text-slate-500 mb-2">
              {t('rule_contribution_intro')}
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_age_points')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.agePoints })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_repair_ratio')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.repairRatioPoints })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_repeat_faults')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.repeatFaultPoints })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_energy_efficiency')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.efficiencyPoints })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_visual_condition')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.conditionPoints })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('rule_parts_availability')}</span>
                <span className="font-medium text-slate-900">{t('pts_param', { pts: recommendation.rulePoints.partsPoints })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5 mt-1">
                <span>{t('total_score_label')}</span>
                <span>{recommendation.score} / 100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: 3 Equal-weight buttons, no color bias (Guardrail G1) */}
      {!isProfessionalView && (
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onSelectRepair}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-sm transition-colors text-center"
          >
            {t('choose_repair')}
          </button>
          {paymentMode === 'EMI' ? (
            <button
              type="button"
              onClick={() => onSelectReplace?.(selectedTenor, tradeInCredit)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-sm transition-colors text-center"
            >
              {t('choose_replace_emi')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectFullPayment?.(tradeInCredit)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-sm transition-colors text-center"
            >
              {t('choose_replace_full')}
            </button>
          )}
          <button
            type="button"
            onClick={onSelectDecideLater}
            className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs rounded-xl transition-colors text-center"
          >
            {t('defer_decision')}
          </button>
        </div>
      )}
    </div>
  );
};
