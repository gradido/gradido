// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { qrcanvas } from 'qrcanvas'
import { COIN_IMAGE_PATH, qrCodeOptions, renderQrCodeCanvas } from './qrCode'

vi.mock('qrcanvas', () => ({ qrcanvas: vi.fn(() => ({ width: 360 })) }))

describe('qrCodeOptions', () => {
  // FigureQrCode.spec.js asserts the same object. The two together are what keeps the
  // code in the modal and the code on the printed cheque from becoming two codes.
  it('carries the settings both call sites depend on', () => {
    const coin = { src: COIN_IMAGE_PATH }
    expect(qrCodeOptions('https://example.com', coin)).toEqual({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com',
      logo: { image: coin },
    })
  })
})

describe('renderQrCodeCanvas', () => {
  let mockImage

  beforeEach(() => {
    vi.clearAllMocks()
    mockImage = { src: '', onload: null, onerror: null }
    global.Image = vi.fn(() => mockImage)
  })

  it('draws the code with the coin the wallet serves', async () => {
    const pending = renderQrCodeCanvas('https://example.com/redeem/CL-1a2345678')
    expect(mockImage.src).toBe('/img/gdd-coin.png')
    mockImage.onload()

    await expect(pending).resolves.toEqual({ width: 360 })
    expect(qrcanvas).toHaveBeenCalledWith({
      cellSize: 8,
      correctLevel: 'H',
      data: 'https://example.com/redeem/CL-1a2345678',
      logo: { image: mockImage },
    })
  })

  it('rejects when the picture cannot be loaded', async () => {
    const pending = renderQrCodeCanvas('https://example.com/redeem/CL-1a2345678')
    mockImage.onerror()

    await expect(pending).rejects.toThrow('cannot load image: /img/gdd-coin.png')
    expect(qrcanvas).not.toHaveBeenCalled()
  })
})
