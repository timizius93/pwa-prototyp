import type {MetadataRoute} from 'next'

// Web-App-Manifest. Sorgt dafür, dass die vom Homescreen gestartete App im
// Vollbild ohne Browser-Chrome läuft (display: standalone). Wird von Next.js
// automatisch als <link rel="manifest"> in den <head> eingehängt.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'E-MOUNTAINBIKE',
    short_name: 'E-MTB',
    description: 'Das E-Mountainbike-Magazin als Web-App.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c0c0d',
    theme_color: '#0c0c0d',
    icons: [
      // Echte 41-Bildmarke (public/icon-512.png) — deckt Android/Chrome ab.
      {src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
      {src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
    ],
  }
}
