import React from 'react';
import { useStore } from '../store/useStore';
import { City } from '../domain/types';
import {
  X,
  Calendar,
  Thermometer,
  MapPin,
  Droplets,
  Wind,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';

export const SimulationPanel: React.FC = () => {
  const isSimPanelOpen = useStore((state) => state.isSimPanelOpen);
  const toggleSimPanel = useStore((state) => state.toggleSimPanel);
  const simulatedDate = useStore((state) => state.simulatedDate);
  const setSimulatedDate = useStore((state) => state.setSimulatedDate);
  const simulatedCity = useStore((state) => state.simulatedCity);
  const setSimulatedCity = useStore((state) => state.setSimulatedCity);
  const cityTemperatures = useStore((state) => state.cityTemperatures);
  const setCityTemperature = useStore((state) => state.setCityTemperature);
  const cityHumidity = useStore((state) => state.cityHumidity);
  const setCityHumidity = useStore((state) => state.setCityHumidity);
  const cityAQI = useStore((state) => state.cityAQI);
  const setCityAQI = useStore((state) => state.setCityAQI);
  const cityWaterHardness = useStore((state) => state.cityWaterHardness);
  const setCityWaterHardness = useStore((state) => state.setCityWaterHardness);
  const cityVoltageStability = useStore((state) => state.cityVoltageStability);
  const setCityVoltageStability = useStore((state) => state.setCityVoltageStability);
  const applySimulationScenario = useStore((state) => state.applySimulationScenario);

  if (!isSimPanelOpen) return null;

  const cities: City[] = ['Delhi', 'Mumbai', 'Pune', 'Kolkata', 'Bengaluru'];
  const currentTemp = cityTemperatures[simulatedCity] ?? 34;
  const currentHumidity = cityHumidity[simulatedCity] ?? 60;
  const currentAQI = cityAQI[simulatedCity] ?? 120;
  const currentHardness = cityWaterHardness[simulatedCity] ?? 350;
  const currentVoltage = cityVoltageStability[simulatedCity] ?? 'STABLE';

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <div>
          <h3 className="font-semibold text-sm">Simulation Control Panel</h3>
          <p className="text-xs text-amber-400">Prototype: simulated data</p>
        </div>
        <button
          onClick={toggleSimPanel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6 flex-1 overflow-y-auto text-sm">
        {/* City Selector */}
        <div className="space-y-2">
          <label className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" />
            Active Region / City
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSimulatedCity(city)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                  simulatedCity === city
                    ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {city} ({cityTemperatures[city]}°C)
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Selected city drives the current perspective in mobile previews and GIS hot zone maps.
          </p>
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <label className="font-medium text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Simulated Date
          </label>
          <input
            type="date"
            value={simulatedDate}
            onChange={(e) => setSimulatedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setSimulatedDate('2026-03-10')}
              className="text-[11px] px-2 py-1 bg-slate-100 rounded border hover:bg-slate-200"
            >
              10 Mar (Pre-summer)
            </button>
            <button
              onClick={() => setSimulatedDate('2026-05-15')}
              className="text-[11px] px-2 py-1 bg-slate-100 rounded border hover:bg-slate-200"
            >
              15 May (Peak Summer)
            </button>
            <button
              onClick={() => setSimulatedDate('2026-12-25')}
              className="text-[11px] px-2 py-1 bg-slate-100 rounded border hover:bg-slate-200"
            >
              25 Dec (Winter)
            </button>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-500" />
              Outside Temperature ({simulatedCity})
            </label>
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                currentTemp >= 40
                  ? 'bg-rose-100 text-rose-800'
                  : currentTemp >= 35
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentTemp}°C
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="48"
            step="1"
            value={currentTemp}
            onChange={(e) => setCityTemperature(simulatedCity, Number(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>20°C (Mild)</span>
            <span>35°C (Warm)</span>
            <span className="text-rose-600 font-semibold">40°C+ (Heatwave Surge)</span>
            <span>48°C</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Temperatures at or above 40°C trigger heatwave alert push notifications and spike AC/Fridge service and replacement demand.
          </p>
        </div>

        {/* Humidity (%) Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-500" />
              Relative Humidity ({simulatedCity})
            </label>
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                currentHumidity >= 80
                  ? 'bg-cyan-100 text-cyan-900 font-bold'
                  : currentHumidity >= 65
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentHumidity}% RH
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="95"
            step="1"
            value={currentHumidity}
            onChange={(e) => setCityHumidity(simulatedCity, Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>20% (Dry)</span>
            <span>60% (Moderate)</span>
            <span className="text-cyan-700 font-semibold">80%+ (Monsoon Surge)</span>
            <span>95%</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Humidity above 80% auto-triggers push notifications and accelerates Washing Machine & AC dehumidification service loads on the heatmap.
          </p>
        </div>

        {/* Air Quality Index (AQI) Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Wind className="w-4 h-4 text-amber-500" />
              Air Quality Index (AQI)
            </label>
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                currentAQI >= 300
                  ? 'bg-rose-100 text-rose-800'
                  : currentAQI >= 150
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentAQI} AQI
            </span>
          </div>

          <input
            type="range"
            min="30"
            max="480"
            step="5"
            value={currentAQI}
            onChange={(e) => setCityAQI(simulatedCity, Number(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>30 (Good)</span>
            <span>150 (Moderate)</span>
            <span className="text-rose-600 font-semibold">300+ (Severe Hazardous)</span>
            <span>480</span>
          </div>
          <p className="text-[11px] text-slate-500">
            AQI &gt;= 300 triggers hazardous smog push notifications, driving air purifier filter replacement orders and AMC contracts.
          </p>
        </div>

        {/* Water Hardness (TDS ppm) Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Water Hardness / TDS
            </label>
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                currentHardness >= 800
                  ? 'bg-blue-100 text-blue-900 font-bold'
                  : currentHardness >= 500
                  ? 'bg-slate-100 text-slate-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentHardness} ppm TDS
            </span>
          </div>

          <input
            type="range"
            min="80"
            max="1200"
            step="20"
            value={currentHardness}
            onChange={(e) => setCityWaterHardness(simulatedCity, Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>80 (Soft)</span>
            <span>400 (Moderate)</span>
            <span className="text-blue-800 font-semibold">800+ ppm (Severe Scaling)</span>
            <span>1200</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Hard water &gt;= 800 ppm causes rapid calcium scaling on geyser elements and RO membrane degradation, driving replacement demand.
          </p>
        </div>

        {/* Power Grid Voltage Stability */}
        <div className="space-y-2">
          <label className="font-medium text-slate-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Power Grid Voltage Stability
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['STABLE', 'MODERATE', 'SEVERE'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setCityVoltageStability(simulatedCity, level)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  currentVoltage === level
                    ? level === 'SEVERE'
                      ? 'border-rose-600 bg-rose-50 text-rose-900'
                      : level === 'MODERATE'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {level === 'STABLE' ? 'Stable (230V)' : level === 'MODERATE' ? 'Moderate Spikes' : 'Severe Surges'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Severe grid voltage instability causes compressor capacitor and inverter PCB burnouts across appliances.
          </p>
        </div>

        {/* 1-Click Scenario Presets */}
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200/80 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-purple-950">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Automated Simulation Scenarios (Auto-triggers Push & Map)</span>
          </div>
          <p className="text-purple-800 text-[11px] leading-snug">
            Trigger presets that simultaneously update environmental metrics, recalculate GIS heatmaps, and send push notifications with sound.
          </p>

          <div className="space-y-1.5">
            <button
              onClick={() => applySimulationScenario('HEATWAVE')}
              className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-xs shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span>☀️ Peak Heatwave (42°C, 38% RH)</span>
              <span className="text-[10px] bg-purple-800/60 px-1.5 py-0.5 rounded">AC Surge</span>
            </button>

            <button
              onClick={() => applySimulationScenario('MONSOON_HUMID')}
              className="w-full py-2 px-3 bg-cyan-700 hover:bg-cyan-800 text-white font-medium rounded-xl text-xs shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span>🌧️ Monsoon Surge (92% RH, Severe Grid)</span>
              <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.5 rounded">Washer / AC</span>
            </button>

            <button
              onClick={() => applySimulationScenario('SEVERE_POLLUTION')}
              className="w-full py-2 px-3 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl text-xs shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span>🌫️ Severe Smog Crisis (350 AQI)</span>
              <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.5 rounded">Purifiers</span>
            </button>

            <button
              onClick={() => applySimulationScenario('HARD_WATER')}
              className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-xl text-xs shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span>🧪 Hard Water Crisis (950 ppm TDS)</span>
              <span className="text-[10px] bg-blue-900/60 px-1.5 py-0.5 rounded">Geyser / RO</span>
            </button>

            <button
              onClick={() => applySimulationScenario('POWER_FLUCTUATION')}
              className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded-xl text-xs shadow-sm transition-all text-left flex items-center justify-between"
            >
              <span>⚡ Power Grid Surge (Severe Voltage Spikes)</span>
              <span className="text-[10px] bg-rose-900/60 px-1.5 py-0.5 rounded">PCB Burnout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
