import type { NextConfig } from "next";

/**
 * Next.js Configuration
 * 
 * Configured for production deployment with Docker support.
 */
const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Disable image optimization if not using Next.js Image component
  // images: {
  //   unoptimized: true
  // },
  
  // Experimental features (use with caution)
  experimental: {
    // Enable if using server actions
    // serverActions: true,
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        // Cache API responses
        source: '/api/data',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300'
          }
        ]
      }
    ]
  },
  
  // Redirects (if needed)
  async redirects() {
    return []
  },
  
  // Rewrites (if needed)
  async rewrites() {
    return []
  }
}

export default nextConfig
