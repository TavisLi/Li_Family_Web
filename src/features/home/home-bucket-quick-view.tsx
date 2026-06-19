'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BucketItem } from '@/payload/payload-types'
import { completeBucketItemAction } from '@/features/bucket-list/actions'
import { CompletionFireworks } from '@/features/bucket-list/completion-fireworks'

type HomeBucketQuickViewProps = {
  items: BucketItem[]
}

export function HomeBucketQuickView({ items }: HomeBucketQuickViewProps) {
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [runId, setRunId] = useState(0)
  const [isPending, startTransition] = useTransition()

  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm leading-7 text-slate-300">
        目前沒有進行中的願望，進入完整看板把下一個共同計畫推上軌道。
      </p>
    )
  }

  return (
    <div className="mt-4 grid gap-3">
      <CompletionFireworks runId={runId} />
      {items.map((item) => (
        <div
          className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2"
          key={item.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400">Priority {item.priority ?? 3}</p>
          </div>
          <Button
            className="h-9 rounded-md"
            disabled={isPending && pendingId === item.id}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => {
              setPendingId(item.id)
              startTransition(async () => {
                const result = await completeBucketItemAction(item.id)

                if (result.status === 'ok') {
                  setRunId((current) => current + 1)
                }

                setPendingId(null)
              })
            }}
          >
            {isPending && pendingId === item.id ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            完成
          </Button>
        </div>
      ))}
    </div>
  )
}
