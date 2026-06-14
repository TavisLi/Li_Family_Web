import Link from 'next/link'
import { ArrowRight, CalendarDays, Layers3, Newspaper } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { BlogIndexData } from '@/lib/data/posts'
import type { Post } from '@/payload/payload-types'
import { BlogAuthorHoverCard } from './blog-author-hover-card'
import { BlogTagCloud } from './blog-tag-cloud'

type BlogIndexPageProps = {
  data: BlogIndexData
}

export function BlogIndexPage({ data }: BlogIndexPageProps) {
  const featured = data.posts[0]
  const rest = data.posts.slice(1)

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(120deg,rgba(248,250,252,1),rgba(236,253,245,0.72)_45%,rgba(239,246,255,0.78))]">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_20rem] lg:py-14">
        <div>
          <div className="mb-7 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md">
              <Newspaper className="size-4 text-cyan-700" aria-hidden="true" />
              Premium Family Blog
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-6xl">
              家庭文章、旅行札記與長期思考。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              從舊 Blogger 記憶到新的 Payload richText，這裡收納家人的生活隨筆、閱讀筆記與旅行回聲。
            </p>
          </div>

          {featured ? <FeaturedPost post={featured} /> : <EmptyBlogState />}

          {rest.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <BlogTagCloud selectedTag={data.selectedTag} tags={data.tags} />
          <div className="rounded-lg border border-white/55 bg-white/55 p-5 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="size-4 text-cyan-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-700">
                Categories
              </h2>
            </div>
            <div className="grid gap-2">
              {data.categories.map((category) => (
                <Link
                  className="flex items-center justify-between rounded-md border border-white/55 bg-white/45 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
                  href={`/blog?category=${category.slug}`}
                  key={category.id}
                >
                  {category.title}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function FeaturedPost({ post }: { post: Post }) {
  return (
    <article
      className="group grid overflow-hidden rounded-lg border border-white/60 bg-white/55 shadow-xl shadow-slate-900/10 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/70 md:grid-cols-[0.95fr_1.05fr]"
    >
      <PayloadImage
        className="aspect-[16/11] rounded-none md:aspect-auto"
        fallbackLabel={post.title}
        media={post.coverImage}
        priority
        sizes="(min-width: 768px) 44vw, 100vw"
        tone="neutral"
      />
      <article className="flex min-h-80 flex-col justify-between p-6 md:p-8">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatDate(post.publishedDate)}
          </p>
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-3xl font-semibold leading-tight tracking-normal text-slate-950 transition hover:text-cyan-800 md:text-4xl">
              {post.title}
            </h2>
          </Link>
          <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
            由 Payload posts collection 驅動；Blogger 匯入文章會在內容末尾保留原文連結與更新時間。
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <BlogAuthorHoverCard author={post.author} />
          <Link
            aria-label={`Read ${post.title}`}
            className="inline-flex size-10 items-center justify-center rounded-md border border-white/60 bg-white/60 text-slate-500 transition hover:bg-white hover:text-slate-950"
            href={`/blog/${post.slug}`}
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </article>
    </article>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      className="group grid overflow-hidden rounded-lg border border-white/55 bg-white/50 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-xl hover:shadow-slate-900/10"
      href={`/blog/${post.slug}`}
    >
      <PayloadImage
        className="aspect-[16/10] rounded-none"
        fallbackLabel={post.title}
        media={post.coverImage}
        sizes="(min-width: 768px) 34vw, 100vw"
        tone="neutral"
      />
      <article className="p-5">
        <p className="text-xs font-medium uppercase text-slate-500">
          {formatDate(post.publishedDate)}
        </p>
        <h2 className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight tracking-normal text-slate-950">
          {post.title}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags?.slice(0, 3).map((item) => (
            <span
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
              key={item.id ?? item.tag}
            >
              {item.tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  )
}

function EmptyBlogState() {
  return (
    <div className="rounded-lg border border-white/55 bg-white/55 p-8 text-slate-600 shadow-sm backdrop-blur-md">
      Payload posts collection 尚未有可公開顯示的文章。請先執行 seed 或於後台建立 Blog 文章。
    </div>
  )
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-TW', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
