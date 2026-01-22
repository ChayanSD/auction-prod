"use client";

import { Suspense } from "react";
import SellerDashboard from "@/components/Profile/SellerDashboard";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerPortalPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (
        user.accountType !== "Seller" &&
        user.accountType !== "Admin"
      ) {
        router.push("/profile");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9F13FB]"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="py-10">
        <SellerDashboard />
      </div>
    </Suspense>
  );
}
