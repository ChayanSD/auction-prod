'use client';

import React from 'react';
import { Search, Gavel, CreditCard, Package, ArrowRight } from 'lucide-react';

interface StepData {
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Premium How It Works Section
 * Unique standout design inspired by modern infographics
 * Fully responsive with maintained padding structure
 */
const HowItWorksSection: React.FC = () => {
  const steps: StepData[] = [
    {
      title: 'Browse & Search',
      description: 'Explore our extensive collection of auction items. Use filters to find exactly what you\'re looking for by category, price range, or location.',
      icon: <Search className="w-full h-full" />,
    },
    {
      title: 'Place Your Bid',
      description: 'Found something you love? Register to bid and place your offer. Watch the auction in real-time and increase your bid if needed.',
      icon: <Gavel className="w-full h-full" />,
    },
    {
      title: 'Win & Pay',
      description: 'If you win, you\'ll receive an invoice. Complete payment securely through our integrated payment system with multiple options available.',
      icon: <CreditCard className="w-full h-full" />,
    },
    {
      title: 'Receive Your Item',
      description: 'Once payment is confirmed, we\'ll arrange shipping and packing. Track your item and enjoy your new collectible!',
      icon: <Package className="w-full h-full" />,
    },
  ];

  return (
    <section className="bg-white w-full py-12 sm:py-16 lg:py-0 lg:-mt-100 lg:mb-120 pt-16 md:pt-12 lg:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header with Badge */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-10 xl:mb-16">
          {/* Badge */}
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <span className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full border border-gray-200 bg-gray-50 text-xs sm:text-sm font-medium text-gray-700">
              How it works
            </span>
          </div>
          
          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-4 xl:mb-6 leading-tight">
            Discover the{' '}
            <span className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] bg-clip-text text-transparent">
              Power of Auctions
            </span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-base xl:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get started with our simple auction process. From browsing to receiving your items, we make it easy.
          </p>
        </div>

        {/* Premium Steps Container */}
        <div className="relative">
          {/* Connecting Flow Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#9F13FB] via-[#E95AFF] to-[#9F13FB] opacity-20 -translate-y-1/2"></div>
          
          {/* Connecting Flow Line - Tablet */}
          <div className="hidden md:block lg:hidden absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#9F13FB] via-[#E95AFF] to-[#9F13FB] opacity-20 -translate-y-1/2"></div>

        {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-4 xl:gap-8 relative z-10">
          {steps.map((step, index) => (
              <div
                key={index}
                className="group relative"
              >
                {/* Premium Card */}
                <div className="bg-white rounded-[32px] border border-gray-100 p-6 sm:p-8 lg:p-6 xl:p-10 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden group-hover:border-purple-200">
                  {/* Gradient Background Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-pink-50/0 group-hover:from-purple-50/50 group-hover:to-pink-50/50 transition-all duration-300 rounded-[32px]"></div>
                  
                  {/* Content Container */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon */}
                    <div className="mb-4 sm:mb-6 lg:mb-4 xl:mb-6 text-purple-600 group-hover:text-purple-700 transition-colors">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-12 xl:w-16 lg:h-12 xl:h-16">
                        {step.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl lg:text-xl xl:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-2 xl:mb-4 group-hover:text-gray-950 transition-colors">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm sm:text-base lg:text-sm xl:text-lg text-gray-600 leading-relaxed flex-1">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative Corner Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100/0 to-pink-100/0 group-hover:from-purple-100/30 group-hover:to-pink-100/30 rounded-bl-[32px] transition-all duration-300"></div>
                </div>

                {/* Connecting Arrow - Desktop Only */}
                {index < steps.length - 1 && (
                  <>
                    {/* Desktop Arrow */}
                    <div className="hidden lg:block absolute top-1/2 -right-3 xl:-right-4 z-20">
                      <div className="w-6 h-6 xl:w-8 xl:h-8 rounded-full bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] flex items-center justify-center shadow-lg">
                        <ArrowRight className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Tablet Arrow */}
                    <div className="hidden md:block lg:hidden absolute top-1/2 -right-3 z-20">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] flex items-center justify-center shadow-lg">
                        <ArrowRight className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>
          ))}
          </div>
        </div>

        {/* Premium CTA Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <a
            href="/auction"
            className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105 text-base sm:text-lg gap-2"
          >
            <span>Start Bidding Now</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

