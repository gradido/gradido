// AI-GENERATED — not an architecture reference
// @vitest-environment node
// Node's fetch classes here: jsdom's Headers drops the Range header the archive reads with.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PMTiles, zxyToTileId } from 'pmtiles'
import { archiveFor } from './mapTiles'

// A PMTiles file of one tile, written in the test and served by a fetch that honours the
// Range header - so the archive the wallet opens reads it the way it reads the real planet
// file: header and root directory, a leaf directory, then the tile.
const Z = 12
const X = 2158
const Y = 1401
const TILE = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])

function varints(values) {
  const bytes = []
  for (let value of values) {
    while (value >= 0x80) {
      bytes.push((value & 0x7f) | 0x80)
      value = Math.floor(value / 128)
    }
    bytes.push(value)
  }
  return bytes
}
function directory(entries) {
  let lastId = 0
  const ids = entries.map((entry) => {
    const delta = entry.tileId - lastId
    lastId = entry.tileId
    return delta
  })
  return Uint8Array.from([
    ...varints([entries.length]),
    ...varints(ids),
    ...varints(entries.map((entry) => entry.runLength)),
    ...varints(entries.map((entry) => entry.length)),
    ...varints(entries.map((entry) => entry.offset + 1)),
  ])
}
function pmtilesFile() {
  const leaf = directory([
    { tileId: zxyToTileId(Z, X, Y), runLength: 1, length: TILE.length, offset: 0 },
  ])
  const root = directory([{ tileId: 0, runLength: 0, length: leaf.length, offset: 0 }])
  const rootOffset = 127
  const leafOffset = rootOffset + root.length
  const tileOffset = leafOffset + leaf.length
  const file = new Uint8Array(tileOffset + TILE.length)
  const view = new DataView(file.buffer)
  const uint64 = (offset, value) => view.setUint32(offset, value, true)
  file.set(
    [...'PMTiles'].map((c) => c.charCodeAt(0)),
    0,
  )
  view.setUint8(7, 3)
  uint64(8, rootOffset)
  uint64(16, root.length)
  uint64(24, file.length)
  uint64(40, leafOffset)
  uint64(48, leaf.length)
  uint64(56, tileOffset)
  uint64(64, TILE.length)
  uint64(72, 1)
  uint64(80, 1)
  uint64(88, 1)
  view.setUint8(96, 1) // clustered
  view.setUint8(97, 1) // directories uncompressed
  view.setUint8(98, 1) // tiles uncompressed
  view.setUint8(99, 1) // vector tiles
  view.setUint8(101, 14) // max zoom
  file.set(root, rootOffset)
  file.set(leaf, leafOffset)
  file.set(TILE, tileOffset)
  return file
}
const FILE = pmtilesFile()

// Answers each request from the file; `plan` holds what the first requests do instead.
function serveFile(plan = []) {
  const fetchMock = vi.fn(async (url, { headers }) => {
    const step = plan.shift()
    if (step === 'fail') throw new TypeError('Failed to fetch')
    if (step === 'hang') return new Promise(() => {})
    const [, from, to] = headers.get('range').match(/bytes=(\d+)-(\d+)/)
    const body = FILE.slice(Number(from), Math.min(Number(to) + 1, FILE.length))
    return new Response(body, {
      status: 206,
      headers: {
        'Content-Length': String(body.length),
        'Content-Range': `bytes ${from}-${Number(from) + body.length - 1}/${FILE.length}`,
        ETag: '"file"',
      },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Every test opens its own URL: the archives are kept per URL for the whole module.
let opened = 0
const freshUrl = () => `https://maptiles.example/test-${++opened}.pmtiles`

describe('archiveFor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens one archive per file and keeps it', () => {
    const url = freshUrl()
    const first = archiveFor(url)

    expect(first).toBeInstanceOf(PMTiles)
    expect(archiveFor(url)).toBe(first)
    expect(archiveFor(freshUrl())).not.toBe(first)
  })

  it('reads a tile, and a second time without the header and directories again', async () => {
    const fetchMock = serveFile()
    const archive = archiveFor(freshUrl())

    const tile = await archive.getZxy(Z, X, Y)
    expect(new Uint8Array(tile.data)).toEqual(TILE)
    const firstReads = fetchMock.mock.calls.length

    await archive.getZxy(Z, X, Y)
    expect(firstReads).toBe(3)
    expect(fetchMock.mock.calls.length - firstReads).toBe(1)
  })

  it('asks again after a failed read of the file, instead of keeping the failure', async () => {
    const fetchMock = serveFile(['fail'])
    const archive = archiveFor(freshUrl())

    await expect(archive.getZxy(Z, X, Y)).rejects.toThrow('Failed to fetch')
    const tile = await archive.getZxy(Z, X, Y)

    expect(new Uint8Array(tile.data)).toEqual(TILE)
    expect(fetchMock.mock.calls.length).toBe(4)
  })

  it('asks again while an earlier read of the file hangs, instead of waiting on it', async () => {
    const fetchMock = serveFile(['hang'])
    const archive = archiveFor(freshUrl())

    archive.getZxy(Z, X, Y)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const tile = await archive.getZxy(Z, X, Y)

    expect(new Uint8Array(tile.data)).toEqual(TILE)
  })
})
