import type { Metadata, Viewport } from "next";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ff-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--ff-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-mono",
  display: "swap",
});

const siteURL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tessera-bnb.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: {
    default: "Tessera — Public Goods Intelligence",
    template: "%s · Tessera",
  },
  description:
    "An autonomous agent that evaluates Ethereum public-goods funding with evidence, not narrative — live trust-graph, mechanism, and on-chain analysis across Octant and Optimism RetroPGF, BNB Chain first.",
  applicationName: "Tessera",
  authors: [{ name: "Yeheskiel Yunus Tame" }],
  openGraph: {
    title: "Tessera — Public Goods Intelligence",
    description: "Evidence over narrative. An autonomous agent for Ethereum public-goods funding.",
    type: "website",
    siteName: "Tessera",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#07060d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
