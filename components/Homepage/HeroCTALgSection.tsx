import React from 'react';

/**
 * Large desktop Hero CTA section
 * Optimized for screens 1024px and above
 * Uses exact measurements from Figma: 1200px width, 528px height, 80px padding, 29px gap
 */
const HeroCTALgSection: React.FC = () => {
  return (
    <section className="relative lg:top-[-370px] xl:top-[-400px] z-50 lg:max-w-[945px] xl:max-w-[1200px] 2xl:max-w-[1200px] h-auto lg:h-[528px] mx-auto rounded-[32px] bg-[linear-gradient(304.83deg,#9F13FB_14.33%,#E95AFF_95.9%)] p-8 sm:p-12 md:p-16 lg:p-[80px]">
      {/* Main container with gap */}
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full gap-6 lg:gap-[29px]">
        
        {/* Left Character Card - Babi Mario */}
        <div className="flex-shrink-0 w-auto order-2 lg:order-1">
          <div className="bg-white/10 backdrop-blur-sm border border-white/50 w-[120px] h-[132px] sm:w-[150px] sm:h-[165px] lg:w-[180.70492276303258px] lg:h-[197.76228028926388px] pt-[12px] pr-[11px] pb-[12px] pl-[11px] sm:pt-[17px] sm:pr-[16px] sm:pb-[17px] sm:pl-[16px] rounded-[20px] rotate-[-3.28deg] flex flex-col gap-[10px]">
            <img 
              src="/Babi Mario 860.png" 
              alt="Babi Mario character" 
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 lg:px-8 self-center order-1 lg:order-2">
          {/* Listing Invitations Badge */}
          <div className="inline-block mb-4 sm:mb-6">
            <span className="rounded-[140px] border border-white/50 bg-white/25 px-4 sm:px-[18px] py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
              Listing Invitations
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            List your products for auction
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base lg:text-[16.9px] xl:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-lg px-2">
            Unlock a world of imagination with our curated collection of original heroes.
          </p>

          {/* CTA Button */}
          <button className="flex items-center space-x-2 border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-white/20 transition-colors text-sm sm:text-base">
            <span>Request to list</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="21" 
              className="sm:w-6 sm:h-6"
              viewBox="0 0 24 25" 
              fill="none"
              aria-hidden="true"
            >
              <path 
                d="M17.0306 13.0306L9.53063 20.5306C9.46095 20.6002 9.37822 20.6555 9.28718 20.6932C9.19613 20.7309 9.09855 20.7503 9.00001 20.7503C8.90146 20.7503 8.80388 20.7309 8.71283 20.6932C8.62179 20.6555 8.53906 20.6002 8.46938 20.5306C8.3997 20.4609 8.34442 20.3781 8.30671 20.2871C8.269 20.1961 8.24959 20.0985 8.24959 19.9999C8.24959 19.9014 8.269 19.8038 8.30671 19.7128C8.34442 19.6217 8.3997 19.539 8.46938 19.4693L15.4397 12.4999L8.46938 5.53055C8.32865 5.38982 8.24959 5.19895 8.24959 4.99993C8.24959 4.80091 8.32865 4.61003 8.46938 4.4693C8.61011 4.32857 8.80098 4.24951 9.00001 4.24951C9.19903 4.24951 9.3899 4.32857 9.53063 4.4693L17.0306 11.9693C17.1004 12.039 17.1557 12.1217 17.1934 12.2127C17.2312 12.3038 17.2506 12.4014 17.2506 12.4999C17.2506 12.5985 17.2312 12.6961 17.1934 12.7871C17.1557 12.8782 17.1004 12.9609 17.0306 13.0306Z" 
                fill="white" 
              />
            </svg>
          </button>
        </div>

        {/* Right Character Card - Superman */}
        <div className="flex-shrink-0 w-auto self-start order-3 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-sm border border-white/50 w-[173.274916514957px] h-[205.5062395548405px] pt-[17px] pr-[16px] pb-[17px] pl-[16px] rounded-[20px] rotate-[12.69deg] flex flex-col gap-[10px]">
            <img 
              src="/Superman.png" 
              alt="Superman character" 
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroCTALgSection;
