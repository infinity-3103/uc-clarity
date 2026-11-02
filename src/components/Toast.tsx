import React, { useEffect } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs border border-slate-700 animate-in slide-in-from-bottom-2 duration-150"
    >
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
        )}
        <span className="font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notice"
        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
