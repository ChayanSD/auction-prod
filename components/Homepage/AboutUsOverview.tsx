"use client";

import React from "react";
import Link from "next/link";

/**
 * About Us Overview Section
 * Hero section with image on left and content on right
 * Responsive design following homepage patterns
 */
const AboutUsOverview: React.FC = () => {
  return (
    <section className="bg-white w-full py-8 sm:py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Image Section - Left */}
          <div className="w-full lg:w-1/2 shrink-0">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[32px] p-6 sm:p-8 lg:p-10 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Super Media Bros Logo"
                className="w-full h-auto max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] object-contain"
              />
            </div>
          </div>

          {/* Content Section - Right */}
          <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              About Super Media Bros
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6 leading-relaxed">
              Your Premier Destination for Premium Auctions
            </p>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              At Super Media Bros, we're passionate about connecting collectors,
              enthusiasts, and buyers with unique and valuable items through our
              innovative auction platform. We've built a trusted marketplace where
              authenticity meets opportunity.
            </p>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Whether you're looking to bid on rare collectibles, consign your
              items, or discover something extraordinary, we're here to make your
              auction experience seamless and enjoyable.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsOverview;

