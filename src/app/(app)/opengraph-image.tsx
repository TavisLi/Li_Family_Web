import { ImageResponse } from 'next/og'

export const alt = 'Web Li family portal'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-between bg-slate-950 p-16 text-white">
        <div tw="flex text-3xl text-cyan-200">Li Family</div>
        <div tw="flex flex-col">
          <div tw="flex text-8xl font-bold">Web Li</div>
          <div tw="mt-5 flex text-3xl text-slate-200">A bilingual family portal</div>
        </div>
        <div tw="flex text-2xl text-slate-300">Memories, journeys, and the years between.</div>
      </div>
    ),
    size,
  )
}
