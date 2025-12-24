'use client';

import React, { useState } from 'react';
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
  const [activeSection, setActiveSection] = useState('My Details');

  const renderContent = () => {
    switch (activeSection) {
      case 'My Bids':
        return <MyBidsSection />;
      case 'My Invoices':
        return <MyInvoicesSection />;
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
            onItemClick={setActiveSection}
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

