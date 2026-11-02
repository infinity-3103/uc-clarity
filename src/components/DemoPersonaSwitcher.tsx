import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, ShieldCheck, FileText, Check, MapPin, Sparkles, SlidersHorizontal, Wrench } from 'lucide-react';
import { PartnerDemoSelector } from './PartnerDemoSelector';

export const DemoPersonaSwitcher: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'partner'>('customer');
  const customers = useStore((state) => state.customers);
  const selectedCustomerId = useStore((state) => state.selectedCustomerId);
  const selectCustomer = useStore((state) => state.selectCustomer);
  const serviceRequests = useStore((state) => state.serviceRequests);
  const toggleSimPanel = useStore((state) => state.toggleSimPanel);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const activeReqs = serviceRequests.filter((r) => r.customerId === activeCustomer?.id);

  // Build persona list dynamically from store.customers
  const personas = customers.slice(0, 5).map((c) => {
    const isThin = !c.hasCreditHistory;
    const isSuperPrime = c.bureauScore && c.bureauScore >= 750;
    const isPrime = c.bureauScore && c.bureauScore >= 700 && c.bureauScore < 750;

    const tag = isThin
      ? 'Thin-File AA Path'
      : isSuperPrime
      ? 'Bureau Super-Prime'
      : isPrime
      ? 'Bureau Prime Path'
      : 'Bureau Standard';

    const desc = isThin
      ? c.id === 'cust-priya'
        ? 'First-time credit applicant. Evaluated through bank transaction cashflow and average balance.'
        : 'No credit bureau history. Requires RBI Account Aggregator (AA) consent for cashflow underwriting.'
      : isSuperPrime
      ? 'Super-prime credit history. Instant pre-approved loan sanctions up to 24-month tenors.'
      : isPrime
      ? 'Prime credit score. Directly opens Key Fact Statement (KFS) without bank statement review.'
      : 'Moderate bureau credit score. Eligible for standard 3 to 9-month Aarambh Bank tenors.';

    const color = isThin
      ? c.id === 'cust-priya'
        ? 'border-rose-300 bg-rose-50 text-rose-950'
        : 'border-amber-300 bg-amber-50 text-amber-950'
      : isSuperPrime
      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
      : isPrime
      ? 'border-purple-300 bg-purple-50 text-purple-950'
      : 'border-blue-300 bg-blue-50 text-blue-950';

    return {
      id: c.id,
      name: c.name,
      city: c.city,
      creditType: isThin ? 'THIN_FILE' : 'BUREAU',
      score: c.bureauScore || null,
      desc,
      tag,
      color,
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-5 space-y-4 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Demo Persona Selector</h3>
            <span className="text-[10px] text-amber-600 font-medium">Evaluation simulation control</span>
          </div>
        </div>

        <button
          onClick={toggleSimPanel}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1"
          title="Open Environmental Simulation Sliders"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sensors</span>
        </button>
      </div>

      {/* Switch between Customer Personas and Partner Demo Selector */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('customer')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'customer'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Customers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partner')}
          className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'partner'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Partners</span>
        </button>
      </div>

      {activeTab === 'partner' ? (
        <PartnerDemoSelector />
      ) : (
        <>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a simulated persona to test how the system dynamically handles different credit underwriting flows (Bureau vs Thin-File) and active service bookings.
          </p>

          {/* Persona Cards */}
          <div className="space-y-2.5">
        {personas.map((p) => {
          const isSelected = activeCustomer?.id === p.id;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => selectCustomer(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectCustomer(p.id);
                }
              }}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between space-y-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isSelected
                  ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {p.city}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-purple-700 mt-0.5">
                    {p.creditType === 'BUREAU' ? `Bureau Score: ${p.score}` : 'Thin-File (No Prior Score)'}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
                    {p.tag}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Active Persona Inspection Footer */}
      {activeCustomer && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Active Test Profile</span>
            <span className="text-purple-700">{activeCustomer.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div>
              <span className="text-slate-400 block">Underwriting Route:</span>
              <span className="font-semibold text-slate-800">
                {activeCustomer.hasCreditHistory ? 'Bureau Direct KFS' : 'Account Aggregator AA'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Registered Appliances:</span>
              <span className="font-semibold text-slate-800">
                {activeCustomer.appliances.length} Units in {activeCustomer.city}
              </span>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
