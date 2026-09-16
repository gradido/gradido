// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { layers, namedFlavor } from '@protomaps/basemaps'
import CONFIG from '@/config'
import { FLAVOR_OF_LOOK, TILE_SOURCE, styleFor } from './mapStyle'

/** Every text field of the style's layers, as one string to search. */
const labelsOf = (style) =>
  JSON.stringify(style.layers.filter((layer) => layer.layout?.['text-field']))

describe('styleFor', () => {
  // K-004: dark is black, normal is light, bright is white.
  it.each([
    ['dunkel', 'black'],
    ['normal', 'light'],
    ['hell', 'white'],
  ])('draws the look %s with the %s style and its sprite', (look, flavor) => {
    const style = styleFor(look, 'de')

    expect(style.sprite).toBe(`${CONFIG.MAP_ASSETS_URL}/sprites/v4/${flavor}`)
    expect(style.layers).toEqual(layers(TILE_SOURCE, namedFlavor(flavor), { lang: 'de' }))
  })

  it('draws a look it does not know as the normal one', () => {
    expect(styleFor('neon', 'de')).toEqual(styleFor('normal', 'de'))
  })

  // K-005, K-006: tiles, fonts and sprites all come from Gradido's own server.
  it('reads the tiles, the fonts and the sprites from the addresses the wallet is configured with', () => {
    const style = styleFor('normal', 'de')

    expect(style.version).toBe(8)
    expect(style.glyphs).toBe(`${CONFIG.MAP_ASSETS_URL}/fonts/{fontstack}/{range}.pbf`)
    expect(style.sources).toEqual({
      [TILE_SOURCE]: {
        type: 'vector',
        url: `pmtiles://${CONFIG.MAP_TILES_URL}`,
        attribution: '© OpenStreetMap-Mitwirkende',
      },
    })
    expect(style.layers.every((layer) => !layer.source || layer.source === TILE_SOURCE)).toBe(true)
  })

  it('names places in the wallet language', () => {
    expect(labelsOf(styleFor('normal', 'de'))).toContain('name:de')
    expect(labelsOf(styleFor('normal', 'ru'))).toContain('name:ru')
    expect(labelsOf(styleFor('normal', 'ru'))).not.toContain('name:de')
  })

  // Protomaps adds no label layer without a language: a map handed none would have no names.
  it('labels a map it is given no language for in English', () => {
    const style = styleFor('normal', undefined)

    expect(labelsOf(style)).toContain('name:en')
    expect(style.sources[TILE_SOURCE].attribution).toBe('© OpenStreetMap contributors')
  })

  it('credits OpenStreetMap in German for a German wallet and in English for any other', () => {
    expect(styleFor('hell', 'de').sources[TILE_SOURCE].attribution).toBe(
      '© OpenStreetMap-Mitwirkende',
    )
    expect(styleFor('hell', 'fr').sources[TILE_SOURCE].attribution).toBe(
      '© OpenStreetMap contributors',
    )
  })

  it('knows the three looks and no other', () => {
    expect(Object.keys(FLAVOR_OF_LOOK)).toEqual(['dunkel', 'normal', 'hell'])
  })
})
