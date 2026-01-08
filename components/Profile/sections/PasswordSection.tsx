'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Password Section Component
 * Allows users to update their password
 * Pixel-perfect design matching Figma
 */
const PasswordSection: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Passwords
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-3">
          Update your password to keep your account secure
        </p>
        <p className="text-xs sm:text-sm text-gray-500">
          Last changed: 15-03-2024 &nbsp; 10:22
        </p>
      </div>

      <div className="space-y-5 sm:space-y-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 pr-12 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 pr-12 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            Passwords must be a minimum of 8 characters and include an uppercase letter, lowercase letter, number, and special character (e.g. !@#$%^&*).
          </p>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full h-11 sm:h-12 rounded-lg border border-gray-300 px-4 sm:px-5 pr-12 text-sm sm:text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button className="mt-4 sm:mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#E253FF] to-[#9F13FB] text-white px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95">
          Update Password
        </button>
      </div>
    </section>
  );
};

export default PasswordSection;

