import React from 'react'
import { ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type ImageFallbackTone = 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'

type ImageFallbackProps = {
  label: string
  className?: string
  tone?: ImageFallbackTone
}

const toneClasses: Record<ImageFallbackTone, string> = {
  neutral: 'from-slate-50/80 via-white/50 to-emerald-50/70 text-slate-700',
  tavis: 'from-sky-50/90 via-white/55 to-cyan-100/70 text-sky-800',
  lynn: 'from-amber-50/90 via-white/60 to-rose-50/70 text-amber-900',
  leo: 'from-zinc-950/95 via-emerald-950/80 to-black text-emerald-200',
  travel: 'from-cyan-50/90 via-white/55 to-amber-50/75 text-cyan-900',
}

export function ImageFallback({
  label,
  className,
  tone = 'neutral',
}: ImageFallbackProps) {
  return (
    <div
      className={cn(
        'relative flex aspect-[4/3] min-h-40 w-full overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br shadow-sm backdrop-blur-md',
        'before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent',
        toneClasses[tone],
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className="relative z-10 m-auto flex max-w-[80%] flex-col items-center gap-3 text-center">
        <ImageIcon className="size-7 opacity-80" aria-hidden="true" />
        <span className="text-sm font-medium leading-5">{label}</span>
      </div>
    </div>
  )
}
