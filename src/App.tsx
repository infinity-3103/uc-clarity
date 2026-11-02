import React from 'react';
import { useStore } from './store/useStore';
import { TopBar } from './components/TopBar';
import { PhoneFrame } from './components/PhoneFrame';
import { MobileNotificationBanner } from './components/MobileNotificationBanner';
import { SimulationPanel } from './components/SimulationPanel';
import { CustomerApp } from './views/customer/CustomerApp';
import { ProfessionalApp } from './views/professional/ProfessionalApp';
import { OpsDashboard } from './views/ops/OpsDashboard';
import { MarketplaceView } from './views/marketplace/MarketplaceView';
import { DemoPersonaSwitcher } from './components/DemoPersonaSwitcher';

export const App: React.FC = () => {
  const currentRole = useStore((state) => state.currentRole);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-100 flex flex-col antialiased">
      {/* Universal Top Bar */}
      <TopBar />

      {/* Main View Area based on Role Tab */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {currentRole === 'customer' && (
          <div className="py-6 px-4 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 w-full max-w-6xl">
            <PhoneFrame title="Urban Company">
              <CustomerApp />
            </PhoneFrame>

            {/* Demo Simulation Controls on the Right */}
            <div className="w-full max-w-sm xl:w-96 xl:sticky xl:top-24 space-y-4">
              <DemoPersonaSwitcher />
            </div>
          </div>
        )}

        {currentRole === 'professional' && (
          <div className="py-6 flex flex-col items-center justify-center w-full">
            <PhoneFrame title="UC Partner">
              <ProfessionalApp />
            </PhoneFrame>
          </div>
        )}

        {currentRole === 'marketplace' && (
          <div className="w-full">
            <MarketplaceView />
          </div>
        )}

        {currentRole === 'ops' && (
          <div className="w-full">
            <OpsDashboard />
          </div>
        )}

        {currentRole === 'split' && (
          <div className="w-full py-6 px-4 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 overflow-x-auto min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                Customer Mobile Screen
              </div>
              <PhoneFrame title="Urban Company">
                <CustomerApp />
              </PhoneFrame>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Partner Mobile Screen
              </div>
              <PhoneFrame title="UC Partner">
                <ProfessionalApp />
              </PhoneFrame>
            </div>

            {/* Demo Simulation Controls on the Right */}
            <div className="w-full max-w-sm xl:w-80 xl:sticky xl:top-24 space-y-4">
              <DemoPersonaSwitcher />
            </div>
          </div>
        )}
      </main>

      {/* Desktop Notification Banner */}
      {(currentRole === 'ops' || currentRole === 'marketplace') && (
        <MobileNotificationBanner isEmbedded={false} />
      )}

      {/* Global Overlays */}
      <SimulationPanel />
    </div>
  );
};

export default App;
