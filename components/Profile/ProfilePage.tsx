'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProfileWrapper from './ProfileWrapper';
import ProfileSidebar from './ProfileSidebar';
import MyDetailsSection from './sections/MyDetailsSection';
import PaymentMethodsSection from './sections/PaymentMethodsSection';
import AddressesSection from './sections/AddressesSection';
import PasswordSection from './sections/PasswordSection';
import MyBidsSection from './sections/MyBidsSection';
import MyInvoicesSection from './sections/MyInvoicesSection';

/**
 * Profile Page Component
 * Main container for My Account page
 * Pixel-perfect design matching Figma
 */
const ProfilePage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('My Details');

  // Initialize from URL params on mount
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['My Details', 'My Bids', 'My Invoices'].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // Update URL when section changes
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'My Bids':
        return <MyBidsSection key="my-bids" />;
      case 'My Invoices':
        return <MyInvoicesSection key="my-invoices" />;
      case 'My Details':
      default:
        return (
          <div className="space-y-8 lg:space-y-10">
            <MyDetailsSection />
            <PaymentMethodsSection />
            <AddressesSection />
            <PasswordSection />
          </div>
        );
    }
  };

  return (
    <ProfileWrapper>
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Left navigation sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <ProfileSidebar
            activeItem={activeSection}
            onItemClick={handleSectionChange}
          />
        </div>

        {/* Right content sections */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </ProfileWrapper>
  );
};

export default ProfilePage;

