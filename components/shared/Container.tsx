import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Container variant
   * - 'default': Standard container (1024px, 1280px, 1440px)
   * - 'wide': Wider container for full-width sections
   * - 'narrow': Narrower container for focused content
   */
  variant?: 'default' | 'wide' | 'narrow';
}

/**
 * Container Component
 * Standardized horizontal container for all pages
 * Provides consistent max-widths and padding across different screen sizes
 * 
 * Breakpoints:
 * - Mobile (< 640px): Full width with px-4 (16px padding)
 * - Tablet (640px+): px-6 (24px padding)
 * - Laptop (1024px): max-w-5xl (1024px)
 * - Desktop (1280px): max-w-6xl (1152px)
 * - Large Desktop (1440px): max-w-7xl (1280px)
 * - XL Desktop (1536px+): max-w-[1440px]
 */
const Container: React.FC<ContainerProps> = ({ 
  children, 
  className = '',
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px]',
    wide: 'max-w-6xl lg:max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1500px]',
    narrow: 'max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1240px]'
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Container;

