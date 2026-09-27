import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const fixturePaths = [
  'members/tavis/tavis-avatar.jpeg',
  'members/lynn/lynn-avatar.jpeg',
  'travels/201307-hainan/cover/201307-hainan-cover-001.jpeg',
  'travels/201307-hainan/itinerary/day-03-nanshan-sea-guanyin-001.jpeg',
  'travels/202308-east-australia/cover/202308-east-australia-cover-001.jpeg',
  'travels/202602-thailand-phuket/cover/202602-thailand-phuket-cover-001.jpeg',
  'travels/202602-thailand-phuket/gallery/202602-thailand-phuket-gallery-022.jpeg',
  'travels/202607-chongqing-yangtze-river/cover/202607-chongqing-yangtze-river-cover-001.jpg',
  'travels/202607-chongqing-yangtze-river/itinerary/day-01-chongqing-001.jpeg',
  'travels/202702-thailand-phuket/cover/202702-thailand-phuket-cover-001.jpg',
]

export async function withSeedTestAssets(run: (assetRoot: string) => Promise<void>): Promise<void> {
  const assetRoot = await mkdtemp(path.join(tmpdir(), 'seed-test-assets-'))
  const previous = process.env.CONTENT_SOURCE_ASSET_ROOT

  try {
    for (const sourcePath of fixturePaths) {
      const physicalPath = path.join(assetRoot, sourcePath)
      await mkdir(path.dirname(physicalPath), { recursive: true })
      await writeFile(physicalPath, 'synthetic test asset')
    }
    process.env.CONTENT_SOURCE_ASSET_ROOT = assetRoot
    await run(assetRoot)
  } finally {
    if (previous === undefined) delete process.env.CONTENT_SOURCE_ASSET_ROOT
    else process.env.CONTENT_SOURCE_ASSET_ROOT = previous
    await rm(assetRoot, { recursive: true, force: true })
  }
}
