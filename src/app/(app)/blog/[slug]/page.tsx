import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogPostPage } from '@/features/blog/blog-post-page'
import { blogInteractionId, getBlogInteractionThread, getBlogPostBySlug } from '@/lib/data/posts'
import { getMediaUrl } from '@/lib/media'

export const dynamic = 'force-dynamic'

type BlogPostRouteProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostRouteProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Blog',
    }
  }

  if (post.isPrivate) {
    return {
      title: 'Family-only Blog Post',
      description: '這篇家庭文章需要登入後才能閱讀。',
    }
  }

  const image = getMediaUrl(post.coverImage)
  const description = post.tags?.length
    ? `Web Li Blog: ${post.tags.map((item) => item.tag).join(', ')}`
    : 'Web Li 家庭 Blog 文章。'

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      images: image ? [{ url: image }] : undefined,
      publishedTime: post.publishedDate,
      type: 'article',
    },
  }
}

export default async function BlogPostRoute({ params }: BlogPostRouteProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const thread = await getBlogInteractionThread(blogInteractionId(post))
  const jsonLd = post.isPrivate ? null : blogPostingJsonLd(post)

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <BlogPostPage post={post} thread={thread} />
    </>
  )
}

function blogPostingJsonLd(post: NonNullable<Awaited<ReturnType<typeof getBlogPostBySlug>>>) {
  const image = getMediaUrl(post.coverImage)
  const authorName = typeof post.author === 'number' ? 'Web Li Family' : post.author.displayName

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.publishedDate,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    image: image ? [image] : undefined,
    mainEntityOfPage: `/blog/${post.slug}`,
  }
}
