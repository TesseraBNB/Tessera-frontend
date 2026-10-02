import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify a verdict",
  description: "Check a Tessera report against its attestation on BNB Chain (BNB Attestation Service, BSC testnet).",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
