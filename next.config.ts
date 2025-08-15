import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching for debugging Google Auth issues
  generateBuildId: () => Date.now().toString(),
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://ssl.gstatic.com;
              style-src 'self' 'unsafe-inline' https://accounts.google.com;
              img-src 'self' data: https: blob:;
              font-src 'self' https://fonts.gstatic.com;
              connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com;
              frame-src 'self' https://accounts.google.com;
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
