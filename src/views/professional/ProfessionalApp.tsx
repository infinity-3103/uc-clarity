import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useT } from '../../i18n';
import { APPLIANCE_FORMS } from '../../config/appliances';
import { ComparisonScreen } from '../../components/ComparisonScreen';
import { Photo, ApplianceType } from '../../domain/types';
import { computeCityDemand } from '../../domain/demand';
import { planSalesDeployment } from '../../domain/allocation';
import { PartnerDemoSelector } from '../../components/PartnerDemoSelector';
import {
  cityLabel,
  zoneLabel,
  applianceLabel,
  faultLabel,
  statusLabel,
  skillList,
} from '../../i18n/formatters';

const FAULT_OPTIONS = ['Compressor', 'Fan Motor', 'PCB Circuit', 'Gas Leakage'] as const;
const PHYSICAL_STATE_OPTIONS = [
  { val: 'normal', labelKey: 'p_normal_intact', color: 'text-emerald-700' },
  { val: 'faulty', labelKey: 'p_worn_failing', color: 'text-rose-700' },
] as const;
import {
  Wrench,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Camera,
  MapPin,
  Clock,
  Shield,
  Volume2,
  Award,
  ArrowLeft,
  Navigation,
  ClipboardCheck,
  Target,
  Percent,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Wind,
  Snowflake,
  WashingMachine,
  Flame,
  Droplets,
  Zap,
} from 'lucide-react';

