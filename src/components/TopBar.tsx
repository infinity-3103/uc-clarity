import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Smartphone,
  Wrench,
  BarChart3,
  Columns,
  RotateCcw,
  SlidersHorizontal,
  ShoppingBag,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const currentRole = useStore((state) => state.currentRole);
  const setRole = useStore((state) => state.setRole);
  const resetDemo = useStore((state) => state.resetDemo);
  const toggleSimPanel = useStore((state) => state.toggleSimPanel);

  const tabs = [
    { id: 'customer', label: 'Customer', icon: Smartphone },
    { id: 'professional', label: 'Professional', icon: Wrench },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'ops', label: 'UC Operations', icon: BarChart3 },
    { id: 'split', label: 'Split view', icon: Columns },
  ] as const;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Prototype Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
            UC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">UC Clarity</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                prototype
              </span>
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Prototype: simulated data
            </div>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <nav className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentRole === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRole(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            title="Simulation Parameters (Date, City, Temp)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulation panel</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 text-xs font-medium transition-all"
            title="Reset to Seeded Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset demo</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Demo"
        message="Reset demo state back to seeded initial data?"
        confirmLabel="Reset Demo"
        onConfirm={() => {
          resetDemo();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </header>
  );
};
