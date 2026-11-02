import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { City } from '../domain/types';
import { planSalesDeployment } from '../domain/allocation';
import { useT, cityLabel, applianceLabel, zoneLabel } from '../i18n';
import { Briefcase, MapPin, Star, TrendingUp, Check } from 'lucide-react';

interface PartnerDemoSelectorProps {
  onPartnerSelect?: (proId: string) => void;
  compact?: boolean;
}

const CITIES: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];

export const PartnerDemoSelector: React.FC<PartnerDemoSelectorProps> = ({
  onPartnerSelect,
  compact = false,
}) => {
  const professionals = useStore((state) => state.professionals);
  const selectedProId = useStore((state) => state.selectedProfessionalId);
  const selectProfessional = useStore((state) => state.selectProfessional);
  const serviceRequests = useStore((state) => state.serviceRequests);
  const zones = useStore((state) => state.zones);
  const salesLeads = useStore((state) => state.salesLeads);
  const { t } = useT();

  const currentPro = professionals.find((p) => p.id === selectedProId) || professionals[0];
  const [activeCity, setActiveCity] = useState<City>(currentPro?.city || 'Mumbai');

  // Sync active city if selected professional changes from outside
  useEffect(() => {
    if (currentPro && currentPro.city !== activeCity) {
      setActiveCity(currentPro.city);
    }
  }, [selectedProId]);

  // Derived sales deployments
  const salesDeployments = planSalesDeployment(professionals, zones, salesLeads);

  // Filtered partners strictly by selected city
  const cityPros = professionals.filter((p) => p.city === activeCity);

  const handleSelect = (proId: string) => {
    selectProfessional(proId);
    if (onPartnerSelect) {
      onPartnerSelect(proId);
    }
  };

  return (
    <div className="space-y-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
      {/* Step 1: City Chips */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <MapPin className="w-3 h-3 text-purple-600" />
          <span>{t('select_city_chip')}</span>
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CITIES.map((city) => {
            const isSelected = activeCity === city;
            const proCount = professionals.filter((p) => p.city === city).length;

            return (
              <button
                key={city}
                type="button"
                onClick={() => setActiveCity(city)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cityLabel(city, t)}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                  {proCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Partners List Filtered by City */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1.5">
          <span>{t('select_partner_title')} {t('partners_in_city', { count: cityPros.length, city: cityLabel(activeCity, t) })}</span>
        </label>

        <div className={`space-y-1.5 overflow-y-auto ${compact ? 'max-h-48' : 'max-h-64'} pr-0.5`}>
          {cityPros.map((pro) => {
            const isSelected = pro.id === selectedProId;

            // Check if pro has an active job
            const hasActiveJob = serviceRequests.some(
              (r) => r.professionalId === pro.id && r.status !== 'COMPLETED'
            );

            // Check if pro has an active sales deployment
            const deployment = salesDeployments.find((d) => d.partnerId === pro.id);

            return (
              <button
                key={pro.id}
                type="button"
                onClick={() => handleSelect(pro.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {pro.name}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      {pro.rating}
                    </span>
                    {hasActiveJob && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 flex items-center gap-0.5">
                        <Briefcase className="w-2.5 h-2.5" />
                        {t('job_assigned_badge')}
                      </span>
                    )}
                    {deployment && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {t('p_deployment_assigned')}: {zoneLabel(deployment.toZoneId, zones, t)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {pro.skills.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                      >
                        {applianceLabel(s, t)}
                      </span>
                    ))}
                    {pro.salesModuleOptIn && (
                      <span className="text-[10px] text-emerald-700 font-semibold ml-1">
                        • {t('p_sales_opt_in')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
