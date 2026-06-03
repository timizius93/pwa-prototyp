import {notFound} from 'next/navigation'
import {getIssuePanels} from '@/lib/sanity'
import {ArticleCarousel} from '@/components/ArticleCarousel'

export const dynamic = 'force-dynamic'

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const panels = await getIssuePanels()

  if (!panels.length) notFound()

  const found = panels.findIndex((p: any) => p.slug === slug)
  const startIndex = found >= 0 ? found : 0

  return <ArticleCarousel panels={panels} startIndex={startIndex} />
}
