import {notFound} from 'next/navigation'
import {getIssueArticlesFull} from '@/lib/sanity'
import {ArticleCarousel} from '@/components/ArticleCarousel'

export const dynamic = 'force-dynamic'

export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const articles = await getIssueArticlesFull()

  if (!articles.length) notFound()

  const found = articles.findIndex((a: any) => a.slug === slug)
  const startIndex = found >= 0 ? found : 0

  return <ArticleCarousel articles={articles} startIndex={startIndex} />
}
