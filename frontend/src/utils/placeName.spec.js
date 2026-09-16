// AI-GENERATED — not an architecture reference
import { describe, expect, it, vi } from 'vitest'
import { PbfWriter } from 'pbf'
import { decodePlaces, placeNameAt, tileXY } from './placeName'

// A place as the decoder hands it over. The nodes below are read from the Protomaps planet
// file on maptiles.gradido.net (OSM 14.09.2026), cut down to the places each case turns on.
const node = (lat, lng, kind, kindDetail, name, more = {}) => ({
  lat,
  lng,
  properties: { kind, kind_detail: kindDetail, name, ...more },
})
const city = (lat, lng, name, population, more) =>
  node(lat, lng, 'locality', 'city', name, { population, ...more })
const town = (lat, lng, name, population, more) =>
  node(lat, lng, 'locality', 'town', name, { population, ...more })
const village = (lat, lng, name, population = 2000) =>
  node(lat, lng, 'locality', 'village', name, { population })
const suburb = (lat, lng, name, more) =>
  node(lat, lng, 'neighbourhood', 'suburb', name, { population: 0, ...more })
const quarter = (lat, lng, name, more) =>
  node(lat, lng, 'macrohood', 'quarter', name, { population: 0, ...more })

const HEILBRONN = city(49.142303, 9.218731, 'Heilbronn', 131653, { 'name:de': 'Heilbronn' })
const KUENZELSAU = town(49.280348, 9.690113, 'Künzelsau', 14802)
const OEHRINGEN = town(49.200551, 9.502487, 'Öhringen', 22777)
const MUENCHEN = city(48.13711, 11.575298, 'München', 1484226, {
  'name:de': 'München',
  'name:en': 'Munich',
})

// The zoom levels the places are read from, written out: the rule was measured on these.
const FINE = 12
const TOWNS = 9
const WIDER = 11

// An archive that has every tile, and a decoder that answers per zoom level.
function tiles({ fine = [], towns = [], wider = [] }) {
  const byZoom = { [FINE]: fine, [TOWNS]: towns, [WIDER]: wider }
  const archive = { getZxy: vi.fn(async (z, x, y) => ({ data: { z, x, y } })) }
  const decode = vi.fn((data) => byZoom[data.z])
  return { archive, decode }
}

async function nameAt(point, lists, locale = 'de') {
  const { archive, decode } = tiles(lists)
  return placeNameAt(archive, point.lat, point.lng, locale, decode)
}

describe('tileXY', () => {
  it('finds the tiles the map file was read from', () => {
    expect(tileXY(49.2803765, 9.6901512, 12)).toEqual({ x: 2158, y: 1401 })
    expect(tileXY(49.2803765, 9.6901512, 9)).toEqual({ x: 269, y: 175 })
    expect(tileXY(50.0738138, 14.4519428, 12)).toEqual({ x: 2212, y: 1387 })
    expect(tileXY(37.9867045, 23.7348729, 12)).toEqual({ x: 2318, y: 1580 })
  })

  it('wraps a longitude beyond ±180 back, as the map hands it over after panning round the world', () => {
    expect(tileXY(49.2803765, 9.6901512 + 360, 12)).toEqual({ x: 2158, y: 1401 })
    expect(tileXY(49.2803765, 9.6901512 - 720, 12)).toEqual({ x: 2158, y: 1401 })
    expect(tileXY(0, 180, 12)).toEqual({ x: 0, y: 2048 })
  })

  it('holds a latitude beyond the tiles at their edge', () => {
    expect(tileXY(89.9, 0, 12)).toEqual({ x: 2048, y: 0 })
    expect(tileXY(-89.9, 0, 12)).toEqual({ x: 2048, y: 4095 })
  })
})

// A vector tile written in the test: one layer, its features, keys and values (MVT 2.1).
function vectorTile(layers) {
  const pbf = new PbfWriter()
  for (const layer of layers) pbf.writeMessage(3, writeLayer, layer)
  return pbf.finish()
}
function writeLayer(layer, pbf) {
  const keys = []
  const values = []
  pbf.writeVarintField(15, 2)
  pbf.writeStringField(1, layer.name)
  for (const feature of layer.features) pbf.writeMessage(2, writeFeature, { feature, keys, values })
  for (const key of keys) pbf.writeStringField(3, key)
  for (const value of values) {
    pbf.writeMessage(
      4,
      (v, p) => (typeof v === 'number' ? p.writeDoubleField(3, v) : p.writeStringField(1, v)),
      value,
    )
  }
  pbf.writeVarintField(5, 4096)
}
function indexIn(list, item) {
  if (!list.includes(item)) list.push(item)
  return list.indexOf(item)
}
function writeFeature({ feature, keys, values }, pbf) {
  pbf.writePackedVarint(
    2,
    Object.entries(feature.properties).flatMap(([k, v]) => [indexIn(keys, k), indexIn(values, v)]),
  )
  pbf.writeVarintField(3, feature.type)
  pbf.writePackedVarint(4, feature.geometry)
}
const zigzag = (n) => (n << 1) ^ (n >> 31)
const asArrayBuffer = (bytes) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

