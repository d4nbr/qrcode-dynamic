import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', '@napi-rs/canvas'],
  output: 'standalone',
}

export default nextConfig
