import React from "react";
import type { FeatureCardData } from '@/types/homepage.types';

interface FeatureCardProps {
  title: string;
  status: string;
  character: string;
}

/**
 * Individual feature card component for Coming Soon section
 * Pixel-perfect mobile design matching Figma (375px width)
 * Mobile: Vertical layout with character on top, badge, then title
 * Desktop: Horizontal layout
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ title, status, character }) => {
  return (
    <div className="rounded-[32px] h-auto md:h-[180px] lg:h-[180px] xl:h-[200px] border flex flex-col md:flex-row justify-center md:justify-start items-center gap-4 border-[rgba(255,255,255,0.25)] bg-[#BC37FD] p-4 md:p-2 lg:px-3 lg:py-1">
      {/* Character Image - Full width on mobile, constrained on desktop */}
      <div className="flex justify-center items-center w-full md:w-auto">
        <img
          className="w-auto h-[200px] sm:h-[220px] md:h-[140px] lg:h-[160px] xl:h-[180px] object-contain"
          src={character}
          alt={title}
          loading="lazy"
        />
      </div>
      
      {/* Content Section - Badge and Title */}
      <div className="flex flex-col justify-start items-center md:items-start w-full md:w-auto relative px-0 md:px-0 pt-0 md:pt-3">
        {/* Coming Soon Badge - Above title on mobile, below on desktop */}
        <div className="order-1 md:order-2 w-auto md:w-[123px] lg:w-[130px] xl:w-[150px] rounded-[140px] border border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.25)] text-white mb-3 md:mb-4 flex px-4 md:px-[6px] lg:px-[18px] py-2 md:py-[8px] justify-center items-center gap-[10px] text-xs md:text-xs lg:text-[16px] xl:text-lg whitespace-nowrap">
          {status}
        </div>
        
        {/* Title - Below badge on mobile, above on desktop */}
        <h3 className="order-2 md:order-1 text-lg sm:text-xl md:text-md lg:text-lg xl:text-2xl font-bold text-white mb-0 md:mb-5 text-center md:text-left">
          {title}
        </h3>
      </div>
    </div>
  );
};

/**
 * Coming Soon section with feature cards
 * Pixel-perfect mobile design (375px) matching Figma
 */
const ComingSoonSection: React.FC = () => {
  const features: FeatureCardData[] = [
    {
      title: "Our Official Store",
      status: "Coming Soon",
      character: "/pika.png",
    },
    {
      title: "Grading",
      status: "Coming Soon",
      character: "/sark.png",
    },
    {
      title: "Competitions",
      status: "Coming Soon",
      character: "/jokera.png",
    },
  ];

  return (
    <div className="bg-[url('/bg.svg')] bg-center bg-cover bg-no-repeat w-full md:h-[438px] h-auto lg:px-8 xl:px-[100px] px-4 md:px-[8px] py-8 md:py-12 lg:py-[64px] relative z-10">
      <div className="max-w-7xl mx-auto px-2 md:px-4">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[43px] xl:text-4xl md:text-5xl font-bold text-white lg:px-[120px] pb-6 md:pb-8 lg:pb-[50px] xl:pb-[64px] tracking-tight text-center">
          Many more coming soon...
        </h2>

        {/* Cards Grid - Stack vertically on mobile (1 column), horizontal on desktop (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4 xl:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={`${feature.title}-${index}`}
              title={feature.title}
              status={feature.status}
              character={feature.character}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComingSoonSection;
