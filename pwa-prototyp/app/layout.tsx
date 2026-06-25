import type {Metadata, Viewport} from 'next'
import {ServiceWorkerSetup} from '@/components/ServiceWorkerSetup'
import {VisualEditingBridge} from '@/components/VisualEditingBridge'
import './globals.css'

// Live-Preview-Brücke nur lokal/in der Preview-Umgebung laden (NEXT_PUBLIC_SANITY_PREVIEW=true
// in .env.local). Auf Vercel ist das Flag nicht gesetzt → der Code landet nicht im Bundle,
// die öffentliche Demo bleibt unberührt.
const PREVIEW = process.env.NEXT_PUBLIC_SANITY_PREVIEW === 'true'

export const metadata: Metadata = {
  title: 'E-MOUNTAINBIKE — Reader (Pilot)',
  description: 'PWA-Reader-Prototyp für die 41 Publishing Magazin-PWA',
  // Pilot zeigt Drafts und ist nicht der echte Auftritt — nicht indexieren
  // (Skeptiker-Review: Pilot-Hygiene, auch wegen SEO-Duplikaten zu ebike-mtb.com).
  robots: {index: false, follow: false},
  // iOS Safari erkennt sonst Zahlen/Datumsangaben automatisch als (blaue) Links.
  formatDetection: {telephone: false, date: false, address: false, email: false},
  // Vom Homescreen gestartet im Vollbild ohne Safari-Chrome laufen.
  // Opake (schwarze) Status-Bar → Inhalt rutscht nicht unter Uhr/Notch.
  appleWebApp: {
    capable: true,
    title: 'E-MTB',
    statusBarStyle: 'black',
  },
}

export const viewport: Viewport = {
  themeColor: '#0c0c0d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de">
      <body>
        <ServiceWorkerSetup />
        {children}
        {PREVIEW && <VisualEditingBridge />}
      </body>
    </html>
  )
}
