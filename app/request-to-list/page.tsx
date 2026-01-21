"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuctionRequestForm from "@/components/shared/AuctionRequestForm";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function RequestToListPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F13FB]"></div>
      </div>
    );
  }

  const isApprovedSeller =
    user.accountType === "Seller" || user.sellerStatus === "Approved";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#9F13FB] to-[#E95AFF] p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Request to List Your Auction Item
            </h1>
            <p className="text-white/80">
              Fill out the form below to submit your auction item for review.
              Our admin team will review your request and get back to you soon.
            </p>
          </div>

          <div className="p-8">
            {isApprovedSeller && (
              <div className="mb-8 p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-900">
                    You are a registered seller!
                  </h3>
                  <p className="text-sm text-purple-700">
                    You can also manage your listings from your seller
                    dashboard.
                  </p>
                </div>
                <Link
                  href="/profile/seller-portal"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              </div>
            )}

            <AuctionRequestForm
              onSuccess={() => {
                if (isApprovedSeller) {
                  router.push("/profile/seller-portal?tab=consignments");
                } else {
                  router.push("/profile");
                }
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
