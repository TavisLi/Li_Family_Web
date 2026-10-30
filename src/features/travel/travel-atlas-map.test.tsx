import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Window } from 'happy-dom'

import { TravelAtlasMapView } from './travel-atlas-map-view'

const entries = [
  { id: 'synthetic:one', title: '合成地點一', coordinate: { crs: 'WGS84', longitude: 120, latitude: 23 }, item: null },
  { id: 'synthetic:without-location', title: '沒有座標的合成故事', item: null },
]

test('keeps the complete synthetic list available while the map loads', () => {
  const html = renderToStaticMarkup(createElement(TravelAtlasMapView, { entries }))
  assert.match(html, /合成地點一/)
  assert.match(html, /沒有座標的合成故事/)
  assert.match(html, /位置未提供或無法顯示/)
  assert.match(html, /role="status"/)
  assert.match(html, /地圖載入中/)
})

const dom = new Window({ url: 'http://localhost/' })
let webglAvailable = true
Object.defineProperty(globalThis, 'window', { value: dom, configurable: true })
Object.defineProperty(globalThis, 'document', { value: dom.document, configurable: true })
Object.defineProperty(globalThis, 'navigator', { value: dom.navigator, configurable: true })
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })
Object.defineProperty(dom.HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => webglAvailable ? { getExtension: () => null } : null,
})

class FakeMap {
  static latest: FakeMap
  readonly handlers = new Map<string, () => void>()
  readonly jumps: unknown[] = []
  readonly zoomActions: string[] = []
  removed = false

  constructor(readonly options: { container: HTMLElement; style: unknown; scrollZoom?: boolean; cooperativeGestures?: boolean }) {
    FakeMap.latest = this
  }

  on(name: string, handler: () => void) { this.handlers.set(name, handler); return this }
  fire(name: string) { this.handlers.get(name)?.() }
  jumpTo(options: unknown) { this.jumps.push(options); return this }
  fitBounds() { return this }
  zoomIn() { this.zoomActions.push('in'); return this }
  zoomOut() { this.zoomActions.push('out'); return this }
  remove() { this.removed = true }
}

class FakeMarker {
  static created: FakeMarker[] = []
  static failNext = false
  coordinate: number[] = []

  constructor(readonly options: { element: HTMLElement }) {
    if (FakeMarker.failNext) { FakeMarker.failNext = false; throw new Error('synthetic marker error') }
    FakeMarker.created.push(this)
  }
  setLngLat(coordinate: number[]) { this.coordinate = coordinate; return this }
  addTo(map: FakeMap) { map.options.container.appendChild(this.options.element); return this }
  remove() { this.options.element.remove() }
}

let workerUrl = ''
mock.module('maplibre-gl', { exports: { Map: FakeMap, Marker: FakeMarker, setWorkerUrl: (url: string) => { workerUrl = url } } })
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')

test('synchronizes a synthetic marker and list selection on an empty local style', async (t) => {
  FakeMarker.created = []
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)
  const root = createRoot(container as unknown as HTMLElement)
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  await act(async () => {
    root.render(createElement(TravelAtlasMapView, { entries }))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  assert.ok(FakeMap.latest, 'MapLibre should be loaded for a valid marker')
  assert.match(workerUrl, /maplibre-gl-worker\.mjs$/)
  assert.equal(FakeMap.latest.options.scrollZoom, false)
  assert.equal(FakeMap.latest.options.cooperativeGestures, true)
  const style = FakeMap.latest.options.style as { sources: Record<string, unknown>; sprite?: string; glyphs?: string }
  assert.deepEqual(style.sources, {})
  assert.equal(style.sprite, undefined)
  assert.equal(style.glyphs, undefined)

  await act(async () => FakeMap.latest.fire('load'))
  assert.deepEqual(FakeMarker.created.map((marker) => marker.coordinate), [[120, 23]])
  const marker = FakeMarker.created[0].options.element
  const listButton = container.querySelector('ul[aria-label="地點清單"] button') as unknown as HTMLButtonElement | null
  assert.ok(listButton)
  await act(async () => marker.click())
  assert.equal(listButton.getAttribute('aria-pressed'), 'true')
  const clear = [...container.querySelectorAll('button')].find((button) => button.textContent === '清除選取')
  assert.ok(clear)
  await act(async () => clear.click())
  assert.equal(marker.getAttribute('aria-pressed'), 'false')
  await act(async () => listButton.click())
  assert.equal(marker.getAttribute('aria-pressed'), 'true')
  assert.deepEqual(FakeMap.latest.jumps.at(-1), { center: [120, 23] })
  const buttons = [...container.querySelectorAll('button')]
  const zoomIn = buttons.find((button) => button.textContent === '放大地圖')
  const zoomOut = buttons.find((button) => button.textContent === '縮小地圖')
  const reset = buttons.find((button) => button.textContent === '重設地圖')
  assert.ok(zoomIn && zoomOut && reset)
  assert.equal(zoomIn.getAttribute('aria-label'), '放大地圖')
  assert.equal(zoomOut.getAttribute('aria-label'), '縮小地圖')
  assert.equal(reset.getAttribute('aria-label'), '重設地圖')
  await act(async () => { zoomIn.click(); zoomOut.click(); reset.click() })
  assert.deepEqual(FakeMap.latest.zoomActions, ['in', 'out'])
  assert.deepEqual(FakeMap.latest.jumps.at(-1), { center: [120, 23], zoom: 4 })
})

test('expands coincident markers and synchronizes the chosen item', async (t) => {
  FakeMarker.created = []
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)
  const root = createRoot(container as unknown as HTMLElement)
  t.after(async () => { await act(async () => root.unmount()); container.remove() })
  const groupedEntries = [
    entries[0],
    { id: 'synthetic:two', title: '合成地點二', coordinate: { crs: 'WGS84', longitude: 120, latitude: 23 }, item: null },
    entries[1],
  ]
  await act(async () => { root.render(createElement(TravelAtlasMapView, { entries: groupedEntries })); await new Promise((resolve) => setTimeout(resolve, 0)) })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  const map = FakeMap.latest
  await act(async () => map.fire('load'))
  assert.equal(FakeMarker.created.length, 1)
  const marker = FakeMarker.created[0].options.element
  assert.equal(marker.getAttribute('aria-label'), '同地點 2 個項目')
  assert.ok(dom.document.getElementById(marker.getAttribute('aria-controls') ?? ''))
  await act(async () => marker.click())
  assert.equal(marker.getAttribute('aria-expanded'), 'true')
  const group = container.querySelector('[role="group"][aria-label="同地點的項目"]')
  assert.ok(group)
  const choice = [...group.querySelectorAll('button')].find((button) => button.textContent === '合成地點二')
  assert.ok(choice)
  await act(async () => choice.click())
  const listButtons = [...container.querySelectorAll('ul[aria-label="地點清單"] button')]
  assert.equal(listButtons[1].getAttribute('aria-pressed'), 'true')
  assert.equal(marker.getAttribute('aria-pressed'), 'true')
})

