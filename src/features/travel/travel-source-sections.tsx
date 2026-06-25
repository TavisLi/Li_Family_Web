import React from 'react'

import type { TravelProject } from '@/payload/payload-types'

export function TravelSourceSections({ project }: { project: TravelProject }) {
  const sections = project.sourceSections ?? []

  if (!sections.length) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase text-slate-500">Source Coverage</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          完整來源內容
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          以下區塊忠實保留 content-source 旅遊 Markdown 的章節、表格、清單、提醒與連結，避免正式頁面只呈現摘要而漏掉細節。
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <article
            className="rounded-lg border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl"
            id={section.anchor}
            key={section.id ?? section.anchor}
          >
            <p className="text-xs font-semibold uppercase text-cyan-800">
              Markdown H{section.level}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
              {section.title}
            </h3>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {section.body}
            </p>
            {section.links?.length ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/40 pt-4">
                {section.links.map((link) => (
                  <a
                    className="rounded-full border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-sm font-medium text-cyan-900 transition hover:bg-cyan-100"
                    href={link.url}
                    key={link.id ?? link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
