'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from 'maplibre-gl'

import { Button } from '@/components/ui/button'
import {
  projectTravelAtlasEntries,
  resolveTravelAtlasSelection,
  resolveTravelAtlasState,
  type TravelAtlasEntry,
  type TravelAtlasMarkerGroup,
  type TravelAtlasRendererAvailability,
} from '@/lib/travel-atlas'

const EMPTY_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9edf2' } }],
}

type MarkerButton = { element: HTMLButtonElement; groupId: string; itemIds: readonly string[] }

function resetMapView(map: MapLibreMap, groups: readonly TravelAtlasMarkerGroup[]) {
  const coordinates = groups.map((group) => [group.coordinate.longitude, group.coordinate.latitude] as [number, number])
  if (coordinates.length === 1) {
    map.jumpTo({ center: coordinates[0], zoom: 4 })
  } else if (coordinates.length > 1) {
    const longitudes = coordinates.map(([longitude]) => longitude)
    const latitudes = coordinates.map(([, latitude]) => latitude)
    map.fitBounds([[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]], { padding: 40, maxZoom: 8, duration: 0 })
  }
}

/** Entries must already be filtered for the current reader by their owning data layer. */
export function TravelAtlasMapView<T>({ entries }: { entries: readonly TravelAtlasEntry<T>[] }) {
  const projection = useMemo(() => projectTravelAtlasEntries(entries), [entries])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<TravelAtlasRendererAvailability>('loading')
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const markerButtons = useRef<MarkerButton[]>([])
  const selected = resolveTravelAtlasSelection(selectedId, projection.listItems.map((item) => item.id))
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const groupPanelId = useId()
  const expandedGroup = projection.groups.find((group) => group.id === expandedGroupId)
  const state = resolveTravelAtlasState(projection, availability)
  const markerIds = new Set(projection.markers.map((marker) => marker.id))

  useEffect(() => {
    setSelectedId((current) => resolveTravelAtlasSelection(current, projection.listItems.map((item) => item.id)))
    setExpandedGroupId((current) => projection.groups.some((group) => group.id === current) ? current : null)
  }, [projection])

  useEffect(() => {
    for (const marker of markerButtons.current) {
      const pressed = selected !== null && marker.itemIds.includes(selected)
      marker.element.setAttribute('aria-pressed', String(pressed))
      marker.element.classList.toggle('ring-4', pressed)
      if (marker.itemIds.length > 1) {
        marker.element.setAttribute('aria-expanded', String(marker.groupId === expandedGroupId))
      }
    }
  }, [selected, expandedGroupId])

  useEffect(() => {
    if (state.status !== 'ready' || selected === null) return
    const marker = projection.markers.find((item) => item.id === selected)
    if (marker) mapRef.current?.jumpTo({ center: [marker.coordinate.longitude, marker.coordinate.latitude] })
  }, [projection, selected, state.status])

  useEffect(() => {
    if (projection.markers.length === 0 || !mapContainer.current) return

    let active = true
    let failed = false
    let map: MapLibreMap | null = null
    const markers: MapLibreMarker[] = []
    const container = mapContainer.current
    setAvailability('loading')

    function fail(reason: 'webgl-unsupported' | 'provider-error') {
      if (!active || failed) return
      failed = true
      const restoreFocus = container.contains(document.activeElement)
      for (const marker of markers) marker.remove()
      markerButtons.current = []
      if (mapRef.current === map) mapRef.current = null
      map?.remove()
      map = null
      setAvailability(reason)
      if (restoreFocus) {
        const target = listRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]') ??
          listRef.current?.querySelector<HTMLButtonElement>('button')
        target?.focus()
      }
    }

    async function initialize() {
      try {
        const probe = document.createElement('canvas').getContext('webgl2')
        if (!probe) {
          fail('webgl-unsupported')
          return
        }
        probe.getExtension('WEBGL_lose_context')?.loseContext()

        const { Map, Marker, setWorkerUrl } = await import('maplibre-gl')
        if (!active) return
        setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString())
        map = new Map({ container, style: EMPTY_STYLE, center: [0, 0], zoom: 1, attributionControl: false, scrollZoom: false, cooperativeGestures: true })
        mapRef.current = map
        map.on('error', () => fail('provider-error'))
        map.on('webglcontextlost', () => fail('webgl-unsupported'))
        map.on('load', () => {
          if (!active || failed || !map) return
          try {
            const buttons: MarkerButton[] = []
            for (const group of projection.groups) {
              const element = document.createElement('button')
              const itemIds = group.markers.map((marker) => marker.id)
              element.type = 'button'
              element.className = 'flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-primary text-sm font-semibold text-primary-foreground shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
              element.textContent = itemIds.length > 1 ? String(itemIds.length) : '●'
              element.setAttribute('aria-label', itemIds.length > 1 ? `同地點 ${itemIds.length} 個項目` : `選取 ${group.markers[0].title}`)
              const pressed = selectedRef.current !== null && itemIds.includes(selectedRef.current)
              element.setAttribute('aria-pressed', String(pressed))
              element.classList.toggle('ring-4', pressed)
              if (itemIds.length > 1) {
                element.setAttribute('aria-expanded', 'false')
                element.setAttribute('aria-controls', groupPanelId)
              }
              element.addEventListener('click', () => {
                if (itemIds.length === 1) setSelectedId(itemIds[0])
                else setExpandedGroupId((current) => current === group.id ? null : group.id)
              })
              markers.push(new Marker({ element }).setLngLat([group.coordinate.longitude, group.coordinate.latitude]).addTo(map))
              buttons.push({ element, groupId: group.id, itemIds })
            }
            markerButtons.current = buttons
            resetMapView(map, projection.groups)
            setAvailability('ready')
          } catch {
            fail('provider-error')
          }
        })
      } catch {
        fail('provider-error')
      }
    }

    void initialize()
    return () => {
      active = false
      for (const marker of markers) marker.remove()
      markerButtons.current = []
      if (mapRef.current === map) mapRef.current = null
      map?.remove()
    }
  }, [projection, groupPanelId])

  const status = state.status === 'loading' ? '地圖載入中' :
    state.status === 'ready' ? '地圖已載入' :
    state.status === 'empty' ? '目前沒有可顯示的地圖地點' :
    state.reason === 'webgl-unsupported' ? '此裝置不支援地圖，請使用地點清單' :
    state.reason === 'disabled' ? '地圖尚未啟用，請使用地點清單' : '地圖載入失敗，請使用地點清單'

  return (
    <section aria-label="旅行地圖與地點清單" className="space-y-4">
      <div ref={mapContainer} role="region" aria-label="互動地圖" className="relative h-64 overflow-hidden rounded-lg border bg-muted sm:h-80" />
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{status}</p>
      <p className="text-sm text-muted-foreground">底圖尚未啟用；地點可由下方清單選取。</p>
      {state.status === 'ready' && (
        <div role="group" aria-label="地圖控制" className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-auto min-h-11" aria-label="放大地圖" onClick={() => mapRef.current?.zoomIn({ duration: 0 })}>放大地圖</Button>
          <Button type="button" variant="outline" className="h-auto min-h-11" aria-label="縮小地圖" onClick={() => mapRef.current?.zoomOut({ duration: 0 })}>縮小地圖</Button>
          <Button type="button" variant="outline" className="h-auto min-h-11" aria-label="重設地圖" onClick={() => { if (mapRef.current) resetMapView(mapRef.current, projection.groups) }}>重設地圖</Button>
        </div>
      )}
      <div id={groupPanelId} role="group" aria-label="同地點的項目" className="space-y-2" hidden={!expandedGroup}>
        {expandedGroup && (
          <>
            <p>同地點的項目</p>
            {expandedGroup.markers.map((marker) => (
              <Button key={marker.id} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal text-left" aria-pressed={selected === marker.id} onClick={() => setSelectedId(marker.id)}>{marker.title}</Button>
            ))}
          </>
        )}
      </div>
      <ul ref={listRef} aria-label="地點清單" className="space-y-2">
        {projection.listItems.map((entry) => (
          <li key={entry.id}>
            <Button type="button" variant="outline" className="h-auto min-h-11 w-full justify-start whitespace-normal text-left" aria-pressed={selected === entry.id} onClick={() => setSelectedId(entry.id)}>
              {entry.title}{!markerIds.has(entry.id) ? '（位置未提供或無法顯示）' : ''}{selected === entry.id ? '（已選取）' : ''}
            </Button>
          </li>
        ))}
      </ul>
      {selected !== null && <Button type="button" variant="outline" className="h-auto min-h-11" onClick={() => setSelectedId(null)}>清除選取</Button>}
    </section>
  )
}
