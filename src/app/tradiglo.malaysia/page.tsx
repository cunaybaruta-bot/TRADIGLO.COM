'use client';

import TradigloHeader from '@/components/tradiglo/TradigloHeader';
import MalaysiaHero from '@/components/tradiglo/MalaysiaHero';
import TrustBar from '@/components/tradiglo/TrustBar';
import RegistrationSection from '@/components/tradiglo/RegistrationSection';
import TradigloFooter from '@/components/tradiglo/TradigloFooter';
import MobileStickyBar from '@/components/tradiglo/MobileStickyBar';
import TickerTape from '@/components/TickerTape';

export default function TradigloMalaysiaLandingPage() {
  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TradigloHeader />
      {/* Spacer to push content below the fixed header (h-16 on mobile, h-20 on md+) */}
      <div className="h-16 md:h-20" />
      <TickerTape />
      <main>
        <MalaysiaHero />
        <TrustBar />
        <RegistrationSection />
      </main>
      <TradigloFooter />
      <MobileStickyBar />
    </div>
  );
}
