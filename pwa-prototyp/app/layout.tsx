import type {Metadata, Viewport} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'E-MOUNTAINBIKE — Reader (Pilot)',
  description: 'PWA-Reader-Prototyp für die 41 Publishing Magazin-PWA',
  // iOS Safari erkennt sonst Zahlen/Datumsangaben automatisch als (blaue) Links.
  formatDetection: {telephone: false, date: false, address: false, email: false},
}

export const viewport: Viewport = {
  themeColor: '#0c0c0d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
