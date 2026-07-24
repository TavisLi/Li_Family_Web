'use client'

import React, { useEffect, useRef, useState } from 'react'

const delayClasses = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-500']

export function SkillRadarMeter({
  index,
  label,
  score,
  widthClass,
}: {
  index: number
  label: string
  score: number
  widthClass: string
}) {
  const meterRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const accessibleLabel = label.replace(/\*\*/g, '')

  useEffect(() => {
    const meter = meterRef.current

    if (!meter || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(meter)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-label={`${accessibleLabel} ${score}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={score}
      className="h-2 overflow-hidden rounded-full bg-slate-200/80"
      ref={meterRef}
      role="progressbar"
    >
      <div
        className={`h-full ${widthClass} origin-left ${
          isVisible ? 'scale-x-100' : 'scale-x-0'
        } transform-gpu rounded-full bg-slate-900 transition-transform duration-1000 ease-out ${
          delayClasses[Math.min(index, delayClasses.length - 1)]
        } motion-reduce:scale-x-100 motion-reduce:transition-none`}
      />
    </div>
  )
}
