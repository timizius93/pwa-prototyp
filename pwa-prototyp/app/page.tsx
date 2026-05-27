import {getKiosk} from '@/lib/sanity'
import {Kiosk} from '@/components/Kiosk'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getKiosk()

  if (!data) {
    return <main className="empty">Keine Ausgabe in Sanity gefunden.</main>
  }

  return <Kiosk data={data} />
}
