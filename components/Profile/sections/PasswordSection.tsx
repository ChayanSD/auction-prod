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
    <section className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6 shadow-sm mb-10">
      <div className="mb-2">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
          My Passwords
        </h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Last changed: 15-03-2024 &nbsp; 10:22
      </p>

      <div className="space-y-4 text-sm text-gray-700">
        <div>
          <label className="block font-medium text-gray-500 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showCurrentPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-500 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm mb-1"
              placeholder="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Passwords are a minimum of 8 characters and must include an upper case letter, a lower case letter, a number and a special character (e.g. !@#$%^&*).
          </p>
        </div>

        <div>
          <label className="block font-medium text-gray-500 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-sm"
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button className="mt-3 inline-flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">
          Update Password
        </button>
      </div>
    </section>
  );
};

export default PasswordSection;

