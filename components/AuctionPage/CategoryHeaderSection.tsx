'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { apiClient } from '@/lib/fetcher';
import { MapPin, Calendar, Clock } from 'lucide-react';

interface AuctionDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

interface CategoryHeaderSectionProps {
  categoryName: string | null;
}

const CategoryHeaderSection: React.FC<CategoryHeaderSectionProps> = ({ categoryName }) => {
  const [auctionDetails, setAuctionDetails] = useState<AuctionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryName) {
      setAuctionDetails(null);
      return;
    }

    const fetchAuctionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const auction = await apiClient.get<AuctionDetails>(`/auction?name=${encodeURIComponent(categoryName)}`);
        setAuctionDetails(auction);
      } catch (err) {
        console.error('Error fetching auction details:', err);
        setError('Failed to load auction details');
        setAuctionDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [categoryName]);

  // Time remaining countdown - Only for Live and Upcoming auctions
  useEffect(() => {
    // Don't show timer if auction is Closed or no end date
    if (!auctionDetails?.endDate || auctionDetails?.status === 'Closed') {
      setTimeRemaining(null);
      return;
    }

    // Only show timer for Live and Upcoming auctions
    if (auctionDetails.status !== 'Live' && auctionDetails.status !== 'Upcoming') {
      setTimeRemaining(null);
      return;
    }

    const endDate = new Date(auctionDetails.endDate);
    const now = new Date();
    
    // Check if date has passed - if so, don't show timer
    if (endDate < now) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const currentTime = new Date().getTime();
      const diff = endDate.getTime() - currentTime;

      if (diff <= 0) {
        setTimeRemaining(null);
        return false;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatted = `${days}d ${hours}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      setTimeRemaining(formatted);
      return true;
    };

    // Initial call
    const hasTime = updateRemaining();
    if (!hasTime) return;

    const intervalId = setInterval(() => {
      const stillPositive = updateRemaining();
      if (!stillPositive) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [auctionDetails?.endDate, auctionDetails?.status]);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Determine if auction is closed based on end date and status
  const getAuctionStatus = () => {
    if (!auctionDetails) return null;
    
    const endDate = auctionDetails.endDate ? new Date(auctionDetails.endDate) : null;
    const now = new Date();
    const isDatePassed = endDate ? endDate < now : false;
    
    // If date has passed OR status is Closed, show Closed
    if (isDatePassed || auctionDetails.status === 'Closed') {
      return 'Closed';
    }
    
    // Otherwise return the actual status
    return auctionDetails.status;
  };

  const displayStatus = getAuctionStatus();

  // Show "All Auction Items" when no category is selected
  if (!categoryName) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0E0E0E] mb-2">
          All Auction Items
        </h2>
        <p className="text-sm sm:text-base text-[#4D4D4D]">
          Browse through all available auction items across different categories and auctions.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full bg-white border border-[#E3E3E3] rounded-xl overflow-hidden mb-6 sm:mb-8 animate-pulse">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-[300px] lg:w-[360px] xl:w-[400px] h-[250px] sm:h-[300px] md:h-auto bg-gray-200"></div>
          <div className="flex-1 p-4 sm:p-5 lg:p-6">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state or auction not found
  if (error || !auctionDetails) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0E0E0E] mb-2">
          {categoryName}
        </h2>
        <p className="text-sm sm:text-base text-[#4D4D4D]">
          Auction details not available.
        </p>
      </div>
    );
  }

  // Show auction details
  return (
    <div className="w-full mb-6 sm:mb-8">
      {/* Banner Header - Outside the card */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#0E0E0E] leading-tight">
          Auction Lot: <span className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] bg-clip-text text-transparent">{auctionDetails.name}</span>
        </h1>
      </div>

      {/* Card Section */}
      <div className="w-full bg-white border border-[#E3E3E3] rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row">
          {/* Image Section - Left Side */}
          {auctionDetails.imageUrl && (
            <div className="w-full md:w-[300px] lg:w-[360px] xl:w-[400px] shrink-0 h-[250px] sm:h-[300px] md:h-auto bg-[#F7F7F7] relative">
              <Image
                src={auctionDetails.imageUrl}
                alt={auctionDetails.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 300px, (max-width: 1280px) 360px, 400px"
              />
            </div>
          )}
          
          {/* Content Section - Right Side */}
          <div className="flex-1 p-4 sm:p-5 lg:p-6">
            {/* Status Badge and Time Remaining */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              {/* Status Badge */}
              {displayStatus && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm sm:text-base font-semibold uppercase tracking-wide ${
                  displayStatus === 'Live' 
                    ? 'bg-[#FEEDED] border border-[#FA9A9C] text-[#F6484B]'
                    : displayStatus === 'Upcoming'
                    ? 'bg-[#FEF8ED] border border-[#F6BC48] text-[#DB9914]'
                    : 'bg-[#F7F7F7] border border-[#E3E3E3] text-[#4D4D4D]'
                }`}>
                  {displayStatus === 'Live' && (
                    <div className="w-2 h-2 bg-[#F6484B] rounded-full animate-pulse"></div>
                  )}
                  {displayStatus === 'Live' ? 'LIVE NOW' : displayStatus}
                </div>
              )}
              
              {/* Time Remaining - Only show for Live and Upcoming (not Closed) */}
              {timeRemaining && displayStatus !== 'Closed' && (
                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#0E0E0E]">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#9F13FB]" />
                  <span>{timeRemaining}</span>
                </div>
              )}
            </div>

            {/* Accordion for Full Details */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-[#9F13FB] hover:text-[#7A0FC4] hover:no-underline py-2 sm:py-3">
                  Show auction details
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-4 text-sm sm:text-base text-[#4D4D4D]">
                    {/* Full Description */}
                    <div>
                      <h4 className="font-semibold text-[#0E0E0E] mb-2">Description</h4>
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {auctionDetails.description}
                      </p>
                    </div>

                    {/* Location */}
                    {auctionDetails.location && (
                      <div className="flex items-start gap-2 sm:gap-3 pt-2 border-t border-purple-200/50">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#9F13FB] mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-[#0E0E0E] mb-1">Location</h4>
                          <p>{auctionDetails.location}</p>
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    {(auctionDetails.startDate || auctionDetails.endDate) && (
                      <div className="flex flex-col gap-3 pt-2 border-t border-purple-200/50">
                        {auctionDetails.startDate && (
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#9F13FB] mt-0.5 shrink-0" />
                            <div>
                              <h4 className="font-semibold text-[#0E0E0E] mb-1">Auction Start</h4>
                              <p>{formatDate(auctionDetails.startDate)}</p>
                            </div>
                          </div>
                        )}
                        {auctionDetails.endDate && (
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#9F13FB] mt-0.5 shrink-0" />
                            <div>
                              <h4 className="font-semibold text-[#0E0E0E] mb-1">Auction End</h4>
                              <p>{formatDate(auctionDetails.endDate)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHeaderSection;