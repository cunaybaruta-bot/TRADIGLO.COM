'use client';

import TradigloHeader from '@/components/tradiglo/TradigloHeader';
import TradigloHero from '@/components/tradiglo/TradigloHero';
import TrustBar from '@/components/tradiglo/TrustBar';
import ProblemSection from '@/components/tradiglo/ProblemSection';
import SolutionSection from '@/components/tradiglo/SolutionSection';
import SignalPreview from '@/components/tradiglo/SignalPreview';
import WhatsAppChannel from '@/components/tradiglo/WhatsAppChannel';
import RegistrationSection from '@/components/tradiglo/RegistrationSection';
import HowItWorks from '@/components/tradiglo/HowItWorks';
import PerformanceSection from '@/components/tradiglo/PerformanceSection';
import BenefitsSection from '@/components/tradiglo/BenefitsSection';
import AudienceFit from '@/components/tradiglo/AudienceFit';
import FAQSection from '@/components/tradiglo/FAQSection';
import FinalCTA from '@/components/tradiglo/FinalCTA';
import TradigloFooter from '@/components/tradiglo/TradigloFooter';
import MobileStickyBar from '@/components/tradiglo/MobileStickyBar';

export default function TradigloLandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <TradigloHeader />
      <main>
        <TradigloHero />
        <TrustBar />
        <ProblemSection />
        <SolutionSection />
        <SignalPreview />
        <WhatsAppChannel />
        <RegistrationSection />
        <HowItWorks />
        <PerformanceSection />
        <BenefitsSection />
        <AudienceFit />
        <FAQSection />
        <FinalCTA />
      </main>
      <TradigloFooter />
      <MobileStickyBar />
    </div>
  );
}
