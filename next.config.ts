import type { NextConfig } from "next";

// Tessera frontend — deployed on Vercel, talks to the Go API on Railway via
// NEXT_PUBLIC_API_URL. No static export / no dev rewrites: the browser calls
// the API origin directly (CORS allowlisted server-side).
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
