/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js-Dev-Indikator (das „N"-Overlay) ausblenden — reines Dev-Tool, stört beim
  // iPhone-Test. (Im Produktions-Build erscheint es ohnehin nicht.)
  devIndicators: false,

  // Bilder kommen direkt vom Sanity-CDN über <img> — wir nutzen bewusst NICHT
  // den next/image-Optimizer (Vercel-Kostenfalle laut Review).

  // Zugriff vom iPhone über die LAN-IP im Dev-Modus erlauben (sonst kann Next
  // Cross-Origin-Dev-Requests einschränken → Client-JS/Hydration läuft nicht).
  allowedDevOrigins: ['192.168.178.182'],
}

export default nextConfig
