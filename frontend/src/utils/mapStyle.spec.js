// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { layers, namedFlavor } from '@protomaps/basemaps'
import CONFIG from '@/config'
import { FLAVOR_OF_LOOK, TILE_SOURCE, styleFor } from './mapStyle'

/** Every text field of the style's layers, as one string to search. */
const labelsOf = (style) =>
  JSON.stringify(style.layers.filter((layer) => layer.layout?.['text-field']))

/** Protomaps' own layers for a flavor, which the wallet has not touched. */
const untouched = (flavor) => layers(TILE_SOURCE, namedFlavor(flavor), { lang: 'de' })

/** The ids of the layers a style draws differently from Protomaps' own. */
const changedLayersOf = (style, flavor) => {
  const own = untouched(flavor)
  return style.layers
    .filter((layer, index) => JSON.stringify(layer) !== JSON.stringify(own[index]))
    .map((layer) => layer.id)
}

/** How bright a grey like '#5c5c5c' is, 0 to 255. */
const brightnessOf = (hex) => parseInt(hex.slice(1, 3), 16)

describe('styleFor', () => {
  // K-004: dark is black, normal is light, bright is white.
  it.each([
    ['dunkel', 'black'],
    ['normal', 'light'],
    ['hell', 'white'],
  ])('draws the look %s with the %s style and its sprite', (look, flavor) => {
    const style = styleFor(look, 'de')

    expect(style.sprite).toBe(`${CONFIG.MAP_ASSETS_URL}/sprites/v4/${flavor}`)
    expect(style.layers.map((layer) => layer.id)).toEqual(untouched(flavor).map(({ id }) => id))
  })

  // The home map draws the normal look, and there the place names are what a member finds
  // their way by.
  it.each([
    ['normal', 'light'],
    ['hell', 'white'],
  ])('leaves the look %s exactly as Protomaps draws it', (look, flavor) => {
    expect(styleFor(look, 'de').layers).toEqual(untouched(flavor))
  })

  describe('on the dark look, where the towns read as people', () => {
    const places = (style) => style.layers.find((layer) => layer.id === 'places_locality')
    const own = places({ layers: untouched('black') })

    // Measured against the installed Protomaps, not against a name written down here: a
    // flavor key or a layer id it no longer knows would change nothing, and this says so.
    it('changes the towns and nothing else', () => {
      expect(changedLayersOf(styleFor('dunkel', 'de'), 'black')).toEqual(['places_locality'])
    })

    it('writes the place names darker than Protomaps does', () => {
      const color = places(styleFor('dunkel', 'de')).paint['text-color']

      expect(color).toBe('#5c5c5c')
      expect(brightnessOf(color)).toBeLessThan(brightnessOf(own.paint['text-color']))
    })

    it('dims the small circles that mark a place, which Protomaps draws at full strength', () => {
      expect(own.paint['icon-opacity']).toBeUndefined()
      expect(places(styleFor('dunkel', 'de')).paint['icon-opacity']).toBe(0.35)
    })

    // The circles are there to be dimmed: a layer without them would make the line above a
    // statement about nothing.
    it('still marks a place with its circle', () => {
      expect(JSON.stringify(places(styleFor('dunkel', 'de')).layout['icon-image'])).toContain(
        'townspot',
      )
    })

    // With the two changes taken back, the layer is Protomaps' own again.
    it('keeps everything else Protomaps set on the towns', () => {
      const quiet = places(styleFor('dunkel', 'de'))
      const takenBack = {
        ...quiet.paint,
        'text-color': own.paint['text-color'],
        'icon-opacity': own.paint['icon-opacity'],
      }

      expect(takenBack).toEqual(own.paint)
      expect(quiet.layout).toEqual(own.layout)
    })
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
