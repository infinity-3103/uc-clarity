import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Building2 } from 'lucide-react';
import { useT } from '../i18n';

interface AAConsentModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onConsentSuccess: () => void;
  onDeclineToRepair: () => void;
}

export const AAConsentModal: React.FC<AAConsentModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onConsentSuccess,
  onDeclineToRepair,
}) => {
  const { t } = useT();
  const customer = useStore((state) => state.customers.find((c) => c.id === customerId));
  const updateCustomerConsent = useStore((state) => state.updateCustomerConsent);

  const [declinedView, setDeclinedView] = useState<boolean>(false);

  if (!isOpen || !customer) return null;

  const hasCreditConsent = customer.consents.find((c) => c.purpose === 'CREDIT_ASSESSMENT')?.granted || false;
  const hasBankSharing = customer.consents.find((c) => c.purpose === 'BANK_SHARING')?.granted || false;
  const canProceed = hasCreditConsent && hasBankSharing;

  const handleToggleCredit = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCustomerConsent(customerId, 'CREDIT_ASSESSMENT', e.target.checked);
  };

  const handleToggleBank = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCustomerConsent(customerId, 'BANK_SHARING', e.target.checked);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-sm">{t('aa_modal_title')}</h3>
              <p className="text-[11px] text-amber-400">{t('aa_modal_subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Decline Fallback View */}
        {declinedView ? (
          <div className="p-5 space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <span className="font-semibold block">{t('no_pressure_title')}</span>
              <p className="text-[11px] leading-relaxed">
                {t('aa_declined_notice')}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onDeclineToRepair}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-center"
              >
                {t('proceed_repair_option')}
              </button>
              <button
                type="button"
                onClick={() => setDeclinedView(false)}
                className="w-full py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium rounded-xl text-center"
              >
                {t('back_consent_options')}
              </button>
            </div>
          </div>
        ) : (
          /* Main AA Consent View */
          <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
            <p className="text-slate-600 leading-relaxed">
              {t('aa_explainer')}
            </p>

            {/* Structured Disclosures */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
              <div>
                <strong className="text-slate-900 block font-medium">{t('aa_q1')}</strong>
                <span className="text-slate-600">{t('aa_a1')}</span>
              </div>
              <div>
                <strong className="text-slate-900 block font-medium">{t('aa_q2')}</strong>
                <span className="text-slate-600">{t('aa_a2')}</span>
              </div>
              <div>
                <strong className="text-slate-900 block font-medium">{t('aa_q3')}</strong>
                <span className="text-slate-600">{t('aa_a3')}</span>
              </div>
              <div>
                <strong className="text-slate-900 block font-medium">{t('aa_q4')}</strong>
                <span className="text-slate-600">{t('aa_a4')}</span>
              </div>
            </div>

            {/* Mandatory Unbundled Toggles (Defaults OFF) */}
            <div className="space-y-2 pt-1">
              <label className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <span className="text-xs text-slate-800 font-medium">
                  {t('grant_credit_assessment_consent')}
                </span>
                <input
                  type="checkbox"
                  checked={hasCreditConsent}
                  onChange={handleToggleCredit}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </label>

              <label className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50">
                <span className="text-xs text-slate-800 font-medium">
                  {t('authorize_bank_sharing')}
                </span>
                <input
                  type="checkbox"
                  checked={hasBankSharing}
                  onChange={handleToggleBank}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={!canProceed}
                onClick={onConsentSuccess}
                className={`w-full py-2.5 rounded-xl font-medium text-xs transition-colors ${
                  canProceed
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {t('continue_to_kfs')}
              </button>

              <button
                type="button"
                onClick={() => setDeclinedView(true)}
                className="w-full py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                {t('prefer_not_share_statements')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
