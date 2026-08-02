export type PrototypeView = 'overview' | 'day-03' | 'day-08' | 'photos'

export type PrototypeVariant = 'editorial' | 'cinematic' | 'scrapbook'

export type PrototypePhoto = {
  alt: string
  caption: string
  location: string
  momentKey: string
  src: string
  time: string
}

export type PrototypeDay = {
  date: string
  dayKey: 'day-03' | 'day-08'
  dayNumber: number
  kicker: string
  lodging: string
  meals: string
  moments: {
    description: string
    location: string
    momentKey?: string
    time: string
    title: string
  }[]
  photos: PrototypePhoto[]
  title: string
  videoPlacement: {
    caption: string
    momentKey: string
    title: string
  }
}

export const prototypeDays: PrototypeDay[] = [
  {
    date: '2013.07.29 · 週一',
    dayKey: 'day-03',
    dayNumber: 3,
    kicker: '從海上觀音到三亞灣的城市遠景',
    lodging: '三亞美高梅度假酒店',
    meals: '東北人餐廳 · 午晚餐合併',
    moments: [
      {
        description: '包車原訂車型臨時更換，延誤約一小時後才正式出發。',
        location: '亞龍灣',
        time: '09:00',
        title: '從酒店出發',
      },
      {
        description: '搭遊園車前往海上觀音，再沿山海之間的步道走到南山寺。',
        location: '南山文化旅遊區',
        momentKey: 'nanshan-sea-guanyin',
        time: '10:30',
        title: '在南海邊仰望 108 米觀音',
      },
      {
        description: '山頂視野越過三亞灣、市區與大東海，旅程在傍晚突然展開。',
        location: '鹿回頭公園',
        momentKey: 'luhuitou-overlook',
        time: '17:00',
        title: '看見整座城市的海岸線',
      },
      {
        description: '回到美高梅，夕陽與夜泳替奔波的一天收尾。',
        location: '三亞美高梅',
        time: '18:30',
        title: '回到亞龍灣',
      },
    ],
    photos: [
      {
        alt: '南山文化旅遊區的海上觀音與廣場遊客',
        caption: '南山文化旅遊區的海上觀音。',
        location: '南山文化旅遊區',
        momentKey: 'nanshan-sea-guanyin',
        src: '/prototypes/travel-memory-hainan/day-03-nanshan.jpeg',
        time: '11:00',
      },
      {
        alt: '鹿回頭公園俯瞰三亞灣與市區海岸線',
        caption: '登上鹿回頭公園，俯瞰三亞灣與市區海岸線。',
        location: '鹿回頭公園',
        momentKey: 'luhuitou-overlook',
        src: '/prototypes/travel-memory-hainan/day-03-luhuitou.jpeg',
        time: '17:00',
      },
    ],
    title: '三亞市區觀光',
    videoPlacement: {
      caption: '海南來源目前沒有 YouTube URL；正式資料具備 URL 後，影片會在所屬 moment 內嵌。',
      momentKey: 'nanshan-sea-guanyin',
      title: '南山文化旅遊區 · 旅行影片',
    },
  },
  {
    date: '2013.08.03 · 週六',
    dayKey: 'day-08',
    dayNumber: 8,
    kicker: '在礁湖、海風與返程之間，替八日旅程留一個安靜句點',
    lodging: '返程日 · 無住宿',
    meals: '艾美西餐廳早餐 · 中餐廳午餐',
    moments: [
      {
        description: '風平浪靜，清晨的酒店幾乎無人，海景泳池與沙灘都還在醒來。',
        location: '石梅灣艾美',
        time: '07:00',
        title: '獨自早起逛酒店',
      },
      {
        description: '不規則泳池彼此相連，是這間酒店最令人記住的空間。',
        location: '礁湖泳池',
        momentKey: 'shimei-bay-le-meridien-lagoon-pool',
        time: '10:30',
        title: '旅程最後一次下水',
      },
      {
        description: '幾乎無人的沙灘、微涼海風，讓返程前的最後一小時慢下來。',
        location: '石梅灣海灘',
        momentKey: 'shimei-bay-le-meridien-beach',
        time: '12:30',
        title: '在海邊替假期收尾',
      },
      {
        description: '搭酒店接駁車前往鳳凰機場，結束八日海南旅程。',
        location: '三亞鳳凰機場',
        time: '15:00',
        title: '返程',
      },
    ],
    photos: [
      {
        alt: '石梅灣艾美礁湖泳池與棕櫚樹',
        caption: '石梅灣艾美的礁湖泳池，是旅程最後一天的度假亮點。',
        location: '石梅灣艾美',
        momentKey: 'shimei-bay-le-meridien-lagoon-pool',
        src: '/prototypes/travel-memory-hainan/day-08-lagoon-pool.jpeg',
        time: '10:30',
      },
      {
        alt: '石梅灣艾美通往海灘的景觀與遠方海島',
        caption: '石梅灣艾美幾乎無人的海灘，為八日旅程留下安靜的尾聲。',
        location: '石梅灣艾美海灘',
        momentKey: 'shimei-bay-le-meridien-beach',
        src: '/prototypes/travel-memory-hainan/day-08-beach.jpeg',
        time: '12:30',
      },
    ],
    title: '石梅灣艾美純度假 → 返程',
    videoPlacement: {
      caption: '沒有影片時保留具體、安靜的空狀態；不會拿其他旅行影片代替。',
      momentKey: 'shimei-bay-le-meridien-beach',
      title: '石梅灣的最後一段海風',
    },
  },
]

export const overviewDays = [
  { day: 1, label: '抵達三亞', place: '亞龍灣' },
  { day: 2, label: '雨天泡酒店', place: '美高梅' },
  { day: 3, label: '城市與海岸', place: '南山 · 鹿回頭', view: 'day-03' as const },
  { day: 4, label: '住進山林', place: '鳥巢度假村' },
  { day: 5, label: '山頂與海棠灣', place: '亞龍灣' },
  { day: 6, label: '親子度假日', place: '海棠灣' },
  { day: 7, label: '黎寨與颱風', place: '檳榔谷' },
  { day: 8, label: '海風裡返程', place: '石梅灣', view: 'day-08' as const },
]

export const prototypeVariants: {
  key: PrototypeVariant
  label: string
  note: string
}[] = [
  {
    key: 'editorial',
    label: 'Editorial journal',
    note: '雜誌式留白、圖文交錯，以閱讀故事為主。',
  },
  {
    key: 'cinematic',
    label: 'Cinematic timeline',
    note: '大畫面與時間軸，先感受場景再讀細節。',
  },
  {
    key: 'scrapbook',
    label: 'Family scrapbook',
    note: '家庭手記與相片註記，保留更多私人記憶感。',
  },
]