test('preserves the list when WebGL is unavailable or the map errors', async (t) => {
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)
  const root = createRoot(container as unknown as HTMLElement)
  t.after(async () => { webglAvailable = true; await act(async () => root.unmount()); container.remove() })

  webglAvailable = false
  await act(async () => root.render(createElement(TravelAtlasMapView, { entries })))
  assert.match(container.textContent ?? '', /此裝置不支援地圖/)
  assert.match(container.textContent ?? '', /沒有座標的合成故事/)

  webglAvailable = true
  const newEntries = [...entries]
  await act(async () => { root.render(createElement(TravelAtlasMapView, { entries: newEntries })); await new Promise((resolve) => setTimeout(resolve, 0)) })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  const map = FakeMap.latest
  await act(async () => map.fire('load'))
  const focusedMarker = map.options.container.querySelector('button')
  assert.ok(focusedMarker)
  focusedMarker.focus()
  await act(async () => map.fire('error'))
  assert.equal(map.removed, true)
  assert.match(container.textContent ?? '', /地圖載入失敗/)
  const listButton = container.querySelector('ul[aria-label="地點清單"] button') as unknown as HTMLButtonElement | null
  assert.ok(listButton)
  assert.ok(Object.is(dom.document.activeElement, listButton), 'focus returns to the list when the focused map fails')
  await act(async () => listButton.click())
  assert.equal(listButton.getAttribute('aria-pressed'), 'true')
})

test('keeps selection visible when the list is selected before map load and clears it when filtered out', async (t) => {
  FakeMarker.created = []
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)
  const root = createRoot(container as unknown as HTMLElement)
  t.after(async () => { await act(async () => root.unmount()); container.remove() })
  await act(async () => { root.render(createElement(TravelAtlasMapView, { entries })); await new Promise((resolve) => setTimeout(resolve, 0)) })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  const map = FakeMap.latest
  const first = container.querySelector('ul[aria-label="地點清單"] button') as unknown as HTMLButtonElement | null
  assert.ok(first)
  await act(async () => first.click())
  await act(async () => map.fire('load'))
  const marker = FakeMarker.created[0].options.element
  assert.equal(marker.getAttribute('aria-pressed'), 'true')
  assert.equal(marker.classList.contains('ring-4'), true)
  await act(async () => root.render(createElement(TravelAtlasMapView, { entries: [entries[1]] })))
  assert.equal(map.removed, true)
  assert.equal(container.textContent?.includes('清除選取'), false)
  assert.match(container.textContent ?? '', /目前沒有可顯示的地圖地點/)
})

test('falls back to the list if marker creation fails during map load', async (t) => {
  const container = dom.document.createElement('div')
  dom.document.body.appendChild(container)
  const root = createRoot(container as unknown as HTMLElement)
  t.after(async () => { FakeMarker.failNext = false; await act(async () => root.unmount()); container.remove() })
  await act(async () => { root.render(createElement(TravelAtlasMapView, { entries })); await new Promise((resolve) => setTimeout(resolve, 0)) })
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
  const map = FakeMap.latest
  FakeMarker.failNext = true
  await act(async () => map.fire('load'))
  assert.equal(map.removed, true)
  assert.match(container.textContent ?? '', /地圖載入失敗/)
  assert.match(container.textContent ?? '', /沒有座標的合成故事/)
})
