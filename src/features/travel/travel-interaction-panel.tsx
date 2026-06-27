'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Lock, MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { TravelInteractionThread, TravelReaction } from '@/lib/data/travel'
import { cn } from '@/lib/utils'
import { submitTravelInteractionAction } from './actions'

type OptimisticAction =
  | {
      type: 'comment'
      text: string
    }
  | {
      type: 'reaction'
      reaction: TravelReaction
    }

type TravelInteractionPanelProps = {
  thread: TravelInteractionThread
  associatedId: string
  label: string
  className?: string
}

export function TravelInteractionPanel({
  thread: initialThread,
  associatedId,
  label,
  className,
}: TravelInteractionPanelProps) {
  const [thread, setThread] = useState(initialThread)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticThread, addOptimistic] = useOptimistic(thread, applyOptimisticAction)

  function submitReaction(reaction: TravelReaction) {
    setMessage(null)
    startTransition(async () => {
      addOptimistic({ type: 'reaction', reaction })
      const result = await submitTravelInteractionAction({ associatedId, reaction })

      if (result.status === 'ok') {
        setThread(result.thread)
        return
      }

      setMessage(result.message)
    })
  }

  function submitComment(formData: FormData) {
    const commentText = String(formData.get('commentText') ?? '').trim()

    if (!commentText) {
      return
    }

    setMessage(null)
    startTransition(async () => {
      addOptimistic({ type: 'comment', text: commentText })
      const result = await submitTravelInteractionAction({ associatedId, commentText })

      if (result.status === 'ok') {
        setThread(result.thread)
        return
      }

      setMessage(result.message)
    })
  }

  if (optimisticThread.locked) {
    return (
      <div
        className={cn(
          'mt-5 rounded-2xl border border-white/55 bg-white/35 p-4 text-sm leading-6 text-slate-600 shadow-inner shadow-white/35 backdrop-blur-md',
          className,
        )}
      >
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Lock className="size-4" aria-hidden="true" />
          討論席已預留
        </div>
        <p className="mt-2">
          {label} 的留言、thumb-up 與 thumb-down 會在家人登入後開放。
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mt-5 rounded-2xl border border-white/55 bg-white/35 p-4 shadow-inner shadow-white/35 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          <MessageCircle className="size-4" aria-hidden="true" />
          家庭討論席
        </span>
        <span className="text-xs font-medium text-slate-500">
          {optimisticThread.comments.length} 則討論
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          aria-label={`${label} thumb up`}
          className="rounded-full border-cyan-200/70 bg-cyan-50/75 text-cyan-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-100 active:translate-y-0"
          disabled={isPending}
          onClick={() => submitReaction('up')}
          size="sm"
          type="button"
          variant="outline"
        >
          <ThumbsUp className="size-4" aria-hidden="true" />
          {optimisticThread.reactions.up}
        </Button>
        <Button
          aria-label={`${label} thumb down`}
          className="rounded-full border-amber-200/70 bg-amber-50/75 text-amber-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-amber-100 active:translate-y-0"
          disabled={isPending}
          onClick={() => submitReaction('down')}
          size="sm"
          type="button"
          variant="outline"
        >
          <ThumbsDown className="size-4" aria-hidden="true" />
          {optimisticThread.reactions.down}
        </Button>
      </div>

      <form action={submitComment} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="h-10 min-w-0 rounded-full border border-white/60 bg-white/70 px-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200/60"
          disabled={isPending}
          name="commentText"
          placeholder="留下家人討論意見"
        />
        <Button
          className="rounded-full bg-slate-950 px-4 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
          disabled={isPending}
          size="sm"
          type="submit"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          送出
        </Button>
      </form>

      {message ? <p className="mt-2 text-xs font-medium text-amber-700">{message}</p> : null}

      {optimisticThread.comments.length ? (
        <div className="mt-4 grid gap-2">
          {optimisticThread.comments.slice(-3).map((comment) => (
            <div
              className="rounded-2xl border border-white/45 bg-white/55 p-3 text-sm leading-6 text-slate-700 shadow-sm shadow-slate-900/5"
              key={comment.id}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{comment.authorName}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {new Date(comment.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
              <p>{comment.commentText}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function applyOptimisticAction(
  thread: TravelInteractionThread,
  action: OptimisticAction,
): TravelInteractionThread {
  if (action.type === 'reaction') {
    return {
      ...thread,
      reactions: {
        ...thread.reactions,
        [action.reaction]: thread.reactions[action.reaction] + 1,
      },
    }
  }

  return {
    ...thread,
    comments: [
      ...thread.comments,
      {
        id: -Date.now(),
        associatedId: thread.associatedId,
        authorName: '同步中',
        commentText: action.text,
        reaction: null,
        createdAt: new Date().toISOString(),
      },
    ],
  }
}
