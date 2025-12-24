"use client";

import MainContentCards from "@/components/Homepage/MainContentCards";
import ComingSoonSection from "@/components/Homepage/ComingSoonSection";
import NewAuctionItems from "@/components/Homepage/NewAuctionItems";
import HeroCTASection from "@/components/Homepage/HeroCTASection";
import HeroCTALgSection from "@/components/Homepage/HeroCTALgSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

/**
 * Homepage component
 * Fully responsive for mobile, tablet, and desktop
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <MainContentCards />
      <ComingSoonSection />
      <NewAuctionItems />
      
      {/* Mobile + Tablet version (shown by default, hidden on lg and above) */}
      <div className="lg:hidden">
        <HeroCTASection />
      </div>

      {/* Large desktop version (hidden by default, shown only on lg and above) */}
      <div className="container mx-auto hidden lg:block">
        <HeroCTALgSection />
      </div>
      
      <Footer />
    </div>
  );
}
