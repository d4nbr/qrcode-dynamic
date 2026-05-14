import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OAB Maranhão · Wallpaper Wi-Fi',
    short_name: 'OAB MA Wi-Fi',
    description: 'Gerador de papéis de parede institucionais com QR Code Wi-Fi',
    start_url: '/gerar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#003366',
    theme_color: '#003366',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
