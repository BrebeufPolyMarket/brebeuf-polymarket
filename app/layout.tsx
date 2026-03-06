import type { Metadata } from "next";

import { HouseLeadBanner } from "@/components/realtime/house-lead-banner";

import "./globals.css";

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
      <body className="antialiased">
        <HouseLeadBanner />
        {children}
      </body>
    </html>
  );
}
