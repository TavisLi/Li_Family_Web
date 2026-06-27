'use client'

import React from 'react'
import { useState } from 'react'
import Image from 'next/image'

import type { Media } from '@/payload/payload-types'
import { cn } from '@/lib/utils'
import { ImageFallback } from './image-fallback'

type PayloadImageProps = {
  media: Media | number | null | undefined
  fallbackLabel: string
  className?: string
  imageClassName?: string
  priority?: boolean
  sizes: string
  tone?: 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'
}

function getMediaUrl(media: Media | number | null | undefined) {
  if (!media || typeof media === 'number') {
    return null
  }

  return media.sizes?.large?.url ?? media.sizes?.medium?.url ?? media.url ?? null
}

export function PayloadImage({
  media,
  fallbackLabel,
  className,
  imageClassName,
  priority = false,
  sizes,
  tone = 'neutral',
}: PayloadImageProps) {
  const [hasError, setHasError] = useState(false)
  const src = getMediaUrl(media)

  if (hasError || !src || !media || typeof media === 'number') {
    return <ImageFallback className={className} label={fallbackLabel} tone={tone} />
  }

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-lg', className)}>
      <Image
        alt={media.altText}
        className={cn('object-cover', imageClassName)}
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
