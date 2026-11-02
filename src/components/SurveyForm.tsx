import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useT, applianceLabel } from '../i18n';
import { ApplianceType, City, SurveyAgeBand, SurveyAnswerItem, SurveyIssue, SurveyReplaceInterest } from '../domain/types';
import { CHECKOUT_SURVEY_DISCOUNT_PCT } from '../config/assumptions';
import { Wind, Snowflake, WashingMachine, Flame, Droplets, CheckCircle2, ChevronRight, Tag } from 'lucide-react';

interface SurveyFormProps {
  customerId: string;
  city: City;
  zoneId: string;
  source: 'checkout' | 'exit';
  onComplete: (discountPct: number) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

const APPLIANCE_METADATA: { type: ApplianceType; labelKey: any; icon: React.FC<{ className?: string }> }[] = [
  { type: 'AC', labelKey: 'app_ac', icon: Wind },
  { type: 'FRIDGE', labelKey: 'app_fridge', icon: Snowflake },
  { type: 'WASHER', labelKey: 'app_washer', icon: WashingMachine },
  { type: 'GEYSER', labelKey: 'app_geyser', icon: Flame },
  { type: 'PURIFIER', labelKey: 'app_purifier', icon: Droplets },
];

const AGE_OPTIONS = [
  { band: 'UNDER_1', key: 'age_under_1' },
  { band: '1_TO_3', key: 'age_1_to_3' },
  { band: '3_TO_5', key: 'age_3_to_5' },
  { band: '5_TO_8', key: 'age_5_to_8' },
  { band: 'OVER_8', key: 'age_over_8' },
] as const;

const ISSUE_OPTIONS = [
  { issue: 'NONE', key: 'issue_none' },
  { issue: 'NOT_WORKING', key: 'issue_not_working' },
  { issue: 'NOISY', key: 'issue_noisy' },
  { issue: 'HIGH_BILL', key: 'issue_high_bill' },
  { issue: 'FREQUENT_REPAIR', key: 'issue_frequent_repair' },
] as const;

const INTEREST_OPTIONS = [
  { val: 'YES', key: 'interest_yes' },
  { val: 'MAYBE', key: 'interest_maybe' },
  { val: 'NO', key: 'interest_no' },
] as const;

export const SurveyForm: React.FC<SurveyFormProps> = ({
  customerId,
  city,
  zoneId,
  source,
  onComplete,
  onCancel,
  title,
  description,
}) => {
  const { t } = useT();
  const submitSurveyResponse = useStore((state) => state.submitSurveyResponse);

  const [selectedAppliances, setSelectedAppliances] = useState<ApplianceType[]>(['AC']);
  const [activeAppliance, setActiveAppliance] = useState<ApplianceType>('AC');

  // Per appliance answers
  const [answersByAppliance, setAnswersByAppliance] = useState<
    Record<
      ApplianceType,
      {
        ageBand: SurveyAgeBand;
        issues: SurveyIssue[];
        replaceInterest: SurveyReplaceInterest;
      }
    >
  >({
    AC: { ageBand: '3_TO_5', issues: ['NONE'], replaceInterest: 'MAYBE' },
    FRIDGE: { ageBand: '3_TO_5', issues: ['NONE'], replaceInterest: 'NO' },
    WASHER: { ageBand: '1_TO_3', issues: ['NONE'], replaceInterest: 'NO' },
    GEYSER: { ageBand: '3_TO_5', issues: ['NONE'], replaceInterest: 'NO' },
    PURIFIER: { ageBand: '1_TO_3', issues: ['NONE'], replaceInterest: 'NO' },
  });

  const toggleAppliance = (app: ApplianceType) => {
    setSelectedAppliances((prev) => {
      if (prev.includes(app)) {
        if (prev.length === 1) return prev; // Keep at least one
        const updated = prev.filter((a) => a !== app);
        if (activeAppliance === app) {
          setActiveAppliance(updated[0]);
        }
        return updated;
      } else {
        setActiveAppliance(app);
        return [...prev, app];
      }
    });
  };

  const updateCurrentAge = (ageBand: SurveyAgeBand) => {
    setAnswersByAppliance((prev) => ({
      ...prev,
      [activeAppliance]: { ...prev[activeAppliance], ageBand },
    }));
  };

  const toggleIssue = (issue: SurveyIssue) => {
    setAnswersByAppliance((prev) => {
      const current = prev[activeAppliance];
      let newIssues: SurveyIssue[];

      if (issue === 'NONE') {
        newIssues = ['NONE'];
      } else {
        const withoutNone = current.issues.filter((i) => i !== 'NONE');
        if (withoutNone.includes(issue)) {
          newIssues = withoutNone.filter((i) => i !== issue);
          if (newIssues.length === 0) newIssues = ['NONE'];
        } else {
          newIssues = [...withoutNone, issue];
        }
      }

      return {
        ...prev,
        [activeAppliance]: { ...current, issues: newIssues },
      };
    });
  };

  const updateReplaceInterest = (replaceInterest: SurveyReplaceInterest) => {
    setAnswersByAppliance((prev) => ({
      ...prev,
      [activeAppliance]: { ...prev[activeAppliance], replaceInterest },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedAnswers: SurveyAnswerItem[] = selectedAppliances.map((app) => ({
      appliance: app,
      ageBand: answersByAppliance[app].ageBand,
      issues: answersByAppliance[app].issues,
      replaceInterest: answersByAppliance[app].replaceInterest,
    }));

    submitSurveyResponse({
      customerId,
      city,
      zoneId,
      answers: formattedAnswers,
      source,
    });

    onComplete(CHECKOUT_SURVEY_DISCOUNT_PCT);
  };

  const currentConfig = answersByAppliance[activeAppliance];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm max-w-md w-full mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
          <Tag className="w-3.5 h-3.5" />
          <span>{t('survey_discount_applied')}</span>
        </div>
        <h3 className="font-bold text-base text-slate-900">
          {title || t('survey_title')}
        </h3>
        <p className="text-xs text-slate-500">
          {description || t('survey_offer_desc')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Question A: Appliances owned at home */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            1. {t('q_appliances_owned')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {APPLIANCE_METADATA.map((app) => {
              const Icon = app.icon;
              const isSelected = selectedAppliances.includes(app.type);
              const isActive = activeAppliance === app.type;

              return (
                <button
                  type="button"
                  key={app.type}
                  onClick={() => toggleAppliance(app.type)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[58px] ${
                    isSelected
                      ? isActive
                        ? 'border-purple-600 bg-purple-50/80 text-purple-900 ring-2 ring-purple-600/20'
                        : 'border-slate-300 bg-slate-50 text-slate-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">
                    {t(app.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Appliance Details Switcher */}
        {selectedAppliances.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-b border-slate-100">
            <span className="text-[11px] text-slate-500 shrink-0 font-medium">{t('survey_configure_label')}</span>
            {selectedAppliances.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => setActiveAppliance(app)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeAppliance === app
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {applianceLabel(app, t)}
              </button>
            ))}
          </div>
        )}

        {/* Question B: Age */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            2. {applianceLabel(activeAppliance, t)} - {t('q_appliance_age')}
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {AGE_OPTIONS.map((item) => (
              <button
                key={item.band}
                type="button"
                onClick={() => updateCurrentAge(item.band)}
                className={`py-2 px-2 rounded-lg border text-center font-medium transition-all ${
                  currentConfig.ageBand === item.band
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Question C: Issues */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            3. {applianceLabel(activeAppliance, t)} - {t('q_appliance_issues')}
          </label>
          <div className="space-y-1.5 text-xs">
            {ISSUE_OPTIONS.map((item) => {
              const isChecked = currentConfig.issues.includes(item.issue);
              return (
                <button
                  key={item.issue}
                  type="button"
                  onClick={() => toggleIssue(item.issue)}
                  className={`w-full py-2 px-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isChecked
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>{t(item.key)}</span>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question D: Replacement Interest */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            4. {applianceLabel(activeAppliance, t)} - {t('q_replace_interest')}
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {INTEREST_OPTIONS.map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => updateReplaceInterest(item.val)}
                className={`py-2 px-1.5 rounded-lg border text-center font-medium transition-all ${
                  currentConfig.replaceInterest === item.val
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <span>{t('submit_survey')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              {t('skip_survey_btn')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
