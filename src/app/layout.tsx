import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
});

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--ff-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ff-mono",
  display: "swap",
});

const siteURL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tessera.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: {
    default: "Tessera — Public Goods Intelligence",
    template: "%s · Tessera",
  },
  description:
    "An autonomous agent that evaluates Ethereum public-goods funding with evidence, not narrative — live trust-graph, mechanism, and on-chain analysis across Octant, Gitcoin, and Optimism RetroPGF.",
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
  themeColor: "#0a0c0e",
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
