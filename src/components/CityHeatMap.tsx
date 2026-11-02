import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { City, ApplianceType, Zone } from '../domain/types';
import { computeZoneDemand, DemandContext, DemandBand } from '../domain/demand';
import { planSalesDeployment } from '../domain/allocation';
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Activity,
  Users,
  Navigation,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface CityHeatMapProps {
  selectedCity: City;
  applianceFilter?: string;
  onSelectZone?: (zone: Zone) => void;
}

interface CityGeoConfig {
  waterways: string[];
  parks: string[];
  labels: { x: number; y: number; text: string; sub: string }[];
  zoneCoords: Record<string, { x: number; y: number; label: string }>;
}

const CITY_GEO_LAYOUTS: Record<City, CityGeoConfig> = {
  Mumbai: {
    waterways: [
      'M 0,0 L 150,0 Q 140,80 160,160 Q 180,240 150,320 Q 130,380 180,440 L 0,440 Z',
      'M 170,250 Q 210,260 230,290 Q 210,300 170,280 Z',
      'M 470,0 Q 420,120 440,240 Q 470,340 500,440 L 680,440 L 680,0 Z',
    ],
    parks: [
      'M 290,50 Q 380,60 370,160 Q 290,170 280,90 Z',
    ],
    labels: [
      { x: 50, y: 220, text: 'ARABIAN SEA', sub: 'Western Coastline' },
      { x: 580, y: 240, text: 'THANE CREEK', sub: 'Navi Mumbai Channel' },
      { x: 330, y: 110, text: 'SGNP Forest Corridor', sub: 'Green Reserve' },
    ],
    zoneCoords: {
      'Andheri': { x: 235, y: 195, label: 'Andheri West & East' },
      'Bandra': { x: 225, y: 285, label: 'Bandra & Khar' },
      'Powai': { x: 345, y: 190, label: 'Powai & Hiranandani' },
      'Thane': { x: 405, y: 110, label: 'Thane Majiwada' },
      'Navi Mumbai': { x: 440, y: 310, label: 'Vashi & Nerul' },
      'Borivali': { x: 230, y: 95, label: 'Borivali & Kandivali' },
    },
  },
  Delhi: {
    waterways: [
      'M 340,0 Q 320,110 360,200 Q 400,280 430,440 L 450,440 Q 420,280 380,200 Q 340,110 360,0 Z',
    ],
    parks: [
      'M 250,150 Q 290,180 270,310 Q 230,280 240,180 Z',
    ],
    labels: [
      { x: 395, y: 360, text: 'YAMUNA RIVER', sub: 'Trans-Yamuna Border' },
      { x: 220, y: 60, text: 'NORTH DELHI', sub: 'GT Karnal Road' },
      { x: 140, y: 390, text: 'GURUGRAM BELT', sub: 'Cyber City Expressway' },
    ],
    zoneCoords: {
      'Dwarka': { x: 165, y: 265, label: 'Dwarka Sector 6 - 21' },
      'Rohini': { x: 185, y: 115, label: 'Rohini & Pitampura' },
      'Saket': { x: 315, y: 325, label: 'Saket & Malviya Ngr' },
      'Lajpat Nagar': { x: 365, y: 255, label: 'Lajpat & South Ext' },
      'Noida': { x: 495, y: 275, label: 'Noida Sector 18 & 62' },
      'Gurugram': { x: 145, y: 365, label: 'DLF Phase 1-5' },
    },
  },
  Pune: {
    waterways: [
      'M 60,190 Q 220,200 320,230 Q 440,240 680,270 L 680,290 Q 440,260 320,250 Q 220,220 60,210 Z',
    ],
    parks: [
      'M 200,230 Q 250,220 240,290 Q 190,280 190,240 Z',
    ],
    labels: [
      { x: 130, y: 90, text: 'HINJEWADI IT PARK', sub: 'Phase 1 - 3 Tech Hub' },
      { x: 490, y: 220, text: 'MULA-MUTHA RIVER', sub: 'Confluence Belt' },
      { x: 480, y: 360, text: 'MAGARPATTA CITY', sub: 'Hadapsar Cyber Corridor' },
    ],
    zoneCoords: {
      'Kothrud': { x: 235, y: 295, label: 'Kothrud & Karve Nagar' },
      'Wakad': { x: 185, y: 135, label: 'Wakad & Pimple Saudagar' },
      'Hinjewadi': { x: 115, y: 165, label: 'Hinjewadi Tech Corridor' },
      'Hadapsar': { x: 475, y: 315, label: 'Hadapsar & Magarpatta' },
      'Baner': { x: 230, y: 195, label: 'Baner & Balewadi' },
    },
  },
  Kolkata: {
    waterways: [
      'M 260,0 Q 240,160 270,260 Q 300,360 290,440 L 320,440 Q 330,360 300,260 Q 270,160 290,0 Z',
    ],
    parks: [
      'M 330,230 Q 380,220 370,300 Q 320,310 330,240 Z',
    ],
    labels: [
      { x: 160, y: 220, text: 'HOOGHLY RIVER', sub: 'Howrah Bridge Axis' },
      { x: 470, y: 140, text: 'BIDHANNAGAR', sub: 'Salt Lake IT Parks' },
      { x: 540, y: 260, text: 'RAJARHAT / NEW TOWN', sub: 'Eco Park Zone' },
    ],
    zoneCoords: {
      'Salt Lake': { x: 435, y: 215, label: 'Salt Lake Sector I - V' },
      'New Town': { x: 535, y: 195, label: 'New Town Action Area 1-3' },
      'Howrah': { x: 205, y: 225, label: 'Howrah Station & Shibpur' },
      'Behala': { x: 295, y: 365, label: 'Behala Chowrasta & Parnasree' },
      'Dum Dum': { x: 395, y: 105, label: 'Dum Dum & Airport Ring' },
    },
  },
  Bengaluru: {
    waterways: [
      'M 420,250 Q 480,240 510,270 Q 470,290 410,270 Z',
      'M 240,70 Q 300,60 290,100 Q 230,100 240,70 Z',
    ],
    parks: [
      'M 290,200 Q 340,190 330,260 Q 280,260 290,200 Z',
    ],
    labels: [
      { x: 450, y: 240, text: 'BELLANDUR BASIN', sub: 'Lake Corridor' },
      { x: 530, y: 130, text: 'WHITEFIELD IT HUB', sub: 'ITPB Tech Zone' },
      { x: 360, y: 390, text: 'OUTER RING ROAD', sub: 'Electronic City Highway' },
    ],
    zoneCoords: {
      'Whitefield': { x: 545, y: 175, label: 'Whitefield & ITPB' },
      'Koramangala': { x: 345, y: 265, label: 'Koramangala Block 1 - 8' },
      'HSR Layout': { x: 405, y: 335, label: 'HSR Layout Sector 1 - 7' },
      'Indiranagar': { x: 375, y: 185, label: 'Indiranagar 100ft Rd' },
      'Electronic City': { x: 415, y: 395, label: 'Electronic City Phase 1-2' },
    },
  },
};

