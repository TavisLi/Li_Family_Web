export default function TravelMemoryDayLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-stone-100 px-5 py-16" aria-busy="true">
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-4 w-40 bg-stone-300" />
        <div className="mt-12 h-14 max-w-2xl bg-stone-300" />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="aspect-[4/3] bg-stone-300" />
          <div className="aspect-[4/3] bg-stone-300" />
        </div>
      </div>
    </main>
  )
}