describe('decodePlaces', () => {
  const z = 12
  const x = 2158
  const y = 1401
  // The middle of that tile, as longitude and latitude.
  const lng = ((x + 0.5) / 2 ** z) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / 2 ** z))) * 180) / Math.PI

  it('reads the points of the places layer, longitude and latitude the right way round', () => {
    const data = vectorTile([
      {
        name: 'places',
        features: [
          {
            type: 1,
            properties: { kind: 'locality', kind_detail: 'town', name: 'Mitte', population: 14802 },
            geometry: [9, zigzag(2048), zigzag(2048)],
          },
          // A line in the same layer is no place.
          {
            type: 2,
            properties: { name: 'Weg' },
            geometry: [9, zigzag(0), zigzag(0), 10, zigzag(100), zigzag(100)],
          },
        ],
      },
      {
        name: 'roads',
        features: [{ type: 1, properties: { name: 'Straße' }, geometry: [9, 2, 2] }],
      },
    ])

    const places = decodePlaces(asArrayBuffer(data), x, y, z)

    expect(places).toHaveLength(1)
    expect(places[0].lat).toBeCloseTo(lat, 6)
    expect(places[0].lng).toBeCloseTo(lng, 6)
    expect(places[0].properties).toEqual({
      kind: 'locality',
      kind_detail: 'town',
      name: 'Mitte',
      population: 14802,
    })
  })

  it('has no places in a tile without the places layer', () => {
    const data = vectorTile([
      { name: 'water', features: [{ type: 1, properties: { name: 'See' }, geometry: [9, 2, 2] }] },
    ])

    expect(decodePlaces(asArrayBuffer(data), x, y, z)).toEqual([])
  })
})

