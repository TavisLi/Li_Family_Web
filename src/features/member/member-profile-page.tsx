import Link from 'next/link'
import React from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Mail,
  GraduationCap,
  MapPin,
  Phone,
} from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { User } from '@/payload/payload-types'
import { MemberTypewriter } from './member-typewriter'
import { SkillRadarMeter } from './skill-radar-meter'

type MemberProfilePageProps = {
  member: User
}

type MemberTone = 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'
type MemberMedia = NonNullable<User['resumeMilestoneImages']>[number]
type CareerTimelineItem = NonNullable<User['careerTimeline']>[number]

const sectionHeadingClass = 'mt-2 text-3xl font-semibold tracking-normal text-slate-950'
const timelineMetaClass = 'text-lg font-semibold text-slate-500'

function toneForMember(member: User): MemberTone {
  const persona = member.theme?.persona

  if (persona === 'tavis' || persona === 'lynn' || persona === 'leo') {
    return persona
  }

  return 'neutral'
}

function profileStyle(member: User) {
  if (member.slug === 'tavis') {
    return {
      accent: 'text-sky-700',
      background:
        'bg-[linear-gradient(120deg,rgba(245,249,255,0.96),rgba(229,242,249,0.88)_45%,rgba(250,252,255,0.94))]',
      border: 'border-sky-100',
      eyebrow: 'DIGITAL TRANSFORMATION TECHNOLOGY LEADERSHIP',
      panel: 'border-sky-100/80 bg-white/58',
      quote: '天行健，君子以自強不息',
      title: '冷靜、精密，讓製造與系統一起前進。',
    }
  }

  if (member.slug === 'lynn') {
    return {
      accent: 'text-amber-800',
      background:
        'bg-[linear-gradient(120deg,rgba(255,250,244,0.98),rgba(241,227,211,0.88)_45%,rgba(255,246,239,0.95))]',
      border: 'border-amber-100',
      eyebrow: 'Morandi warmth and refined order',
      panel: 'border-amber-100/80 bg-white/60',
      quote: '把專業、秩序與美感，安放在生活的細節裡。',
      title: '溫潤、專業，把複雜的事整理得優雅。',
    }
  }

  return {
    accent: 'text-slate-700',
    background:
      'bg-[linear-gradient(120deg,rgba(248,250,252,0.98),rgba(235,241,240,0.88)_45%,rgba(255,255,255,0.95))]',
    border: 'border-slate-200',
    eyebrow: 'Family profile',
    panel: 'border-slate-200 bg-white/60',
    quote: member.status || '家人的故事正在這裡慢慢展開。',
    title: member.status || '一頁安靜的家庭側寫。',
  }
}

function scoreClass(score: number) {
  if (score >= 95) {
    return 'w-[96%]'
  }

  if (score >= 90) {
    return 'w-[91%]'
  }

  if (score >= 85) {
    return 'w-[86%]'
  }

  if (score >= 80) {
    return 'w-[81%]'
  }

  return 'w-[72%]'
}

function portraitImageClass(member: User) {
  if (member.slug === 'tavis') {
    return 'object-[50%_18%]'
  }

  if (member.slug === 'lynn') {
    return 'object-[50%_16%]'
  }

  return 'object-top'
}

const defaultPublicContact = {
  description: '公開聯絡方式僅用於家庭網站與專業交流，私密家庭資訊仍保留在家人模式。',
  email: 'txli@icloud.com',
  phone: '+886-988-115546',
  siteTitle: 'Web Li',
}

function displayText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value.trim() || fallback
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const localized = record['zh-TW'] ?? record.en ?? record.value

    if (typeof localized === 'string') {
      return localized.trim() || fallback
    }
  }

  return fallback
}

function compactTextList(values: unknown[]): string[] {
  return values.map((value) => displayText(value)).filter(Boolean)
}

