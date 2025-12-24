import React from 'react';
import { CheckmarkItem } from '@/components/shared/CheckmarkItem';
import { CTAButton } from '@/components/shared/CTAButton';

/**
 * Main content cards section displaying Auction site and Store information
 * Pixel-perfect mobile design matching Figma (375px width)
 */
const MainContentCards: React.FC = () => {
  return (
    <div className="bg-gray-50 w-full">
      <div className="max-w-[1440px] mx-auto px-0 md:px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Auction Site Card */}
          <div className="border-b lg:border-b-0 lg:border-r border-gray-100 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row items-center lg:items-start">
            {/* Character Illustration */}
            <div className="flex flex-1 items-center justify-center bg-gray-100 px-4 sm:px-6 md:px-9 py-6 sm:py-8 md:py-12 rounded-[32px] w-full lg:w-auto mb-4 lg:mb-0">
              <img 
                src="/Thor_Babi copy 1.png" 
                alt="Thor character illustration" 
                className="w-auto h-[180px] sm:h-[220px] md:h-[250px] lg:h-auto object-contain max-w-full"
              />
            </div>

            {/* Content */}
            <div className="flex-1 lg:ml-7 h-full py-3 w-full lg:w-auto">
              <div className="text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-[#0E0E0E] mb-2">
                  Auction site
                </h3>
                <p className="text-sm sm:text-base text-[#0E0E0E] mb-4 sm:mb-2 leading-relaxed">
                  Specialists in media. Toys and Games, movies, collectibles and everything pop culture.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="mb-4">
                    <h4 className="font-medium text-[#4D4D4D] text-xs sm:text-sm mb-2 sm:mb-3 tracking-wide">
                      SELLERS
                    </h4>
                    <div className="space-y-2">
                      <CheckmarkItem text="0-10% Seller Fees." />
                      <CheckmarkItem text="Collections available." />
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="17" 
                            viewBox="0 0 16 17" 
                            fill="none"
                            aria-hidden="true"
                          >
                            <path 
                              d="M13 2.63666H3C2.73478 2.63666 2.48043 2.74201 2.29289 2.92955C2.10536 3.11709 2 3.37144 2 3.63666V13.6367C2 13.9019 2.10536 14.1562 2.29289 14.3438C2.48043 14.5313 2.73478 14.6367 3 14.6367H13C13.2652 14.6367 13.5196 14.5313 13.7071 14.3438C13.8946 14.1562 14 13.9019 14 13.6367V3.63666C14 3.37144 13.8946 3.11709 13.7071 2.92955C13.5196 2.74201 13.2652 2.63666 13 2.63666ZM10.8538 7.49041L7.35375 10.9904C7.30731 11.0369 7.25217 11.0738 7.19147 11.0989C7.13077 11.1241 7.06571 11.1371 7 11.1371C6.93429 11.1371 6.86923 11.1241 6.80853 11.0989C6.74783 11.0738 6.69269 11.0369 6.64625 10.9904L5.14625 9.49041C5.05243 9.39659 4.99972 9.26934 4.99972 9.13666C4.99972 9.00398 5.05243 8.87673 5.14625 8.78291C5.24007 8.68909 5.36732 8.63638 5.5 8.63638C5.63268 8.63638 5.75993 8.68909 5.85375 8.78291L7 9.92978L10.1462 6.78291C10.1927 6.73645 10.2479 6.6996 10.3086 6.67446C10.3692 6.64932 10.4343 6.63638 10.5 6.63638C10.5657 6.63638 10.6308 6.64932 10.6914 6.67446C10.7521 6.6996 10.8073 6.73645 10.8538 6.78291C10.9002 6.82936 10.9371 6.88451 10.9622 6.94521C10.9873 7.00591 11.0003 7.07096 11.0003 7.13666C11.0003 7.20236 10.9873 7.26741 10.9622 7.32811C10.9371 7.3888 10.9002 7.44395 10.8538 7.49041Z" 
                              fill="#BC37FD" 
                            />
                          </svg>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Connected to The Saleroom so maximum exposure to buyers worldwide.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#4D4D4D] text-xs sm:text-sm mb-2 sm:mb-3 tracking-wide">
                      BUYERS
                    </h4>
                    <div className="space-y-2">
                      <CheckmarkItem text="Shipping and Packing Options Available." />
                      <CheckmarkItem text="Easy Payment Methods." />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center lg:justify-start mt-4 lg:mt-0">
                <CTAButton href="/auction" text="Explore Auctions" variant="purple" />
              </div>
            </div>
          </div>

          {/* The Store Card */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-100 py-4 md:py-6 lg:py-8 px-4 md:px-6 lg:px-7 flex flex-col lg:flex-row items-center lg:items-start">
            {/* Character Illustration */}
            <div className="flex flex-1 items-center justify-center bg-gray-100 px-6 sm:px-8 md:px-14 lg:px-9 py-5 sm:py-6 md:py-9 rounded-[32px] w-full lg:w-auto mb-4 lg:mb-0">
              <img 
                src="/pikachu.png" 
                alt="Pikachu character illustration" 
                className="w-auto h-[180px] sm:h-[220px] md:h-[250px] lg:h-auto object-contain max-w-full"
              />
            </div>

            {/* Content */}
            <div className="flex-1 lg:ml-8 h-full w-full lg:w-auto">
              <div className="flex flex-col justify-between h-full py-4 sm:py-8 text-center lg:text-left">
                <div className="mb-5 lg:mb-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    The store
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    New, used and retired sets. Games, steel books and many more.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-start mt-4 lg:mt-0">
                  <CTAButton href="/store" text="Visit Store" variant="black" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContentCards;
