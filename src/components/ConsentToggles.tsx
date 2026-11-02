import React from 'react';
import { useStore } from '../store/useStore';
import { ConsentPurpose } from '../domain/types';
import { CONSENT_PURPOSES } from '../domain/consent';
import { Shield } from 'lucide-react';
import { useT } from '../i18n';

interface ConsentTogglesProps {
  customerId: string;
  purposes?: ConsentPurpose[];
  compact?: boolean;
}

export const ConsentToggles: React.FC<ConsentTogglesProps> = ({
  customerId,
  purposes,
  compact = false,
}) => {
  const { t } = useT();
  const customer = useStore((state) => state.customers.find((c) => c.id === customerId));
  const updateCustomerConsent = useStore((state) => state.updateCustomerConsent);

  if (!customer) return null;

  const displayList = purposes
    ? CONSENT_PURPOSES.filter((p) => purposes.includes(p.purpose))
    : CONSENT_PURPOSES;

  const getConsentTitle = (purpose: ConsentPurpose, fallback: string) => {
    switch (purpose) {
      case 'DIAGNOSTICS': return t('consent_diag_title');
      case 'MARKETING': return t('consent_mkt_title');
      case 'CREDIT_ASSESSMENT': return t('consent_credit_title');
      case 'BANK_SHARING': return t('consent_bank_title');
      default: return fallback;
    }
  };

  const getConsentDesc = (purpose: ConsentPurpose, fallback: string) => {
    switch (purpose) {
      case 'DIAGNOSTICS': return t('consent_diag_desc');
      case 'MARKETING': return t('consent_mkt_desc');
      case 'CREDIT_ASSESSMENT': return t('consent_credit_desc');
      case 'BANK_SHARING': return t('consent_bank_desc');
      default: return fallback;
    }
  };

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
          <Shield className="w-4 h-4 text-purple-600" />
          <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
            {t('consent_screen_title')}
          </h4>
        </div>
      )}

      <div className="space-y-2.5">
        {displayList.map((item) => {
          const record = customer.consents.find((c) => c.purpose === item.purpose);
          const isGranted = record?.granted || false;

          return (
            <div
              key={item.purpose}
              className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="font-medium text-xs text-slate-900 block leading-tight">
                    {getConsentTitle(item.purpose, item.title)}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {getConsentDesc(item.purpose, item.description)}
                  </p>
                </div>

                {/* Unbundled Toggle Switch: Default OFF (Guardrail G7) */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isGranted}
                  data-testid={`consent-toggle-${item.purpose}`}
                  onClick={() => updateCustomerConsent(customerId, item.purpose, !isGranted)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 cursor-pointer ${
                    isGranted ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isGranted ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                <span>{t('consent_version_revocable')}</span>
                <span className={isGranted ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                  {isGranted ? t('consent_status_granted') : t('consent_status_off')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
