import React from "react";
import type { FeatureCardData } from '@/types/homepage.types';

interface FeatureCardProps {
  title: string;
  status: string;
  character: string;
}

/**
 * Individual feature card component for Coming Soon section
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ title, status, character }) => {
  return (
    <div className="rounded-[24px] sm:rounded-[32px] h-auto sm:h-[180px] lg:h-[180px] xl:h-[200px] border flex flex-col sm:flex-row justify-start gap-3 sm:gap-4 items-center border-[rgba(255,255,255,0.25)] bg-[#BC37FD] p-3 sm:p-2 lg:px-3 lg:py-1">
      <div className="flex justify-center w-full sm:w-auto">
        <img
          className="w-full max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[400px] h-auto object-contain"
          src={character}
          alt={title}
          loading="lazy"
        />
      </div>
      <div className="flex flex-col justify-start w-full relative px-4 sm:px-[30px] md:px-0 pt-2 sm:pt-3">
        <h3 className="order-2 sm:order-1 text-base sm:text-md lg:text-lg xl:text-2xl font-bold text-white mb-3 sm:mb-5 text-center sm:text-left">
          {title}
        </h3>
        <div className="order-1 sm:order-2 w-full sm:w-[123px] lg:w-[130px] xl:w-[150px] rounded-[140px] border border-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.25)] text-white mb-3 sm:mb-4 flex px-3 sm:px-[6px] lg:px-[18px] py-1.5 sm:py-[8px] justify-center items-center gap-[10px] text-xs sm:text-xs lg:text-[16px] xl:text-lg whitespace-nowrap mx-auto sm:mx-0">
          {status}
        </div>
      </div>
    </div>
  );
};

/**
 * Coming Soon section with feature cards
 * Fully responsive for mobile, tablet, and desktop
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
    <div className="bg-[url('/bg.svg')] bg-center bg-cover bg-no-repeat min-h-[400px] sm:min-h-[438px] md:h-[438px] lg:px-8 xl:px-[100px] px-4 sm:px-[8px] py-8 sm:py-12 md:py-[64px] relative z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[43px] xl:text-4xl font-bold text-white lg:px-[120px] pb-6 sm:pb-8 md:pb-[50px] lg:pb-[64px] tracking-tight text-center">
          Many more coming soon...
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
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
