'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Plus, SendHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BucketListData, BucketMutationResult } from '@/lib/data/bucket-list'
import type { BucketStatus } from '@/lib/data/phase-7-domain'
import type { BucketItem } from '@/payload/payload-types'
import {
  completeBucketItemAction,
  createBucketItemAction,
  moveBucketItemAction,
} from './actions'
import { CompletionFireworks } from './completion-fireworks'

type BucketListBoardProps = {
  initialData: BucketListData
}

const columns: {
  status: BucketStatus
  title: string
  empty: string
}[] = [
  {
    status: 'pool',
    title: '願望池',
    empty: '新的家庭想法會先停在這裡。',
  },
  {
    status: 'in-progress',
    title: '進行中',
    empty: '把一件願望推上軌道吧。',
  },
  {
    status: 'completed',
    title: '已實現',
    empty: '完成的願望會同步收進時空膠囊。',
  },
]

export function BucketListBoard({ initialData }: BucketListBoardProps) {
  const [items, setItems] = useState(initialData.items)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('看板已同步。')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)
  const [isPending, startTransition] = useTransition()
  const grouped = useMemo(() => groupItems(items), [items])

  const applyResult = (result: BucketMutationResult, firework = false) => {
    setMessage(result.message)

    if (result.status !== 'ok') {
      return
    }

    setItems((current) => upsertItem(current, result.item))

    if (firework) {
      setRunId((current) => current + 1)
    }
  }

  return (
    <div className="grid gap-5">
      <CompletionFireworks runId={runId} />
      <form
        className="grid gap-3 rounded-lg border border-white/65 bg-white/50 p-4 shadow-sm backdrop-blur-xl md:grid-cols-[1fr_1.4fr_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          setPendingKey('create')
          startTransition(async () => {
            const result = await createBucketItemAction({
              title,
              description,
              priority: 3,
            })

            applyResult(result)

            if (result.status === 'ok') {
              setTitle('')
              setDescription('')
            }

            setPendingKey(null)
          })
        }}
      >
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          願望名稱
          <input
            className="h-10 rounded-md border border-slate-300/70 bg-white/75 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            disabled={isPending}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          描述
          <input
            className="h-10 rounded-md border border-slate-300/70 bg-white/75 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            disabled={isPending}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <Button className="self-end rounded-md" disabled={isPending && pendingKey === 'create'}>
          {isPending && pendingKey === 'create' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          新增
        </Button>
      </form>

      <p className="text-sm font-medium text-slate-600" aria-live="polite">
        {message}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            className="min-h-80 rounded-lg border border-white/65 bg-white/45 p-4 shadow-sm backdrop-blur-xl"
            key={column.status}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold tracking-normal">{column.title}</h3>
              <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                {grouped[column.status].length}
              </span>
            </div>
            <div className="grid gap-3">
              {grouped[column.status].length > 0 ? (
                grouped[column.status].map((item) => (
                  <BucketCard
                    isPending={isPending}
                    item={item}
                    key={item.id}
                    pendingKey={pendingKey}
                    onComplete={() => {
                      const key = `complete:${item.id}`
                      setPendingKey(key)
                      startTransition(async () => {
                        applyResult(await completeBucketItemAction(item.id), true)
                        setPendingKey(null)
                      })
                    }}
                    onMove={(status) => {
                      const key = `move:${item.id}:${status}`
                      setPendingKey(key)
                      startTransition(async () => {
                        applyResult(await moveBucketItemAction({ id: item.id, status }))
                        setPendingKey(null)
                      })
                    }}
                  />
                ))
              ) : (
                <p className="rounded-md border border-dashed border-slate-300 bg-white/35 p-4 text-sm leading-7 text-slate-500">
                  {column.empty}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function BucketCard({
  isPending,
  item,
  onComplete,
  onMove,
  pendingKey,
}: {
  isPending: boolean
  item: BucketItem
  onComplete: () => void
  onMove: (status: BucketStatus) => void
  pendingKey: string | null
}) {
  const completePending = pendingKey === `complete:${item.id}`

  return (
    <article className="rounded-lg border border-white/65 bg-white/65 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold tracking-normal text-slate-950">{item.title}</h4>
          {item.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          P{item.priority ?? 3}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.status !== 'pool' ? (
          <MoveButton
            disabled={isPending}
            pending={pendingKey === `move:${item.id}:pool`}
            status="pool"
            onMove={onMove}
          />
        ) : null}
        {item.status !== 'in-progress' ? (
          <MoveButton
            disabled={isPending}
            pending={pendingKey === `move:${item.id}:in-progress`}
            status="in-progress"
            onMove={onMove}
          />
        ) : null}
        {item.status !== 'completed' ? (
          <Button
            className="rounded-md"
            disabled={isPending}
            size="sm"
            type="button"
            onClick={onComplete}
          >
            {completePending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            完成
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            已收進時空膠囊
          </span>
        )}
      </div>
    </article>
  )
}

function MoveButton({
  disabled,
  onMove,
  pending,
  status,
}: {
  disabled: boolean
  onMove: (status: BucketStatus) => void
  pending: boolean
  status: BucketStatus
}) {
  return (
    <Button
      className="rounded-md"
      disabled={disabled}
      size="sm"
      type="button"
      variant="outline"
      onClick={() => onMove(status)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <SendHorizontal className="size-4" aria-hidden="true" />
      )}
      {statusLabel(status)}
    </Button>
  )
}

function groupItems(items: BucketItem[]): Record<BucketStatus, BucketItem[]> {
  return {
    pool: items.filter((item) => item.status === 'pool'),
    'in-progress': items.filter((item) => item.status === 'in-progress'),
    completed: items.filter((item) => item.status === 'completed'),
  }
}

function upsertItem(items: BucketItem[], item: BucketItem): BucketItem[] {
  const exists = items.some((current) => current.id === item.id)
  const next = exists
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items]

  return next.sort((left, right) => (left.priority ?? 3) - (right.priority ?? 3))
}

function statusLabel(status: BucketStatus) {
  if (status === 'pool') {
    return '願望池'
  }

  if (status === 'in-progress') {
    return '進行中'
  }

  return '完成'
}
