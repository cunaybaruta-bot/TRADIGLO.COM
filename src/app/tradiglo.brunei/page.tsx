'use client';

import TradigloHeader from '@/components/tradiglo/TradigloHeader';
import BruneiHero from '@/components/tradiglo/BruneiHero';
import BruneiRegistrationSection from '@/components/tradiglo/BruneiRegistrationSection';
import BruneiFooter from '@/components/tradiglo/BruneiFooter';
import BruneiMobileStickyBar from '@/components/tradiglo/BruneiMobileStickyBar';
import TickerTape from '@/components/TickerTape';

export default function TradigloBruneiLandingPage() {
  return (
    <div className="min-h-screen bg-[#07091F] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TradigloHeader />
      {/* Spacer to push content below the fixed header (h-16 on mobile, h-20 on md+) */}
      <div className="h-16 md:h-20" />
      <TickerTape />
      <main>
        <BruneiHero />
        <BruneiRegistrationSection />
      </main>
      <BruneiFooter />
      <BruneiMobileStickyBar />
    </div>
  );
}
