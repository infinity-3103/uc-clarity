import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { City, ApplianceType } from '../../domain/types';
import { ALLOCATION_WEIGHTS, planSalesDeployment, getPartnerLeaderboard } from '../../domain/allocation';
import { calculateUnitEconomics, formatIndianCurrency, ECONOMICS_DISCLAIMER } from '../../domain/economics';
import { EXIT_SURVEY_TARGET_CONSENT, NUDGE_MAX_PER_WEEK } from '../../config/assumptions';
import { CityHeatMap } from '../../components/CityHeatMap';
import {
  BarChart3,
  MapPin,
  Users,
  ShieldCheck,
  FileCheck2,
  Megaphone,
  Briefcase,
  DollarSign,
  Thermometer,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const OpsDashboard: React.FC = () => {
  const serviceRequests = useStore((state) => state.serviceRequests);
  const professionals = useStore((state) => state.professionals);
  const customers = useStore((state) => state.customers);
  const zones = useStore((state) => state.zones);
  const loanApplications = useStore((state) => state.loanApplications);
  const deletionRequests = useStore((state) => state.deletionRequests);
  const repositionSuggestions = useStore((state) => state.repositionSuggestions);
  const applyRepositionSuggestion = useStore((state) => state.applyRepositionSuggestion);
  const simulatedCity = useStore((state) => state.simulatedCity);
  const cityTemperatures = useStore((state) => state.cityTemperatures);
  const cityHumidity = useStore((state) => state.cityHumidity);
  const cityAQI = useStore((state) => state.cityAQI);
  const cityWaterHardness = useStore((state) => state.cityWaterHardness);
  const cityVoltageStability = useStore((state) => state.cityVoltageStability);
  const salesLeads = useStore((state) => state.salesLeads);
  const directOrders = useStore((state) => state.directOrders);
  const selectProfessional = useStore((state) => state.selectProfessional);
  const setRole = useStore((state) => state.setRole);
  const sendCampaignNudges = useStore((state) => state.sendCampaignNudges);
  const triggerPushNotification = useStore((state) => state.triggerPushNotification);
  const eventLog = useStore((state) => state.eventLog);

  const [activeTab, setActiveTab] = useState<
    'funnel' | 'hotregions' | 'allocation' | 'trust' | 'consent' | 'campaign' | 'programme' | 'economics'
  >('funnel');

  const [selectedCityForMap, setSelectedCityForMap] = useState<City>(simulatedCity);
  const [selectedApplianceFilter, setSelectedApplianceFilter] = useState<string>('ALL');

  // Lead Filters: City & Appliance with Select All
  const [selectedLeadCities, setSelectedLeadCities] = useState<City[]>([
    'Mumbai',
    'Delhi',
    'Pune',
    'Kolkata',
    'Bengaluru',
  ]);
  const [selectedLeadAppliances, setSelectedLeadAppliances] = useState<ApplianceType[]>([
    'AC',
    'FRIDGE',
    'WASHER',
    'GEYSER',
    'PURIFIER',
  ]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const filteredSalesLeads = useMemo(() => {
    return salesLeads.filter(
      (lead) =>
        selectedLeadCities.includes(lead.city) &&
        selectedLeadAppliances.includes(lead.appliance)
    );
  }, [salesLeads, selectedLeadCities, selectedLeadAppliances]);

  const handleSelectAllCities = () => {
    setSelectedLeadCities(['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru']);
  };

  const toggleLeadCity = (city: City) => {
    const allCities: City[] = ['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'];
    if (selectedLeadCities.length === allCities.length) {
      setSelectedLeadCities([city]);
    } else if (selectedLeadCities.includes(city)) {
      const next = selectedLeadCities.filter((c) => c !== city);
      setSelectedLeadCities(next.length === 0 ? allCities : next);
    } else {
      setSelectedLeadCities([...selectedLeadCities, city]);
    }
  };

  const handleSelectAllAppliances = () => {
    setSelectedLeadAppliances(['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER']);
  };

  const toggleLeadAppliance = (app: ApplianceType) => {
    const allApps: ApplianceType[] = ['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'];
    if (selectedLeadAppliances.length === allApps.length) {
      setSelectedLeadAppliances([app]);
    } else if (selectedLeadAppliances.includes(app)) {
      const next = selectedLeadAppliances.filter((a) => a !== app);
      setSelectedLeadAppliances(next.length === 0 ? allApps : next);
    } else {
      setSelectedLeadAppliances([...selectedLeadAppliances, app]);
    }
  };

  const isAllRowsSelected =
    filteredSalesLeads.length > 0 && selectedLeadIds.length === filteredSalesLeads.length;

  const toggleSelectAllRows = () => {
    if (isAllRowsSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredSalesLeads.map((l) => l.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const [leaderboardCategory, setLeaderboardCategory] = useState<ApplianceType | 'Overall'>('Overall');
  const [leaderboardCity, setLeaderboardCity] = useState<City | 'All'>('All');

  const leaderboard = useMemo(() => {
    let list = getPartnerLeaderboard(professionals, leaderboardCategory);
    if (leaderboardCity !== 'All') {
      list = list.filter((p) => p.city === leaderboardCity);
    }
    return list;
  }, [professionals, leaderboardCategory, leaderboardCity]);

  const salesDeployments = useMemo(() => {
    const demandContext = {
      temp: cityTemperatures[selectedCityForMap],
      humidity: cityHumidity[selectedCityForMap],
      aqi: cityAQI[selectedCityForMap],
      tds: cityWaterHardness[selectedCityForMap],
      voltage: cityVoltageStability[selectedCityForMap],
      serviceRequests,
      directOrders,
      salesLeads,
    };
    return planSalesDeployment(professionals, zones, salesLeads, demandContext);
  }, [
    professionals,
    zones,
    salesLeads,
    selectedCityForMap,
    cityTemperatures,
    cityHumidity,
    cityAQI,
    cityWaterHardness,
    cityVoltageStability,
    serviceRequests,
    directOrders,
  ]);

  // Economics Simulator Inputs (Section 12 Defaults)
  const [econVisits, setEconVisits] = useState<number>(1000);
  const [econConversion, setEconConversion] = useState<number>(0.05);
  const [econTicket, setEconTicket] = useState<number>(48500);
  const [econMargin, setEconMargin] = useState<number>(0.10);
  const [econIncentive, setEconIncentive] = useState<number>(0.03);
  const [econSubvention, setEconSubvention] = useState<number>(0.04);
  const [brandFundsSubvention, setBrandFundsSubvention] = useState<boolean>(false);

  const econOutputs = calculateUnitEconomics({
    eligibleVisits: econVisits,
    conversionPct: econConversion,
    avgTicket: econTicket,
    ucMarginPct: econMargin,
    incentivePct: econIncentive,
    subventionPct: econSubvention,
    brandFundsSubvention,
  });

  // Funnel counts
  const totalBooked = serviceRequests.length;
  const totalInspected = serviceRequests.filter((r) => r.recommendation).length;
  const totalRepairs = serviceRequests.filter((r) => r.choice === 'REPAIR').length;
  const totalReplaces = serviceRequests.filter((r) => r.choice === 'REPLACE').length;
  const totalLoans = loanApplications.length;
  const totalDisbursed = loanApplications.filter((l) => l.status === 'DISBURSED' || l.status === 'COOLING_OFF').length;

  const funnelData = [
    { stage: 'Diagnostics Booked', count: totalBooked, fill: '#6366F1' },
    { stage: 'Inspections Done', count: totalInspected, fill: '#8B5CF6' },
    { stage: 'Repair Chosen', count: totalRepairs, fill: '#10B981' },
    { stage: 'Replace Chosen', count: totalReplaces, fill: '#EC4899' },
    { stage: 'EMI Applied', count: totalLoans, fill: '#F59E0B' },
    { stage: 'Units Disbursed', count: totalDisbursed, fill: '#059669' },
  ];

  // Consent rates
  const validCustomers = customers.filter((c) => !c.deleted);
  const diagConsentRate = Math.round(
    (validCustomers.filter((c) => c.consents.some((cr) => cr.purpose === 'DIAGNOSTICS' && cr.granted)).length /
      (validCustomers.length || 1)) *
      100
  );
  const mktgConsentRate = Math.round(
    (validCustomers.filter((c) => c.consents.some((cr) => cr.purpose === 'MARKETING' && cr.granted)).length /
      (validCustomers.length || 1)) *
      100
  );
  const creditConsentRate = Math.round(
    (validCustomers.filter((c) => c.consents.some((cr) => cr.purpose === 'CREDIT_ASSESSMENT' && cr.granted)).length /
      (validCustomers.length || 1)) *
      100
  );

  // Pro opt-in rate
  const optedInPros = professionals.filter((p) => p.salesModuleOptIn).length;
  const optInRate = Math.round((optedInPros / (professionals.length || 1)) * 100);

  const currentCityTemp = cityTemperatures[selectedCityForMap] ?? 34;
  const cityZones = zones.filter((z) => z.city === selectedCityForMap);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight">Urban Company Operations</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
              Enterprise Command Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Regional service demand, neutral allocation, and consent compliance
          </p>
        </div>

        {/* Guardrail Badge (Mandatory G5 / Section 11) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conversion weight in allocation: 0 (guardrail)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex space-x-6 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'funnel', label: 'Overview Funnel' },
          { id: 'hotregions', label: 'Hot Regions & Weather' },
          { id: 'allocation', label: 'Job Allocation Engine' },
          { id: 'trust', label: 'Trust & Diagnostics Monitor' },
          { id: 'consent', label: 'Consent & Deletion Ledger' },
          { id: 'campaign', label: 'Campaign Nudge Console' },
          { id: 'programme', label: 'Professional Programme' },
          { id: 'economics', label: 'Unit Economics Module' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Panels */}
      <main className="p-6 max-w-7xl mx-auto w-full flex-1">
        {/* TAB 1: FUNNEL */}
        {activeTab === 'funnel' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900">
                End-to-End Diagnostic & Decision Funnel
              </h2>
              <span className="text-xs text-slate-500">Live Simulation Data</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              {funnelData.map((stage) => (
                <div key={stage.stage} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-slate-500 font-medium text-[11px] truncate block">{stage.stage}</span>
                  <div className="text-xl font-bold text-slate-900">{stage.count}</div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Funnel Conversion Stages
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData}>
                    <XAxis dataKey="stage" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6B46C1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOT REGIONS */}
        {activeTab === 'hotregions' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Regional Demand Heat & Weather Overlay
                </h2>
                <p className="text-xs text-slate-500">
                  Driven by simulated temperature and appliance vintage distributions
                </p>
              </div>

              {/* City & Appliance Filters */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">City:</span>
                  <select
                    value={selectedCityForMap}
                    onChange={(e) => setSelectedCityForMap(e.target.value as City)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 shadow-xs"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Pune">Pune</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Bengaluru">Bengaluru</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[11px] px-1 font-medium">Appliance:</span>
                  {(['ALL', 'AC', 'FRIDGE', 'WASHER', 'PURIFIER', 'GEYSER'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedApplianceFilter(cat)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                        selectedApplianceFilter === cat
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive GIS Heatmap */}
            <div className="space-y-4">
              <CityHeatMap
                selectedCity={selectedCityForMap}
                applianceFilter={selectedApplianceFilter}
              />

              {/* Repositioning Suggestions (Section 11) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Dynamic Repositioning Suggestions
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Suggests repositioning idle pros to zones where demand exceeds coverage.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    {repositionSuggestions.filter((s) => !s.applied).length} pending
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {repositionSuggestions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900">{s.professionalName}</span>
                          <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200">
                            {s.travelMinutes}m travel
                          </span>
                        </div>
                        <div className="text-[11px] text-purple-700 font-semibold">
                          {s.fromZoneName} &rarr; {s.toZoneName}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{s.reason}</p>
                      </div>
                      <button
                        disabled={s.applied}
                        onClick={() => applyRepositionSuggestion(s.id)}
                        className={`w-full py-1.5 rounded-lg font-semibold text-xs transition-colors mt-2 ${
                          s.applied
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                        }`}
                      >
                        {s.applied ? 'Suggestion Applied' : 'Apply Suggestion'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALLOCATION ENGINE */}
        {activeTab === 'allocation' && (
          <div className="space-y-6">
            {/* Sales Deployment Table (Derived pure plan) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Strategic Sales Deployment (Proactive Demand-Led Placement)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Derived cross-zone placements for top-ranked sales partners based on micro-demand and survey leads. Completely decoupled from repair dispatch (Guardrail G5).
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
                  {salesDeployments.length} Active Deployments
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Partner</th>
                        <th className="px-4 py-3">Best Category</th>
                        <th className="px-4 py-3">From Zone</th>
                        <th className="px-4 py-3">To Zone</th>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Demand Score</th>
                        <th className="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesDeployments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No sales repositioning deployments active at this time.
                          </td>
                        </tr>
                      ) : (
                        salesDeployments.map((dep) => (
                          <tr key={`${dep.partnerId}-${dep.toZoneId}`} className="hover:bg-purple-50/40">
                            <td className="px-4 py-3 font-semibold text-slate-900">{dep.partnerName}</td>
                            <td className="px-4 py-3 font-medium text-purple-700">{dep.bestCategory}</td>
                            <td className="px-4 py-3 text-slate-600">{dep.fromZoneName}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-700">{dep.toZoneName}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">#{dep.rank}</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">{dep.demandScore}/100</td>
                            <td className="px-4 py-3 text-slate-600 text-[11px]">{dep.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Repair Dispatch Table - Guardrail G5 Enforced */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Algorithmic Job Allocation & Dispatch
                  </h2>
                  <p className="text-xs text-slate-500">
                    Formula: S = 0.35*(1-travelNorm) + 0.25*skill + 0.20*ratingNorm + 0.20*slaFit
                  </p>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  Conversion Weight = 0 (Guardrail G5 Enforced)
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Job ID</th>
                        <th className="px-4 py-3">Appliance</th>
                        <th className="px-4 py-3">Assigned Partner</th>
                        <th className="px-4 py-3">Travel Fit (35%)</th>
                        <th className="px-4 py-3">Skill Match (25%)</th>
                        <th className="px-4 py-3">Rating Fit (20%)</th>
                        <th className="px-4 py-3">SLA Fit (20%)</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceRequests.slice(0, 8).map((req) => {
                        const pro = professionals.find((p) => p.id === req.professionalId);
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{req.id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{req.applianceType}</td>
                            <td className="px-4 py-3 font-medium text-purple-700">{pro?.name || 'Assigned'}</td>
                            <td className="px-4 py-3 text-slate-600">0.31 / 0.35</td>
                            <td className="px-4 py-3 text-slate-600">0.25 / 0.25</td>
                            <td className="px-4 py-3 text-slate-600">0.18 / 0.20</td>
                            <td className="px-4 py-3 text-slate-600">0.20 / 0.20</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{req.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRUST MONITOR */}
        {activeTab === 'trust' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">
              Trust & Diagnostic Integrity Monitor (Guardrail G4)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 text-xs">
                <span className="text-slate-500 font-medium">Customer Satisfaction Index</span>
                <div className="text-2xl font-bold text-slate-900">4.82 ★</div>
                <span className="text-[10px] text-slate-400">Zero pressure reported</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 text-xs">
                <span className="text-slate-500 font-medium">Repair vs Replace Ratio</span>
                <div className="text-2xl font-bold text-indigo-600">62% Repair / 38% Replace</div>
                <span className="text-[10px] text-slate-400">Natural economic distribution</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 text-xs">
                <span className="text-slate-500 font-medium">Condemned & Repaired Elsewhere</span>
                <div className="text-2xl font-bold text-emerald-600">0.4%</div>
                <span className="text-[10px] text-emerald-600 font-medium">Within safe integrity bounds</span>
              </div>
            </div>

            {/* Audit Sample Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">Diagnostic Inspection Random Audit Sample</span>
                <span className="text-xs text-slate-400">100% Deterministic Engine Log</span>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                {serviceRequests.filter((r) => r.recommendation).slice(0, 5).map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{r.brand} {r.applianceType} (Age: {r.ageYears}y)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                          Lean: {r.recommendation?.lean}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Reasons: {r.recommendation?.reasons.join(' ')}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">Score: {r.recommendation?.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONSENT MONITOR */}
        {activeTab === 'consent' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900">
              Consent Monitor & Right to be Forgotten Ledger
            </h2>

            {/* Consent Ratios */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Diagnostics Consent</span>
                <div className="text-xl font-bold text-slate-900">{diagConsentRate}%</div>
                <span className="text-[10px] text-slate-400">All default OFF</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Marketing Consent</span>
                <div className="text-xl font-bold text-slate-900">{mktgConsentRate}%</div>
                <span className="text-[10px] text-slate-400">Gating seasonal nudges</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Credit Assessment</span>
                <div className="text-xl font-bold text-slate-900">{creditConsentRate}%</div>
                <span className="text-[10px] text-slate-400">Optional EMI applicants</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Exit Survey Rate</span>
                <div className="text-xl font-bold text-purple-700">42%</div>
                <span className="text-[10px] text-purple-600 font-medium">
                  Target: {Math.round(EXIT_SURVEY_TARGET_CONSENT * 100)}% (Met)
                </span>
              </div>
            </div>

            {/* Deletion Requests Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">Right to be Forgotten Erasure Audit Log</span>
                <span className="text-xs text-slate-500">Statutory Compliance</span>
              </div>

              <div className="p-4 space-y-2 text-xs">
                {deletionRequests.map((del) => (
                  <div key={del.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-900">
                        Subject: {del.customerName} (ID: {del.customerId})
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Completed at: {del.completedAt}
                      </div>
                      {del.retainedRecords.length > 0 && (
                        <div className="text-[10px] text-amber-700 mt-1 font-medium">
                          Retained: {del.retainedRecords.join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ERASED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CAMPAIGN CONSOLE (Section 12) */}
        {activeTab === 'campaign' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Campaign Nudge Console
                </h2>
                <p className="text-xs text-slate-500">
                  Rules gated by MARKETING consent with frequency cap ({NUDGE_MAX_PER_WEEK}/week) and 10% holdout
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'nudge-pre-summer',
                  name: 'Rule 1: Pre-Summer AC Check',
                  trigger: 'Feb-Apr and owns AC >= 8 yrs or past fault',
                  sampleText: 'Summer is almost here. Is your AC ready? Book a check or see replacement offers with no-cost EMI.',
                },
                {
                  id: 'nudge-heatwave',
                  name: 'Rule 2: Extreme Heatwave Alert',
                  trigger: 'Simulated outside temperature >= 40°C in customer city',
                  sampleText: 'It is 41 C out there. Quick AC check slots are open today.',
                },
                {
                  id: 'nudge-festive',
                  name: 'Rule 3: Festive / New Year Season',
                  trigger: '20 Dec to 5 Jan and owns fridge/washer >= 8 yrs',
                  sampleText: 'Party season! Keep the drinks chilled. See refrigerator offers.',
                },
                {
                  id: 'nudge-amc',
                  name: 'Rule 4: Post-Warranty Native AMC',
                  trigger: 'Owns Native product past warranty',
                  sampleText: 'Your Native warranty has ended. Keep it running with an AMC at Rs 5,000 a year.',
                },
                {
                  id: 'nudge-declined-reminder',
                  name: 'Rule 5: Declined-to-Buy Follow-Up',
                  trigger: '7 days post repair choice on high replace lean',
                  sampleText: 'Flexible no-cost EMI options starting from Rs 4,042/mo are available if you decide to replace.',
                },
              ].map((rule) => (
                <div key={rule.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{rule.name}</span>
                    <span className="text-slate-500 text-[11px] block">Trigger: {rule.trigger}</span>
                    <p className="text-slate-600 italic text-[11px]">&quot;{rule.sampleText}&quot;</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const sentCount = sendCampaignNudges(rule.id, 10);
                        if (sentCount === 0) {
                          // Dispatch test alert preview so user immediately sees animation and hears chime
                          triggerPushNotification({
                            title: rule.name.replace(/^Rule \d+:\s*/, ''),
                            body: rule.sampleText,
                            appTitle: 'Urban Company',
                          });
                        }
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-xs"
                    >
                      Evaluate & Send Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: PROFESSIONAL PROGRAMME */}
        {activeTab === 'programme' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Professional Welfare & Sales Referral Programme
                </h2>
                <p className="text-xs text-slate-500">
                  Survey-generated lead intelligence and voluntary partner referral performance
                </p>
              </div>
            </div>

            {/* Top Table: Survey Leads Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Survey Customer Leads</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                    {filteredSalesLeads.length} of {salesLeads.length} Leads
                  </span>
                  {selectedLeadIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {selectedLeadIds.length} Selected
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">Captured via checkout & exit surveys</span>
              </div>

              {/* Filter Toolbar: City & Appliances with Select All */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                  {/* City Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 min-w-[70px]">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      City:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllCities}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedLeadCities.length === 5
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Select All
                      </button>
                      {(['Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'] as City[]).map((city) => {
                        const isSelected = selectedLeadCities.includes(city);
                        const isSingle = selectedLeadCities.length !== 5 && isSelected;
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleLeadCity(city)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                              isSingle
                                ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold'
                                : isSelected
                                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium'
                                : 'bg-slate-100 text-slate-400 border border-transparent hover:text-slate-600'
                            }`}
                          >
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Appliances Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 min-w-[85px]">
                      <Wrench className="w-3.5 h-3.5 text-purple-600" />
                      Appliances:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllAppliances}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedLeadAppliances.length === 5
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Select All
                      </button>
                      {(['AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'] as ApplianceType[]).map((app) => {
                        const isSelected = selectedLeadAppliances.includes(app);
                        const isSingle = selectedLeadAppliances.length !== 5 && isSelected;
                        const label =
                          app === 'FRIDGE'
                            ? 'Fridge'
                            : app === 'WASHER'
                            ? 'Washer'
                            : app === 'GEYSER'
                            ? 'Geyser'
                            : app === 'PURIFIER'
                            ? 'Purifier'
                            : 'AC';
                        return (
                          <button
                            key={app}
                            type="button"
                            onClick={() => toggleLeadAppliance(app)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                              isSingle
                                ? 'bg-purple-100 text-purple-800 border border-purple-300 font-bold'
                                : isSelected
                                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium'
                                : 'bg-slate-100 text-slate-400 border border-transparent hover:text-slate-600'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-3 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={isAllRowsSelected}
                            onChange={toggleSelectAllRows}
                            className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                            title="Select all filtered leads"
                          />
                        </th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Appliance</th>
                        <th className="px-4 py-3">City</th>
                        <th className="px-4 py-3">Zone</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Age</th>
                        <th className="px-4 py-3">Reported Issue</th>
                        <th className="px-4 py-3">Replace Interest</th>
                        <th className="px-4 py-3">Captured</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSalesLeads.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                            No survey leads match the selected City and Appliance filters.
                          </td>
                        </tr>
                      ) : (
                        filteredSalesLeads.map((lead) => {
                          const zoneName = zones.find((z) => z.id === lead.zoneId)?.name || lead.zoneId;
                          const priorityClass =
                            lead.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : lead.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200';
                          const isRowChecked = selectedLeadIds.includes(lead.id);

                          return (
                            <tr
                              key={lead.id}
                              className={`transition-colors ${
                                isRowChecked ? 'bg-purple-50/70' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="px-3 py-3">
                                <input
                                  type="checkbox"
                                  checked={isRowChecked}
                                  onChange={() => toggleSelectRow(lead.id)}
                                  className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                                Customer #{lead.customerId.replace('cust-', '').slice(0, 4)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{lead.appliance}</td>
                              <td className="px-4 py-3 text-slate-600">{lead.city}</td>
                              <td className="px-4 py-3 text-slate-600">{zoneName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityClass}`}>
                                  {lead.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{lead.ageYearsBand}</td>
                              <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={lead.issue}>
                                {lead.issue}
                              </td>
                              <td className="px-4 py-3 capitalize font-medium text-slate-800">
                                {lead.replacementInterest}
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-[11px]">
                                {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Leaderboard of Opted-in Partners */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Opted-in Partner Leaderboard ({optedInPros} enrolled)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any partner row to inspect their mobile view in the low-literacy partner app
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-slate-500 font-bold text-[11px] px-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-purple-600" />
                      City:
                    </span>
                    {(['All', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Bengaluru'] as const).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setLeaderboardCity(city)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          leaderboardCity === city
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {city === 'All' ? 'Select All' : city}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 text-xs">
                    <span className="text-slate-500 font-bold text-[11px] px-1 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-purple-600" />
                      Category:
                    </span>
                    {(['Overall', 'AC', 'FRIDGE', 'WASHER', 'GEYSER', 'PURIFIER'] as (ApplianceType | 'Overall')[]).map(
                      (cat) => {
                      const label =
                        cat === 'Overall'
                          ? 'Overall'
                          : cat === 'AC'
                          ? 'AC'
                          : cat === 'FRIDGE'
                          ? 'Fridge'
                          : cat === 'WASHER'
                          ? 'Washer'
                          : cat === 'GEYSER'
                          ? 'Geyser'
                          : 'Purifier';

                      return (
                        <button
                          key={cat}
                          onClick={() => setLeaderboardCategory(cat)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                            leaderboardCategory === cat
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Partner</th>
                        <th className="px-4 py-3">City</th>
                        <th className="px-4 py-3">Best Category</th>
                        <th className="px-4 py-3">Units Sold</th>
                        <th className="px-4 py-3">Conversion Rate (%)</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            No opted-in partners in this city and category filter.
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((item) => (
                          <tr
                            key={item.partnerId}
                            onClick={() => {
                              selectProfessional(item.partnerId);
                              setRole('professional');
                            }}
                            className="hover:bg-purple-50/50 cursor-pointer transition-colors group"
                          >
                            <td className="px-4 py-3 font-bold text-slate-900">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                  item.rank === 1
                                    ? 'bg-amber-100 text-amber-800 font-extrabold'
                                    : item.rank === 2
                                    ? 'bg-slate-200 text-slate-800 font-bold'
                                    : item.rank === 3
                                    ? 'bg-amber-50 text-amber-900 font-bold'
                                    : 'text-slate-600'
                                }`}
                              >
                                #{item.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-purple-700 group-hover:underline">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{item.city}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{item.bestCategory}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{item.unitsSold} units</td>
                            <td className="px-4 py-3 font-semibold text-emerald-600">{item.conversionRatePct}%</td>
                            <td className="px-4 py-3 text-purple-600 font-medium text-[11px]">
                              View in Partner App →
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Programme Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Module Opt-In Rate</span>
                <div className="text-xl font-bold text-slate-900">{optInRate}%</div>
                <span className="text-[10px] text-purple-600 font-medium">Target: 30% (Achieved)</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Total Referral Fees Paid</span>
                <div className="text-xl font-bold text-purple-700">Rs 1,48,200</div>
                <span className="text-[10px] text-slate-400">Directly into technician accounts</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Opt-Out Penalties</span>
                <div className="text-xl font-bold text-emerald-600">0</div>
                <span className="text-[10px] text-slate-400">Strictly zero penalty</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Service Pay Parity</span>
                <div className="text-xl font-bold text-emerald-600">100%</div>
                <span className="text-[10px] text-slate-400">Identical fee regardless of outcome</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
              <span className="font-semibold block">Sales-Module Cohort Performance (Informational Only):</span>
              <p className="text-[11px] leading-relaxed">
                Technicians enrolled in referral earning achieve higher monthly partner retention. As per <strong>Guardrail G5</strong>, sales conversion performance is never an input to job assignment algorithms.
              </p>
            </div>
          </div>
        )}

        {/* TAB 8: UNIT ECONOMICS MODULE (Section 12 - Mandatory Default Table) */}
        {activeTab === 'economics' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Unit Economics & Channel Contribution Module
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive financial model simulating conversion, margins, and subventions
                </p>
              </div>
            </div>

            {/* Interactive Inputs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Eligible Visits:</label>
                <input
                  type="number"
                  value={econVisits}
                  onChange={(e) => setEconVisits(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Conversion Rate ({(econConversion * 100).toFixed(1)}%):</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.10"
                  step="0.01"
                  value={econConversion}
                  onChange={(e) => setEconConversion(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Average Ticket (INR):</label>
                <input
                  type="number"
                  value={econTicket}
                  onChange={(e) => setEconTicket(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={brandFundsSubvention}
                    onChange={(e) => setBrandFundsSubvention(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span>Brand Funds Subvention</span>
                </label>
              </div>
            </div>

            {/* Calculated Output Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Replacement Sales</span>
                <div className="text-xl font-bold text-slate-900">{econOutputs.salesCount} units</div>
                <span className="text-[10px] text-slate-400">Total volume: {formatIndianCurrency(econOutputs.salesValue)}</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">UC Margin (10%)</span>
                <div className="text-xl font-bold text-slate-900">{formatIndianCurrency(econOutputs.ucMargin)}</div>
                <span className="text-[10px] text-slate-400">Channel revenue</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-slate-500 font-medium">Partner Incentive (3%)</span>
                <div className="text-xl font-bold text-purple-700">{formatIndianCurrency(econOutputs.incentiveCost)}</div>
                <span className="text-[10px] text-slate-400">Referral payout</span>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-xs space-y-1">
                <span className="text-purple-800 font-medium">Net Contribution</span>
                <div className="text-xl font-bold text-purple-900">{formatIndianCurrency(econOutputs.netContribution)}</div>
                <span className="text-[10px] text-purple-700 font-semibold">
                  {brandFundsSubvention ? 'Brand bears subvention' : 'UC bears 4% subvention'}
                </span>
              </div>
            </div>

            {/* Sourced Benchmark Table (Section 12 Specification Matrix) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">
                  Case 12 Sourced Benchmark Model (1,000 Visits @ Rs 48,500 Ticket)
                </span>
                <span className="text-slate-400 text-[11px]">Exact Reproduction Matrix</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Conversion</th>
                      <th className="px-4 py-3">Sales</th>
                      <th className="px-4 py-3">Sales Value</th>
                      <th className="px-4 py-3">Margin 10%</th>
                      <th className="px-4 py-3">Incentive 3%</th>
                      <th className="px-4 py-3">Net (UC Bears 4%)</th>
                      <th className="px-4 py-3">Net (Brand Funds)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">3%</td>
                      <td className="px-4 py-3">30</td>
                      <td className="px-4 py-3">{formatIndianCurrency(1455000)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(145500)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(43650)}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatIndianCurrency(43650)}</td>
                      <td className="px-4 py-3 font-bold text-purple-700">{formatIndianCurrency(101850)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 bg-purple-50/20">
                      <td className="px-4 py-3 font-bold text-slate-900">5% (Default)</td>
                      <td className="px-4 py-3">50</td>
                      <td className="px-4 py-3">{formatIndianCurrency(2425000)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(242500)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(72750)}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatIndianCurrency(72750)}</td>
                      <td className="px-4 py-3 font-bold text-purple-700">{formatIndianCurrency(169750)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">8%</td>
                      <td className="px-4 py-3">80</td>
                      <td className="px-4 py-3">{formatIndianCurrency(3880000)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(388000)}</td>
                      <td className="px-4 py-3">{formatIndianCurrency(116400)}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatIndianCurrency(116400)}</td>
                      <td className="px-4 py-3 font-bold text-purple-700">{formatIndianCurrency(271600)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 italic">
                {ECONOMICS_DISCLAIMER}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
