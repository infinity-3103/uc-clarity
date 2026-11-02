import React from 'react';

interface ApplianceArtProps {
  type: string;
  brand?: string;
  className?: string;
}

export const ApplianceArt: React.FC<ApplianceArtProps> = ({ type, brand, className = 'w-full h-44' }) => {
  const normType = type.toLowerCase();

  if (normType.includes('ac')) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl overflow-hidden p-3 ${className}`}>
        <svg viewBox="0 0 280 140" className="w-full h-full max-h-36 drop-shadow-md select-none">
          <defs>
            <linearGradient id="ac-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="ac-air" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </linearGradient>
          </defs>

          {/* AC Main Indoor Unit Chassis */}
          <rect x="20" y="24" width="240" height="74" rx="8" fill="url(#ac-body)" stroke="#cbd5e1" strokeWidth="1.5" />
          
          {/* Top Air Intake Grille Lines */}
          <line x1="36" y1="32" x2="244" y2="32" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="36" y1="36" x2="244" y2="36" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />

          {/* Bottom Airflow Deflector Vane */}
          <rect x="25" y="82" width="230" height="12" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <line x1="30" y1="88" x2="250" y2="88" stroke="#cbd5e1" strokeWidth="1" />

          {/* Digital LED Display */}
          <rect x="180" y="44" width="46" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="195" y="59" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">24°C</text>
          <circle cx="218" cy="51" r="2" fill="#22c55e" />

          {/* Brand Logo Stamp */}
          <text x="38" y="58" fill="#475569" fontSize="10" fontWeight="bold" letterSpacing="1">
            {brand ? brand.toUpperCase() : '5-STAR INVERTER'}
          </text>
          <text x="38" y="70" fill="#0284c7" fontSize="7" fontWeight="semibold">
            DUAL INVERTER COPPER
          </text>

          {/* BEE 5-Star Tag */}
          <g transform="translate(140, 48)">
            <rect x="0" y="0" width="28" height="15" rx="2" fill="#ef4444" />
            <text x="14" y="11" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle">★ 5.0</text>
          </g>

          {/* Airflow Breeze Wave */}
          <path d="M 40,98 Q 90,118 140,105 Q 190,122 240,102" fill="none" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
          <path d="M 60,106 Q 110,126 160,113 Q 210,128 230,112" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      </div>
    );
  }

  if (normType.includes('fridge')) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl overflow-hidden p-3 ${className}`}>
        <svg viewBox="0 0 160 200" className="w-full h-full max-h-36 drop-shadow-md select-none">
          <defs>
            <linearGradient id="fridge-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="25%" stopColor="#64748b" />
              <stop offset="60%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="handle-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Refrigerator Body Cabinet */}
          <rect x="25" y="12" width="110" height="176" rx="6" fill="url(#fridge-body)" stroke="#334155" strokeWidth="1.5" />

          {/* Top Freezer Door */}
          <rect x="28" y="15" width="104" height="60" rx="4" fill="url(#fridge-body)" stroke="#1e293b" strokeWidth="1" />

          {/* Bottom Fridge Door */}
          <rect x="28" y="78" width="104" height="106" rx="4" fill="url(#fridge-body)" stroke="#1e293b" strokeWidth="1" />

          {/* Door Handles */}
          <rect x="32" y="55" width="4" height="16" rx="1.5" fill="url(#handle-grad)" />
          <rect x="32" y="84" width="4" height="24" rx="1.5" fill="url(#handle-grad)" />

          {/* Smart Inverter LED / Water Dispenser Panel */}
          <rect x="44" y="30" width="30" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
          <text x="48" y="42" fill="#38bdf8" fontSize="8" fontFamily="monospace">-18°C</text>
          <text x="64" y="42" fill="#22c55e" fontSize="6" fontFamily="monospace">3°C</text>

          {/* Brand Emblem */}
          <text x="80" y="26" fill="#e2e8f0" fontSize="7" fontWeight="bold" textAnchor="middle">
            {brand ? brand.slice(0, 10).toUpperCase() : 'INVERTER'}
          </text>

          {/* BEE Star Sticker */}
          <rect x="100" y="24" width="16" height="12" rx="1" fill="#ef4444" />
          <text x="108" y="32" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">5★</text>
        </svg>
      </div>
    );
  }

  if (normType.includes('washer')) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl overflow-hidden p-3 ${className}`}>
        <svg viewBox="0 0 160 180" className="w-full h-full max-h-36 drop-shadow-md select-none">
          <defs>
            <linearGradient id="washer-chassis" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <radialGradient id="drum-glass" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Washer Outer Chassis */}
          <rect x="20" y="14" width="120" height="152" rx="8" fill="url(#washer-chassis)" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Top Control Panel Band */}
          <rect x="24" y="18" width="112" height="34" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
          
          {/* Detergent Drawer */}
          <rect x="28" y="24" width="28" height="20" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="32" y1="34" x2="52" y2="34" stroke="#94a3b8" strokeWidth="1" />

          {/* Program Dial */}
          <circle cx="78" cy="34" r="10" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="78" y1="34" x2="78" y2="28" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Digital Screen */}
          <rect x="94" y="24" width="38" height="20" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
          <text x="100" y="38" fill="#38bdf8" fontSize="8" fontFamily="monospace">45m</text>
          <circle cx="124" cy="32" r="1.5" fill="#22c55e" />

          {/* Front Load Glass Door Ring */}
          <circle cx="80" cy="108" r="44" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <circle cx="80" cy="108" r="38" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="80" cy="108" r="32" fill="url(#drum-glass)" />

          {/* Stainless Drum Texture & Bubbles */}
          <circle cx="80" cy="108" r="20" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="72" cy="116" r="3" fill="rgba(255,255,255,0.6)" />
          <circle cx="84" cy="120" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="88" cy="112" r="4" fill="rgba(255,255,255,0.4)" />

          {/* Handle Grip Notch */}
          <rect x="114" y="103" width="5" height="12" rx="2" fill="#334155" />
        </svg>
      </div>
    );
  }

  if (normType.includes('purifier')) {
    return (
      <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl overflow-hidden p-3 ${className}`}>
        <svg viewBox="0 0 160 190" className="w-full h-full max-h-36 drop-shadow-md select-none">
          <defs>
            <linearGradient id="ro-body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="ro-water" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Purifier Body Housing */}
          <rect x="25" y="14" width="110" height="160" rx="10" fill="url(#ro-body)" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Top Filter Chamber Cover */}
          <path d="M 25,24 Q 80,14 135,24 L 135,70 L 25,70 Z" fill="#0f172a" />
          <text x="80" y="38" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
            UC NATIVE RO
          </text>
          <text x="80" y="48" fill="#38bdf8" fontSize="6.5" textAnchor="middle">
            2-YEAR FILTER LIFE
          </text>

          {/* UV Halo Ring & TDS Monitor */}
          <circle cx="80" cy="58" r="5" fill="#38bdf8" opacity="0.85" />
          <text x="80" y="60.5" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">UV</text>

          {/* Water Storage Window with Live Level */}
          <rect x="42" y="78" width="76" height="66" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
          <rect x="44" y="96" width="72" height="46" rx="4" fill="url(#ro-water)" opacity="0.85" />
          <text x="80" y="122" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
            8 Litres Pure
          </text>

          {/* Dispenser Spout */}
          <rect x="74" y="148" width="12" height="12" rx="2" fill="#64748b" />
          <path d="M 77,160 L 83,160 L 80,166 Z" fill="#0284c7" />

          {/* Bottom Tray */}
          <rect x="35" y="166" width="90" height="6" rx="2" fill="#94a3b8" />
        </svg>
      </div>
    );
  }

  // Fallback: Geyser / Water Heater
  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/90 rounded-xl overflow-hidden p-3 ${className}`}>
      <svg viewBox="0 0 160 190" className="w-full h-full max-h-36 drop-shadow-md select-none">
        <defs>
          <linearGradient id="geyser-body" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        {/* Storage Geyser Cylinder Body */}
        <rect x="35" y="18" width="90" height="140" rx="28" fill="url(#geyser-body)" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Central Display / Temp Dial */}
        <circle cx="80" cy="80" r="22" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="80" cy="80" r="16" fill="#1e293b" />
        <text x="80" y="84" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">65°C</text>

        {/* Status Dual LEDs (Power & Heating) */}
        <circle cx="68" cy="115" r="3" fill="#ef4444" />
        <text x="68" y="125" fill="#64748b" fontSize="5" textAnchor="middle">HEAT</text>
        <circle cx="92" cy="115" r="3" fill="#22c55e" />
        <text x="92" y="125" fill="#64748b" fontSize="5" textAnchor="middle">POWER</text>

        {/* Brand Stamp */}
        <text x="80" y="44" fill="#334155" fontSize="8" fontWeight="bold" textAnchor="middle">
          {brand ? brand.slice(0, 10).toUpperCase() : 'GEYSER'}
        </text>

        {/* Inlet & Outlet Pipes */}
        <rect x="52" y="158" width="10" height="18" rx="2" fill="#0284c7" />
        <rect x="98" y="158" width="10" height="18" rx="2" fill="#ef4444" />
        <text x="57" y="182" fill="#0284c7" fontSize="5.5" fontWeight="bold" textAnchor="middle">COLD</text>
        <text x="103" y="182" fill="#ef4444" fontSize="5.5" fontWeight="bold" textAnchor="middle">HOT</text>
      </svg>
    </div>
  );
};
