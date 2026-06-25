import {cookies} from 'next/headers'
import {getKiosk, asLang} from '@/lib/sanity'
import {Kiosk} from '@/components/Kiosk'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const lang = asLang((await cookies()).get('lang')?.value)
  const data = await getKiosk(lang)

  if (!data) {
    return <main className="empty">Keine Ausgabe in Sanity gefunden.</main>
  }

  return <Kiosk data={data} lang={lang} />
}
