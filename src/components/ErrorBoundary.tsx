import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';
import { t } from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (Boolean((import.meta as any).env?.DEV)) {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Fail silently
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = Boolean((import.meta as any).env?.DEV);

      return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {t('error_boundary_title')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('error_boundary_message')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                {t('error_boundary_reset')}
              </button>
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                {t('error_boundary_retry')}
              </button>
            </div>

            {isDev && this.state.error && (
              <details className="text-left mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-rose-800 font-mono">
                <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                  {t('error_boundary_details')}
                </summary>
                <div className="mt-2 whitespace-pre-wrap overflow-x-auto text-[11px] leading-tight">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
