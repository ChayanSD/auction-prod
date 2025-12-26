'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShoppingBag, Package, Gamepad2, BookOpen, Star, Truck, CreditCard, Shield, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

/**
 * Store Page
 * Displays information about the store with products, features, and contact information
 * Fully responsive for all devices
 */
export default function StorePage() {
  const storeFeatures = [
    {
      icon: Package,
      title: 'New & Used Items',
      description: 'Browse our extensive collection of new and pre-owned items in excellent condition.',
    },
    {
      icon: Gamepad2,
      title: 'Games & Collectibles',
      description: 'Video games, board games, trading cards, and rare collectibles for every enthusiast.',
    },
    {
      icon: BookOpen,
      title: 'Steel Books & Media',
      description: 'Limited edition steel books, Blu-rays, DVDs, and special edition media collections.',
    },
    {
      icon: Star,
      title: 'Retired Sets',
      description: 'Exclusive retired sets and discontinued items that are hard to find elsewhere.',
    },
  ];

  const benefits = [
    {
      icon: Truck,
      title: 'Fast Shipping',
      description: 'Secure packaging and reliable delivery options available worldwide.',
    },
    {
      icon: CreditCard,
      title: 'Easy Payments',
      description: 'Multiple payment methods accepted for your convenience.',
    },
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: 'Your transactions are protected with industry-standard security measures.',
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-16 lg:h-20"></div> {/* Spacer for fixed header */}

      <main className="w-full">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Character Illustration */}
              <div className="shrink-0 w-full sm:w-80 lg:w-96">
                <div className="bg-gray-100 rounded-[32px] p-6 sm:p-8 lg:p-10 flex items-center justify-center">
                  <img 
                    src="/pikachu.png" 
                    alt="Store mascot" 
                    className="w-full h-auto max-w-[300px] sm:max-w-[350px] lg:max-w-[400px] object-contain"
                  />
                </div>
              </div>

              {/* Hero Content */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  Welcome to The Store
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                  New, used and retired sets. Games, steel books and many more.
                </p>
                <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto lg:mx-0">
                  Discover a curated collection of collectibles, games, media, and exclusive items. 
                  Whether you're a collector, gamer, or enthusiast, we have something special for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/auction"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    Explore Auctions
                  </Link>
                  <Link
                    href="/categories"
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-gray-900 transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    Browse Categories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Store Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What We Offer
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our diverse range of products and services designed for collectors and enthusiasts
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {storeFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Shop With Us
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                We're committed to providing the best shopping experience for our customers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
          <div className="max-w-4xl mx-auto text-center">
            <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-purple-600 mx-auto mb-6 sm:mb-8" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Browse our auctions to find unique items, rare collectibles, and exclusive deals. 
              Join thousands of satisfied customers who trust us for their collecting needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auction"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
              >
                View Auctions
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all hover:scale-105 text-sm sm:text-base"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Have questions? We're here to help!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-center border border-gray-200">
                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  info@auctionplatform.com
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-center border border-gray-200">
                <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  +44 (0) 20 1234 5678
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 text-center border border-gray-200 sm:col-span-2 lg:col-span-1">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Visit Us</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  123 Auction Lane<br />
                  London, SW1A 0AA<br />
                  United Kingdom
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

