import type { Metadata } from 'next'

import { BlogIndexPage } from '@/features/blog/blog-index-page'
import { getBlogIndex } from '@/lib/data/posts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Web Li 家庭 Blog，收納生活隨筆、旅行札記與長期思考。',
}

type BlogPageProps = {
  searchParams: Promise<{
    category?: string
    tag?: string
  }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category, tag } = await searchParams
  const data = await getBlogIndex({ category, tag })

  return <BlogIndexPage data={data} />
}
