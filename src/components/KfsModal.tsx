import React, { useState } from 'react';
import { generateKFS } from '../domain/bank';
import { ShieldCheck, X } from 'lucide-react';
import { useT } from '../i18n';

interface KfsModalProps {
  productName: string;
  principal: number;
  tenorMonths: number;
  monthlyEMI: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const KfsModal: React.FC<KfsModalProps> = ({
  productName,
  principal,
  tenorMonths,
  monthlyEMI,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useT();
  // Guardrail G6: Checkbox must NOT be pre-ticked (checked: false by default)
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);

  if (!isOpen) return null;

  const kfs = generateKFS(productName, principal, tenorMonths, monthlyEMI);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-semibold text-sm">{t('kfs_modal_title')}</h3>
              <p className="text-[11px] text-amber-400">{t('kfs_statutory_disclosure')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('kfs_regulated_lender')}</span>
              <span className="font-semibold text-slate-900">{kfs.lenderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('kfs_lsp')}</span>
              <span className="text-slate-800 font-medium">{kfs.lspName}</span>
            </div>
          </div>

          <div className="space-y-2 border-y border-slate-100 py-2.5">
            <div className="flex justify-between">
              <span className="text-slate-600">{t('kfs_financed_item')}</span>
              <span className="font-medium text-slate-900">{kfs.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t('kfs_loan_principal')}</span>
              <span className="font-semibold text-slate-900">Rs {kfs.principal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t('kfs_tenor')}</span>
              <span className="font-medium text-slate-900">{t('kfs_tenor_installments', { tenor: kfs.tenorMonths })}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm bg-purple-50 p-2 rounded">
              <span>{t('kfs_monthly_emi')}</span>
              <span>Rs {kfs.monthlyEMI.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t('kfs_apr')}</span>
              <span className="font-medium text-emerald-700">{t('kfs_apr_zero_cost')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">{t('kfs_processing_fees')}</span>
              <span className="font-medium text-slate-900">{t('kfs_fees_zero')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-900">
              <span>{t('kfs_total_payable')}</span>
              <span>Rs {kfs.totalPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Statutory clauses */}
          <div className="space-y-1.5 text-[11px] text-slate-500">
            <p className="bg-amber-50 p-2 rounded border border-amber-200/60 text-amber-900">
              <strong className="font-semibold">{t('kfs_cooling_off')}</strong> {t('kfs_cooling_off_desc')}
            </p>
            <p>
              <strong className="font-medium text-slate-700">{t('kfs_data_sharing')}</strong> {t('kfs_data_sharing_desc')}
            </p>
            <p>
              <strong className="font-medium text-slate-700">{t('kfs_grievance')}</strong> {kfs.grievanceContact}
            </p>
          </div>

          {/* Acknowledgement Checkbox: Must NOT be pre-ticked (Guardrail G6) */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                data-testid="kfs-acknowledgement-checkbox"
                checked={isAcknowledged}
                onChange={(e) => setIsAcknowledged(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-snug">
                {t('kfs_ack_text')}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            data-testid="kfs-submit-button"
            disabled={!isAcknowledged}
            onClick={() => {
              if (isAcknowledged) {
                onConfirm();
              }
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors ${
              isAcknowledged
                ? 'bg-purple-600 hover:bg-purple-700 shadow-sm cursor-pointer'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {t('kfs_agree_submit')}
          </button>
        </div>
      </div>
    </div>
  );
};
