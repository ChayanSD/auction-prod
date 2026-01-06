'use client';

import React, { useState } from 'react';

interface ProductTabsProps {
  item: {
    id: string;
    name: string;
    description: string;
    terms: string | null;
    shipping: any;
    baseBidPrice: number;
    buyersPremium?: number | null;
    taxPercentage?: number | null;
    auction: {
      id: string;
      name: string;
      location: string;
      status: string;
    };
  };
}

const ProductTabs: React.FC<ProductTabsProps> = ({ item }) => {
  const [activeTab, setActiveTab] = useState('description');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'description', label: 'Product Description' },
    { id: 'payment', label: 'Payment Details' },
    // { id: 'auction', label: 'Auction Details' },
    { id: 'shipping', label: 'Shipping Options' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line">
              {item.description}
            </div>
            {item.terms && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                <p className="text-gray-700 whitespace-pre-line">{item.terms}</p>
              </div>
            )}
          </div>
        );

      case 'payment':
        const buyersPremium = item.buyersPremium ?? 0;
        const taxPercentage = item.taxPercentage ?? 0;
        const taxAmount = (item.baseBidPrice + buyersPremium) * (taxPercentage / 100);
        const totalEstimated = item.baseBidPrice + buyersPremium + taxAmount;
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Base Bid Price:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(item.baseBidPrice)}</span>
                </div>
                {buyersPremium > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Buyer's Premium:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(buyersPremium)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tax ({taxPercentage}%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Total Estimated:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(totalEstimated)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Payment methods accepted: Credit Card, Debit Card, Bank Transfer
              </p>
              <p className="text-sm text-gray-700 mt-2">
                All payments are processed securely through our payment gateway.
              </p>
            </div>
          </div>
        );

      // case 'auction':
      //   return (
      //     <div className="space-y-6">
      //       <div>
      //         <h3 className="text-xl font-bold text-gray-900 mb-4">Auction Information</h3>
      //         <div className="space-y-3">
      //           <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200">
      //             <span className="text-gray-600">Auction Name:</span>
      //             <span className="font-semibold text-gray-900">{item.auction.name}</span>
      //           </div>
      //           <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200">
      //             <span className="text-gray-600">Start Date:</span>
      //             <span className="font-semibold text-gray-900">{formatDate(item.auction.startDate)}</span>
      //           </div>
      //           <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200">
      //             <span className="text-gray-600">End Date:</span>
      //             <span className="font-semibold text-gray-900">{formatDate(item.auction.endDate)}</span>
      //           </div>
      //           <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-200">
      //             <span className="text-gray-600">Location:</span>
      //             <span className="font-semibold text-gray-900">{item.auction.location}</span>
      //           </div>
      //           <div className="flex flex-col sm:flex-row sm:justify-between py-2">
      //             <span className="text-gray-600">Status:</span>
      //             <span className={`font-semibold ${
      //               item.auction.status === 'Active' ? 'text-green-600' :
      //               item.auction.status === 'Upcoming' ? 'text-blue-600' :
      //               item.auction.status === 'Ended' ? 'text-red-600' :
      //               'text-gray-600'
      //             }`}>
      //               {item.auction.status}
      //             </span>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );

      case 'shipping':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h3>
              {item.shipping && typeof item.shipping === 'object' ? (
                <div className="space-y-3">
                  {item.shipping.address && (
                    <div className="py-2 border-b border-gray-200">
                      <span className="text-gray-600">Address: </span>
                      <span className="font-semibold text-gray-900">{item.shipping.address}</span>
                    </div>
                  )}
                  {item.shipping.country && (
                    <div className="py-2 border-b border-gray-200">
                      <span className="text-gray-600">Country: </span>
                      <span className="font-semibold text-gray-900">{item.shipping.country}</span>
                    </div>
                  )}
                  {item.shipping.method && (
                    <div className="py-2 border-b border-gray-200">
                      <span className="text-gray-600">Shipping Method: </span>
                      <span className="font-semibold text-gray-900">{item.shipping.method}</span>
                    </div>
                  )}
                  {item.shipping.cost && (
                    <div className="py-2">
                      <span className="text-gray-600">Shipping Cost: </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.shipping.cost)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Shipping options will be available after the auction ends. Please contact us for shipping arrangements.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-4 text-sm sm:text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProductTabs;

