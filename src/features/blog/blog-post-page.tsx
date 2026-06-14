import Link from 'next/link'
import { ArrowLeft, CalendarDays, LockKeyhole } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { blogInteractionId, type BlogInteractionThread } from '@/lib/data/posts'
import type { Post } from '@/payload/payload-types'
import { BlogAuthorHoverCard } from './blog-author-hover-card'
import { BlogReactionPanel } from './blog-reaction-panel'
import { LexicalRenderer } from './lexical-renderer'

type BlogPostPageProps = {
  post: Post
  thread: BlogInteractionThread
}

export function BlogPostPage({ post, thread }: BlogPostPageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(240,253,250,0.75)_44%,rgba(255,247,237,0.7))]">
      <article className="mx-auto w-full max-w-5xl px-5 py-8 md:py-12">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          href="/blog"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          回到 Blog
        </Link>

        <header className="rounded-lg border border-white/60 bg-white/55 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-md md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(post.publishedDate)}
            </span>
            {post.isPrivate ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Family Only
              </span>
            ) : null}
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-6xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BlogAuthorHoverCard author={post.author} />
            {post.categories?.map((category) =>
              typeof category === 'number' ? null : (
                <Link
                  className="rounded-full border border-white/55 bg-white/55 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
                  href={`/blog?category=${category.slug}`}
                  key={category.id}
                >
                  {category.title}
                </Link>
              ),
            )}
          </div>
        </header>

        <PayloadImage
          className="mt-6 aspect-[16/8] min-h-72 rounded-lg border border-white/60 shadow-xl shadow-slate-900/10"
          fallbackLabel={post.title}
          media={post.coverImage}
          priority
          sizes="(min-width: 1024px) 64rem, 100vw"
          tone="neutral"
        />

        <div className="mx-auto mt-8 max-w-3xl">
          <div className="mb-8 flex flex-wrap gap-2">
            {post.tags?.map((item) => (
              <Link
                className="rounded-md bg-white/65 px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"
                href={`/blog?tag=${encodeURIComponent(item.tag)}`}
                key={item.id ?? item.tag}
              >
                #{item.tag}
              </Link>
            ))}
          </div>

          <LexicalRenderer content={post.content} />

          <BlogReactionPanel
            associatedId={blogInteractionId(post)}
            className="mt-10"
            postSlug={post.slug}
            thread={thread}
          />
        </div>
      </article>
    </main>
  )
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-TW', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
