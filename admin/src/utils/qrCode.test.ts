// AI-GENERATED — not an architecture reference

import { beforeEach, describe, expect, it, mock } from 'bun:test'

const qrcanvas = mock((_options: unknown) => ({ width: 360 }))
mock.module('qrcanvas', () => ({ qrcanvas }))

// after the mock: the file takes qrcanvas as it is loaded
const { COIN_IMAGE_PATH, qrCodeOptions, renderQrCodeCanvas } = await import('./qrCode')

describe('qrCodeOptions', () => {
  // The wallet's FigureQrCode.spec.js asserts the same object. The two together are what keeps the
  // code in the modal and the code on the printed cheque from becoming two codes.
  it('carries the settings both call sites depend on', () => {
    const coin = { src: COIN_IMAGE_PATH } as HTMLImageElement
    expect(qrCodeOptions('https://example.com', coin)).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
      logo: { image: coin },
    })
  })
})

describe('renderQrCodeCanvas', () => {
  let mockImage: { src: string; onload: (() => void) | null; onerror: (() => void) | null }

  beforeEach(() => {
    qrcanvas.mockClear()
    mockImage = { src: '', onload: null, onerror: null }
    // no browser here: the picture is the test's own, and loads when the test says so
    Object.assign(globalThis, { Image: mock(() => mockImage) })
  })

  it('draws the code with the coin the wallet serves', async () => {
    const pending = renderQrCodeCanvas('https://example.com/redeem/CL-1a2345678')
    expect(mockImage.src).toBe('/img/gdd-coin.png')
    mockImage.onload?.()

    expect<unknown>(await pending).toEqual({ width: 360 })
    expect(qrcanvas).toHaveBeenCalledWith({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com/redeem/CL-1a2345678',
      logo: { image: mockImage },
    })
  })

  it('rejects when the picture cannot be loaded', async () => {
    const pending = renderQrCodeCanvas('https://example.com/redeem/CL-1a2345678')
    mockImage.onerror?.()

    await expect(pending).rejects.toThrow('cannot load image: /img/gdd-coin.png')
    expect(qrcanvas).not.toHaveBeenCalled()
  })
})
