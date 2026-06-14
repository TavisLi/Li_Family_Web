'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { BadgeCheck, Heart, Lock, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { BlogInteractionThread, BlogReaction } from '@/lib/data/posts'
import { cn } from '@/lib/utils'
import { submitBlogInteractionAction } from './actions'

type OptimisticAction =
  | {
      type: 'comment'
      text: string
    }
  | {
      type: 'reaction'
      reaction: BlogReaction
    }

type BlogReactionPanelProps = {
  thread: BlogInteractionThread
  associatedId: string
  postSlug: string
  className?: string
}

const reactionConfig: Array<{
  reaction: BlogReaction
  label: string
  icon: LucideIcon
}> = [
  { reaction: 'heart', label: 'Heart', icon: Heart },
  { reaction: 'cool', label: 'Cool', icon: Sparkles },
  { reaction: 'applause', label: 'Applause', icon: BadgeCheck },
]

export function BlogReactionPanel({
  thread: initialThread,
  associatedId,
  postSlug,
  className,
}: BlogReactionPanelProps) {
  const [thread, setThread] = useState(initialThread)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticThread, addOptimistic] = useOptimistic(thread, applyOptimisticAction)

  function submitReaction(reaction: BlogReaction) {
    setMessage(null)
    startTransition(async () => {
      addOptimistic({ type: 'reaction', reaction })
      const result = await submitBlogInteractionAction({ associatedId, postSlug, reaction })

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
      const result = await submitBlogInteractionAction({ associatedId, postSlug, commentText })

      if (result.status === 'ok') {
        setThread(result.thread)
        return
      }

      setMessage(result.message)
    })
  }

  if (optimisticThread.locked) {
    return (
      <section
        className={cn(
          'rounded-lg border border-white/55 bg-white/55 p-5 text-sm leading-6 text-slate-600 shadow-sm backdrop-blur-md',
          className,
        )}
      >
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Lock className="size-4" aria-hidden="true" />
          家人模式限定
        </div>
        <p className="mt-2">
          這篇文章的留言與 heart、cool、applause 暖心反應已預留；登入家人後才可讀取與操作。
        </p>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'rounded-lg border border-white/55 bg-white/55 p-5 shadow-sm backdrop-blur-md',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {reactionConfig.map((item) => {
          const Icon = item.icon

          return (
            <Button
              aria-label={`${item.label} reaction`}
              className="bg-white/65 text-slate-800 hover:bg-white"
              disabled={isPending}
              key={item.reaction}
              onClick={() => submitReaction(item.reaction)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Icon className="size-4" aria-hidden="true" />
              {optimisticThread.reactions[item.reaction]}
            </Button>
          )
        })}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          <MessageCircle className="size-4" aria-hidden="true" />
          {optimisticThread.comments.length} 則留言
        </span>
      </div>

      <form action={submitComment} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="h-10 min-w-0 rounded-md border border-white/50 bg-white/70 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
          disabled={isPending}
          name="commentText"
          placeholder="留下給家人的回應"
        />
        <Button disabled={isPending} size="sm" type="submit">
          <MessageCircle className="size-4" aria-hidden="true" />
          送出
        </Button>
      </form>

      {message ? <p className="mt-2 text-xs font-medium text-amber-700">{message}</p> : null}

      {optimisticThread.comments.length ? (
        <div className="mt-5 grid gap-3">
          {optimisticThread.comments.slice(-5).map((comment) => (
            <article
              className="rounded-lg border border-white/45 bg-white/50 p-4 text-sm leading-6 text-slate-700"
              key={comment.id}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-950">{comment.authorName}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {new Date(comment.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
              <p>{comment.commentText}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function applyOptimisticAction(
  thread: BlogInteractionThread,
  action: OptimisticAction,
): BlogInteractionThread {
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
