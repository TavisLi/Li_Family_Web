import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  MapPin,
  Sparkles,
} from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { User } from '@/payload/payload-types'

type MemberProfilePageProps = {
  member: User
}

type MemberTone = 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'

const roleLabel: Record<User['familyRole'], string> = {
  daughter: '女兒',
  family: '家人',
  father: '父親',
  grandmother: '奶奶',
  mother: '母親',
  son: '兒子',
}

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
      eyebrow: 'Apple-like technology leadership',
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

function timelineLimit(member: User) {
  return member.slug === 'tavis' || member.slug === 'lynn' ? 6 : 4
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

export function MemberProfilePage({ member }: MemberProfilePageProps) {
  const style = profileStyle(member)
  const tone = toneForMember(member)
  const timeline = member.careerTimeline?.slice(0, timelineLimit(member)) ?? []
  const skills = member.skillRadar?.slice(0, 6) ?? []
  const heroImage = member.heroImage ?? member.avatar
  const gallery = member.resumeMilestoneImages?.length
    ? member.resumeMilestoneImages
    : member.galleryImages

  return (
    <main className={style.background}>
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative order-2 lg:order-1">
          <PayloadImage
            className={`aspect-[4/5] min-h-[32rem] rounded-lg border ${style.border} shadow-2xl shadow-slate-900/10`}
            fallbackLabel={member.displayName}
            media={heroImage}
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            tone={tone}
          />
          <div className={`absolute -bottom-5 left-5 right-5 rounded-lg border ${style.panel} p-4 shadow-xl backdrop-blur-xl`}>
            <p className="text-xs font-semibold uppercase text-slate-500">{roleLabel[member.familyRole]}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{style.quote}</p>
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
            {member.displayName}
          </h1>
          <div className="mt-6 max-w-3xl overflow-hidden text-2xl font-semibold leading-tight text-slate-800 md:text-3xl">
            {member.typewriter?.prefix ? <span>{member.typewriter.prefix}</span> : null}
            <TypewriterWords words={member.typewriter?.rotatingWords?.map((item) => item.word) ?? []} />
            {member.typewriter?.suffix ? <span>{member.typewriter.suffix}</span> : null}
          </div>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
            {member.bio || style.title}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <NarrativePanel member={member} stylePanel={style.panel} />
        <SkillRadar accentClass={style.accent} panelClass={style.panel} skills={skills} />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className={`text-sm font-semibold uppercase ${style.accent}`}>Professional Timeline</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              經歷不是列表，是一路形成的判斷力。
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            由 Payload 中的履歷時間軸資料驅動，保留重點里程碑與每段職涯的核心貢獻。
          </p>
        </div>
        <div className="grid gap-4">
          {timeline.length > 0 ? (
            timeline.map((item, index) => (
              <article
                className={`grid gap-5 rounded-lg border ${style.panel} p-5 shadow-sm backdrop-blur-md md:grid-cols-[10rem_1fr]`}
                key={item.id ?? `${item.organization}-${index}`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {[item.start, item.end].filter(Boolean).join(' - ')}
                  </p>
                  {item.location ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="size-4" aria-hidden="true" />
                      {item.location}
                    </p>
                  ) : null}
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                    {item.organization} · {item.role}
                  </h3>
                  {item.summary ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                  ) : null}
                  {item.highlights?.length ? (
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 md:grid-cols-2">
                      {item.highlights.slice(0, 4).map((highlight) => (
                        <li className="border-l border-slate-300 pl-3" key={highlight.id ?? highlight.text}>
                          {highlight.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className={`rounded-lg border ${style.panel} p-6 text-sm text-slate-600`}>
              履歷時間軸資料尚未建立。
            </article>
          )}
        </div>
      </section>

      {gallery?.length ? (
        <section className="mx-auto w-full max-w-7xl px-5 pb-20">
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.slice(0, 3).map((image, index) => (
              <PayloadImage
                className="aspect-[4/3] rounded-lg shadow-lg shadow-slate-900/10"
                fallbackLabel={`${member.displayName} milestone ${index + 1}`}
                key={typeof image === 'number' ? image : image.id}
                media={image}
                sizes="(min-width: 768px) 31vw, 100vw"
                tone={tone}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

function TypewriterWords({ words }: { words: string[] }) {
  if (!words.length) {
    return null
  }

  return (
    <span className="mx-2 inline-grid h-[1.18em] min-w-[8em] overflow-hidden align-bottom text-slate-950">
      <span className="animate-word-rail">
        {words.slice(0, 4).map((word) => (
          <span className="block h-[1.18em]" key={word}>
            {word}
          </span>
        ))}
      </span>
    </span>
  )
}

function NarrativePanel({ member, stylePanel }: { member: User; stylePanel: string }) {
  return (
    <article className={`rounded-lg border ${stylePanel} p-6 shadow-sm backdrop-blur-md`}>
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="size-5 text-slate-600" aria-hidden="true" />
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">信念、教育與生活</h2>
      </div>
      <div className="grid gap-5">
        <InfoBlock
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          items={member.beliefs?.map((belief) => belief.text) ?? [member.status || '家人的故事正在展開。']}
          title="Beliefs"
        />
        <InfoBlock
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          items={
            member.education?.map((item) =>
              [item.school, item.degree, item.major, item.year].filter(Boolean).join(' · '),
            ) ?? ['教育資料可在 Payload Admin 中補充。']
          }
          title="Education"
        />
        <InfoBlock
          icon={<BriefcaseBusiness className="size-5" aria-hidden="true" />}
          items={
            member.interests?.map((item) =>
              item.description ? `${item.name}：${item.description}` : item.name,
            ) ?? ['興趣與生活美學資料可在 Payload Admin 中補充。']
          }
          title="Interests"
        />
      </div>
    </article>
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
          <p key={item}>{item}</p>
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
      <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">能力不是標籤，而是證據。</h2>
      <div className="mt-7 grid gap-4">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <div key={skill.id ?? skill.skill}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-800">{skill.skill}</span>
                <span className="text-slate-500">{skill.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
                <div className={`h-full rounded-full bg-slate-900 ${scoreClass(skill.score)}`} />
              </div>
              {skill.evidence ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{skill.evidence}</p>
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
