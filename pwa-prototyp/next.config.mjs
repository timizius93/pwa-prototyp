/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bilder kommen direkt vom Sanity-CDN über <img> — wir nutzen bewusst NICHT
  // den next/image-Optimizer (Vercel-Kostenfalle laut Review).

  // Zugriff vom iPhone über die LAN-IP im Dev-Modus erlauben (sonst kann Next
  // Cross-Origin-Dev-Requests einschränken → Client-JS/Hydration läuft nicht).
  allowedDevOrigins: ['192.168.178.182'],
}

export default nextConfig
