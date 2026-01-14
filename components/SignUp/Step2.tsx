"use client";

import { useState } from "react";
import Link from "next/link";

type FormDataType = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode?: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  newsletter: boolean;
};

type HandleInputChange = (key: string, value: string | boolean) => void;

type ErrorsType = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
};

type CallingCodesType = string[];

export default function Step2({
  formData,
  handleInputChange,
  callingCodes,
  errors,
}: {
  formData: FormDataType;
  handleInputChange: HandleInputChange;
  callingCodes: CallingCodesType;
  errors: ErrorsType;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <div className="w-full overflow-x-hidden">
      <h2 className="text-base md:text-lg lg:text-2xl xl:text-2xl font-semibold mb-4 md:mb-6 xl:mb-8 border-b border-[#E3E3E3] pb-4 md:pb-6 xl:pb-8 break-words">
        Account Information and Credentials
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              htmlFor="firstName"
              className="text-sm md:text-base lg:text-lg xl:text-lg font-semibold text-[#0E0E0E] block"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent mt-2 text-sm sm:text-base"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="middleName"
              className="text-sm md:text-base lg:text-lg xl:text-lg font-semibold text-[#0E0E0E] block"
            >
              Middle Name
            </label>
            <input
              id="middleName"
              type="text"
              value={formData.middleName}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent mt-2 text-sm sm:text-base"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="text-sm md:text-base lg:text-lg xl:text-lg font-semibold text-[#0E0E0E] block"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent mt-2 text-sm sm:text-base"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="email"
            className="text-sm md:text-base lg:text-lg xl:text-lg font-semibold text-[#0E0E0E] block"
          >
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 md:p-2.5 xl:p-3 focus:outline-none focus:ring-2 focus:ring-purple-300 mt-2 text-sm md:text-base xl:text-base"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}

          <div className="mt-6">
            <label
              htmlFor="phone"
              className="text-lg font-semibold text-[#0E0E0E]"
            >
              Phone Number
            </label>
            <div className="flex items-stretch mt-2">
              <div className="flex w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded">
                <label htmlFor="phoneCode" className="flex items-center px-2">
                  <select
                    id="phoneCode"
                    value={formData.phoneCode}
                    onChange={(e) =>
                      handleInputChange("phoneCode", e.target.value)
                    }
                    className="bg-transparent border-0 outline-none p-0 text-sm focus:outline-none focus:ring-0"
                    aria-label="Country calling code"
                  >
                    {callingCodes.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="flex-1 bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 outline-none text-sm sm:text-base focus:outline-none focus:ring-0"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="password"
              className="text-lg font-semibold text-[#0E0E0E] mb-2"
            >
              Password
            </label>
            <p className="text-sm text-gray-500 my-2">
              Passwords are a minimum of 8 characters and must include an upper
              case letter, a lower case letter, a number and a special character
              (e.g., !@#$%^&*).
            </p>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 focus:outline-none focus:ring-0"
              >
                {!showPassword ? (
                  // Provided SVG (eye) used by default when password is hidden
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M19.3211 9.74688C19.2937 9.68516 18.632 8.21719 17.1609 6.74609C15.2008 4.78594 12.725 3.75 9.99999 3.75C7.27499 3.75 4.79921 4.78594 2.83905 6.74609C1.36796 8.21719 0.703118 9.6875 0.678899 9.74688C0.643362 9.82681 0.625 9.91331 0.625 10.0008C0.625 10.0883 0.643362 10.1748 0.678899 10.2547C0.706243 10.3164 1.36796 11.7836 2.83905 13.2547C4.79921 15.2141 7.27499 16.25 9.99999 16.25C12.725 16.25 15.2008 15.2141 17.1609 13.2547C18.632 11.7836 19.2937 10.3164 19.3211 10.2547C19.3566 10.1748 19.375 10.0883 19.375 10.0008C19.375 9.91331 19.3566 9.82681 19.3211 9.74688ZM9.99999 15C7.5953 15 5.49452 14.1258 3.75546 12.4023C3.0419 11.6927 2.43483 10.8836 1.95312 10C2.4347 9.11636 3.04179 8.30717 3.75546 7.59766C5.49452 5.87422 7.5953 5 9.99999 5C12.4047 5 14.5055 5.87422 16.2445 7.59766C16.9595 8.307 17.5679 9.11619 18.0508 10C17.4875 11.0516 15.0336 15 9.99999 15ZM9.99999 6.25C9.25831 6.25 8.53329 6.46993 7.9166 6.88199C7.29992 7.29404 6.81927 7.87971 6.53544 8.56494C6.25162 9.25016 6.17735 10.0042 6.32205 10.7316C6.46674 11.459 6.82389 12.1272 7.34834 12.6517C7.87279 13.1761 8.54097 13.5333 9.2684 13.6779C9.99583 13.8226 10.7498 13.7484 11.4351 13.4645C12.1203 13.1807 12.7059 12.7001 13.118 12.0834C13.5301 11.4667 13.75 10.7417 13.75 10C13.749 9.00576 13.3535 8.05253 12.6505 7.34949C11.9475 6.64645 10.9942 6.25103 9.99999 6.25ZM9.99999 12.5C9.50554 12.5 9.02219 12.3534 8.61107 12.0787C8.19994 11.804 7.87951 11.4135 7.69029 10.9567C7.50107 10.4999 7.45157 9.99723 7.54803 9.51227C7.64449 9.02732 7.88259 8.58186 8.23222 8.23223C8.58186 7.8826 9.02731 7.6445 9.51227 7.54804C9.99722 7.45157 10.4999 7.50108 10.9567 7.6903C11.4135 7.87952 11.804 8.19995 12.0787 8.61107C12.3534 9.0222 12.5 9.50555 12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 9.99999 12.5Z"
                      fill="#4D4D4D"
                    />
                  </svg>
                ) : (
                  // Alternate/compatible icon (eye with slash) shown when password is visible
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.33 0-9.27-3.11-11-7 1.02-2.22 2.7-4.02 4.72-5.16" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="confirmPassword"
              className="text-lg font-semibold text-[#0E0E0E] mb-2"
            >
              Re-Enter Password
            </label>
            <div className="relative mt-2">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
              <button
                type="button"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 focus:outline-none focus:ring-0"
              >
                {!showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M19.3211 9.74688C19.2937 9.68516 18.632 8.21719 17.1609 6.74609C15.2008 4.78594 12.725 3.75 9.99999 3.75C7.27499 3.75 4.79921 4.78594 2.83905 6.74609C1.36796 8.21719 0.703118 9.6875 0.678899 9.74688C0.643362 9.82681 0.625 9.91331 0.625 10.0008C0.625 10.0883 0.643362 10.1748 0.678899 10.2547C0.706243 10.3164 1.36796 11.7836 2.83905 13.2547C4.79921 15.2141 7.27499 16.25 9.99999 16.25C12.725 16.25 15.2008 15.2141 17.1609 13.2547C18.632 11.7836 19.2937 10.3164 19.3211 10.2547C19.3566 10.1748 19.375 10.0883 19.375 10.0008C19.375 9.91331 19.3566 9.82681 19.3211 9.74688ZM9.99999 15C7.5953 15 5.49452 14.1258 3.75546 12.4023C3.0419 11.6927 2.43483 10.8836 1.95312 10C2.4347 9.11636 3.04179 8.30717 3.75546 7.59766C5.49452 5.87422 7.5953 5 9.99999 5C12.4047 5 14.5055 5.87422 16.2445 7.59766C16.9595 8.307 17.5679 9.11619 18.0508 10C17.4875 11.0516 15.0336 15 9.99999 15ZM9.99999 6.25C9.25831 6.25 8.53329 6.46993 7.9166 6.88199C7.29992 7.29404 6.81927 7.87971 6.53544 8.56494C6.25162 9.25016 6.17735 10.0042 6.32205 10.7316C6.46674 11.459 6.82389 12.1272 7.34834 12.6517C7.87279 13.1761 8.54097 13.5333 9.2684 13.6779C9.99583 13.8226 10.7498 13.7484 11.4351 13.4645C12.1203 13.1807 12.7059 12.7001 13.118 12.0834C13.5301 11.4667 13.75 10.7417 13.75 10C13.749 9.00576 13.3535 8.05253 12.6505 7.34949C11.9475 6.64645 10.9942 6.25103 9.99999 6.25ZM9.99999 12.5C9.50554 12.5 9.02219 12.3534 8.61107 12.0787C8.19994 11.804 7.87951 11.4135 7.69029 10.9567C7.50107 10.4999 7.45157 9.99723 7.54803 9.51227C7.64449 9.02732 7.88259 8.58186 8.23222 8.23223C8.58186 7.8826 9.02731 7.6445 9.51227 7.54804C9.99722 7.45157 10.4999 7.50108 10.9567 7.6903C11.4135 7.87952 11.804 8.19995 12.0787 8.61107C12.3534 9.0222 12.5 9.50555 12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 9.99999 12.5Z"
                      fill="#4D4D4D"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 1l22 22" />
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5.33 0-9.27-3.11-11-7 1.02-2.22 2.7-4.02 4.72-5.16" />
                  </svg>
                )}
              </button>
            </div>

            <label className="flex items-center gap-2 my-6">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) =>
                  handleInputChange("termsAccepted", e.target.checked)
                }
              />
              I accept the <Link href="/terms" className="text-[#9F13FB] hover:underline">terms & conditions</Link>
            </label>
            {errors.termsAccepted && (
              <p className="text-red-500 text-sm mt-1">
                {errors.termsAccepted}
              </p>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.newsletter}
                onChange={(e) =>
                  handleInputChange("newsletter", e.target.checked)
                }
              />
              <span className="text-sm md:text-base">
                I would like to receive updates about upcoming auctions and news from Supermedia Bros
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
