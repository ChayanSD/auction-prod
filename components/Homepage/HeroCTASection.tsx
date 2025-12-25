'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hero CTA Section Component
 * Used on both homepage and auction page with different positioning
 * Different from HeroCTALgSection (which is homepage-only)
 */
const HeroCTASection: React.FC = () => {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const isAuctionpage = pathname === '/auction';
  const isAuctionItemPage = pathname?.startsWith('/auction-item');

  return (
    <section className={`relative ${isHomepage ? 'lg:top-[-370px] xl:top-[-400px]' : ''} ${isAuctionpage || isAuctionItemPage ? 'lg:top-[190px] xl:top-[180px]' : ''} z-50 lg:max-w-[945px] xl:max-w-[1240px] md:rounded-t-[32px] lg:rounded-[32px] bg-[linear-gradient(305deg,#9F13FB_14.33%,#E95AFF_95.9%)] mx-auto`}>
      <div className="flex flex-col md:flex-row items-center md:items-end pt-4">
        {/* Left Content */}
        <div className="text-white md:px-20 px-3 pb-4 items-center md:items-start text-center md:text-left">
          <div className="inline-block mb-6">
            <span className="rounded-[140px] border border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.25)] px-[18px] py-2">
              Listing Invitations
            </span>
          </div>

          <div>
            <h2 className="text-[30px] xl:text-5xl font-bold mb-6 leading-tight">
              List your products for auction
            </h2>
            <p className="lg:text-[16.9px] xl:text-xl text-white/90 mb-8 leading-relaxed max-w-lg">
              Unlock a world of imagination with our curated collection of original heroes.
            </p>
          </div>

          <div className="flex justify-center md:justify-start">
            <button className="flex items-center space-x-2 border text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-colors hover:bg-white/10">
              <span>Request to list</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
              >
                <path
                  d="M17.0306 13.0306L9.53063 20.5306C9.46095 20.6002 9.37822 20.6555 9.28718 20.6932C9.19613 20.7309 9.09855 20.7503 9.00001 20.7503C8.90146 20.7503 8.80388 20.7309 8.71283 20.6932C8.62179 20.6555 8.53906 20.6002 8.46938 20.5306C8.3997 20.4609 8.34442 20.3781 8.30671 20.2871C8.269 20.1961 8.24959 20.0985 8.24959 19.9999C8.24959 19.9014 8.269 19.8038 8.30671 19.7128C8.34442 19.6217 8.3997 19.539 8.46938 19.4693L15.4397 12.4999L8.46938 5.53055C8.32865 5.38982 8.24959 5.19895 8.24959 4.99993C8.24959 4.80091 8.32865 4.61003 8.46938 4.4693C8.61011 4.32857 8.80098 4.24951 9.00001 4.24951C9.19903 4.24951 9.3899 4.32857 9.53063 4.4693L17.0306 11.9693C17.1004 12.039 17.1557 12.1217 17.1934 12.2127C17.2312 12.3038 17.2506 12.4014 17.2506 12.4999C17.2506 12.5985 17.2312 12.6961 17.1934 12.7871C17.1557 12.8782 17.1004 12.9609 17.0306 13.0306Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Right Content - Character Cards and Person */}
        <img className="-mb-4" src="/image 69.png" alt="Character illustration" />
      </div>
    </section>
  );
};

export default HeroCTASection;
