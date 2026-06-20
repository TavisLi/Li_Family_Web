'use client'

import { useEffect, useRef } from 'react'

type CompletionFireworksProps = {
  runId: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const colors = ['#38bdf8', '#fbbf24', '#fb7185', '#34d399', '#f8fafc']

export function CompletionFireworks({ runId }: CompletionFireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (runId === 0) {
      return
    }

    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    let animationFrame = 0
    let frame = 0
    const particles = createParticles(window.innerWidth, window.innerHeight)

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      frame += 1
      context.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.03
        particle.life -= 0.018

        if (particle.life <= 0) {
          continue
        }

        context.globalAlpha = Math.max(particle.life, 0)
        context.fillStyle = particle.color
        context.beginPath()
        context.arc(particle.x, particle.y, 3.2, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1

      if (frame < 120) {
        animationFrame = window.requestAnimationFrame(draw)
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    draw()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [runId])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-screen w-screen"
      aria-hidden="true"
    />
  )
}

function createParticles(width: number, height: number): Particle[] {
  const centers = [
    { x: width * 0.28, y: height * 0.34 },
    { x: width * 0.62, y: height * 0.42 },
    { x: width * 0.5, y: height * 0.24 },
  ]

  return centers.flatMap((center, centerIndex) =>
    Array.from({ length: 36 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 36
      const speed = 2.4 + ((index + centerIndex) % 8) * 0.28

      return {
        x: center.x,
        y: center.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[(index + centerIndex) % colors.length],
      }
    }),
  )
}
