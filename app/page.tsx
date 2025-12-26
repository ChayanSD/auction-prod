"use client";

import MainContentCards from "@/components/Homepage/MainContentCards";
import ComingSoonSection from "@/components/Homepage/ComingSoonSection";
import NewAuctionItems from "@/components/Homepage/NewAuctionItems";
import NewAuctionItemsSection from "@/components/Homepage/NewAuctionItemsSection";
import HeroCTASection from "@/components/Homepage/HeroCTASection";
import HeroCTALgSection from "@/components/Homepage/HeroCTALgSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

/**
 * Homepage component
 * Pixel-perfect design matching Figma
 * Mobile: 375px width, vertical stacking
 * Desktop: 1440px width, horizontal layouts
 * Fixed: No double scrollbars, proper overflow handling
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden lg:overflow-y-hidden w-full px-4 py-4 md:px-0 md:py-0">
      <Header />
      <MainContentCards />
      <ComingSoonSection />
      <NewAuctionItems />
      <NewAuctionItemsSection />
      
      {/* Mobile + Tablet version (shown by default, hidden on lg and above) */}
      <div className="lg:hidden w-full">
        <HeroCTASection />
      </div>

      {/* Large desktop version (hidden by default, shown only on lg and above) */}
      <div className="container mx-auto hidden lg:block w-full">
        <HeroCTALgSection />
      </div>
      
      <Footer />
    </div>
  );
}
