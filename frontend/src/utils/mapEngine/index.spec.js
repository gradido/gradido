// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { MAP_ENGINE } from '@/composables/useMapSwitches'
import { loadMapEngine } from './index'
import * as leaflet from './leaflet'
import * as maplibre from './maplibre'

// Never the real MapLibre in jsdom: it needs WebGL 2 and would die deep in drawing.
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

describe('loadMapEngine', () => {
  it('loads the MapLibre engine for the MapLibre switch', async () => {
    const engine = await loadMapEngine(MAP_ENGINE.MAPLIBRE)

    expect(engine.createMap).toBe(maplibre.createMap)
  })

  it('loads the Leaflet engine for the Leaflet switch', async () => {
    const engine = await loadMapEngine(MAP_ENGINE.LEAFLET)

    expect(engine.createMap).toBe(leaflet.createMap)
  })

  // Every server drew with Leaflet before the switch existed.
  it('loads the Leaflet engine for a switch position it does not know', async () => {
    const engine = await loadMapEngine('OPENLAYERS')

    expect(engine.createMap).toBe(leaflet.createMap)
  })
})
