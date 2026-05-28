import type { Metadata } from "next";
import { Suspense } from "react";
import { Dancing_Script, Bree_Serif, DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const dancingScript = Dancing_Script({
  variable: "--font-brittany",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const breeSerif = Bree_Serif({
  variable: "--font-bree-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const dmSans = DM_Sans({
  variable: "--font-product-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rest & Rx | Wellness for Healthcare Heroes",
  description:
    "A revolutionary, physician-backed app combating healthcare burnout. Exclusive perks, intentional inspiration, and supportive community for healthcare professionals.",
  keywords:
    "healthcare burnout, wellness app, physician wellness, healthcare professionals, self-care, Dr. Helene Okpere",
  openGraph: {
    title: "Rest & Rx | Wellness for Healthcare Heroes",
    description:
      "Empowering healthcare professionals to reclaim balance and joy through curated wellness tools, exclusive discounts, and supportive community.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dancingScript.variable} ${breeSerif.variable} ${dmSans.variable}`}
    >
      <body className={dmSans.className} style={{ minHeight: "100vh" }}>
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
