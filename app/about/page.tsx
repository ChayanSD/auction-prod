"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  Home,
  ChevronRight,
  Award,
  Users,
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

/**
 * About Us Page
 * Premium, responsive design following project patterns
 */

export default function AboutPage() {
  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Trust & Security",
      description:
        "We ensure secure transactions and authentic items with verified sellers and buyers.",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description:
        "Curated collections of premium items, carefully selected for quality and authenticity.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community",
      description:
        "Building a vibrant community of collectors, enthusiasts, and auction lovers.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Innovation",
      description:
        "Leveraging technology to create seamless auction experiences for everyone.",
    },
  ];

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "50K+", label: "Items Sold" },
    { number: "500+", label: "Auctions" },
    { number: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="px-4 py-4 md:px-4 md:py-0 lg:px-8">
        <Header />
      </div>
      <div className="h-16 lg:h-20"></div> {/* Spacer for fixed header */}
      <main className="w-full">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-gray-900 font-medium">About Us</span>
          </nav>
        </div>

        {/* Hero Section - Image Left, Content Right */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 mb-8 sm:mb-12 lg:mb-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Image Section - Left */}
            <div className="w-full lg:w-1/2 shrink-0">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[32px] p-6 sm:p-8 lg:p-10 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Super Media Bros Logo"
                  className="w-full h-auto max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] object-contain"
                />
              </div>
            </div>

            {/* Content Section - Right */}
            <div className="w-full lg:w-1/2 flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                About Super Media Bros
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 leading-relaxed">
                Your Premier Destination for Premium Auctions
              </p>
              <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                At Super Media Bros, we're passionate about connecting
                collectors, enthusiasts, and buyers with unique and valuable
                items through our innovative auction platform. We've built a
                trusted marketplace where authenticity meets opportunity.
              </p>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Whether you're looking to bid on rare collectibles, consign your
                items, or discover something extraordinary, we're here to make
                your auction experience seamless and enjoyable.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-gray-50 w-full py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] text-white mb-4 sm:mb-6">
              <Target className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              To revolutionize the auction experience by providing a
              transparent, secure, and user-friendly platform that connects
              buyers and sellers worldwide. We're committed to fostering a
              community where every item finds its perfect home and every
              collector discovers their next treasure.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-gray-50 w-full py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Our Values
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-purple-600">
                    {value.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              What We Do
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive auction services for buyers and sellers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-white">
                <Award className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Premium Auctions
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Browse and bid on carefully curated collections of rare items,
                collectibles, and unique pieces from trusted sellers around the
                world.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-white">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Consignment Services
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Have valuable items to sell? Our consignment service helps you
                reach the right buyers and maximize the value of your
                collectibles.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-200 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center mb-4 sm:mb-6 text-white">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Global Reach
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Connect with buyers and sellers worldwide. Our platform makes
                international auctions accessible and secure for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-12 sm:py-16 lg:py-20 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join thousands of satisfied users and discover your next treasure
              today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auction"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base"
              >
                Browse Auctions
              </Link>
              <Link
                href="/contact?type=Consignment"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-gray-900 transition-all hover:scale-105 text-sm sm:text-base"
              >
                Consign Your Items
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
