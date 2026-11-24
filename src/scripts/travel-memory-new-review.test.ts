import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyNewMemory } from './travel-memory-new-review.mjs'

function fixture() {
  const scope = { slug: 'fixture-memory', environment: 'fixture', locale: 'zh-TW' }
  const memory = { id: 7, slug: scope.slug, isPrivate: true, _status: 'draft' }
  const day = { id: 3, dayKey: 'day-01', _status: 'draft', memory: 7,
    moments: [{ momentKey: 'first', placements: [{ type: 'photo', placementKey: 'photo', media: 17 }] },
      { momentKey: 'second' }],
  }
  const media = [{ id: 17 }]
  const snapshot = { ...scope, ownerCount: 1, versionCount: 1,
    inventory: { memory, days: [day], allLocales: { memory: { ...memory }, days: [{ ...day }], media } },
  }
  const preview = { ...scope, status: 'PREVIEW', preservedMedia: media,
    plan: { parent: { data: { slug: scope.slug, isPrivate: true } },
      days: [{ dayKey: day.dayKey, data: { moments: day.moments } }] },
  }
  return { preview: structuredClone(preview), snapshot: structuredClone(snapshot) }
}

test('draft readback reports independently verified counts and visibility', () => {
  const { preview, snapshot } = fixture()
  assert.deepEqual(verifyNewMemory(preview, snapshot, 7), {
    status: 'PASS', scope: 'target-draft-readback', slug: snapshot.slug, memoryId: 7,
    visibility: 'family', draftStatus: 'draft', days: 1, moments: 2, placements: 1,
    photoPlacements: 1, preservedMedia: 1,
  })
})

test('readback rejects extra placements and differences across locale views', () => {
  const { preview, snapshot } = fixture()
  const additional = structuredClone(snapshot)
  additional.inventory.days[0]!.moments[1]!.placements = [{ type: 'photo', placementKey: 'extra', media: 17 }]
  assert.throws(() => verifyNewMemory(preview, additional, 7))
  const published = structuredClone(snapshot)
  published.inventory.allLocales.memory._status = 'published'
  assert.throws(() => verifyNewMemory(preview, published, 7))
  const foreignDay = structuredClone(snapshot)
  foreignDay.inventory.allLocales.days[0]!.memory = 9
  assert.throws(() => verifyNewMemory(preview, foreignDay, 7))
})
