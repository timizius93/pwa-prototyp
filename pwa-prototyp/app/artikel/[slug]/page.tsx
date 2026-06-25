import {notFound} from 'next/navigation'
import {cookies} from 'next/headers'
import {getIssuePanels, asLang} from '@/lib/sanity'
import {ArticleCarousel} from '@/components/ArticleCarousel'

export const dynamic = 'force-dynamic'

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const lang = asLang((await cookies()).get('lang')?.value)
  const panels = await getIssuePanels(lang)

  if (!panels.length) notFound()

  const found = panels.findIndex((p: any) => p.slug === slug)
  const startIndex = found >= 0 ? found : 0

  return <ArticleCarousel panels={panels} startIndex={startIndex} lang={lang} />
}
