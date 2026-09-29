// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { CHAT_IMAGE_FULL_MAX_PIXELS, CHAT_IMAGE_UNEDITED } from './chatImageEdit'
import {
  CHAT_IMAGE_SAVE_QUALITY,
  chatImageFile,
  chatImageFileName,
  saveChatImageFile,
} from './chatImageSave'

vi.mock('@/utils/isComputer', () => ({ isComputer: vi.fn(() => true) }))

const edit = (changes = {}) => ({ ...CHAT_IMAGE_UNEDITED, ...changes })
const PHOTO = { image: { name: 'photo' }, width: 4000, height: 3000 }

/** A canvas that only knows its size and hands its "JPEG" to toBlob, as a test says. */
const canvasThat = (blob = new Blob(['JPEG'], { type: 'image/jpeg' })) =>
  vi.fn((source, cut, width, height) => ({
    width,
    height,
    toBlob: vi.fn((callback, type, quality) => {
      canvasThat.asked = { type, quality }
      callback(blob)
    }),
  }))

describe('chatImageFileName', () => {
  it('names the file after Gradido and the member’s own day and time', () => {
    expect(chatImageFileName(new Date(2026, 8, 29, 7, 5))).toBe('Gradido-2026-09-29-07-05.jpg')
    expect(chatImageFileName(new Date(2026, 11, 1, 17, 42))).toBe('Gradido-2026-12-01-17-42.jpg')
  })
})

describe('chatImageFile', () => {
  afterEach(() => {
    canvasThat.asked = null
  })

  it('draws the cutout at its own size and writes a JPEG of high quality', async () => {
    const draw = canvasThat()
    const cut = edit({ shape: 'square', zoom: 2 })

    const file = await chatImageFile(PHOTO, cut, { draw, date: new Date(2026, 8, 29, 7, 5) })

    expect(draw).toHaveBeenCalledWith(PHOTO, cut, 1500, 1500)
    expect(canvasThat.asked).toEqual({ type: 'image/jpeg', quality: 0.92 })
    expect(CHAT_IMAGE_SAVE_QUALITY).toBe(0.92)
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('Gradido-2026-09-29-07-05.jpg')
    expect(file.type).toBe('image/jpeg')
  })

  // A 48-megapixel photo is drawn at the iPhone's bound, where Safari still draws.
  it('keeps a large picture within an iPhone’s bound', async () => {
    const draw = canvasThat()

    await chatImageFile({ ...PHOTO, width: 8000, height: 6000 }, edit(), { draw })

    const [, , width, height] = draw.mock.calls[0]
    expect(width * height).toBeLessThanOrEqual(CHAT_IMAGE_FULL_MAX_PIXELS)
    expect(width / height).toBeCloseTo(4 / 3, 2)
  })

  it('rejects where the browser writes no JPEG', async () => {
    await expect(chatImageFile(PHOTO, edit(), { draw: canvasThat(null) })).rejects.toThrow('encode')
  })
})

describe('saveChatImageFile', () => {
  const file = new File(['JPEG'], 'Gradido-2026-09-29-07-05.jpg', { type: 'image/jpeg' })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /** The browser's download: the link it is given, and what it was clicked with. */
  const downloads = () => {
    const created = vi.fn(() => 'blob:the-file')
    const revoked = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL: created, revokeObjectURL: revoked })
    const clicked = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push({ href: this.getAttribute('href'), download: this.download })
    })
    return { created, revoked, clicked }
  }

  /** A phone's share sheet that answers as a test says. */
  const sheet = (answer = async () => {}, canShare = () => true) => {
    const share = vi.fn(answer)
    vi.stubGlobal('navigator', { ...navigator, share, canShare: vi.fn(canShare) })
    return share
  }

  it('downloads the file on a computer, and lets the address go after a while', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const { created, revoked, clicked } = downloads()
    const share = sheet()

    await expect(saveChatImageFile(file, { computer: true })).resolves.toBe('downloaded')

    expect(share).not.toHaveBeenCalled()
    expect(created).toHaveBeenCalledWith(file)
    expect(clicked).toEqual([{ href: 'blob:the-file', download: 'Gradido-2026-09-29-07-05.jpg' }])
    expect(revoked).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10000)
    expect(revoked).toHaveBeenCalledWith('blob:the-file')
  })

  // On a phone the share sheet: "Bild sichern" puts it among the photos.
  it('hands the file to the share sheet on a phone', async () => {
    const { clicked } = downloads()
    const share = sheet()

    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('shared')

    expect(share).toHaveBeenCalledWith({ files: [file] })
    expect(navigator.canShare).toHaveBeenCalledWith({ files: [file] })
    expect(clicked).toEqual([])
  })

  it('takes a closed sheet as a change of mind, and downloads nothing', async () => {
    const { clicked } = downloads()
    sheet(async () => {
      throw Object.assign(new Error('closed'), { name: 'AbortError' })
    })

    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('cancelled')
    expect(clicked).toEqual([])
  })

  /**
   * Safari lets a tap open the sheet for a moment only, and making a large picture takes one: the
   * sheet refuses, and the member gets a second tap -- no download that would land among the files.
   */
  it('asks for a second tap where the sheet wants a tap of its own', async () => {
    const { clicked } = downloads()
    sheet(async () => {
      throw Object.assign(new Error('no gesture'), { name: 'NotAllowedError' })
    })

    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('again')
    expect(clicked).toEqual([])
  })

  it('downloads where the sheet fails otherwise', async () => {
    const { clicked } = downloads()
    sheet(async () => {
      throw Object.assign(new Error('broken'), { name: 'DataError' })
    })

    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('downloaded')
    expect(clicked).toHaveLength(1)
  })

  it('downloads on a phone whose sheet cannot take files, or has none', async () => {
    const { clicked } = downloads()
    const share = sheet(
      async () => {},
      () => false,
    )

    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('downloaded')
    expect(share).not.toHaveBeenCalled()

    vi.stubGlobal('navigator', { ...navigator, share: undefined, canShare: undefined })
    await expect(saveChatImageFile(file, { computer: false })).resolves.toBe('downloaded')
    expect(clicked).toHaveLength(2)
  })

  // Asked of the device where the caller does not say.
  it('asks whether this is a computer where it is not told', async () => {
    const { isComputer } = await import('@/utils/isComputer')
    const { clicked } = downloads()
    sheet()

    await saveChatImageFile(file)

    expect(isComputer).toHaveBeenCalled()
    expect(clicked).toHaveLength(1)
  })
})