export const ProfessionalApp: React.FC = () => {
  const { t, currentLanguage } = useT();

  const selectedProfessionalId = useStore((state) => state.selectedProfessionalId);
  const professionals = useStore((state) => state.professionals);
  const serviceRequests = useStore((state) => state.serviceRequests);
  const customers = useStore((state) => state.customers);
  const zones = useStore((state) => state.zones);
  const salesLeads = useStore((state) => state.salesLeads);
  const cityTemperatures = useStore((state) => state.cityTemperatures);
  const cityHumidity = useStore((state) => state.cityHumidity);
  const cityAQI = useStore((state) => state.cityAQI);
  const cityWaterHardness = useStore((state) => state.cityWaterHardness);
  const cityVoltageStability = useStore((state) => state.cityVoltageStability);

  const submitProInspection = useStore((state) => state.submitProInspection);
  const completeServiceJob = useStore((state) => state.completeServiceJob);
  const toggleSalesModuleOptIn = useStore((state) => state.toggleSalesModuleOptIn);
  const completeSalesTraining = useStore((state) => state.completeSalesTraining);

  const pro = professionals.find((p) => p.id === selectedProfessionalId) || professionals[0];

  // 5 Bottom Tabs: 'jobs' | 'sales' | 'earnings' | 'loans' | 'demand'
  const [currentTab, setCurrentTab] = useState<'jobs' | 'sales' | 'earnings' | 'loans' | 'demand'>('jobs');
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);

  // Active job for this professional
  const activeJob =
    serviceRequests.find((r) => r.professionalId === pro.id && r.status !== 'CANCELLED') ||
    serviceRequests.find((r) => r.professionalId === pro.id);

  const customerForJob = customers.find((c) => c.id === activeJob?.customerId);
  const hasDiagConsent = customerForJob?.consents.find((cr) => cr.purpose === 'DIAGNOSTICS')?.granted || false;

  // Derived sales deployments
  const allDeployments = planSalesDeployment(professionals, zones, salesLeads, {
    temp: cityTemperatures[pro.city],
    humidity: cityHumidity[pro.city],
    aqi: cityAQI[pro.city],
    tds: cityWaterHardness[pro.city],
    voltage: cityVoltageStability[pro.city],
    serviceRequests,
    salesLeads,
  });

  const partnerDeployment = allDeployments.find((d) => d.partnerId === pro.id);

  // City-scoped demand
  const cityDemandData = useMemo(() => {
    return computeCityDemand(
      pro.city,
      90,
      {
        temp: cityTemperatures[pro.city],
        humidity: cityHumidity[pro.city],
        aqi: cityAQI[pro.city],
        tds: cityWaterHardness[pro.city],
        voltage: cityVoltageStability[pro.city],
        serviceRequests,
        salesLeads,
      },
      zones
    );
  }, [
    pro.city,
    cityTemperatures,
    cityHumidity,
    cityAQI,
    cityWaterHardness,
    cityVoltageStability,
    serviceRequests,
    salesLeads,
    zones,
  ]);

  // Inspection form state
  const [inspectionReadings, setInspectionReadings] = useState<Record<string, string | boolean | number>>({
    likelyFault: activeJob?.applianceType === 'AC' ? 'Compressor' : 'Motor',
    repeatFaults: 0,
    coilDeltaTemp: 7,
    compressorCurrent: 'high',
  });

  const [photos, setPhotos] = useState<Photo[]>([
    { id: 'p1', name: 'Serial Plate & Model Stamp', grade: 3 },
    { id: 'p2', name: 'Internal Motor / Coil State', grade: 2 },
  ]);

  // Speech read-aloud support
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speakText = (text: string) => {
    if (!hasSpeech) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (currentLanguage === 'hi') utterance.lang = 'hi-IN';
      else if (currentLanguage === 'mr') utterance.lang = 'mr-IN';
      else if (currentLanguage === 'kn') utterance.lang = 'kn-IN';
      else utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech error', err);
    }
  };

  const handleAddSamplePhotos = () => {
    setPhotos([
      { id: 'p1', name: 'Serial Plate & Electrical Rating', grade: 3 },
      { id: 'p2', name: 'Condenser Coil & Motor Assembly', grade: 2 },
    ]);
  };

  const handleSubmitInspection = () => {
    if (!activeJob) return;
    const likelyFault = (inspectionReadings.likelyFault as string) || 'Compressor';
    submitProInspection(activeJob.id, inspectionReadings, photos, likelyFault);
    setIsInspecting(false);
  };

  const getApplianceIcon = (app: ApplianceType) => {
    switch (app) {
      case 'AC':
        return <Wind className="w-5 h-5 text-sky-500" />;
      case 'FRIDGE':
        return <Snowflake className="w-5 h-5 text-blue-500" />;
      case 'WASHER':
        return <WashingMachine className="w-5 h-5 text-indigo-500" />;
      case 'GEYSER':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'PURIFIER':
        return <Droplets className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 select-none">
      {/* Top Header: Partner Profile & Demo Selector Trigger */}
      <div className="bg-slate-900 text-white p-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-xs">
              {pro.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors">
                  {pro.name}
                </span>
                {isSelectorOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {cityLabel(pro.city, t)} • {skillList(pro.skills, t)}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {hasSpeech && (
              <button
                type="button"
                onClick={() => {
                  if (currentTab === 'jobs') speakText(t('p_speech_jobs'));
                  else if (currentTab === 'sales') speakText(t('p_speech_sales'));
                  else if (currentTab === 'earnings') speakText(t('p_speech_earnings'));
                  else if (currentTab === 'loans') speakText(t('p_speech_loans'));
                  else if (currentTab === 'demand') speakText(t('p_speech_demand'));
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
                title={t('p_read_aloud')}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('p_online')}</span>
            </div>
          </div>
        </div>

        {/* 2-Step Partner Demo Selector Dropdown */}
        {isSelectorOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
            <PartnerDemoSelector
              compact={true}
              onPartnerSelect={() => setIsSelectorOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* ================= TAB 1: JOBS ================= */}
        {currentTab === 'jobs' && (
          <div className="p-4 space-y-4">
            {/* Sales Deployment Card (if assigned to this partner) */}
            {partnerDeployment && (
              <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-slate-950" />
                    <span>{t('p_deployment_assigned')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                    {t('p_rank_param', { rank: partnerDeployment.rank })}
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-base leading-tight">
                    {t('p_target_param', { zone: zoneLabel(partnerDeployment.toZoneId, zones, t) })}
                  </h4>
                  <p className="text-xs font-semibold text-slate-950/90 mt-0.5">
                    {(() => {
                      const m = partnerDeployment.reason.match(/Rank (\d+) in (\w+), zone \w+ demand (\d+)/);
                      if (m) {
                        return t('p_deployment_reason_param', {
                          rank: m[1],
                          category: applianceLabel(m[2] as ApplianceType, t),
                          score: m[3],
                        });
                      }
                      return partnerDeployment.reason;
                    })()}
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-slate-950 border-t border-amber-400/60">
                  <span>{t('p_demand_score_param', { score: partnerDeployment.demandScore })}</span>
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t('p_priority_zone_badge')}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Inspection Form Overlay View */}
            {isInspecting && activeJob ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInspecting(false)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {t('p_onsite_inspection_title')}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {activeJob.brand} {applianceLabel(activeJob.applianceType, t)}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                  {/* Enumerable Options as Large Icon Buttons */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block text-xs">
                      1. {t('p_select_observed_fault')}:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FAULT_OPTIONS.map((fault) => {
                        const isSelected = inspectionReadings.likelyFault === fault;
                        return (
                          <button
                            key={fault}
                            type="button"
                            onClick={() =>
                              setInspectionReadings({ ...inspectionReadings, likelyFault: fault })
                            }
                            className={`min-h-[56px] p-3 rounded-xl border text-left flex items-center justify-between font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 text-slate-950 ring-2 ring-amber-400/30'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{faultLabel(fault, t)}</span>
                            {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coil Condition / Component State */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block text-xs">
                      2. {t('p_physical_condition')}:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PHYSICAL_STATE_OPTIONS.map((item) => {
                        const isSelected = inspectionReadings.compressorCurrent === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() =>
                              setInspectionReadings({ ...inspectionReadings, compressorCurrent: item.val })
                            }
                            className={`min-h-[56px] p-3 rounded-xl border text-left flex items-center justify-between font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className={item.color}>{t(item.labelKey)}</span>
                            {isSelected && <Check className="w-4 h-4 text-purple-600 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mandatory Photos */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {t('p_diagnostic_photos_count', { count: photos.length })}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        {t('p_ready_badge')}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {photos.map((p, idx) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-700">
                            {t('p_photo_label', { idx: idx + 1, name: p.name })}
                          </span>
                          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                            {t('p_grade_label', { grade: p.grade ?? 3 })}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSamplePhotos}
                      className="min-h-[48px] w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>{t('p_capture_photos_btn')}</span>
                    </button>
                  </div>

                  {/* Primary Submit Button (Min 56px touch target) */}
                  <button
                    type="button"
                    onClick={handleSubmitInspection}
                    className="min-h-[56px] w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t('p_submit_inspection_report_btn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Jobs Card */
              <div className="space-y-3">
                {activeJob ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4">
                    {/* Header with Appliance Icon & Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {getApplianceIcon(activeJob.applianceType)}
                        </div>
                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold uppercase">
                            {statusLabel(activeJob.status, t)}
                          </span>
                          <h4 className="font-extrabold text-base text-slate-900 mt-0.5">
                            {activeJob.brand} {applianceLabel(activeJob.applianceType, t)}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          ₹{activeJob.serviceFee}
                        </span>
                        <span className="text-[10px] text-slate-500">{t('p_fixed_fee')}</span>
                      </div>
                    </div>

                    {/* Area & Time Chips */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {cityLabel(customerForJob?.city || pro.city, t)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {activeJob.scheduledSlot || '14:00 - 16:00'}
                        </span>
                      </div>
                    </div>

                    {/* 3-Step Icon Progress Bar: Go -> Check -> Done */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {t('job_progress_label')}
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Step 1: Go */}
                        <div
                          className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                            activeJob.status === 'ASSIGNED' || activeJob.status === 'INSPECTED' || activeJob.status === 'COMPARISON_SHOWN' || activeJob.status === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <Navigation className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold">{t('p_step_go')}</span>
                        </div>

                        {/* Step 2: Check */}
                        <div
                          className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                            activeJob.status === 'COMPARISON_SHOWN' || activeJob.status === 'REPAIR_CHOSEN' || activeJob.status === 'REPLACE_CHOSEN' || activeJob.status === 'COMPLETED'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : activeJob.status === 'ASSIGNED'
                              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <ClipboardCheck className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold">{t('p_step_check')}</span>
                        </div>

                        {/* Step 3: Done */}
                        <div
                          className={`p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition-all ${
                            activeJob.status === 'COMPLETED'
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold">{t('p_step_done')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button (Min 56px touch target) */}
                    {activeJob.status === 'ASSIGNED' && (
                      <button
                        type="button"
                        onClick={() => setIsInspecting(true)}
                        className="min-h-[56px] w-full py-3 bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-slate-950 font-black rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Wrench className="w-5 h-5" />
                        <span>{t('p_start_inspection')}</span>
                      </button>
                    )}

                    {/* Inspection Submitted: Neutral Comparison Mirror (G3) */}
                    {activeJob.recommendation && (
                      <div className="space-y-3 pt-1">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{t('p_customer_mirror_notice')}</span>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <ComparisonScreen
                            recommendation={activeJob.recommendation}
                            applianceType={activeJob.applianceType}
                            brand={activeJob.brand}
                            ageYears={activeJob.ageYears}
                            likelyFault={(activeJob.proReadings?.likelyFault as string) || 'Compressor'}
                            isProfessionalView={true}
                          />
                        </div>

                        {activeJob.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => completeServiceJob(activeJob.id)}
                            className="min-h-[56px] w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{t('p_mark_job_completed_btn', { fee: activeJob.serviceFee })}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-700">{t('p_no_active_job')}</h4>
                    <p className="text-xs text-slate-400">
                      {t('p_new_repair_dispatches_param', { skills: skillList(pro.skills, t) })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: SALES ================= */}
        {currentTab === 'sales' && (
          <div className="p-4 space-y-4">
            {/* Opt-In Big Switch Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{t('p_sales_opt_in')}</h3>
                  <span className="text-[11px] text-slate-500">
                    {pro.salesModuleOptIn ? t('p_enrolled_partner_status') : t('p_service_only_status')}
                  </span>
                </div>
                {/* Large Toggle Switch (Min 56px touch target area) */}
                <button
                  type="button"
                  onClick={() => {
                    if (pro.salesModuleOptIn) {
                      toggleSalesModuleOptIn(pro.id, false);
                    } else {
                      completeSalesTraining(pro.id);
                      toggleSalesModuleOptIn(pro.id, true);
                    }
                  }}
                  className={`w-16 h-9 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                    pro.salesModuleOptIn ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* 3 Pictorial Rule Icons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {/* Rule 1: No Target */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-1 min-h-[56px]">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {t('p_rule_no_target')}
                  </span>
                </div>

                {/* Rule 2: No Penalty */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-1 min-h-[56px]">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {t('p_rule_no_penalty')}
                  </span>
                </div>

                {/* Rule 3: 3% Fee */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-1 min-h-[56px]">
                  <Percent className="w-5 h-5 text-amber-600" />
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {t('p_rule_commission')}
                  </span>
                </div>
              </div>
            </div>

            {/* Referral Tracker as Progress Bar with Large Rupee Numerals */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('p_referral_tracker')}
              </span>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-purple-700">
                    ₹{pro.referralEarnings.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 block">{t('p_total_referral_income_label')}</span>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-slate-800">
                    {pro.salesByCategory
                      ? Object.values(pro.salesByCategory).reduce((acc, curr) => acc + (curr?.unitsSold || 0), 0)
                      : 8}{' '}
                    {t('p_units_label')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{t('p_units_sold')}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        ((pro.salesByCategory
                          ? Object.values(pro.salesByCategory).reduce((acc, curr) => acc + (curr?.unitsSold || 0), 0)
                          : 8) /
                          15) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>{t('p_zero_units')}</span>
                  <span>{t('p_target_free_track')}</span>
                  <span>{t('p_fifteen_plus_units')}</span>
                </div>
              </div>

              {/* Category Breakdown Chips */}
              {pro.salesByCategory && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(pro.salesByCategory).map(([cat, stats]) => (
                    <div key={cat} className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 block">{applianceLabel(cat, t)}</span>
                      <span className="text-[11px] text-purple-700 font-semibold">
                        {t('p_sold_visits_param', { sold: stats?.unitsSold || 0, visits: stats?.opportunities || 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: EARNINGS ================= */}
        {currentTab === 'earnings' && (
          <div className="p-4 space-y-4">
            {/* Total Earnings Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('p_total_wallet_earnings_label')}
              </span>
              <div className="text-3xl font-black text-slate-900">
                ₹{(pro.serviceEarnings + pro.referralEarnings).toLocaleString('en-IN')}
              </div>

              {/* Donut Ring Chart splitting service vs referral earnings */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                {/* SVG Donut Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Service Earnings Arc (Slate/Indigo) */}
                    <path
                      className="text-slate-800"
                      strokeDasharray={`${Math.round(
                        (pro.serviceEarnings / (pro.serviceEarnings + pro.referralEarnings || 1)) * 100
                      )}, 100`}
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Referral Arc (Purple) */}
                    <path
                      className="text-purple-600"
                      strokeDasharray={`${Math.round(
                        (pro.referralEarnings / (pro.serviceEarnings + pro.referralEarnings || 1)) * 100
                      )}, 100`}
                      strokeDashoffset={`-${Math.round(
                        (pro.serviceEarnings / (pro.serviceEarnings + pro.referralEarnings || 1)) * 100
                      )}`}
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-[11px] text-slate-700">
                    {Math.round((pro.referralEarnings / (pro.serviceEarnings + pro.referralEarnings || 1)) * 100)}%
                  </div>
                </div>

                {/* Legend Values */}
                <div className="space-y-1.5 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                      {t('p_service_earnings')}
                    </span>
                    <strong className="text-slate-900">₹{pro.serviceEarnings.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      {t('p_referral_earnings')}
                    </span>
                    <strong className="text-purple-700">₹{pro.referralEarnings.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Pending vs Settled Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>{t('p_settled_earnings')}: ₹{pro.serviceEarnings.toLocaleString('en-IN')}</span>
                  <span className="text-amber-700 font-bold">{t('p_pending_earnings')}: ₹1,455</span>
                </div>
                <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-[85%]" />
                  <div className="bg-amber-500 h-full w-[15%]" />
                </div>
              </div>

              {/* Guardrail G4 Meaning as icon plus a short line */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-tight font-medium">
                  {t('p_g4_notice')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: LOANS ================= */}
        {currentTab === 'loans' && (
          <div className="p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('p_loans_title')}
            </span>

            {/* 3 Large Icon Cards, each with one button (Min 56px touch target) */}
            {/* Card 1: Tool & Equipment Kit */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{t('p_tool_loan_title')}</h4>
                  <span className="text-[11px] text-slate-500">{t('p_tool_loan_desc')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Tool kit application submitted to Aarambh Bank.')}
                className="min-h-[56px] w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t('p_apply_tool_loan_btn')}
              </button>
            </div>

            {/* Card 2: Health & Accident Cover */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{t('p_health_shield_title')}</h4>
                  <span className="text-[11px] text-emerald-700 font-bold">{t('p_health_shield_desc')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Insurance certificate active for current season.')}
                className="min-h-[56px] w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t('p_view_policy_btn')}
              </button>
            </div>

            {/* Card 3: Earnings Micro-Advance */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{t('p_advance_title')}</h4>
                  <span className="text-[11px] text-slate-500">{t('p_advance_desc')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Advance of ₹5,000 disbursed via UPI.')}
                className="min-h-[56px] w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t('p_withdraw_advance_btn')}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 5: DEMAND (CITY-SCOPED ONLY) ================= */}
        {currentTab === 'demand' && (
          <div className="p-4 space-y-4">
            {/* Header info strictly scoped to partner's city */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  {t('p_city_demand_title')}
                </h3>
                <span className="text-[11px] font-semibold text-purple-700">
                  {t('p_market_forecast_param', { city: cityLabel(pro.city, t) })}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-xs">
                {t('p_overall_demand_param', {
                  level:
                    cityDemandData.overallLevel === 'High'
                      ? t('p_high_demand')
                      : cityDemandData.overallLevel === 'Medium'
                      ? t('p_med_demand')
                      : t('p_low_demand'),
                  score: cityDemandData.overallScore,
                })}
              </span>
            </div>

            {/* Informational Notice meaning as short icon line */}
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
              <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{t('p_city_demand_notice')}</span>
            </div>

            {/* Per Appliance: Icon, Bar, and High/Medium/Low */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('p_demand_by_category_param', { city: cityLabel(pro.city, t) })}
              </span>

              <div className="space-y-2.5">
                {(['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'] as ApplianceType[]).map((app) => {
                  const data = cityDemandData.appliances[app];
                  const levelColor =
                    data.level === 'High'
                      ? 'text-rose-600 bg-rose-50 border-rose-200'
                      : data.level === 'Medium'
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

                  const barColor =
                    data.level === 'High'
                      ? 'bg-rose-500'
                      : data.level === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <div key={app} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {getApplianceIcon(app)}
                          <span>{applianceLabel(app, t)}</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] border ${levelColor}`}>
                          {data.level === 'High' ? t('p_high_demand') : data.level === 'Medium' ? t('p_med_demand') : t('p_low_demand')} ({data.score}/100)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 3 Zones in that City ONLY */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {t('p_top_zones')}
              </span>

              <div className="space-y-2">
                {cityDemandData.topZones.map((zone, idx) => (
                  <div
                    key={zone.zoneId}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{zoneLabel(zone.zoneId, zones, t)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {zone.leadCount > 0 && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          {t('p_leads_count_param', { count: zone.leadCount })}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          zone.level === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : zone.level === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t('p_pts_count_param', { score: zone.score })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 5 BOTTOM TABS BAR (MIN 56px TOUCH TARGETS) ================= */}
      <div className="bg-white border-t border-slate-200 grid grid-cols-5 py-1 px-1 shrink-0 z-40 shadow-lg">
        {[
          { id: 'jobs', labelKey: 'p_tab_jobs', icon: Wrench },
          { id: 'sales', labelKey: 'p_tab_sales', icon: TrendingUp },
          { id: 'earnings', labelKey: 'p_tab_earnings', icon: Award },
          { id: 'loans', labelKey: 'p_tab_loans', icon: CreditCard },
          { id: 'demand', labelKey: 'p_tab_demand', icon: Navigation },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCurrentTab(tab.id as any);
                setIsInspecting(false);
              }}
              className={`min-h-[56px] flex flex-col items-center justify-center py-1 transition-all rounded-xl cursor-pointer ${
                isActive ? 'text-purple-600 font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-purple-600 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{t(tab.labelKey as any)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
