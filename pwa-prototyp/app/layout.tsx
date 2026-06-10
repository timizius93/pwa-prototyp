import type {Metadata, Viewport} from 'next'
import {ServiceWorkerSetup} from '@/components/ServiceWorkerSetup'
import './globals.css'

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
      </body>
    </html>
  )
}
