import Link from 'next/link';
import React from 'react';
import type { CTAButtonProps } from '@/types/homepage.types';
import { cn } from '@/lib/utils';

/**
 * Reusable CTA button component with arrow icon
 * Supports purple gradient and black variants
 */
export const CTAButton: React.FC<CTAButtonProps> = ({ 
  href, 
  text, 
  variant = 'purple',
  className = '',
  onClick
}) => {
  const baseClasses = "w-fit text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-sm sm:text-[16px] font-semibold transition-colors flex items-center space-x-2 sm:space-x-2.5 hover:scale-105 active:scale-95";
  const variantClasses = variant === 'purple' 
    ? "linear-gradient" 
    : "bg-black hover:bg-gray-800";
  
  const ArrowIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="10" 
      height="17" 
      viewBox="0 0 10 17" 
      fill="none"
      className="w-2 h-3 sm:w-[10px] sm:h-[17px]"
      aria-hidden="true"
    >
      <path 
        d="M9.03061 9.16727L1.53062 16.6673C1.46093 16.737 1.37821 16.7922 1.28716 16.8299C1.19612 16.8677 1.09854 16.8871 0.99999 16.8871C0.901444 16.8871 0.803862 16.8677 0.712817 16.8299C0.621773 16.7922 0.539047 16.737 0.469364 16.6673C0.399682 16.5976 0.344406 16.5149 0.306695 16.4238C0.268983 16.3328 0.249573 16.2352 0.249573 16.1366C0.249573 16.0381 0.268983 15.9405 0.306695 15.8495C0.344406 15.7584 0.399682 15.6757 0.469364 15.606L7.43968 8.63665L0.469364 1.66727C0.328634 1.52654 0.249573 1.33567 0.249573 1.13665C0.249573 0.937625 0.328634 0.746753 0.469364 0.606022C0.610095 0.465292 0.800967 0.38623 0.99999 0.38623C1.19901 0.38623 1.38988 0.465292 1.53062 0.606022L9.03061 8.10602C9.10035 8.17568 9.15567 8.25839 9.19341 8.34944C9.23115 8.44049 9.25058 8.53809 9.25058 8.63665C9.25058 8.73521 9.23115 8.8328 9.19341 8.92385C9.15567 9.0149 9.10035 9.09762 9.03061 9.16727Z" 
        fill="white" 
      />
    </svg>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseClasses, variantClasses, className)}
      >
        <span>{text}</span>
        <ArrowIcon />
      </button>
    );
  }

  return (
    <Link href={href} className={cn(baseClasses, variantClasses, className)}>
      <span>{text}</span>
      <ArrowIcon />
    </Link>
  );
};

