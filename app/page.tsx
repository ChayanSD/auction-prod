"use client";

import MainContentCards from "@/components/Homepage/MainContentCards";
import AboutUsOverview from "@/components/Homepage/AboutUsOverview";
import ComingSoonSection from "@/components/Homepage/ComingSoonSection";
import NewAuctionItems from "@/components/Homepage/NewAuctionItems";
import NewAuctionItemsSection from "@/components/Homepage/NewAuctionItemsSection";
import HowItWorksSection from "@/components/Homepage/HowItWorksSection";
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
    <div className="min-h-screen bg-white overflow-x-hidden lg:overflow-y-hidden w-full">
      <div className="px-4 pt-4 pb-0 md:px-0 md:pt-0 md:pb-0">
        <Header />
        <MainContentCards />
      </div>

      
      {/* ComingSoonSection - Full width background on mobile, pulled up to remove gap */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-6 md:mt-0">
        <ComingSoonSection />
      </div>
      {/* About Us Overview Section - Right after hero */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-6 md:mt-0">
        <AboutUsOverview />
      </div>
      
      {/* NewAuctionItems - Full width background on mobile, pulled up to connect seamlessly */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-6 md:mt-0">
        <NewAuctionItems />
      </div>
      
      {/* NewAuctionItemsSection - Full width background on mobile, pulled up to connect seamlessly */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-8 md:mt-0">
        <NewAuctionItemsSection />
      </div>
      
      {/* How It Works Section - Full width background on mobile, pulled up to connect seamlessly */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-6 md:mt-0">
        <HowItWorksSection />
      </div>
      
      {/* Mobile + Tablet version (shown by default, hidden on lg and above) */}
      <div className="lg:hidden  relative left-1/2 -translate-x-1/2 w-screen md:w-full md:left-0 md:translate-x-0 -mt-6 md:mt-0">
        <HeroCTALgSection />
      </div>

      {/* Large desktop version (hidden by default, shown only on lg and above) */}
      <div className="container pointer-events-none mx-auto hidden lg:block w-full relative z-50">
        <HeroCTALgSection />
      </div>
      <Footer />
      
    </div>
  );
}
