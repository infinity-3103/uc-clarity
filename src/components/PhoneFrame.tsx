import React from 'react';
import { MobileNotificationBanner } from './MobileNotificationBanner';
import { useT, LANGUAGE_OPTIONS } from '../i18n';

interface PhoneFrameProps {
  title?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ title, children, headerRight }) => {
  const { t, currentLanguage, setLanguage, fontClass } = useT();

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* 390px x 844px Mobile Phone Mockup */}
      <div className="relative w-[390px] h-[844px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-800 flex flex-col overflow-hidden ring-1 ring-slate-900/10">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-50 flex items-center justify-end px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700/80 mr-1" />
          <div className="w-2 h-2 rounded-full bg-blue-900/40" />
        </div>

        {/* Heads-up mobile push notification banner from top */}
        {title === 'Urban Company' && <MobileNotificationBanner isEmbedded={true} />}

        {/* Persistent Watermark Banner */}
        <div className="pt-7 pb-1 px-4 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-[11px] font-medium text-amber-900 select-none z-40">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {t('prototype_watermark')}
          </span>
          {headerRight || <span className="text-[10px] text-amber-700">{t('academic_demo')}</span>}
        </div>

        {/* Viewport Header with Synced Language Switcher */}
        {title && (
          <div className="px-4 py-2 bg-slate-900 text-white flex items-center justify-between z-30 shadow-sm">
            <h2 className={`text-sm font-semibold tracking-wide truncate ${fontClass}`}>{title}</h2>

            <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all ${
                    currentLanguage === opt.code
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={opt.label}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Viewport Screen */}
        <div className={`flex-1 overflow-y-auto bg-slate-50 relative flex flex-col ${fontClass}`}>
          {children}
        </div>

        {/* Mobile Home Bar */}
        <div className="h-5 bg-white flex items-center justify-center z-40">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>
    </div>
  );
};
