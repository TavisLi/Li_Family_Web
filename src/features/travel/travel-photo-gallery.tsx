import Link from 'next/link'
import React from 'react'
import { Images } from 'lucide-react'

import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelRuntimeRecord } from '@/lib/travel-runtime'
import type { Media } from '@/payload/payload-types'

type TravelPhotoGalleryProps = {
  project: TravelRuntimeRecord
}

export function TravelPhotoGalleryPreview({ project }: TravelPhotoGalleryProps) {
  const gallery = mediaObjects(project.galleryImages)
  const preview = gallery.slice(0, 5)

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-slate-500">Photo Rhythm</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
            照片瀑布流與正式預留模組
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            有照片時讀 Payload Media，照片不足時以 ImageFallback 保持版面節奏。
          </p>
        </div>
        {gallery.length > preview.length ? (
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
            href={`/travel/${project.slug}/photos`}
          >
            <Images className="size-4" aria-hidden="true" />
            Show all photos
          </Link>
        ) : null}
      </div>
      <TravelPhotoGrid fallbackLabel={project.title} media={preview} />
    </section>
  )
}

export function TravelPhotoGalleryPage({ project }: TravelPhotoGalleryProps) {
  const gallery = mediaObjects(project.galleryImages)

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f4_44%,#f8efe5_100%)] text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-5 py-10 md:py-14">
        <Link
          className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          href={`/travel/${project.slug}`}
        >
          回到旅行頁
        </Link>
        <div className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase text-slate-500">All photos</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal text-slate-950 md:text-6xl">
            {project.title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
            完整照片頁保留每張照片原始比例，避免裁切掉人物、景點或行程細節。
          </p>
        </div>
        <div className="mt-10">
          <TravelPhotoGrid fallbackLabel={project.title} media={gallery} />
        </div>
      </section>
    </main>
  )
}

function TravelPhotoGrid({
  fallbackLabel,
  media,
}: {
  fallbackLabel: string
  media: Media[]
}) {
  if (!media.length) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ImageFallback key={index} label={`${fallbackLabel} photo ${index + 1}`} tone="lynn" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid auto-rows-[12rem] gap-4 sm:grid-cols-2 sm:auto-rows-[14rem] lg:grid-cols-4">
      {media.map((item, index) => (
        <article className={galleryTileClass(index, media.length)} key={item.id}>
          <PayloadImage
            className="size-full rounded-lg border border-white/60 shadow-sm shadow-slate-900/10"
            fallbackLabel={item.altText}
            media={item}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            tone="lynn"
          />
        </article>
      ))}
    </div>
  )
}

function galleryTileClass(index: number, count: number): string {
  if (count === 1) {
    return 'sm:col-span-2 lg:col-span-3 lg:row-span-2'
  }

  if (index === 0) {
    return 'sm:col-span-2 sm:row-span-2'
  }

  if (index === 3) {
    return 'lg:row-span-2'
  }

  return ''
}

function mediaObjects(media: TravelRuntimeRecord['galleryImages']): Media[] {
  return (media ?? []).filter((item): item is Media => typeof item === 'object')
}
