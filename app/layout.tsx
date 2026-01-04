import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import { UserProvider } from "@/contexts/UserContext";
import ToastProvider from "@/components/ToastProvider";
import { Toaster } from "react-hot-toast";
import UserNotificationListener from "@/components/UserNotificationListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Super Media Bros",
  description: "Auction site for Super Media Bros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} antialiased`}
        style={{ fontFamily: 'var(--font-plus-jakarta-sans), sans-serif' }}
      >
        <UserProvider>
          <UserNotificationListener />
          <QueryProvider>{children}</QueryProvider>
          <ToastProvider />
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  );
}
