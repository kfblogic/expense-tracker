import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    // Foto struk (sudah dikecilkan di browser) dikirim lewat Server Action.
    serverActions: { bodySizeLimit: '3mb' },
  },
};

export default nextConfig;
