import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Post } from '@/payload/payload-types'
import { cn } from '@/lib/utils'

type LexicalRendererProps = {
  content: Post['content']
  className?: string
}

type LexicalNode = {
  type?: unknown
  text?: unknown
  tag?: unknown
  listType?: unknown
  url?: unknown
  fields?: unknown
  format?: unknown
  children?: unknown
}

type LinkFields = {
  url?: unknown
}

const textFormat = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
} as const

export function LexicalRenderer({ content, className }: LexicalRendererProps) {
  const nodes = Array.isArray(content.root.children) ? content.root.children : []

  return (
    <div className={cn('space-y-5 text-base leading-8 text-slate-700', className)}>
      {nodes.map((node, index) => renderNode(asLexicalNode(node), `root-${index}`))}
    </div>
  )
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="text-base leading-8 text-slate-700" key={key}>
          {renderChildren(node, key)}
        </p>
      )
    case 'heading':
      return renderHeading(node, key)
    case 'quote':
      return (
        <blockquote
          className="border-l-2 border-cyan-300/80 pl-5 text-lg leading-8 text-slate-800"
          key={key}
        >
          {renderChildren(node, key)}
        </blockquote>
      )
    case 'list':
      return renderList(node, key)
    case 'listitem':
      return <li key={key}>{renderChildren(node, key)}</li>
    case 'linebreak':
      return <br key={key} />
    case 'link':
      return renderLink(node, key)
    case 'text':
      return renderText(node, key)
    default:
      return renderChildren(node, key)
  }
}

function renderHeading(node: LexicalNode, key: string): ReactNode {
  const children = renderChildren(node, key)

  if (node.tag === 'h2') {
    return (
      <h2 className="pt-4 text-3xl font-semibold tracking-normal text-slate-950" key={key}>
        {children}
      </h2>
    )
  }

  if (node.tag === 'h3') {
    return (
      <h3 className="pt-3 text-2xl font-semibold tracking-normal text-slate-950" key={key}>
        {children}
      </h3>
    )
  }

  return (
    <h4 className="pt-2 text-xl font-semibold tracking-normal text-slate-950" key={key}>
      {children}
    </h4>
  )
}

function renderList(node: LexicalNode, key: string): ReactNode {
  const children = renderChildren(node, key)

  if (node.listType === 'number') {
    return (
      <ol className="list-decimal space-y-2 pl-6" key={key}>
        {children}
      </ol>
    )
  }

  return (
    <ul className="list-disc space-y-2 pl-6" key={key}>
      {children}
    </ul>
  )
}

function renderLink(node: LexicalNode, key: string): ReactNode {
  const url = linkUrl(node)

  if (!url) {
    return <span key={key}>{renderChildren(node, key)}</span>
  }

  return (
    <Link
      className="font-medium text-cyan-700 underline decoration-cyan-300 underline-offset-4 transition-colors hover:text-cyan-950"
      href={url}
      key={key}
      rel={url.startsWith('http') ? 'noreferrer' : undefined}
      target={url.startsWith('http') ? '_blank' : undefined}
    >
      {renderChildren(node, key)}
    </Link>
  )
}

function renderText(node: LexicalNode, key: string): ReactNode {
  let content: ReactNode = typeof node.text === 'string' ? node.text : ''
  const format = typeof node.format === 'number' ? node.format : 0

  if (format & textFormat.code) {
    content = (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-900">{content}</code>
    )
  }

  if (format & textFormat.bold) {
    content = <strong>{content}</strong>
  }

  if (format & textFormat.italic) {
    content = <em>{content}</em>
  }

  if (format & textFormat.underline) {
    content = <span className="underline underline-offset-4">{content}</span>
  }

  if (format & textFormat.strikethrough) {
    content = <span className="line-through">{content}</span>
  }

  return <span key={key}>{content}</span>
}

function renderChildren(node: LexicalNode, keyPrefix: string): ReactNode {
  if (!Array.isArray(node.children)) {
    return null
  }

  return node.children.map((child, index) =>
    renderNode(asLexicalNode(child), `${keyPrefix}-${index}`),
  )
}

function asLexicalNode(value: unknown): LexicalNode {
  return value && typeof value === 'object' ? value : {}
}

function linkUrl(node: LexicalNode): string | null {
  if (typeof node.url === 'string') {
    return node.url
  }

  if (node.fields && typeof node.fields === 'object') {
    const fields = node.fields as LinkFields

    return typeof fields.url === 'string' ? fields.url : null
  }

  return null
}