export const CityHeatMap: React.FC<CityHeatMapProps> = ({
  selectedCity,
  applianceFilter = 'ALL',
  onSelectZone,
}) => {
  const zones = useStore((state) => state.zones);
  const professionals = useStore((state) => state.professionals);
  const serviceRequests = useStore((state) => state.serviceRequests);
  const directOrders = useStore((state) => state.directOrders);
  const salesLeads = useStore((state) => state.salesLeads);
  const cityTemperatures = useStore((state) => state.cityTemperatures);
  const cityHumidity = useStore((state) => state.cityHumidity);
  const cityAQI = useStore((state) => state.cityAQI);
  const cityWaterHardness = useStore((state) => state.cityWaterHardness);
  const cityVoltageStability = useStore((state) => state.cityVoltageStability);
  const triggerPushNotification = useStore((state) => state.triggerPushNotification);

  // Time range pill: 7d, 30d, 90d (default 90d)
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(90);

  // Toggle for sales deployments
  const [showDeployments, setShowDeployments] = useState<boolean>(false);

  // Active inspected zone
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Environmental context for active city
  const currentTemp = cityTemperatures[selectedCity] ?? 34;
  const currentHumidity = cityHumidity[selectedCity] ?? 60;
  const currentAQI = cityAQI[selectedCity] ?? 120;
  const currentTDS = cityWaterHardness[selectedCity] ?? 350;
  const currentVoltage = cityVoltageStability[selectedCity] ?? 'STABLE';

  const cityZones = useMemo(
    () => zones.filter((z) => z.city === selectedCity),
    [zones, selectedCity]
  );

  const geoLayout = CITY_GEO_LAYOUTS[selectedCity] || CITY_GEO_LAYOUTS.Mumbai;

  // Demand context for computeZoneDemand
  const demandContext: DemandContext = useMemo(
    () => ({
      temp: currentTemp,
      humidity: currentHumidity,
      aqi: currentAQI,
      tds: currentTDS,
      voltage: currentVoltage,
      serviceRequests,
      directOrders,
      salesLeads,
    }),
    [
      currentTemp,
      currentHumidity,
      currentAQI,
      currentTDS,
      currentVoltage,
      serviceRequests,
      directOrders,
      salesLeads,
    ]
  );

  // Derived sales deployment plan
  const salesDeployments = useMemo(() => {
    return planSalesDeployment(professionals, zones, salesLeads, demandContext);
  }, [professionals, zones, salesLeads, demandContext]);

  // Compute demand for each zone strictly via computeZoneDemand
  const zoneCalculations = useMemo(() => {
    const category =
      applianceFilter === 'ALL' ? 'ALL' : (applianceFilter as ApplianceType);

    return cityZones.map((zone) => {
      const demandRes = computeZoneDemand(zone, category, rangeDays, demandContext);
      const demandScore = demandRes.score;
      const level: DemandBand = demandRes.level;

      const prosInZone = professionals.filter(
        (p) => p.zoneId === zone.id && p.city === selectedCity
      );
      const openLeads = salesLeads.filter(
        (l) => l.zoneId === zone.id && (category === 'ALL' || l.appliance === category)
      );

      // Deployments targeting this zone
      const incomingDeployments = salesDeployments.filter(
        (d) => d.toZoneId === zone.id
      );

      const mapped = geoLayout.zoneCoords[zone.name] || {
        x: zone.x || 300,
        y: zone.y || 200,
        label: zone.name,
      };

      // Single-hue purple gradient styling
      let fillClass = 'rgba(147, 51, 234, 0.18)'; // Low: soft lavender
      let strokeColor = '#c084fc';
      let badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
      let radius = 48;

      if (level === 'High') {
        fillClass = 'rgba(107, 33, 168, 0.65)'; // High: deep vivid purple
        strokeColor = '#581c87';
        badgeBg = 'bg-purple-900 text-purple-100 border-purple-950';
        radius = 68;
      } else if (level === 'Medium') {
        fillClass = 'rgba(126, 34, 206, 0.38)'; // Medium: medium purple
        strokeColor = '#7e22ce';
        badgeBg = 'bg-purple-100 text-purple-800 border-purple-300';
        radius = 56;
      }

      return {
        zone,
        name: zone.name,
        displayName: mapped.label,
        x: mapped.x,
        y: mapped.y,
        demandScore,
        level,
        multiplier: demandRes.multiplier,
        prosInZone,
        activeProsCount: prosInZone.length,
        openLeadsCount: openLeads.length,
        openLeads,
        incomingDeployments,
        fillClass,
        strokeColor,
        badgeBg,
        radius,
      };
    });
  }, [
    cityZones,
    applianceFilter,
    rangeDays,
    demandContext,
    professionals,
    salesLeads,
    salesDeployments,
    selectedCity,
    geoLayout,
  ]);

  const activeZoneData = useMemo(() => {
    if (!activeZoneId) return zoneCalculations[0] || null;
    return zoneCalculations.find((z) => z.zone.id === activeZoneId) || zoneCalculations[0];
  }, [activeZoneId, zoneCalculations]);

  const hoveredZoneData = useMemo(() => {
    if (!hoveredZoneId) return null;
    return zoneCalculations.find((z) => z.zone.id === hoveredZoneId) || null;
  }, [hoveredZoneId, zoneCalculations]);

  const inspectedZone = hoveredZoneData || activeZoneData;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col text-slate-800">
      {/* Top Map Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>{selectedCity} Demand Heatmap</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Single-Hue Demand
              </span>
            </h3>
          </div>
          {/* Compact Sensor Telemetry (single compact line) */}
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Weather: {currentTemp}°C • {currentHumidity}% RH • {currentAQI} AQI • {currentTDS} TDS | {directOrders.length} Orders | {salesLeads.length} Leads
          </p>
        </div>

        {/* Controls: Time Range Pills & Sales Deployments Toggle */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Time Range Pills: 7d, 30d, 90d */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
            {([7, 30, 90] as (7 | 30 | 90)[]).map((days) => (
              <button
                key={days}
                onClick={() => setRangeDays(days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  rangeDays === days
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          {/* Show Sales Deployments Toggle */}
          <button
            onClick={() => setShowDeployments(!showDeployments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showDeployments
                ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${showDeployments ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Show Deployments</span>
            {showDeployments && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Zone Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* SVG Geographic Map Canvas */}
        <div className="lg:col-span-2 relative bg-slate-50/50 p-2 min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
          <svg
            viewBox="0 0 680 440"
            className="w-full h-full max-h-[500px] select-none"
          >
            <defs>
              <pattern id="light-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Background Canvas */}
            <rect width="680" height="440" fill="#F8FAFC" />
            <rect width="680" height="440" fill="url(#light-grid)" />

            {/* Geographical Waterways */}
            {geoLayout.waterways.map((d, idx) => (
              <path
                key={`water-${idx}`}
                d={d}
                fill="#E0F2FE"
                stroke="#BAE6FD"
                strokeWidth="1.2"
                opacity="0.9"
              />
            ))}

            {/* Geographical Green Belts & Parks */}
            {geoLayout.parks.map((d, idx) => (
              <path
                key={`park-${idx}`}
                d={d}
                fill="#DCFCE7"
                stroke="#BBF7D0"
                strokeWidth="1.2"
                opacity="0.85"
              />
            ))}

            {/* Geographical Map Labels */}
            {geoLayout.labels.map((lbl, idx) => (
              <g key={`lbl-${idx}`} transform={`translate(${lbl.x}, ${lbl.y})`} className="pointer-events-none">
                <text
                  fill="#94A3B8"
                  fontSize="9"
                  fontWeight="bold"
                  letterSpacing="1.2"
                  textAnchor="middle"
                >
                  {lbl.text}
                </text>
                <text
                  fill="#CBD5E1"
                  fontSize="7.5"
                  dy="10"
                  textAnchor="middle"
                >
                  {lbl.sub}
                </text>
              </g>
            ))}

            {/* Soft Rounded Zone Demand Circles (Single-Hue Deep Purple Gradient) */}
            {zoneCalculations.map((z) => {
              const isSelected = activeZoneData?.zone.id === z.zone.id;

              return (
                <g key={`zone-circle-${z.zone.id}`}>
                  {/* Soft Single-Hue Purple Demand Blob */}
                  <circle
                    cx={z.x}
                    cy={z.y}
                    r={z.radius}
                    fill={z.fillClass}
                    className="transition-all duration-500"
                  />

                  {/* Soft Boundary Ring */}
                  <circle
                    cx={z.x}
                    cy={z.y}
                    r={z.radius}
                    fill="none"
                    stroke={z.strokeColor}
                    strokeWidth={isSelected ? '2' : '1'}
                    opacity={isSelected ? 0.9 : 0.4}
                  />
                </g>
              );
            })}

            {/* Zone Markers with Name and Score */}
            {zoneCalculations.map((z) => {
              const isSelected = activeZoneData?.zone.id === z.zone.id;
              const hasDeployments = showDeployments && z.incomingDeployments.length > 0;

              return (
                <g
                  key={`marker-${z.zone.id}`}
                  transform={`translate(${z.x}, ${z.y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setActiveZoneId(z.zone.id);
                    onSelectZone?.(z.zone);
                  }}
                  onMouseEnter={() => setHoveredZoneId(z.zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  {/* Outer Click Boundary */}
                  <circle r="36" fill="transparent" />

                  {/* Core Node Circle */}
                  <circle
                    r="15"
                    fill="#FFFFFF"
                    stroke={isSelected ? '#6B21A8' : z.strokeColor}
                    strokeWidth={isSelected ? '3' : '2'}
                    className="filter drop-shadow-sm group-hover:scale-105 transition-transform"
                  />

                  {/* Demand Score Inside Node */}
                  <text
                    y="4"
                    fill={z.level === 'High' ? '#581C87' : '#6B21A8'}
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {z.demandScore}
                  </text>

                  {/* Zone Name Badge */}
                  <g transform="translate(0, 24)" className="pointer-events-none">
                    <rect
                      x="-44"
                      y="-7"
                      width="88"
                      height="15"
                      rx="4"
                      fill={isSelected ? '#581C87' : '#FFFFFF'}
                      stroke={isSelected ? '#3B0764' : '#E2E8F0'}
                      strokeWidth="1"
                      className="filter drop-shadow-xs"
                    />
                    <text
                      y="4"
                      fill={isSelected ? '#FFFFFF' : '#1E293B'}
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {z.name}
                    </text>
                  </g>

                  {/* Sales Deployments Badge if toggle active and incoming partners exist */}
                  {hasDeployments && (
                    <g transform="translate(0, -23)" className="pointer-events-none">
                      <rect
                        x="-38"
                        y="-7"
                        width="76"
                        height="15"
                        rx="4"
                        fill="#7C3AED"
                        stroke="#6D28D9"
                        strokeWidth="1"
                        className="filter drop-shadow-sm"
                      />
                      <text
                        y="4"
                        fill="#FFFFFF"
                        fontSize="7.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        +{z.incomingDeployments.length} {z.incomingDeployments[0].bestCategory}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Quick Map Footer Note */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[11px] text-slate-500">
            <span className="bg-white/90 px-2.5 py-1 rounded-lg backdrop-blur border border-slate-200 shadow-xs">
              Click any zone to inspect micro-demand and trigger pro repositioning
            </span>
            <span className="bg-white/90 px-2 py-1 rounded-lg font-semibold text-purple-700 backdrop-blur border border-slate-200 shadow-xs">
              {rangeDays}d Window
            </span>
          </div>
        </div>

        {/* Rounded Tooltip / Selected Zone Inspection Drawer */}
        {inspectedZone && (
          <div className="bg-white p-5 flex flex-col justify-between space-y-4 text-xs border-l border-slate-100">
            <div className="space-y-4">
              {/* Zone Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-purple-600" />
                    <h4 className="font-bold text-sm text-slate-900">{inspectedZone.displayName}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Zone ID: <span className="font-mono text-purple-600">{inspectedZone.zone.id}</span>
                  </p>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${inspectedZone.badgeBg}`}>
                  {inspectedZone.level} ({inspectedZone.demandScore}/100)
                </div>
              </div>

              {/* Demand Details & Open Leads */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Micro-Demand Telemetry:
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-slate-500">Weather Multiplier:</span>
                    <div className="text-sm font-bold text-purple-700 font-mono">
                      {inspectedZone.multiplier}x
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Sensor: {currentTemp}°C, {currentHumidity}% RH
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-slate-500">Open Survey Leads:</span>
                    <div className="text-sm font-bold text-indigo-700 font-mono">
                      {inspectedZone.openLeadsCount} Leads
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Identified from surveys
                    </p>
                  </div>
                </div>
              </div>

              {/* Stationed Professionals */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Stationed Partners:
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {inspectedZone.activeProsCount} Active
                  </span>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {inspectedZone.prosInZone.length === 0 ? (
                    <div className="text-slate-400 text-xs italic p-2 bg-slate-50 rounded-lg">
                      No technicians stationed in this zone.
                    </div>
                  ) : (
                    inspectedZone.prosInZone.map((pro) => (
                      <div
                        key={pro.id}
                        className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-slate-900">{pro.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span>★ {pro.rating}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                            {pro.skills[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Incoming Sales Deployments */}
              {showDeployments && inspectedZone.incomingDeployments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                    Incoming Sales Deployments ({inspectedZone.incomingDeployments.length}):
                  </span>
                  <div className="space-y-1">
                    {inspectedZone.incomingDeployments.map((d) => (
                      <div
                        key={d.partnerId}
                        className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-900 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold">{d.partnerName}</div>
                          <div className="text-[10px] text-purple-700">
                            From {d.fromZoneName} • Category: {d.bestCategory} (Rank #{d.rank})
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-200 rounded">
                          {d.demandScore}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Repositioning Alert Action Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  triggerPushNotification({
                    title: `Repositioning Alert for ${inspectedZone.name}`,
                    body: `Operations dispatching nearest idle technician to ${inspectedZone.name} to balance demand.`,
                    appTitle: 'UC Operations',
                  });
                }}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rebalance & Reposition to {inspectedZone.name}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
