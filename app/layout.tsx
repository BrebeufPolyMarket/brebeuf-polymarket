import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { HouseLeadBanner } from "@/components/realtime/house-lead-banner";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brebeuf Polymarket",
  description: "Campus prediction market platform for Brebeuf College School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <HouseLeadBanner />
        {children}
      </body>
    </html>
  );
}
