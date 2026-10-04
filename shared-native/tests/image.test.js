// AI-GENERATED — not an architecture reference
const { describe, it } = require('node:test')
const { strict } = require('node:assert')
const assert = strict
const zlib = require('node:zlib')
const { probeImage, reencodeImage } = require('../')
// jpeg: the 16 x 8 picture from rust-image-ffi's tests/c/fixture.h
// transparentPng: 4 x 2 RGBA, every pixel fully transparent
const fixture = require('./image.fixture.json')

const jpeg = Buffer.from(fixture.jpeg.base64, 'base64')
const transparentPng = Buffer.from(fixture.transparentPng.base64, 'base64')
const payload = Buffer.from("<script>alert('rimg')</script>")
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const BUDGET = 64 * 1024

// start marker, a comment segment with the payload, the rest of the picture, the payload once
// more behind the end marker
function jpegWithPayload() {
  const comment = Buffer.from([0xff, 0xfe, (payload.length + 2) >> 8, (payload.length + 2) & 0xff])
  return Buffer.concat([jpeg.subarray(0, 2), comment, payload, jpeg.subarray(2), payload])
}

function isJpeg(data) {
  return (
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[data.length - 2] === 0xff &&
    data[data.length - 1] === 0xd9
  )
}

// an RGB PNG of noise, the picture that compresses worst; seeded, so every run sees the same one
function noisePng(width, height) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    return c >>> 0
  })
  const chunk = (type, data) => {
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    let crc = 0xffffffff
    for (const byte of typeAndData) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const checksum = Buffer.alloc(4)
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([length, typeAndData, checksum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bits per channel
  header[9] = 2 // RGB
  const rowBytes = 1 + width * 3
  const rows = Buffer.alloc(height * rowBytes)
  let seed = 1
  for (let i = 0; i < rows.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    // the first byte of a row is its filter: none
    rows[i] = i % rowBytes === 0 ? 0 : seed >>> 24
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(rows, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

describe('probeImage', () => {
  it('reads format and size from the header', () => {
    assert.deepEqual(probeImage(jpeg), {
      success: true,
      value: {
        format: 'jpeg',
        width: fixture.jpeg.width,
        height: fixture.jpeg.height,
        hasAlpha: false,
      },
    })
    assert.deepEqual(probeImage(transparentPng), {
      success: true,
      value: {
        format: 'png',
        width: fixture.transparentPng.width,
        height: fixture.transparentPng.height,
        hasAlpha: true,
      },
    })
  })
  it('answers RIMG_ERR_UNSUPPORTED for what is not a picture', () => {
    for (const input of [payload, new Uint8Array(0)]) {
      const result = probeImage(input)
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_UNSUPPORTED')
      assert.equal(typeof result.error.message, 'string')
    }
  })
  it('throws for an input that is not a Uint8Array', () => {
    assert.throws(() => probeImage(), /Uint8Array/)
    assert.throws(() => probeImage('not bytes'), /Uint8Array/)
  })
})

describe('reencodeImage', () => {
  describe('a picture that decodes', () => {
    it('comes back as a JPEG of the same size without what was hidden in it', async () => {
      const input = jpegWithPayload()
      assert.ok(input.includes(payload))

      const result = await reencodeImage(input, { maxOutputBytes: BUDGET })

      assert.equal(result.success, true)
      const { data, ...info } = result.value
      assert.deepEqual(info, {
        inputFormat: 'jpeg',
        width: fixture.jpeg.width,
        height: fixture.jpeg.height,
        hasAlpha: false,
      })
      assert.ok(Buffer.isBuffer(data))
      assert.ok(data.length <= BUDGET)
      assert.ok(isJpeg(data))
      assert.equal(data.includes(payload), false)
    })
    it('accepts a plain Uint8Array', async () => {
      const result = await reencodeImage(new Uint8Array(jpeg), { maxOutputBytes: BUDGET })
      assert.equal(result.success, true)
      assert.ok(isJpeg(result.value.data))
    })
    it('is not affected by the input changing while it runs', async () => {
      const input = Buffer.from(jpeg)
      const pending = reencodeImage(input, { maxOutputBytes: BUDGET })
      input.fill(0)
      const result = await pending
      assert.equal(result.success, true)
    })
    it('runs several at once', async () => {
      const results = await Promise.all(
        Array.from({ length: 16 }, () => reencodeImage(jpeg, { maxOutputBytes: BUDGET })),
      )
      for (const result of results) {
        assert.equal(result.success, true)
        assert.deepEqual(result.value.data, results[0].value.data)
      }
    })
    it('takes the budget as a limit, not as memory to reserve', async () => {
      // 16 calls with 4 GiB each would not come back if the budget were allocated
      const results = await Promise.all(
        Array.from({ length: 16 }, () => reencodeImage(jpeg, { maxOutputBytes: 2 ** 32 - 1 })),
      )
      for (const result of results) {
        assert.equal(result.success, true)
      }
    })
    it('still fits a picture that encodes larger than its size suggests', async () => {
      const width = 256
      const height = 256
      const result = await reencodeImage(noisePng(width, height), {
        maxOutputBytes: 1024 * 1024,
        inputFormats: ['png'],
        jpegQuality: 100,
      })
      assert.equal(result.success, true)
      // over the binding's estimate of 4 bytes per pixel plus 1024, so this took the second pass
      assert.ok(result.value.data.length > width * height * 4 + 1024)
      assert.ok(isJpeg(result.value.data))
    })
    it('encodes smaller at a lower jpegQuality', async () => {
      const high = await reencodeImage(jpeg, { maxOutputBytes: BUDGET, jpegQuality: 100 })
      const low = await reencodeImage(jpeg, { maxOutputBytes: BUDGET, jpegQuality: 10 })
      assert.ok(low.value.data.length < high.value.data.length)
    })
    it('encodes as PNG when asked to', async () => {
      const result = await reencodeImage(jpeg, { maxOutputBytes: BUDGET, outputFormat: 'png' })
      assert.equal(result.success, true)
      assert.deepEqual(result.value.data.subarray(0, 8), PNG_SIGNATURE)
      assert.equal(result.value.inputFormat, 'jpeg')
    })
  })

  describe('formats', () => {
    it('refuses a PNG by default', async () => {
      const result = await reencodeImage(transparentPng, { maxOutputBytes: BUDGET })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_UNSUPPORTED')
    })
    it('takes a PNG when inputFormats allows it', async () => {
      const result = await reencodeImage(transparentPng, {
        maxOutputBytes: BUDGET,
        inputFormats: ['jpeg', 'png'],
      })
      assert.equal(result.success, true)
      const { data, ...info } = result.value
      assert.deepEqual(info, {
        inputFormat: 'png',
        width: fixture.transparentPng.width,
        height: fixture.transparentPng.height,
        hasAlpha: true,
      })
      assert.ok(isJpeg(data))
    })
    it('refuses a JPEG when inputFormats leaves it out', async () => {
      const result = await reencodeImage(jpeg, { maxOutputBytes: BUDGET, inputFormats: ['png'] })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_UNSUPPORTED')
    })
    it('lays transparent pixels over the background', async () => {
      const options = { maxOutputBytes: BUDGET, inputFormats: ['png'] }
      const white = await reencodeImage(transparentPng, options)
      const explicitWhite = await reencodeImage(transparentPng, {
        ...options,
        background: [255, 255, 255],
      })
      const red = await reencodeImage(transparentPng, { ...options, background: [255, 0, 0] })
      assert.deepEqual(explicitWhite.value.data, white.value.data)
      assert.notDeepEqual(red.value.data, white.value.data)
    })
  })

  describe('a picture that is refused', () => {
    it('answers RIMG_ERR_BUFFER_TOO_SMALL with the bytes needed when over budget', async () => {
      const fitting = await reencodeImage(jpeg, { maxOutputBytes: BUDGET })
      const requiredBytes = fitting.value.data.length

      const result = await reencodeImage(jpeg, { maxOutputBytes: requiredBytes - 1 })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_BUFFER_TOO_SMALL')
      assert.equal(result.error.requiredBytes, requiredBytes)
      assert.equal(typeof result.error.message, 'string')

      const exact = await reencodeImage(jpeg, { maxOutputBytes: requiredBytes })
      assert.equal(exact.success, true)
    })
    it('answers RIMG_ERR_UNSUPPORTED for what is not a picture', async () => {
      const result = await reencodeImage(payload, { maxOutputBytes: BUDGET })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_UNSUPPORTED')
      assert.equal(result.error.requiredBytes, undefined)
    })
    it('answers RIMG_ERR_UNSUPPORTED for no bytes at all', async () => {
      const result = await reencodeImage(new Uint8Array(0), { maxOutputBytes: BUDGET })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_UNSUPPORTED')
    })
    it('answers RIMG_ERR_DECODE for a truncated picture', async () => {
      const result = await reencodeImage(jpeg.subarray(0, jpeg.length / 2), {
        maxOutputBytes: BUDGET,
      })
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'RIMG_ERR_DECODE')
    })
    it('answers RIMG_ERR_LIMIT for a picture over maxWidth, maxHeight or maxPixels', async () => {
      const { width, height } = fixture.jpeg
      const limits = [
        { maxWidth: width - 1 },
        { maxHeight: height - 1 },
        { maxPixels: width * height - 1 },
      ]
      for (const limit of limits) {
        const result = await reencodeImage(jpeg, { maxOutputBytes: BUDGET, ...limit })
        assert.equal(result.success, false, JSON.stringify(limit))
        assert.equal(result.error.name, 'RIMG_ERR_LIMIT')
      }
      const atTheLimit = await reencodeImage(jpeg, {
        maxOutputBytes: BUDGET,
        maxWidth: width,
        maxHeight: height,
        maxPixels: width * height,
      })
      assert.equal(atTheLimit.success, true)
    })
  })

  describe('wrong arguments throw', () => {
    it('without options or without a byte budget', () => {
      assert.throws(() => reencodeImage(jpeg), TypeError)
      assert.throws(() => reencodeImage(jpeg, {}), /maxOutputBytes/)
      assert.throws(() => reencodeImage(jpeg, { maxOutputBytes: 0 }), /maxOutputBytes/)
      assert.throws(() => reencodeImage(jpeg, { maxOutputBytes: 1.5 }), /maxOutputBytes/)
    })
    it('for an input that is not a Uint8Array', () => {
      assert.throws(() => reencodeImage('not bytes', { maxOutputBytes: BUDGET }), /Uint8Array/)
      assert.throws(() => reencodeImage(jpeg.buffer, { maxOutputBytes: BUDGET }), /Uint8Array/)
    })
    it('for an option it does not know', () => {
      assert.throws(
        () => reencodeImage(jpeg, { maxOutputBytes: BUDGET, maxWidht: 100 }),
        /Unknown option: maxWidht/,
      )
    })
    it('for an option of the wrong type or out of range', () => {
      const wrong = [
        { jpegQuality: 0 },
        { jpegQuality: 101 },
        { maxWidth: -1 },
        { maxHeight: '100' },
        { maxPixels: Number.NaN },
        { maxAllocBytes: 2 ** 60 },
        { applyOrientation: 1 },
        { inputFormats: [] },
        { inputFormats: ['gif'] },
        { inputFormats: 'jpeg' },
        { outputFormat: 'webp' },
        { background: [255, 255] },
        { background: [255, 255, 256] },
      ]
      for (const option of wrong) {
        assert.throws(
          () => reencodeImage(jpeg, { maxOutputBytes: BUDGET, ...option }),
          new RegExp(`options\\.${Object.keys(option)[0]}`),
          JSON.stringify(option),
        )
      }
    })
  })
})