function renderInlineEmphasisSegment(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      const match = /^\*\*([^*]+)\*\*$/.exec(part)

      if (!match) {
        return part
      }

      return (
        <strong className="font-semibold text-slate-900" key={`${match[1]}-${index}`}>
          {match[1]}
        </strong>
      )
    })
}

function renderInlineEmphasis(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, lineIndex, lines) => {
    const parts = renderInlineEmphasisSegment(line)

    if (lineIndex === lines.length - 1) {
      return parts
    }

    return [...parts, <br key={`line-break-${lineIndex}`} />]
  })
}

function splitListLines(text: string): { intro: string; items: string[] } {
  const lines = text.split(/\r?\n/)
  const items: string[] = []
  const introLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('-')) {
      const itemText = trimmed.replace(/^-\s*/, '').trim()

      if (itemText) {
        items.push(itemText)
      }

      continue
    }

    if (trimmed) {
      introLines.push(trimmed)
    }
  }

  return {
    intro: introLines.join('\n'),
    items,
  }
}

function renderRichTextLines(text: string): ReactNode {
  const { intro, items } = splitListLines(text)

  if (!items.length) {
    return renderInlineEmphasis(text)
  }

  return (
    <>
      {intro ? <span>{renderInlineEmphasis(intro)}</span> : null}
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{renderInlineEmphasis(item)}</li>
        ))}
      </ul>
    </>
  )
}

function renderMarkdownBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  const paragraphLines: string[] = []

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(' ').trim()

    if (paragraph) {
      blocks.push(<p key={`paragraph-${blocks.length}`}>{renderInlineEmphasis(paragraph)}</p>)
    }

    paragraphLines.length = 0
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ''

    if (!line) {
      flushParagraph()
      continue
    }

    if (/^---+$/.test(line)) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/)

    if (heading) {
      flushParagraph()
      blocks.push(
        <h4 className="text-base font-semibold text-slate-900" key={`heading-${blocks.length}`}>
          {renderInlineEmphasis(heading[1])}
        </h4>,
      )
      continue
    }

    const unorderedItem = line.match(/^[-*•]\s+(.+)$/)

    if (unorderedItem) {
      flushParagraph()
      const items = [unorderedItem[1]]

      while (index + 1 < lines.length) {
        const nextItem = lines[index + 1]?.trim().match(/^[-*•]\s+(.+)$/)

        if (!nextItem) {
          break
        }

        items.push(nextItem[1])
        index += 1
      }

      blocks.push(
        <ul className="list-disc space-y-2 pl-5" key={`unordered-list-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineEmphasis(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/)

    if (orderedItem) {
      flushParagraph()
      const items = [orderedItem[1]]

      while (index + 1 < lines.length) {
        const nextItem = lines[index + 1]?.trim().match(/^\d+[.)]\s+(.+)$/)

        if (!nextItem) {
          break
        }

        items.push(nextItem[1])
        index += 1
      }

      blocks.push(
        <ol className="list-decimal space-y-2 pl-5" key={`ordered-list-${blocks.length}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineEmphasis(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    paragraphLines.push(line)
  }

  flushParagraph()

  return blocks
}

function timelineHighlightItems(item: CareerTimelineItem): string[] {
  return compactTextList(item.highlights?.map((highlight) => highlight.text) ?? [])
}

function mediaSearchText(media: MemberMedia): string {
  if (!media || typeof media === 'number') {
    return ''
  }

  return compactTextList([media.filename, media.altText, media.url]).join(' ').toLowerCase()
}

function findCareerMedia(milestoneImages: MemberMedia[], tokens: string[]): MemberMedia | null {
  const normalizedTokens = tokens.map((token) => token.toLowerCase())

  return milestoneImages.find((media) => {
    const searchText = mediaSearchText(media)

    return normalizedTokens.some((token) => searchText.includes(token))
  }) ?? null
}

function timelineCareerMedia({
  index,
  item,
  member,
  milestoneImages,
}: {
  index: number
  item: CareerTimelineItem
  member: User
  milestoneImages: MemberMedia[]
}): MemberMedia[] {
  if (Array.isArray(item.milestoneMedia)) {
    return item.milestoneMedia
  }

  if (member.slug !== 'tavis') {
    return milestoneImages[index] ? [milestoneImages[index]] : []
  }

  const organization = displayText(item.organization)
  const role = displayText(item.role)
  const label = `${organization} ${role}`.toLowerCase()

  if (label.includes('銳立平芯') || label.includes('soimicro')) {
    const media = findCareerMedia(milestoneImages, ['soimicro', 'soi micro'])
    return media ? [media] : []
  }

  if (label.includes('鵬新旭') || label.includes('pensun')) {
    const media = findCareerMedia(milestoneImages, ['pst', 'pensun'])
    return media ? [media] : []
  }

  if (label.includes('華亞科技') || label.includes('inotera')) {
    const media = findCareerMedia(milestoneImages, ['inotera'])
    return media ? [media] : []
  }

  if (label.includes('南亞科技') || label.includes('nanya')) {
    const media = findCareerMedia(milestoneImages, ['nanya'])
    return media ? [media] : []
  }

  if (label.includes('長江存儲') || label.includes('yangtze')) {
    if (label.includes('資深')) {
      const media = findCareerMedia(milestoneImages, ['yangtze-memory-senior-director', 'yangtze-memory-001'])
      return media ? [media] : []
    }

    if (label.includes('mit')) {
      const media = findCareerMedia(milestoneImages, ['yangtze-memory-002'])
      return media ? [media] : []
    }

    const media = findCareerMedia(milestoneImages, ['yangtze-memory'])
    return media ? [media] : []
  }

  return []
}

function publicContactForMember(member: User) {
  const configured = member.publicContact

  return {
    description: displayText(configured?.description, defaultPublicContact.description),
    email: displayText(configured?.email, defaultPublicContact.email),
    phone: displayText(configured?.phone, defaultPublicContact.phone),
    siteTitle: displayText(configured?.siteTitle, defaultPublicContact.siteTitle),
  }
}

export function MemberProfilePage({ member }: MemberProfilePageProps) {
  const style = profileStyle(member)
  const tone = toneForMember(member)
  const timeline = (member.careerTimeline ?? []).filter((item) => {
    const highlights = timelineHighlightItems(item)

    return Boolean(
      displayText(item.organization) ||
        displayText(item.role) ||
        displayText(item.summary) ||
        highlights.length,
    )
  })
  const skills = (member.skillRadar ?? []).filter((skill) => displayText(skill.skill))
  const heroImage = member.heroImage ?? member.avatar
  const milestoneImages = member.resumeMilestoneImages ?? []
  const displayName = displayText(member.displayName, 'Family member')
  const publicContact = publicContactForMember(member)
  const typewriterWords = compactTextList(member.typewriter?.rotatingWords?.map((item) => item.word) ?? [])

  return (
    <main className={style.background}>
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative order-2 lg:order-1">
          <PayloadImage
            className={`aspect-[4/5] min-h-[32rem] rounded-lg border ${style.border} shadow-2xl shadow-slate-900/10`}
            fallbackLabel={displayName}
            fit="cover"
            imageClassName={portraitImageClass(member)}
            media={heroImage}
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            tone={tone}
          />
          <div className="absolute -bottom-5 left-5 right-5 rounded-lg border border-white/45 bg-slate-950/48 p-4 text-center text-white shadow-xl backdrop-blur-xl">
            <p className="text-lg leading-7 text-white">{style.quote}</p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            href="/"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            回到家庭大廳
          </Link>
          <p className={`mt-8 text-sm font-semibold uppercase ${style.accent}`}>{style.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(3rem,12vw,4.25rem)] font-semibold leading-[1.02] tracking-normal text-slate-950 md:text-[clamp(3.5rem,4.8vw,4.5rem)] lg:whitespace-nowrap">
            {displayName}
          </h1>
          <div className="mt-6 max-w-3xl overflow-hidden text-2xl font-semibold leading-tight text-slate-800 md:text-3xl">
            {displayText(member.typewriter?.prefix) ? <span>{displayText(member.typewriter?.prefix)}</span> : null}
            <MemberTypewriter words={typewriterWords} />
            {displayText(member.typewriter?.suffix) ? <span>{displayText(member.typewriter?.suffix)}</span> : null}
          </div>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
            {displayText(member.bio, style.title)}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <NarrativePanel accentClass={style.accent} member={member} stylePanel={style.panel} />
        <SkillRadar accentClass={style.accent} panelClass={style.panel} skills={skills} />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className={`text-sm font-semibold uppercase ${style.accent}`}>Professional Timeline</p>
            <h2 className={sectionHeadingClass}>
              經歷不是列表，是一路形成的判斷力。
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            從早期自動化工程到數字化轉型領導，每段經歷都保留當時的責任、判斷與具體成果。
          </p>
        </div>
        <div className="grid gap-4">
          {timeline.length > 0 ? (
            timeline.map((item, index) => {
              const media = timelineCareerMedia({ index, item, member, milestoneImages })
              const layoutClass = media.length
                ? 'lg:grid-cols-[10rem_1fr_16rem]'
                : 'lg:grid-cols-[10rem_minmax(0,1fr)]'

              return (
                <article
                  className={`grid gap-5 rounded-lg border ${style.panel} p-5 shadow-sm backdrop-blur-md ${layoutClass}`}
                  key={item.id ?? `${displayText(item.organization, 'milestone')}-${index}`}
                >
                  <div>
                    <p className={timelineMetaClass}>
                      {compactTextList([item.start, item.end]).join(' - ')}
                    </p>
                    {displayText(item.location) ? (
                      <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-500">
                        <MapPin className="size-4" aria-hidden="true" />
                        {displayText(item.location)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                      {displayText(item.organization, '職涯里程碑')} · {displayText(item.role, '專業經歷')}
                    </h3>
                    {displayText(item.summary) ? (
                      <div className="mt-3 grid gap-3 text-sm leading-7 text-slate-600">
                        {renderMarkdownBlocks(displayText(item.summary))}
                      </div>
                    ) : null}
                    {timelineHighlightItems(item).length ? (
                      <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
                        {timelineHighlightItems(item).slice(0, 4).map((highlight, highlightIndex) => (
                          <li className="border-l border-slate-300 pl-3" key={`${highlight}-${highlightIndex}`}>
                            {renderRichTextLines(highlight)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <CareerMilestoneMedia item={item} media={media} tone={tone} />
                </article>
              )
            })
          ) : (
            <article className={`rounded-lg border ${style.panel} p-6 text-sm text-slate-600`}>
              履歷時間軸資料尚未建立。
            </article>
          )}
        </div>
      </section>

      <PublicSiteFooter contact={publicContact} />
    </main>
  )
}

function NarrativePanel({
  accentClass,
  member,
  stylePanel,
}: {
  accentClass: string
  member: User
  stylePanel: string
}) {
  const beliefItems = compactTextList(member.beliefs?.map((belief) => belief.text) ?? [member.status])
  const educationItems = compactTextList(
    member.education?.map((item) =>
      compactTextList([item.school, item.degree, item.major, item.year]).join(' · '),
    ) ?? [],
  ).filter((item) => !['學校', '學位', '專業', '年份', '畢業年份'].includes(item))
  const interestItems = compactTextList(
    member.interests?.map((item) => {
      const name = displayText(item.name)
      const description = displayText(item.description)

      return description ? `${name}：${description}` : name
    }) ?? [],
  )

  return (
    <article className={`rounded-lg border ${stylePanel} p-6 shadow-sm backdrop-blur-md`}>
      <div className="mb-6">
        <p className={`text-sm font-semibold uppercase ${accentClass}`}>Beliefs, Education & Interest</p>
        <h2 className={sectionHeadingClass}>信念、教育與生活</h2>
      </div>
      <div className="grid gap-5">
        <InfoBlock
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          items={beliefItems.length ? beliefItems : ['家人的故事正在展開。']}
          title="Beliefs"
        />
        <InfoBlock
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          items={educationItems.length ? educationItems : ['教育資料可在 Payload Admin 中補充。']}
          title="Education"
        />
        <InfoBlock
          icon={<BriefcaseBusiness className="size-5" aria-hidden="true" />}
          items={interestItems.length ? interestItems : ['興趣與生活美學資料可在 Payload Admin 中補充。']}
          title="Interests"
        />
      </div>
    </article>
  )
}

function CareerMilestoneMedia({
  item,
  media,
  tone,
}: {
  item: CareerTimelineItem
  media: MemberMedia[]
  tone: MemberTone
}) {
  if (!media.length) {
    return null
  }

  return (
    <div className="grid gap-3">
      {media.map((mediaItem, mediaIndex) => (
        <PayloadImage
          className="aspect-[4/3] min-h-44 rounded-lg shadow-md shadow-slate-900/10"
          fallbackLabel={`${displayText(item.organization, '職涯里程碑')} milestone media`}
          key={typeof mediaItem === 'number' ? mediaItem : (mediaItem.id ?? mediaIndex)}
          media={mediaItem}
          sizes="(min-width: 1024px) 16rem, 100vw"
          tone={tone}
        />
      ))}
    </div>
  )
}

function PublicSiteFooter({
  contact,
}: {
  contact: ReturnType<typeof publicContactForMember>
}) {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 px-5 py-10 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold uppercase tracking-normal text-slate-950">{contact.siteTitle}</p>
          <p className="mt-2 max-w-xl leading-6">{contact.description}</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <a className="inline-flex items-center gap-2 font-medium text-slate-700 transition hover:text-slate-950" href={`mailto:${contact.email}`}>
            <Mail className="size-4" aria-hidden="true" />
            {contact.email}
          </a>
          <a className="inline-flex items-center gap-2 font-medium text-slate-700 transition hover:text-slate-950" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>
            <Phone className="size-4" aria-hidden="true" />
            {contact.phone}
          </a>
        </div>
      </div>
    </footer>
  )
}

function InfoBlock({
  icon,
  items,
  title,
}: {
  icon: ReactNode
  items: string[]
  title: string
}) {
  return (
    <section className="border-t border-slate-200/80 pt-5">
      <div className="mb-3 flex items-center gap-2 text-slate-600">
        {icon}
        <h3 className="text-sm font-semibold uppercase">{title}</h3>
      </div>
      <div className="grid gap-2 text-sm leading-7 text-slate-600">
        {items.map((item) => (
          <p key={item}>{renderInlineEmphasis(item)}</p>
        ))}
      </div>
    </section>
  )
}

function SkillRadar({
  accentClass,
  panelClass,
  skills,
}: {
  accentClass: string
  panelClass: string
  skills: NonNullable<User['skillRadar']>
}) {
  return (
    <article className={`rounded-lg border ${panelClass} p-6 shadow-sm backdrop-blur-md`}>
      <p className={`text-sm font-semibold uppercase ${accentClass}`}>Skill Radar</p>
      <h2 className={sectionHeadingClass}>能力不是標籤，而是證據。</h2>
      <div className="mt-7 grid gap-4">
        {skills.length > 0 ? (
          skills.map((skill, index) => (
            <div key={skill.id ?? skill.skill}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-800">
                  {renderInlineEmphasis(displayText(skill.skill, '專業能力'))}
                </span>
                <span className="text-slate-500">{skill.score}</span>
              </div>
              <SkillRadarMeter
                index={index}
                label={displayText(skill.skill, '專業能力')}
                score={skill.score}
                widthClass={scoreClass(skill.score)}
              />
              {displayText(skill.evidence) ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {renderInlineEmphasis(displayText(skill.evidence))}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-slate-600">技能雷達資料尚未建立。</p>
        )}
      </div>
    </article>
  )
}
