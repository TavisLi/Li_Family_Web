'use client'

import React from 'react'
import { useState } from 'react'
import ImageModule from 'next/image'

import type { Media } from '@/payload/payload-types'
import { cn } from '@/lib/utils'
import { ImageFallback } from './image-fallback'

const Image = (
  'default' in ImageModule ? ImageModule.default : ImageModule
) as typeof ImageModule

type PayloadImageProps = {
  media: Media | number | null | undefined
  fallbackLabel: string
  className?: string
  imageClassName?: string
  fit?: 'contain' | 'cover'
  layout?: 'fill' | 'intrinsic'
  preferOriginal?: boolean
  priority?: boolean
  sizes: string
  tone?: 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'
}

function getMediaUrl(media: Media | number | null | undefined, preferOriginal = false) {
  if (!media || typeof media === 'number') {
    return null
  }

  if (preferOriginal) {
    return media.url ?? media.sizes?.large?.url ?? media.sizes?.medium?.url ?? null
  }

  return media.sizes?.large?.url ?? media.sizes?.medium?.url ?? media.url ?? null
}

function getMediaDimensions(media: Media | number | null | undefined) {
  if (!media || typeof media === 'number') {
    return null
  }

  const width = media.width ?? media.sizes?.large?.width ?? media.sizes?.medium?.width ?? null
  const height = media.height ?? media.sizes?.large?.height ?? media.sizes?.medium?.height ?? null

  if (!width || !height) {
    return null
  }

  return { height, width }
}

export function PayloadImage({
  media,
  fallbackLabel,
  className,
  imageClassName,
  fit = 'contain',
  layout = 'fill',
  preferOriginal = false,
  priority = false,
  sizes,
  tone = 'neutral',
}: PayloadImageProps) {
  const [hasError, setHasError] = useState(false)
  const src = getMediaUrl(media, preferOriginal)
  const dimensions = getMediaDimensions(media)

  if (hasError || !src || !media || typeof media === 'number') {
    return <ImageFallback className={className} label={fallbackLabel} tone={tone} />
  }

  if (layout === 'intrinsic' && dimensions) {
    return (
      <div className={cn('overflow-hidden rounded-lg bg-white/35', className)} data-image-layout="intrinsic">
        <Image
          alt={media.altText}
          className={cn('h-auto w-full object-contain', imageClassName)}
          height={dimensions.height}
          priority={priority}
          sizes={sizes}
          src={src}
          unoptimized
          width={dimensions.width}
          onError={() => setHasError(true)}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-lg bg-white/35', className)} data-image-layout="fill">
      <Image
        alt={media.altText}
        className={cn(fit === 'cover' ? 'object-cover' : 'object-contain', imageClassName)}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  )
}
