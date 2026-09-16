// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi } from 'vitest'
import { loadMapEngine } from './index'
import * as maplibre from './maplibre'

// Never the real MapLibre in jsdom: it needs WebGL 2 and would die deep in drawing.
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

describe('loadMapEngine', () => {
  it('loads the MapLibre engine', async () => {
    const engine = await loadMapEngine()

    expect(engine.createMap).toBe(maplibre.createMap)
  })
})
