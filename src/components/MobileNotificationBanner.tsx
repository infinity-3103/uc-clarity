import React, { useEffect, useState, useRef } from 'react';
import { useStore, PushNotificationPayload } from '../store/useStore';
import { useT } from '../i18n';
import { Bell, X } from 'lucide-react';

interface MobileNotificationBannerProps {
  // If embedded inside a PhoneFrame, isEmbedded is true
  isEmbedded?: boolean;
}

export const MobileNotificationBanner: React.FC<MobileNotificationBannerProps> = ({
  isEmbedded = false,
}) => {
  const activeNotification = useStore((state) => state.activePushNotification);
  const dismissPushNotification = useStore((state) => state.dismissPushNotification);
  const { t } = useT();

  const [visible, setVisible] = useState(false);
  const [currentPayload, setCurrentPayload] = useState<PushNotificationPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeNotification) {
      setCurrentPayload(activeNotification);
      // Trigger slide down
      const enterTimeout = setTimeout(() => {
        setVisible(true);
      }, 50);

      // Auto dismiss after 4.5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          dismissPushNotification();
        }, 400); // Wait for slide-up exit transition
      }, 4500);

      return () => {
        clearTimeout(enterTimeout);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      setVisible(false);
    }
  }, [activeNotification, dismissPushNotification]);

  if (!currentPayload && !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      dismissPushNotification();
    }, 350);
  };

  // Embedded inside PhoneFrame vs Global Desktop Floating Banner
  const containerClasses = isEmbedded
    ? `absolute top-11 inset-x-3 z-50 transition-all duration-400 ease-out transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95 pointer-events-none'
      }`
    : `fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[360px] max-w-[90vw] transition-all duration-400 ease-out transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-24 opacity-0 scale-95 pointer-events-none'
      }`;

  return (
    <div className={containerClasses}>
      <div
        onClick={handleDismiss}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-3 text-slate-800 cursor-pointer select-none ring-1 ring-black/5 hover:bg-white transition-all"
        style={{
          boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.25), 0 4px 12px -2px rgba(15, 23, 42, 0.1)',
        }}
      >
        {/* App Header Bar */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shadow-xs">
              UC
            </div>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {currentPayload?.appTitle || t('banner_app_title')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] font-medium text-slate-400">
              {currentPayload?.timestamp || t('banner_now')}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              title={t('banner_dismiss')}
              aria-label={t('banner_dismiss')}
              className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Notification Title & Body */}
        <div className="pt-2 space-y-0.5">
          <div className="flex items-start gap-1.5">
            <Bell className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {currentPayload?.title ? t(currentPayload.title, undefined, currentPayload.title) : ''}
            </h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed pl-5 line-clamp-2">
            {currentPayload?.body ? t(currentPayload.body, undefined, currentPayload.body) : ''}
          </p>
        </div>

        {/* Mobile Swipe-Up Pill Bar */}
        <div className="pt-2 flex justify-center">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};
