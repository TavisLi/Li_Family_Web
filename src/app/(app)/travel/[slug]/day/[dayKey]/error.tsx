'use client'

export default function TravelMemoryDayError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-5 text-stone-900">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">每日回憶暫時無法載入</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">請稍後重試；旅行首頁與既有回憶資料不受影響。</p>
        <button className="mt-6 border border-stone-900 bg-stone-900 px-5 py-3 text-sm font-semibold text-white" onClick={reset} type="button">重新載入</button>
      </div>
    </main>
  )
}
