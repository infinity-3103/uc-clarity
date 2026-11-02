import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useT } from '../i18n';
import { BankFeedbackTopic, BankFeedbackType } from '../domain/types';
import { ShieldAlert, MessageSquare, Star, CheckCircle2, X } from 'lucide-react';

interface BankFeedbackSheetProps {
  isOpen: boolean;
  customerId: string;
  loanId?: string;
  initialMode?: BankFeedbackType;
  onClose: () => void;
  onSuccess?: (ticketId: string) => void;
}

const TOPICS: { id: BankFeedbackTopic; labelKey: any }[] = [
  { id: 'LOAN_TERMS', labelKey: 'bank_topic_loan_terms' },
  { id: 'CHARGES', labelKey: 'bank_topic_charges' },
  { id: 'COOLING_OFF', labelKey: 'bank_topic_cooling_off' },
  { id: 'REPAYMENT', labelKey: 'bank_topic_repayment' },
  { id: 'SERVICE', labelKey: 'bank_topic_service' },
  { id: 'OTHER', labelKey: 'bank_topic_other' },
];

export const BankFeedbackSheet: React.FC<BankFeedbackSheetProps> = ({
  isOpen,
  customerId,
  loanId,
  initialMode = 'COMPLAINT',
  onClose,
  onSuccess,
}) => {
  const { t } = useT();
  const addBankFeedback = useStore((state) => state.addBankFeedback);

  const [mode, setMode] = useState<BankFeedbackType>(initialMode);
  const [topic, setTopic] = useState<BankFeedbackTopic>('LOAN_TERMS');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setMessage('');
      setTouched(false);
      setTicketId(null);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMessageValid = message.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isMessageValid) return;

    const newTicketId = addBankFeedback({
      customerId,
      loanId,
      type: mode,
      topic,
      rating: mode === 'FEEDBACK' ? rating : undefined,
      message: message.trim(),
    });

    setTicketId(newTicketId);
    if (onSuccess) {
      onSuccess(newTicketId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-sheet-title"
      className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
    >
      <div
        ref={sheetRef}
        className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[92%] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200 text-slate-900"
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                mode === 'COMPLAINT' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-700'
              }`}
            >
              {mode === 'COMPLAINT' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 id="bank-sheet-title" className="font-bold text-sm text-slate-900">
                {t('bank_feedback_title')}
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Aarambh Bank Regulatory Desk</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback sheet"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ticketId ? (
          /* Success Screen */
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-900">{t('bank_success_title')}</h4>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold text-sm text-purple-900 tracking-wide inline-block px-4">
                {ticketId}
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              {t('bank_success_next_steps')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[56px] py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              {t('btn_done')}
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Mode Toggle: Feedback vs Complaint */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 font-bold text-center">
              <button
                type="button"
                onClick={() => setMode('FEEDBACK')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  mode === 'FEEDBACK'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('bank_mode_feedback')}
              </button>
              <button
                type="button"
                onClick={() => setMode('COMPLAINT')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  mode === 'COMPLAINT'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('bank_mode_complaint')}
              </button>
            </div>

            {/* Topic Chips */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Topic:</label>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setTopic(tp.id)}
                    className={`py-1.5 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      topic === tp.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t(tp.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional 1 to 5 Star Rating for Feedback Mode */}
            {mode === 'FEEDBACK' && (
              <div className="space-y-1.5 bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                <label className="font-bold text-purple-950 block">{t('bank_rating_label')}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} star`}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-purple-900 ml-2">{rating} / 5</span>
                </div>
              </div>
            )}

            {/* Message Textarea */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {t('bank_message_label')}
              </label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onBlur={() => setTouched(true)}
                rows={4}
                placeholder={t('bank_message_placeholder')}
                className={`w-full p-3 border rounded-xl bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  touched && !isMessageValid
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-purple-200 focus:border-purple-600'
                }`}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>
                  {touched && !isMessageValid ? (
                    <span className="text-rose-600 font-medium">
                      {t('bank_message_min_length')}
                    </span>
                  ) : null}
                </span>
                <span className={`font-mono ${message.length >= 10 ? 'text-emerald-600 font-bold' : ''}`}>
                  {message.length} / 10 min
                </span>
              </div>
            </div>

            {/* Actions: Minimum 56px Tap Target */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[56px] py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="submit"
                disabled={!isMessageValid}
                className={`flex-1 min-h-[56px] py-3.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  isMessageValid
                    ? mode === 'COMPLAINT'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                }`}
              >
                {t('btn_submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
