import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-between bg-black p-16 text-white">
        <div tw="flex text-3xl">Li Family</div>
        <div tw="flex flex-col">
          <div tw="flex text-8xl font-bold">Web Li</div>
          <div tw="mt-5 flex text-3xl">A bilingual family portal</div>
        </div>
        <div tw="flex text-2xl">Memories, journeys, and the years between.</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