describe('placeNameAt', () => {
  describe('the measured points', () => {
    it('names Künzelsau by itself: its quarter does not count in a town, and no bigger town is near', async () => {
      const point = { lat: 49.2803765, lng: 9.6901512 }
      const found = await nameAt(point, {
        fine: [
          town(49.280376, 9.690156, 'Künzelsau', 14802),
          village(49.285807, 9.703653, 'Garnberg'),
          quarter(49.276555, 9.671853, 'Taläcker'),
          node(49.287655, 9.692409, 'locality', 'locality', 'Buchs', { population: 1000 }),
        ],
        towns: [
          HEILBRONN,
          OEHRINGEN,
          KUENZELSAU,
          town(49.112422, 9.737148, 'Schwäbisch Hall', 36660),
        ],
      })

      expect(found).toEqual({ place: 'Künzelsau', context: null })
    })

    it('names Böckingen with the city it lies in', async () => {
      const found = await nameAt(
        { lat: 49.133695, lng: 9.1932571 },
        {
          fine: [
            city(49.142288, 9.218645, 'Heilbronn', 131653, { 'name:de': 'Heilbronn' }),
            suburb(49.133697, 9.193261, 'Böckingen', { population: 21000 }),
            node(49.132841, 9.189978, 'neighbourhood', 'neighbourhood', 'Alt-Böckingen', {
              population: 0,
            }),
          ],
          towns: [HEILBRONN],
        },
      )

      expect(found).toEqual({ place: 'Böckingen', context: 'Heilbronn' })
    })

    // 1.6 km from the city's node, and the nearer field name must not win against the city.
    it('names a point in Würzburg after the city, not after the nearer field name', async () => {
      const found = await nameAt(
        { lat: 49.79137, lng: 9.95348 },
        {
          fine: [
            city(49.793372, 9.930975, 'Würzburg', 124700, { 'name:de': 'Würzburg' }),
            node(49.794231, 9.933808, 'locality', 'locality', 'Kapitelshöfe', { population: 1000 }),
            suburb(49.78682, 9.946961, 'Frauenland'),
          ],
          towns: [city(49.793344, 9.930954, 'Würzburg', 124700, { 'name:de': 'Würzburg' })],
        },
      )

      expect(found).toEqual({ place: 'Frauenland', context: 'Würzburg' })
    })

    it('names a field after the nearest village, not the nearer farm, and a bigger town for orientation', async () => {
      const found = await nameAt(
        { lat: 49.24513, lng: 9.61998 },
        {
          fine: [
            town(49.204995, 9.581323, 'Neuenstein', 6394),
            village(49.239527, 9.600377, 'Kirchensall'),
            node(49.247148, 9.614496, 'locality', 'isolated_dwelling', 'Eulhof', {
              population: 100,
            }),
          ],
          towns: [HEILBRONN, OEHRINGEN, KUENZELSAU, town(49.205037, 9.58128, 'Neuenstein', 6394)],
        },
      )

      expect(found).toEqual({ place: 'Kirchensall', context: 'Künzelsau' })
    })

    it('names Pfedelbach with Öhringen next to it', async () => {
      const found = await nameAt(
        { lat: 49.1792, lng: 9.5031 },
        {
          fine: [
            town(49.200509, 9.502444, 'Öhringen', 22777),
            village(49.160954, 9.500341, 'Heuberg'),
            village(49.175966, 9.505234, 'Pfedelbach', 8904),
          ],
          towns: [HEILBRONN, OEHRINGEN],
        },
      )

      expect(found).toEqual({ place: 'Pfedelbach', context: 'Öhringen' })
    })

    it('names Amrichshausen with Künzelsau', async () => {
      const found = await nameAt(
        { lat: 49.28253, lng: 9.74095 },
        {
          fine: [
            town(49.280376, 9.690156, 'Künzelsau', 14802),
            village(49.274511, 9.726248, 'Morsbach'),
            village(49.282532, 9.740946, 'Amrichshausen'),
          ],
          towns: [town(49.112422, 9.737148, 'Schwäbisch Hall', 36660), OEHRINGEN, KUENZELSAU],
        },
      )

      expect(found).toEqual({ place: 'Amrichshausen', context: 'Künzelsau' })
    })

    // The city's node is 6.8 km away and only in the coarser tile; the nearest named place in
    // the fine one is a park.
    it('names Moosach with München', async () => {
      const found = await nameAt(
        { lat: 48.18, lng: 11.51 },
        {
          fine: [
            node(48.15817, 11.501398, 'locality', 'locality', 'Großes Parterre', {
              population: 1000,
            }),
            suburb(48.180367, 11.510389, 'Moosach'),
          ],
          towns: [MUENCHEN],
        },
      )

      expect(found).toEqual({ place: 'Moosach', context: 'München' })
    })

    // Inside München's reach too, but in its own town; the smaller Planegg next to it is no help.
    it('names Gräfelfing by itself with München for orientation', async () => {
      const found = await nameAt(
        { lat: 48.1212042, lng: 11.4299784 },
        {
          fine: [
            town(48.121199, 11.429987, 'Gräfelfing', 13058, { 'name:de': 'Gräfelfing' }),
            town(48.103749, 11.422005, 'Planegg', 10459, { 'name:de': 'Planegg' }),
          ],
          towns: [
            MUENCHEN,
            town(48.121184, 11.429901, 'Gräfelfing', 13058, { 'name:de': 'Gräfelfing' }),
          ],
        },
      )

      expect(found).toEqual({ place: 'Gräfelfing', context: 'München' })
    })

    it('names a district of Prague by its own name and the city in the wallet language', async () => {
      const lists = {
        fine: [
          city(50.087465, 14.421251, 'Praha', 1275406, { 'name:de': 'Prag', 'name:en': 'Prague' }),
          suburb(50.073819, 14.451935, 'Vinohrady', { 'name:de': 'Weinberge' }),
        ],
        towns: [
          city(50.087437, 14.421272, 'Praha', 1275406, { 'name:de': 'Prag', 'name:en': 'Prague' }),
        ],
      }
      const point = { lat: 50.0738138, lng: 14.4519428 }

      expect(await nameAt(point, lists, 'de')).toEqual({ place: 'Vinohrady', context: 'Prag' })
      expect(await nameAt(point, lists, 'en')).toEqual({ place: 'Vinohrady', context: 'Prague' })
      // No reading in the wallet's language: English, and without that the country's own name.
      expect(await nameAt(point, lists, 'nl')).toEqual({ place: 'Vinohrady', context: 'Prague' })
      lists.fine[0].properties['name:en'] = undefined
      lists.towns[0].properties['name:en'] = undefined
      expect(await nameAt(point, lists, 'nl')).toEqual({ place: 'Vinohrady', context: 'Praha' })
    })

    it('names a district in Greek script as it is written where the tile has no other reading', async () => {
      const athens = { 'name:de': 'Athen', 'name:en': 'Athens', script: 'Greek' }
      const found = await nameAt(
        { lat: 37.9867045, lng: 23.7348729 },
        {
          fine: [
            city(37.975564, 23.734825, 'Αθήνα', 3090508, athens),
            quarter(37.98671, 23.734868, 'Εξάρχεια', { script: 'Greek' }),
          ],
          towns: [city(37.975598, 23.73476, 'Αθήνα', 3090508, athens)],
        },
      )

      expect(found).toEqual({ place: 'Εξάρχεια', context: 'Athen' })
    })

    it('names a district in Cyrillic script by its reading in the wallet language', async () => {
      const moscow = { 'name:de': 'Moskau', 'name:en': 'Moscow', script: 'Cyrillic' }
      const found = await nameAt(
        { lat: 55.752, lng: 37.5925 },
        {
          fine: [
            city(55.750545, 37.617488, 'Москва', 13274285, moscow),
            suburb(55.751197, 37.589872, 'Арбат', {
              'name:de': 'Arbat',
              'name:en': 'Arbat',
              script: 'Cyrillic',
            }),
          ],
          towns: [city(55.750497, 37.617531, 'Москва', 13274285, moscow)],
        },
      )

      expect(found).toEqual({ place: 'Arbat', context: 'Moskau' })
    })

    it('names a city without a district near by itself: a neighbourhood is too fine, and a city gets no bigger one', async () => {
      const found = await nameAt(
        { lat: 49.1423025, lng: 9.2186451 },
        {
          fine: [
            city(49.142288, 9.218645, 'Heilbronn', 131653, { 'name:de': 'Heilbronn' }),
            node(49.135522, 9.212208, 'neighbourhood', 'neighbourhood', 'Rosenberg', {
              population: 0,
            }),
          ],
          // Stuttgart would reach Heilbronn (44 km for its population, 40 km away).
          towns: [
            HEILBRONN,
            city(48.778422, 9.180021, 'Stuttgart', 613392, { 'name:de': 'Stuttgart' }),
          ],
        },
      )

      expect(found).toEqual({ place: 'Heilbronn', context: null })
    })

    it('names a town without its old town quarter', async () => {
      const found = await nameAt(
        { lat: 49.490765, lng: 9.7731971 },
        {
          fine: [
            town(49.490793, 9.773176, 'Bad Mergentheim', 22446),
            node(49.490737, 9.771159, 'neighbourhood', 'neighbourhood', 'Altstadt', {
              population: 0,
            }),
            quarter(49.49, 9.775, 'Neues Viertel'),
          ],
          towns: [
            city(49.793344, 9.930954, 'Würzburg', 124700),
            town(49.490765, 9.773197, 'Bad Mergentheim', 22446),
          ],
        },
      )

      expect(found).toEqual({ place: 'Bad Mergentheim', context: null })
    })

    // Inside München's disc (15 km of its 17.7), but with no district of the city near: the
    // point is in the fields around Ismaning, and München is the bigger place nearby.
    it("names a field in a big city's reach after the nearest village, and the city for orientation", async () => {
      const found = await nameAt(
        { lat: 48.24, lng: 11.71 },
        {
          fine: [
            town(48.224244, 11.671536, 'Ismaning', 15221, { 'name:de': 'Ismaning' }),
            village(48.251855, 11.695182, 'Fischerhäuser'),
          ],
          towns: [
            MUENCHEN,
            town(48.40083, 11.744041, 'Freising', 45857, { 'name:en': 'Freising' }),
            town(48.224215, 11.6716, 'Ismaning', 15221, { 'name:de': 'Ismaning' }),
          ],
        },
      )

      expect(found).toEqual({ place: 'Fischerhäuser', context: 'München' })
    })

    // The tile gives Neu-Isenburg the stand-in population of 10,000, so its disc is small and
    // Frankfurt's would cover the town - but no district of Frankfurt is near.
    it('names Neu-Isenburg by itself with Frankfurt for orientation', async () => {
      const found = await nameAt(
        { lat: 50.045, lng: 8.6975 },
        {
          fine: [town(50.055251, 8.695743, 'Neu-Isenburg', 10000)],
          towns: [
            city(50.110671, 8.682117, 'Frankfurt am Main', 701350, {
              'name:de': 'Frankfurt am Main',
              'name:en': 'Frankfurt',
            }),
            city(50.105497, 8.761082, 'Offenbach am Main', 136824, {
              'name:de': 'Offenbach am Main',
            }),
            town(50.055265, 8.695679, 'Neu-Isenburg', 10000),
          ],
        },
      )

      expect(found).toEqual({ place: 'Neu-Isenburg', context: 'Frankfurt am Main' })
    })

    // Langenburg is only in the coarser tile here, and nearer than the village in the fine one.
    it('takes the nearest place from both tiles', async () => {
      const found = await nameAt(
        { lat: 49.26951, lng: 9.86207 },
        {
          fine: [village(49.298822, 9.828343, 'Eberbach')],
          towns: [
            town(49.112422, 9.737148, 'Schwäbisch Hall', 36660),
            town(49.136575, 10.07206, 'Crailsheim', 33000),
            town(49.253241, 9.847698, 'Langenburg', 1723),
          ],
        },
      )

      expect(found).toEqual({ place: 'Langenburg', context: null })
    })
  })

  describe('the rule at its edges', () => {
    // Offsets from a point, in km to the north and east - near enough to flat for these distances.
    const at = (point, north, east) => ({
      lat: point.lat + north / 111.195,
      lng: point.lng + east / (111.195 * Math.cos((point.lat * Math.PI) / 180)),
    })
    const P = { lat: 49.2, lng: 9.6 }
    const place = (offset, make) => make(offset.lat, offset.lng)

    it('asks the two tiles the point lies in, and the wider one only when the fine one has no village', async () => {
      const { archive, decode } = tiles({
        fine: [place(at(P, 1, 0), (a, b) => village(a, b, 'Nah'))],
      })

      await placeNameAt(archive, P.lat, P.lng, 'de', decode)

      const fine = tileXY(P.lat, P.lng, FINE)
      const towns = tileXY(P.lat, P.lng, TOWNS)
      expect(archive.getZxy.mock.calls).toEqual([
        [FINE, fine.x, fine.y],
        [TOWNS, towns.x, towns.y],
      ])
      expect(decode).toHaveBeenCalledWith({ z: FINE, x: fine.x, y: fine.y }, fine.x, fine.y, FINE)
    })

    it('takes a village from the wider tile when the fine one has none within 5 km', async () => {
      const { archive, decode } = tiles({
        fine: [place(at(P, 6, 0), (a, b) => village(a, b, 'Fern'))],
        wider: [place(at(P, 0, 4), (a, b) => village(a, b, 'Weiter'))],
      })

      const found = await placeNameAt(archive, P.lat, P.lng, 'de', decode)

      const wider = tileXY(P.lat, P.lng, WIDER)
      expect(archive.getZxy).toHaveBeenCalledWith(WIDER, wider.x, wider.y)
      expect(found).toEqual({ place: 'Weiter', context: null })
    })

    it('takes a hamlet only when no village is within 5 km in either tile', async () => {
      const hamlet = place(at(P, 0.5, 0), (a, b) =>
        node(a, b, 'locality', 'hamlet', 'Weiler', { population: 100 }),
      )

      expect(await nameAt(P, { fine: [hamlet] })).toEqual({ place: 'Weiler', context: null })
      expect(
        await nameAt(P, {
          fine: [hamlet],
          wider: [place(at(P, 4.5, 0), (a, b) => village(a, b, 'Dorf'))],
        }),
      ).toEqual({ place: 'Dorf', context: null })
    })

    it('has no name where nothing is within 5 km', async () => {
      const far = place(at(P, 5.5, 0), (a, b) => village(a, b, 'Fern'))

      expect(await nameAt(P, { fine: [far], wider: [far] })).toBeNull()
      expect(await nameAt(P, {})).toBeNull()
    })

    it('has no name where the file has no tile there', async () => {
      const archive = { getZxy: vi.fn(async () => undefined) }

      expect(await placeNameAt(archive, P.lat, P.lng, 'de', vi.fn())).toBeNull()
    })

    it('leaves a place without a name out', async () => {
      const unnamed = place(at(P, 0.2, 0), (a, b) => village(a, b, undefined))
      const named = place(at(P, 1, 0), (a, b) => village(a, b, 'Benannt'))

      expect(await nameAt(P, { fine: [unnamed, named] })).toEqual({
        place: 'Benannt',
        context: null,
      })
    })

    it('names a district only within 1 km of it', async () => {
      const bigCity = place(at(P, 3, 0), (a, b) => city(a, b, 'Großstadt', 500000))

      expect(
        await nameAt(P, {
          fine: [place(at(P, 0, 0.9), (a, b) => suburb(a, b, 'Nahviertel'))],
          towns: [bigCity],
        }),
      ).toEqual({ place: 'Nahviertel', context: 'Großstadt' })
      expect(
        await nameAt(P, {
          fine: [place(at(P, 0, 1.1), (a, b) => suburb(a, b, 'Fernviertel'))],
          towns: [bigCity],
        }),
      ).toEqual({ place: 'Großstadt', context: null })
    })

    it('puts the point in the place it is relatively nearest to where two reach it', async () => {
      // A town of 13,000 reaches 1.66 km, one of 60,000 3.57 km.
      const bigTown = place(at(P, 0, 3), (a, b) => town(a, b, 'Mittelstadt', 60000))

      expect(
        await nameAt(P, {
          fine: [place(at(P, 0, -0.5), (a, b) => town(a, b, 'Vorort', 13000))],
          towns: [bigTown],
        }),
      ).toEqual({ place: 'Vorort', context: 'Mittelstadt' })
      expect(
        await nameAt(P, {
          fine: [place(at(P, 0, -1.6), (a, b) => town(a, b, 'Vorort', 13000))],
          towns: [bigTown],
        }),
      ).toEqual({ place: 'Mittelstadt', context: null })
    })

    // 13,000 people reach 1.66 km at 1,500 per km². Inside that the town names the point, just
    // outside it the nearer village does - though the town would still be relatively nearer
    // (1.7 of 1.66 km against 1.0 of the village's 0.65 km).
    it('puts the point in a town as far as its reach goes, and no farther', async () => {
      const nearby = place(at(P, 1, 0), (a, b) => village(a, b, 'Dorf'))
      const inside = place(at(P, 0, 1.6), (a, b) => town(a, b, 'Stadt', 13000))
      const outside = place(at(P, 0, 1.7), (a, b) => town(a, b, 'Stadt', 13000))

      expect(await nameAt(P, { fine: [nearby, inside], towns: [inside] })).toEqual({
        place: 'Stadt',
        context: null,
      })
      expect(await nameAt(P, { fine: [nearby, outside], towns: [outside] })).toEqual({
        place: 'Dorf',
        context: 'Stadt',
      })
    })

    it('names a bigger town for orientation only as far as its reach goes', async () => {
      const village12 = place(at(P, 0, 0), (a, b) => village(a, b, 'Dorf'))
      // 14,802 people reach 6.86 km at 100 per km².
      const near = place(at(P, 0, 6.8), (a, b) => town(a, b, 'Stadt', 14802))
      const far = place(at(P, 0, 6.95), (a, b) => town(a, b, 'Stadt', 14802))

      expect(await nameAt(P, { fine: [village12], towns: [near] })).toEqual({
        place: 'Dorf',
        context: 'Stadt',
      })
      expect(await nameAt(P, { fine: [village12], towns: [far] })).toEqual({
        place: 'Dorf',
        context: null,
      })
    })

    it('names only a bigger place for orientation, and the relatively nearest of them', async () => {
      const home = place(at(P, 0, 0), (a, b) => town(a, b, 'Heimat', 9000))
      const smaller = place(at(P, 0, 1), (a, b) => town(a, b, 'Kleiner', 8000))
      const same = place(at(P, 0, 1), (a, b) => town(a, b, 'Gleich', 9000))
      const bigTown = place(at(P, 0, 7), (a, b) => town(a, b, 'Mittel', 20000))
      const bigCity = place(at(P, 0, 25), (a, b) => city(a, b, 'Groß', 600000))

      expect(await nameAt(P, { fine: [home, smaller, same] })).toEqual({
        place: 'Heimat',
        context: null,
      })
      // Mittel: 7 of its 7.98 km, Groß: 25 of its 43.7 km.
      expect(await nameAt(P, { fine: [home], towns: [bigCity, bigTown] })).toEqual({
        place: 'Heimat',
        context: 'Groß',
      })
    })

    it('rejects when the file cannot be read, so the caller can open it again', async () => {
      const archive = {
        getZxy: vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
      }

      await expect(placeNameAt(archive, P.lat, P.lng, 'de', vi.fn())).rejects.toThrow(
        'Failed to fetch',
      )
    })
  })
})
