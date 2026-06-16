'use client';

import TradigloHeader from '@/components/tradiglo/TradigloHeader';
import SingaporeHero from '@/components/tradiglo/SingaporeHero';
import SingaporeRegistrationSection from '@/components/tradiglo/SingaporeRegistrationSection';
import SingaporeFooter from '@/components/tradiglo/SingaporeFooter';
import SingaporeMobileStickyBar from '@/components/tradiglo/SingaporeMobileStickyBar';
import TickerTape from '@/components/TickerTape';

export default function TradigloSingaporeLandingPage() {
  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TradigloHeader />
      {/* Spacer to push content below the fixed header */}
      <div className="h-16 md:h-20" />
      <TickerTape />
      <main>
        <SingaporeHero />
        <SingaporeRegistrationSection />
      </main>
      <SingaporeFooter />
      <SingaporeMobileStickyBar />
    </div>
  );
}
