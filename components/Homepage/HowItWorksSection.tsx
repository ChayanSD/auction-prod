'use client';

import React from 'react';
import { Search, Gavel, CreditCard, Package } from 'lucide-react';

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Individual step card component
 * Responsive design matching homepage style
 */
const StepCard: React.FC<StepProps> = ({ number, title, description, icon }) => {
  return (
    <div className="bg-white rounded-[32px] border border-gray-200 p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Step Number Badge */}
      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] text-white font-bold text-2xl sm:text-3xl mb-4 sm:mb-6 mx-auto sm:mx-0">
        {number}
      </div>
      
      {/* Icon */}
      <div className="flex items-center justify-center mb-4 sm:mb-6 text-purple-600">
        <div className="w-12 h-12 sm:w-16 sm:h-16">
          {icon}
        </div>
      </div>
      
      {/* Content */}
      <div className="text-center sm:text-left flex-1">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

/**
 * How It Works Section
 * Responsive section explaining the auction process
 * Matches homepage design patterns
 */
const HowItWorksSection: React.FC = () => {
  const steps: Omit<StepProps, 'icon'>[] = [
    {
      number: '1',
      title: 'Browse & Search',
      description: 'Explore our extensive collection of auction items. Use filters to find exactly what you\'re looking for by category, price range, or location.',
    },
    {
      number: '2',
      title: 'Place Your Bid',
      description: 'Found something you love? Register to bid and place your offer. Watch the auction in real-time and increase your bid if needed.',
    },
    {
      number: '3',
      title: 'Win & Pay',
      description: 'If you win, you\'ll receive an invoice. Complete payment securely through our integrated payment system with multiple options available.',
    },
    {
      number: '4',
      title: 'Receive Your Item',
      description: 'Once payment is confirmed, we\'ll arrange shipping and packing. Track your item and enjoy your new collectible!',
    },
  ];

  const icons = [
    <Search className="w-full h-full" />,
    <Gavel className="w-full h-full" />,
    <CreditCard className="w-full h-full" />,
    <Package className="w-full h-full" />,
  ];

  return (
    <section className="bg-white w-full py-12 sm:py-16 lg:py-0 lg:-mt-100 lg:mb-120 pt-16 md:pt-12 lg:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with our simple auction process. From browsing to receiving your items, we make it easy.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={icons[index]}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <a
            href="/auction"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 text-base sm:text-lg"
          >
            Start Bidding Now
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

