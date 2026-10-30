'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { TravelAtlasMap } from '../travel-atlas-map'
import { buildGoogleMapsNavigation } from '@/lib/travel-atlas'
import { visibleAtlasEntries, type AtlasPage } from './atlas-fixtures'

const pages: { key: AtlasPage; label: string; eyebrow: string; title: string; description: string }[] = [
  { key: 'corridor', label: '旅行足跡', eyebrow: "THE PLACES WE'VE BEEN", title: '一起走過的地方', description: '從一張地圖，翻開我們的旅程與回憶。' },
  { key: 'plan', label: '每日行程', eyebrow: 'A DAY TO EXPLORE', title: '把一天走成風景', description: '沿著行程的節奏，找到今天想去的地方。' },
  { key: 'memory', label: '旅行回憶', eyebrow: 'MOMENTS TO REMEMBER', title: '那些留在路上的時光', description: '每一個地點，都有一段值得慢慢讀的故事。' },
]
const control = 'min-h-11 rounded-lg border px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700'
const inactive = 'border-slate-300 bg-white text-slate-700'
const active = 'border-slate-900 bg-slate-900 text-white'

export function AtlasReview() {
  const [page, setPage] = useState<AtlasPage>('corridor')
  const [year, setYear] = useState('all')
  const [status, setStatus] = useState('all')
  const [day, setDay] = useState('day-1')
  const current = pages.find((item) => item.key === page)!
  const entries = useMemo(() => visibleAtlasEntries(page, page === 'corridor' ? year : day, status), [page, year, status, day])
  return (
    <main className={`min-h-screen pb-20 ${page === 'memory' ? 'bg-[#f7f5ef] text-[#34443d]' : 'bg-slate-50 text-slate-900'}`}>
      <div className="bg-slate-800 px-4 py-2 text-center text-xs text-white">合成資料 · 視覺與互動審查 · 不連接旅行資料</div>
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8"><span className="font-serif text-lg font-semibold">Li Family <span className="text-amber-700">✦</span></span><span className="text-sm text-slate-500">Travel Atlas</span></div></header>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <nav aria-label="審查視圖" className="flex flex-wrap gap-2 py-6">{pages.map((item) => <button key={item.key} type="button" aria-pressed={page === item.key} className={`${control} ${page === item.key ? (page === 'memory' ? 'border-[#52675d] bg-[#52675d] text-white' : active) : inactive}`} onClick={() => { setPage(item.key); setDay('day-1') }}>{item.label}</button>)}</nav>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className={`text-xs font-semibold tracking-[0.2em] ${page === 'memory' ? 'text-[#806f4e]' : 'text-amber-700'}`}>{current.eyebrow}</p><h1 className={`mt-3 font-serif text-3xl font-semibold sm:text-4xl ${page === 'memory' ? 'sm:text-5xl' : ''}`}>{current.title}</h1><p className="mt-3 text-slate-600">{current.description}</p></div><p role="status" className="text-sm text-slate-600"><strong className="text-2xl text-slate-900">{String(entries.length).padStart(2, '0')}</strong> 個合成項目</p></div>
        <div className="mb-5 flex flex-wrap gap-3">{page === 'corridor' ? <><label className="text-sm">年份 <select className={`${control} ${inactive}`} value={year} onChange={(event) => setYear(event.target.value)}><option value="all">全部年份</option><option>2026</option><option>2025</option><option>2024</option></select></label><label className="text-sm">狀態 <select className={`${control} ${inactive}`} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部狀態</option><option value="active">進行中</option><option value="archived">已封存</option><option value="memory">回憶</option></select></label></> : ['day-1', 'day-2'].map((value, index) => <button key={value} type="button" className={`${control} ${day === value ? (page === 'memory' ? 'border-[#52675d] bg-[#52675d] text-white' : active) : inactive}`} aria-pressed={day === value} onClick={() => setDay(value)}>Day 0{index + 1}</button>)}</div>
        {entries.length === 0 && <button type="button" className={`${control} ${inactive} mb-4`} onClick={() => { setYear('all'); setStatus('all') }}>清除篩選</button>}
        <TravelAtlasMap entries={entries} tone={page === 'memory' ? 'editorial' : 'default'} renderSummary={(entry) => <span className="mt-1 block text-xs font-normal text-slate-500">{entry.item.year} · {entry.item.meta} · {entry.item.status === 'active' ? '進行中' : entry.item.status === 'archived' ? '已封存' : '回憶'}</span>} renderDetail={(entry) => <><p className="font-medium text-slate-500">{entry.item.meta}</p><p>{entry.item.detail}</p>{entry.item.kind === 'plan' && (() => { const navigation = buildGoogleMapsNavigation({ coordinate: entry.coordinate }); return navigation.status === 'ready' ? <a className="inline-flex min-h-11 items-center text-blue-700 underline focus-visible:outline focus-visible:outline-2" href={navigation.href} target="_blank" rel="noreferrer">Google Maps 外部導航（分享目的地） ↗</a> : null })()}{entry.item.kind === 'memory' && <figure className="border-t border-[#e4ded2] pt-4"><Image className="aspect-[16/9] w-full rounded-sm object-cover" src="/atlas-review/synthetic-sea.svg" alt="合成海景插畫" width={800} height={440} /><figcaption className="mt-2 font-serif text-xs text-[#6f756b]">合成示意插畫</figcaption></figure>}</>} />
      </div>
    </main>
  )
}
