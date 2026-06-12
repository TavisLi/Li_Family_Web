import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BriefcaseBusiness, GraduationCap, Sparkles } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { getMemberBySlug } from '@/lib/data/members'

export const dynamic = 'force-dynamic'

type MemberPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { slug } = await params
  const member = await getMemberBySlug(slug)

  if (!member) {
    return {
      title: 'Member',
    }
  }

  return {
    title: member.displayName,
    description: member.bio || member.status || `Profile for ${member.displayName}`,
    openGraph: {
      title: member.displayName,
      description: member.bio || member.status || `Profile for ${member.displayName}`,
    },
  }
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { slug } = await params
  const member = await getMemberBySlug(slug)

  if (!member) {
    notFound()
  }

  const tone =
    member.theme.persona === 'tavis' || member.theme.persona === 'lynn' || member.theme.persona === 'leo'
      ? member.theme.persona
      : 'neutral'

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <PayloadImage
          className="min-h-80 shadow-lg"
          fallbackLabel={member.displayName}
          media={member.avatar}
          priority
          sizes="(min-width: 1024px) 38vw, 100vw"
          tone={tone}
        />
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium capitalize text-muted-foreground">{member.familyRole}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
            {member.displayName}
          </h1>
          {member.typewriter?.prefix || member.typewriter?.suffix ? (
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {member.typewriter.prefix}
              {member.typewriter.rotatingWords?.[0]?.word ? (
                <span className="font-semibold text-foreground">
                  {member.typewriter.rotatingWords[0].word}
                </span>
              ) : null}
              {member.typewriter.suffix}
            </p>
          ) : null}
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {member.bio || member.status || 'Family profile'}
          </p>
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-3">
        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Beliefs</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {member.beliefs?.length ? (
              member.beliefs.map((belief) => <p key={belief.id}>{belief.text}</p>)
            ) : (
              <p>{member.status || 'A quiet space for family memories.'}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Education</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {member.education?.length ? (
              member.education.map((item) => (
                <p key={item.id}>
                  <span className="font-medium text-foreground">{item.school}</span>
                  {item.major ? ` · ${item.major}` : ''}
                  {item.year ? ` · ${item.year}` : ''}
                </p>
              ))
            ) : (
              <p>Education details can be added in Payload Admin.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Skill Radar</h2>
          </div>
          <div className="space-y-4">
            {member.skillRadar?.length ? (
              member.skillRadar.map((skill) => (
                <div key={skill.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{skill.skill}</span>
                    <span className="text-muted-foreground">{skill.score}</span>
                  </div>
                  <progress
                    aria-label={skill.skill}
                    className="h-2 w-full overflow-hidden rounded-full accent-primary"
                    max={100}
                    value={skill.score}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Skill values can be generated from the profile source document.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-6">
        <h2 className="mb-5 text-2xl font-semibold tracking-normal">Timeline</h2>
        <div className="grid gap-4">
          {member.careerTimeline?.length ? (
            member.careerTimeline.map((item) => (
              <article
                className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md"
                key={item.id}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {[item.start, item.end].filter(Boolean).join(' - ')}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-normal">
                  {item.organization} · {item.role}
                </h3>
                {item.summary ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-white/20 bg-white/35 p-5 text-sm text-muted-foreground shadow-sm backdrop-blur-md">
              Timeline entries can be added after the profile parser is connected.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
