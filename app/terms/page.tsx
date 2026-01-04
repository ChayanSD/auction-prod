'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  FileText,
  CheckCircle,
  UserPlus,
  Gavel,
  Store,
  CreditCard,
  Truck,
  RefreshCw,
  Ban,
  Copyright,
  Shield,
  Scale,
  XCircle,
  Edit,
  Mail,
  Home,
  ChevronRight,
} from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F2F0E9] flex flex-col">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-20"></div>

      {/* Main Content */}
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-4 sm:pt-6">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 hover:text-[#9F13FB] transition-colors">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-gray-900 font-medium">Terms and Conditions</span>
          </nav>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-8 md:pb-12 lg:pb-16">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] text-white mb-4 sm:mb-6">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0E0E0E] mb-4">
              Terms and Conditions
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Last updated: January 2025
            </p>
          </div>

          {/* Content Section */}
          <div className="space-y-6 md:space-y-8">
            {/* Introduction */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    1. Introduction
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    Welcome to Super Media Bros Auction Platform. These Terms and Conditions ("Terms") govern your access to and use of our website, services, and platform (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    2. Acceptance of Terms
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    By creating an account, placing a bid, listing an item, or using any of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                  </p>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-[#9F13FB]">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      <strong className="text-[#9F13FB]">Age Requirement:</strong> You must be at least 18 years old to use our Service. By using the Service, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into these Terms.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Registration */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    3. Account Registration
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    To access certain features of our Service, you must register for an account. When you register, you agree to:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Provide accurate, current, and complete information</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Maintain and promptly update your account information</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Maintain the security of your password and identification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Accept all responsibility for activities that occur under your account</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Notify us immediately of any unauthorized use of your account</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Bidding Terms */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <Gavel className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    4. Bidding Terms
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    When placing a bid on our platform, you agree to the following:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700 mb-4">
                    <li className="flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>All bids are final and cannot be withdrawn once placed</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>You are legally obligated to complete the purchase if you are the winning bidder</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Bids must be placed in good faith and with the intention to purchase</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>We reserve the right to reject or cancel any bid at our discretion</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Bidding increments are set by the system and cannot be modified</span>
                    </li>
                  </ul>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      <strong className="text-orange-600">Important:</strong> If you are the winning bidder, you must complete payment within the specified timeframe. Failure to do so may result in account suspension and legal action.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Seller Terms */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    5. Seller Terms
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    If you list items for auction on our platform, you agree to:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700 mb-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Provide accurate and complete descriptions of all items</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Upload clear and accurate photographs of items</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Disclose any defects, damage, or issues with items</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Ship items within the specified timeframe after auction completion</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Comply with all applicable laws and regulations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Pay all applicable fees and commissions as agreed</span>
                    </li>
                  </ul>
                  <div className="bg-gradient-to-r from-[#9F13FB]/10 to-[#E95AFF]/10 rounded-lg p-4 border border-[#9F13FB]/20">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      <strong className="text-transparent bg-clip-text bg-gradient-to-r from-[#9F13FB] to-[#E95AFF]">Seller Fees:</strong> Range from 0-10% as specified in your seller agreement. We reserve the right to adjust fees with 30 days' notice.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    6. Payment Terms
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    All payments must be made through our secure payment system. We accept major credit cards and other payment methods as specified on our platform.
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Payment is due immediately upon winning an auction</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>All prices are in GBP (£) unless otherwise stated</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Additional fees (shipping, handling, etc.) will be clearly disclosed</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Refunds are subject to our refund policy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>We reserve the right to hold funds until transaction completion</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Shipping and Delivery */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    7. Shipping and Delivery
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    Shipping terms vary by item and seller. You agree to:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Pay all shipping and handling fees as specified</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Provide accurate shipping addresses</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Inspect items upon delivery and report any damage within 48 hours</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Accept that we are not responsible for delays caused by shipping carriers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Understand that international shipping may be subject to customs and duties</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Returns and Refunds */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    8. Returns and Refunds
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    Returns are accepted only in the following circumstances:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700 mb-4">
                    <li className="flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Item received is significantly different from the description</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Item is damaged during shipping (must be reported within 48 hours)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <RefreshCw className="w-5 h-5 text-[#9F13FB] shrink-0 mt-0.5" />
                      <span>Item is not as described or is counterfeit</span>
                    </li>
                  </ul>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      <strong className="text-green-600">Return Policy:</strong> All return requests must be submitted within 7 days of delivery. Refunds will be processed within 14 business days after we receive and verify the returned item.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Prohibited Items */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-red-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center shrink-0 text-red-600">
                  <Ban className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    9. Prohibited Items
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    You may not list or sell the following items on our platform:
                  </p>
                  <ul className="space-y-3 text-sm md:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Illegal items or items that violate any laws</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Counterfeit or replica items</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Stolen goods</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Hazardous materials</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Items that infringe on intellectual property rights</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Weapons, firearms, or ammunition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>Drugs, alcohol, or tobacco products</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <Copyright className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    10. Intellectual Property
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    The Service and its original content, features, and functionality are owned by Super Media Bros and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise exploit any part of the Service without our prior written permission.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    11. Limitation of Liability
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    To the maximum extent permitted by law, Super Media Bros shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
                  </p>
                </div>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <Scale className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    12. Dispute Resolution
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    If you have a dispute with another user or with us, you agree to first contact us to seek an informal resolution. If we cannot resolve the dispute informally, you agree to resolve it through binding arbitration in accordance with the laws of the United Kingdom.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    You waive any right to participate in a class-action lawsuit or class-wide arbitration against us.
                  </p>
                </div>
              </div>
            </section>

            {/* Termination */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    13. Termination
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach these Terms.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                  </p>
                </div>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 md:p-8 lg:p-10 border border-purple-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#9F13FB] to-[#E95AFF] rounded-xl flex items-center justify-center shrink-0 text-white">
                  <Edit className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    14. Changes to Terms
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
                  </p>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                    What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 md:p-8 lg:p-10 border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shrink-0 text-[#9F13FB]">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-[#0E0E0E] mb-4">
                    15. Contact Information
                  </h2>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    If you have any questions about these Terms, please contact us:
                  </p>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 md:p-6 border border-purple-100">
                    <p className="text-sm md:text-base text-gray-700 mb-2">
                      <strong className="text-transparent bg-clip-text bg-gradient-to-r from-[#9F13FB] to-[#E95AFF]">Super Media Bros</strong>
                    </p>
                    <p className="text-sm md:text-base text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#9F13FB]" />
                      <span>Email: support@supermediabros.com</span>
                    </p>
                    <p className="text-sm md:text-base text-gray-700">
                      <Link href="/contact" className="text-[#9F13FB] hover:underline font-medium inline-flex items-center gap-2">
                        <span>Contact Us</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="bg-gradient-to-r from-[#9F13FB]/10 via-[#E95AFF]/10 to-[#9F13FB]/10 rounded-xl p-6 md:p-8 border border-[#9F13FB]/20 mt-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-[#9F13FB]" />
                <h3 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#9F13FB] to-[#E95AFF]">
                  Important Notice
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-700 text-center leading-relaxed">
                By using our Service, you acknowledge that you have read and understood these Terms and Conditions and agree to be bound by them.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

