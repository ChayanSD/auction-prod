'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apiClient } from '@/lib/fetcher';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Home, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import PremiumLoader from '@/components/shared/PremiumLoader';

/**
 * Contact Us Page Content
 */
function ContactPageContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const initialType = searchParams?.get('type') || 'General';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    type: (initialType === 'Consignment' ? 'Consignment' : 'General') as 'General' | 'Consignment' | 'Support' | 'Bidding' | 'Other',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update type when search param changes
  useEffect(() => {
    const typeParam = searchParams?.get('type');
    if (typeParam === 'Consignment') {
      setFormData((prev) => ({ ...prev, type: 'Consignment' }));
    }
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (formData.message.length < 10) {
      toast.error('Message must be at least 10 characters long', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Trim all string fields before sending
      const trimmedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        type: formData.type,
        userId: user?.id || null,
      };
      
      await apiClient.post('/contact', trimmedData);
      
      toast.success('Thank you for contacting us! We will get back to you soon.', {
        position: "top-right",
        autoClose: 5000,
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: '',
        type: 'General',
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Failed to submit contact form. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      }
      
      // Show validation errors if available
      if (error?.response?.data?.details) {
        const validationErrors = error.response.data.details
          .map((detail: any) => `${detail.path?.join('.') || 'Field'}: ${detail.message}`)
          .join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-16 lg:h-20"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Breadcrumbs */}
        {/* <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6 sm:mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-gray-900 font-medium">Contact Us</span>
        </nav> */}

        {/* Page Header */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Have a question or want to consign an item? We're here to help! Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Inquiry Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    required
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Consignment">Consignment</option>
                    <option value="Support">Support</option>
                    <option value="Bidding">Bidding Question</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                    placeholder="Please provide details about your inquiry..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum 10 characters required
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Contact Us Page
 * Wrapped in Suspense for useSearchParams
 */
export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-16 lg:h-20"></div>
        <PremiumLoader text="Loading contact page..." />
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  );
}
