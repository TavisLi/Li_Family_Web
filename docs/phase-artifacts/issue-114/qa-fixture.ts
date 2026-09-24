import type { ComponentProps } from 'react'
import type { Media } from '@/payload/payload-types'
import type { HomePageView } from '@/features/home/home-page'
import type { TravelMemoryDayView, TravelMemoryOverview } from '@/lib/travel-memory'

const photo = (id: number, filename: string, altText: string): Media => ({
  id, type: 'photo', altText,
  url: `/prototypes/travel-memory-hainan/${filename}`,
  width: 1200, height: 800,
  createdAt: '2026-09-24T00:00:00.000Z', updatedAt: '2026-09-24T00:00:00.000Z',
})

const cover = photo(100, 'cover-birds-nest.jpeg', '山林間的家庭旅程風景')
const nanshan = photo(101, 'day-03-nanshan.jpeg', '海南南山文化旅遊區')
const beach = photo(102, 'day-08-beach.jpeg', '海南海邊的沙灘')
const pool = photo(103, 'day-08-lagoon-pool.jpeg', '度假村泳池與綠地')
const mountain = photo(104, 'day-03-luhuitou.jpeg', '鹿回頭山景')

export const portalProps = {
  bucketItems: [],
  familySession: { isFamilyMode: false, displayName: '' },
  featuredTravel: null,
  homeConfig: {
    heroTitle: 'Li Family',
    heroSubtitle: '把家人的日常、旅行與記憶，收束成一座安靜而有光的數位大廳。',
    heroBackground: cover,
    announcement: '這是只供 #114 本地視覺驗收使用的合成資料。',
  },
  members: ['家人甲','家人乙','家人丙','家人丁','家人戊','家人己'].map((displayName, index) => ({
    id: index + 1, slug: `synthetic-${index + 1}`, displayName,
    familyRole: '家人', status: '一起記錄日常與旅程。',
    cardImage: [nanshan, beach, pool, mountain, cover, nanshan][index],
  })),
  posts: [], timelineEvent: null, travelProjects: [],
  wrappedCta: { locked: true, available: false, year: 2026 },
} as unknown as ComponentProps<typeof HomePageView>

export const cinematicMemory = {
  slug: 'synthetic-cinematic', title: '沿著海岸的八日旅行',
  startDate: '2026-04-01', endDate: '2026-04-08',
  summary: '山、海與家人在路上的片段，依發生次序重新組成一趟旅行。',
  coverImage: cover, presentationStyle: 'cinematic-timeline',
  days: Array.from({ length: 8 }, (_, index) => ({
    dayKey: `day-${String(index + 1).padStart(2, '0')}`,
    day: index + 1, title: `第 ${index + 1} 日的風景`,
    theme: ['抵達海岸','城市散步','山間小路','海邊午後','家人晚餐','另一座城','返程前夕','一起回家'][index],
    heroMedia: [cover, mountain, nanshan, beach, pool, cover, mountain, beach][index],
  })),
  guestParticipants: [{ name: '同行家人' }],
  travelLedger: { flights: [], lodgings: [] },
  storySections: [], reminders: [], externalVideos: [],
} as TravelMemoryOverview

const editorialMemory = {
  ...cinematicMemory,
  slug: 'synthetic-editorial', title: '海風裡的一天',
  presentationStyle: 'editorial-journal',
} as TravelMemoryOverview

export const editorialView = {
  memory: editorialMemory,
  day: {
    id: 201, memory: 1, dayIdentity: '1:day-03', dayKey: 'day-03', day: 3,
    title: '在海邊重新相聚', theme: '抵達與相聚',
    dateLabel: '4月3日（週五）', story: '大家在傍晚海風裡重新聚在一起。',
    dailyHeroImage: beach,
    meals: { breakfast: '自理', lunch: '海風麵店', dinner: '家庭合菜' },
    lodging: '海邊家庭旅店',
    moments: [{
      momentKey: 'arrival', time: '10:00', location: '海風鎮', title: '抵達旅店',
      transport: '接駁車', body: '放下行李後，一家人沿著海岸慢慢散步。',
      placements: [{ placementKey: 'arrival-photo', type: 'photo', media: mountain,
        caption: '抵達後一起看見的第一片海。' }],
    }],
    createdAt: '2026-09-24T00:00:00.000Z', updatedAt: '2026-09-24T00:00:00.000Z',
  },
  previousDay: { dayKey: 'day-02', title: '城市散步' },
  nextDay: { dayKey: 'day-04', title: '海邊午後' },
} as TravelMemoryDayView
