import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import TickerTape from '@/components/TickerTape';
import MarketsTable from '@/components/MarketsTable';
import Footer from '@/components/Footer';
import ActivityPopup from '@/components/ActivityPopup';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      <TickerTape />
      <HeroSection />
      <main className="flex-1">
        <MarketsTable />
      </main>
      <Footer />
      <ActivityPopup />
    </div>
  );
}
