"use client";

import Link from "next/link";
import { Hammer, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Animated Icon Section */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 bg-linear-to-br from-purple-500 to-blue-600 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl overflow-hidden relative group">
              <Hammer className="w-16 h-16 text-white -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* 404 Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 -rotate-12 font-bold text-2xl text-purple-600">
              404
            </div>
          </div>
        </div>

        {/* Content Section */}
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
          Sold to the...{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-blue-600">
            Void!
          </span>
        </h1>

        <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-md mx-auto leading-relaxed">
          The item or lot you&apos;re looking for isn&apos;t in our catalogue.
          It might have been withdrawn or moved to a different gallery.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>

          <Link
            href="/auction"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold hover:border-purple-200 hover:text-purple-600 transition-all hover:shadow-md active:scale-95"
          >
            <Search className="w-5 h-5" />
            Browse Auctions
          </Link>
        </div>

        {/* Subtle Footer Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-12 text-gray-400 hover:text-gray-600 flex items-center gap-2 mx-auto transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>
      </div>

      {/* Decorative Floating Shapes */}
      <div className="hidden lg:block absolute top-1/4 left-10 w-12 h-12 border-4 border-purple-200 rounded-full animate-bounce" />
      <div className="hidden lg:block absolute bottom-1/4 right-10 w-8 h-8 bg-blue-200 rounded-lg rotate-45 animate-spin-slow" />
    </div>
  );
}
