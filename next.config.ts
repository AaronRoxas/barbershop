import type { NextConfig } from "next";

function backendUrl() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return ["https:", "http:"].includes(url.protocol) ? url : null;
  } catch { return null; }
}

const backend = backendUrl();
const nextConfig: NextConfig = {
  images: {
    remotePatterns: backend ? [{
      protocol: backend.protocol === "https:" ? "https" : "http",
      hostname: backend.hostname, port: backend.port,
      pathname: "/storage/v1/object/public/business-images/**", search: "",
    }] : [],
    // The local Supabase storage API runs on loopback; hosted backends retain the default restriction.
    dangerouslyAllowLocalIP: backend ? ["localhost", "127.0.0.1"].includes(backend.hostname) : false,
  },
};

export default nextConfig;
