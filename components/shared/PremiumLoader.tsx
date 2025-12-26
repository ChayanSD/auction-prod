'use client';

import React from 'react';

interface PremiumLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

/**
 * Premium Loader Component
 * Beautiful animated loader with gradient and text
 */
const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  text = 'Loading...', 
  fullScreen = true 
}) => {
  return (
    <div className={`${fullScreen ? 'fixed inset-0' : 'absolute inset-0'} z-[9999] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center`}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          {/* Animated gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#9F13FB] border-r-[#E95AFF] animate-spin"></div>
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#9F13FB]/20 to-[#E95AFF]/20 blur-sm"></div>
        </div>
        
        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-gray-800 animate-pulse">
            {text}
          </p>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[#9F13FB] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-[#E95AFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-[#9F13FB] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;

