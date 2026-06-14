export default function FamilyLoginLoading() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-md content-center px-5 py-12">
      <div className="overflow-hidden rounded-lg border border-white/55 bg-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-16 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-11 animate-pulse rounded-md bg-slate-200" />
      </div>
    </main>
  )
}
