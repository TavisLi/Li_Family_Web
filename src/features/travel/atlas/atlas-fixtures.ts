import type { TravelAtlasEntry } from '@/lib/travel-atlas'

export type AtlasPage = 'corridor' | 'plan' | 'memory'
export type AtlasStory = { kind: 'plan' | 'memory'; year: string; day: string; status: 'active' | 'archived' | 'memory'; meta: string; detail: string }

const location = (longitude: number, latitude: number) => ({ crs: 'WGS84', longitude, latitude })
export const atlasEntries: readonly TravelAtlasEntry<AtlasStory>[] = [
  { id: 'kyoto-1', title: '京都・清晨散步', coordinate: location(135.7681, 35.0116), item: { kind: 'plan', year: '2025', day: 'day-1', status: 'archived', meta: '日本 · Day 01', detail: '沿著街道慢慢走，為一天留下從容的開始。' } },
  { id: 'kyoto-2', title: '京都・午後時光', coordinate: location(135.7681, 35.0116), item: { kind: 'plan', year: '2026', day: 'day-1', status: 'active', meta: '日本 · Day 01', detail: '在城市裡停下腳步，看看身邊的風景。' } },
  { id: 'osaka', title: '大阪・河畔', coordinate: location(135.5023, 34.6937), item: { kind: 'plan', year: '2026', day: 'day-2', status: 'active', meta: '日本 · Day 02', detail: '把一段午後留給河邊的光。' } },
  { id: 'brisbane', title: '布里斯本・故事的開始', coordinate: location(153.0251, -27.4698), item: { kind: 'memory', year: '2025', day: 'day-1', status: 'memory', meta: '澳洲 · Day 01', detail: '第一次踏上這座城市的街道，陽光落在每一個轉角。' } },
  { id: 'gold-coast', title: '黃金海岸・海風', coordinate: location(153.4000, -28.0167), item: { kind: 'memory', year: '2025', day: 'day-2', status: 'memory', meta: '澳洲 · Day 02', detail: '海風與笑聲，是這一天最喜歡的記憶。' } },
  { id: 'unlocated', title: '留白的一天', item: { kind: 'memory', year: '2024', day: 'day-1', status: 'memory', meta: '位置未提供 · Day 01', detail: '沒有座標，故事仍然可以繼續閱讀。' } },
]

export function visibleAtlasEntries(page: AtlasPage, filter: string, status: string) {
  return atlasEntries.filter(({ item }) => page === 'corridor'
    ? (filter === 'all' || item.year === filter) && (status === 'all' || item.status === status)
    : item.kind === page && item.day === filter)
}
