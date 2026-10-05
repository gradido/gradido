// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import CONFIG from '@/config'
import { ChatImageError, CHAT_IMAGE_AREA, CHAT_IMAGE_TARGET_BYTES } from './chatImage'
import { chatImageCut, chatImageZoomMin, zoomChatImageInFrame } from './chatImageEdit'
import {
  THANK_YOU_PICTURE_FRAME,
  THANK_YOU_PICTURE_GROUND,
  THANK_YOU_PICTURE_LARGE,
  THANK_YOU_PICTURE_PREVIEW_QUALITY,
  THANK_YOU_PICTURE_SMALL,
  encodeThankYouPictures,
  fetchThankYouPicture,
  openThankYouRenditions,
  thankYouPictureAddress,
  thankYouPictureEdit,
  thankYouPictureInput,
  thankYouPicturePreview,
} from './thankYouPicture'

/** A phone's portrait photo as openChatImage hands it on. */
const PORTRAIT = { image: { name: 'portrait' }, width: 3000, height: 4000 }

describe('the place of the picture on the card', () => {
  it('is 36 : 25, as the motifs are', () => {
    expect(THANK_YOU_PICTURE_FRAME).toBe(36 / 25)
  })

  it('opens a photo filling it, cut in the middle, on the ground of the card', () => {
    const edit = thankYouPictureEdit()

    expect(edit).toMatchObject({
      turn: 0,
      mirrored: false,
      zoom: 1,
      panX: 0,
      panY: 0,
      frame: 36 / 25,
      ground: THANK_YOU_PICTURE_GROUND,
    })
    // a portrait fills the frame's width, and what is above and below falls away
    const cut = chatImageCut(PORTRAIT.width, PORTRAIT.height, edit)
    expect(cut.width).toBe(3000)
    expect(cut.height).toBeCloseTo(3000 / (36 / 25), 9)
    expect(cut.centerY).toBe(2000)
  })

  it('lets a portrait be fitted in whole at 0.52', () => {
    expect(chatImageZoomMin(PORTRAIT.width, PORTRAIT.height, thankYouPictureEdit())).toBeCloseTo(
      0.5208,
      4,
    )
  })
})

describe('the two renditions', () => {
  it('are the chat’s measure, and one of up to 1080 x 750 under 68 KB', () => {
    expect(THANK_YOU_PICTURE_SMALL).toEqual({
      area: CHAT_IMAGE_AREA,
      targetBytes: CHAT_IMAGE_TARGET_BYTES,
    })
    expect(THANK_YOU_PICTURE_SMALL).toEqual({ area: 480000, targetBytes: 32768 })
    expect(THANK_YOU_PICTURE_LARGE).toEqual({ area: 810000, targetBytes: 69632 })
  })

  // Shared, not copied: one encoder, asked twice, the small one first.
  it('are made by the encoder it is handed, the small one first, of the same edit', async () => {
    const edit = thankYouPictureEdit()
    const encode = vi
      .fn()
      .mockResolvedValueOnce({ data: 'SMALL', width: 831, height: 577, bytes: 30000 })
      .mockResolvedValueOnce({ data: 'LARGE', width: 1080, height: 750, bytes: 66000 })

    const pictures = await encodeThankYouPictures(PORTRAIT, edit, { encode })

    expect(encode.mock.calls).toEqual([
      [PORTRAIT, edit, THANK_YOU_PICTURE_SMALL],
      [PORTRAIT, edit, THANK_YOU_PICTURE_LARGE],
    ])
    expect(pictures).toEqual({
      small: { data: 'SMALL', width: 831, height: 577, bytes: 30000 },
      large: { data: 'LARGE', width: 1080, height: 750, bytes: 66000 },
    })
  })

  // Without the small one there is no greeting with this photo.
  it('fail where the small one cannot be made, and the large one is not tried', async () => {
    const encode = vi.fn().mockRejectedValueOnce(new ChatImageError('NOT_SMALL_ENOUGH'))

    await expect(
      encodeThankYouPictures(PORTRAIT, thankYouPictureEdit(), { encode }),
    ).rejects.toMatchObject({ name: 'ChatImageError', problem: 'NOT_SMALL_ENOUGH' })
    expect(encode).toHaveBeenCalledTimes(1)
  })

  // The greeting goes without it: the page its link opens as shows the small one.
  it('do without the large one where it cannot be made', async () => {
    const small = { data: 'SMALL', width: 831, height: 577, bytes: 30000 }
    const encode = vi
      .fn()
      .mockResolvedValueOnce(small)
      .mockRejectedValueOnce(new ChatImageError('NOT_SMALL_ENOUGH'))

    expect(await encodeThankYouPictures(PORTRAIT, thankYouPictureEdit(), { encode })).toEqual({
      small,
      large: null,
    })
  })

  it('go to the server as the JPEG and its size, nothing else', () => {
    expect(thankYouPictureInput({ data: 'JPEG', width: 831, height: 577, bytes: 30000 })).toEqual({
      data: 'JPEG',
      width: 831,
      height: 577,
    })
  })
})

describe('thankYouPicturePreview', () => {
  const drawing = () => {
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,PREVIEW')
    const draw = vi.fn(() => ({ toDataURL }))
    return { draw, toDataURL }
  }

  it('draws the edited photo in the card’s shape, at most as large as the large rendition', () => {
    const { draw, toDataURL } = drawing()
    const edit = thankYouPictureEdit()

    const preview = thankYouPicturePreview(PORTRAIT, edit, { draw })

    expect(preview).toBe('data:image/jpeg;base64,PREVIEW')
    expect(draw).toHaveBeenCalledWith(PORTRAIT, edit, 1080, 750)
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', THANK_YOU_PICTURE_PREVIEW_QUALITY)
  })

  // Fitted in whole, the cutout is larger than the photo: the picture is the frame all the same.
  it('is the whole frame for a photo that was fitted in, margin and all', () => {
    const { draw } = drawing()
    const whole = zoomChatImageInFrame(thankYouPictureEdit(), PORTRAIT.width, PORTRAIT.height, 0)

    thankYouPicturePreview(PORTRAIT, whole, { draw })

    expect(draw).toHaveBeenCalledWith(PORTRAIT, whole, 1080, 750)
  })

  it('is never drawn larger than the cutout is', () => {
    const { draw } = drawing()
    const small = { image: { name: 'small' }, width: 400, height: 300 }

    thankYouPicturePreview(small, thankYouPictureEdit(), { draw })

    // 400 wide, 400 / 1.44 high
    expect(draw).toHaveBeenCalledWith(small, expect.anything(), 400, 278)
  })
})

/**
 * A duplicate of a greeting carries the photo of the old one (ZE-030): the two renditions come
 * from the server as base64, and they go out again as they came.
 */
describe('openThankYouRenditions', () => {
  // Bytes that are no text, so a detour through a string would show: 0xff 0xd8 … 0xff 0xd9.
  const jpeg = (...inside) => Uint8Array.from([0xff, 0xd8, ...inside, 0xff, 0xd9])
  const base64 = (bytes) => btoa(String.fromCharCode(...bytes))
  const SMALL_BYTES = jpeg(0x00, 0x80, 0xfe, 0x01)
  const LARGE_BYTES = jpeg(0x7f, 0xc3, 0x28, 0xa0, 0xa1, 0x10)
  const SMALL = base64(SMALL_BYTES)
  const LARGE = base64(LARGE_BYTES)

  /** A decoder that tells the two files apart by their length, and keeps what it was handed. */
  const decoder = () => {
    const files = []
    const open = vi.fn(async (file) => {
      files.push(file)
      return file.size === LARGE_BYTES.length
        ? { image: { name: 'large' }, width: 1080, height: 750 }
        : { image: { name: 'small' }, width: 831, height: 577 }
    })
    return { open, files }
  }

  /** The bytes of a file (jsdom's File has no arrayBuffer of its own). */
  const bytesOf = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(new Uint8Array(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })

  it('hands both renditions on as they came, their sizes read off the pictures', async () => {
    const { open } = decoder()

    const photo = await openThankYouRenditions({ small: SMALL, large: LARGE }, { open })

    expect(photo.renditions).toEqual({
      small: { data: SMALL, width: 831, height: 577 },
      large: { data: LARGE, width: 1080, height: 750 },
    })
    // …and those go to the server as every rendition does.
    expect(thankYouPictureInput(photo.renditions.small)).toEqual(photo.renditions.small)
  })

  it('opens the large one as the picture the editor cuts, filling the card’s place', async () => {
    const { open } = decoder()

    const photo = await openThankYouRenditions({ small: SMALL, large: LARGE }, { open })

    expect(photo.source).toEqual({ image: { name: 'large' }, width: 1080, height: 750 })
    expect(photo.edit).toEqual(thankYouPictureEdit())
    // 1080 x 750 is the place's own shape: nothing of it falls away.
    expect(chatImageCut(1080, 750, photo.edit)).toMatchObject({ width: 1080, height: 750 })
  })

  it('shows the large one, as it came', async () => {
    const { open } = decoder()

    const photo = await openThankYouRenditions({ small: SMALL, large: LARGE }, { open })

    expect(photo.preview).toBe(`data:image/jpeg;base64,${LARGE}`)
  })

  it('decodes the very bytes the server answered, as JPEG files', async () => {
    const { open, files } = decoder()

    await openThankYouRenditions({ small: SMALL, large: LARGE }, { open })

    expect(files).toHaveLength(2)
    expect(files.map((file) => file.type)).toEqual(['image/jpeg', 'image/jpeg'])
    expect(await bytesOf(files[0])).toEqual(SMALL_BYTES)
    expect(await bytesOf(files[1])).toEqual(LARGE_BYTES)
  })

  // The old greeting has no large rendition: the server answers the small one for both.
  it('does without a large one where the server answered the small one twice', async () => {
    const { open } = decoder()

    const photo = await openThankYouRenditions({ small: SMALL, large: SMALL }, { open })

    expect(photo.renditions).toEqual({
      small: { data: SMALL, width: 831, height: 577 },
      large: null,
    })
    expect(photo.source).toEqual({ image: { name: 'small' }, width: 831, height: 577 })
    expect(photo.preview).toBe(`data:image/jpeg;base64,${SMALL}`)
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('and where no large one came at all', async () => {
    const { open } = decoder()

    const photo = await openThankYouRenditions({ small: SMALL, large: null }, { open })

    expect(photo.renditions.large).toBeNull()
    expect(photo.source.image).toEqual({ name: 'small' })
    expect(open).toHaveBeenCalledTimes(1)
  })

  // Without the small rendition there is no greeting with a photo.
  it('is no photo where no small rendition came, and decodes nothing', async () => {
    const { open } = decoder()

    expect(await openThankYouRenditions({ small: null, large: LARGE }, { open })).toBeNull()
    expect(await openThankYouRenditions({ small: null, large: null }, { open })).toBeNull()
    expect(open).not.toHaveBeenCalled()
  })

  it('fails where a rendition is no picture', async () => {
    const open = vi.fn().mockRejectedValue(new ChatImageError('FORMAT'))

    await expect(openThankYouRenditions({ small: SMALL, large: LARGE }, { open })).rejects.toThrow()
  })

  it('fails where what came is not base64', async () => {
    const { open } = decoder()

    await expect(openThankYouRenditions({ small: '%%%', large: null }, { open })).rejects.toThrow()
    expect(open).not.toHaveBeenCalled()
  })
})

describe('thankYouPictureAddress', () => {
  const CODE = 'a3f9c2d41b7e19981fa0c4e2'
  const graphqlUri = CONFIG.GRAPHQL_URI
  afterEach(() => {
    CONFIG.GRAPHQL_URI = graphqlUri
  })

  it('is an address under /api on the server the wallet talks to', () => {
    CONFIG.GRAPHQL_URI = 'https://ki-playground.gradido.net/graphql'

    expect(thankYouPictureAddress(CODE)).toBe(
      `https://ki-playground.gradido.net/api/thank-you-greeting-picture/${CODE}`,
    )
  })

  // In development the server is another port than the wallet.
  it('goes to the server’s own port in development', () => {
    CONFIG.GRAPHQL_URI = 'http://localhost:4000/graphql'

    expect(thankYouPictureAddress(CODE)).toBe(
      `http://localhost:4000/api/thank-you-greeting-picture/${CODE}`,
    )
  })

  it('is on the wallet’s own origin where the server is named by a path alone', () => {
    CONFIG.GRAPHQL_URI = '/graphql'

    expect(thankYouPictureAddress(CODE)).toBe(
      `${window.location.origin}/api/thank-you-greeting-picture/${CODE}`,
    )
  })

  it('carries no ending of a file: nginx has rules of its own for .jpg', () => {
    CONFIG.GRAPHQL_URI = 'https://ki-playground.gradido.net/graphql'

    expect(thankYouPictureAddress(CODE)).not.toMatch(/\.[a-z]+$/)
  })

  // ⛔ What goes into the path has the form of a code, or there is no address.
  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a number', 123],
    ['an empty text', ''],
    ['a code too short', 'a3f9c2d41b7e19981fa0c4e'],
    ['a code too long', 'a3f9c2d41b7e19981fa0c4e2a'],
    ['a path', '../../graphql'],
    ['a code with a path after it', 'a3f9c2d41b7e19981fa0c4e2/x'],
    ['a code with a question after it', 'a3f9c2d41b7e19981fa0c4e2?x'],
    ['a contribution link', 'CL-a3f9c2d41b7e19981fa0c4e2'],
  ])('has no address for %s', (name, code) => {
    expect(thankYouPictureAddress(code)).toBeNull()
  })

  it('takes a code in capitals as the page of a link does', () => {
    CONFIG.GRAPHQL_URI = 'https://ki-playground.gradido.net/graphql'

    expect(thankYouPictureAddress(CODE.toUpperCase())).toBe(
      `https://ki-playground.gradido.net/api/thank-you-greeting-picture/${CODE.toUpperCase()}`,
    )
  })
})

/**
 * One fetch for the two that need the picture of an open link as a file of their own: the page
 * the link opens as (useThankYouLinkPicture) and the sheet the greeting is printed on
 * (useThankYouGreetingSheet).
 */
describe('fetchThankYouPicture', () => {
  const ADDRESS =
    'https://ki-playground.gradido.net/api/thank-you-greeting-picture/a3f9c2d41b7e19981fa0c4e2'
  const answer = (blob, ok = true) => ({
    ok,
    status: ok ? 200 : 404,
    blob: () => Promise.resolve(blob),
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('asks the address once, without cookies and without keeping anything', async () => {
    const picture = new Blob(['JPEG'], { type: 'image/jpeg' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(picture)))

    await expect(fetchThankYouPicture(ADDRESS)).resolves.toBe(picture)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(ADDRESS, { cache: 'no-store', credentials: 'omit' })
  })

  // The server answers everything that is no picture of an open link with an empty 404.
  it('gives nothing where the server gives nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(new Blob([]), false)))

    await expect(fetchThankYouPicture(ADDRESS)).resolves.toBeNull()
  })

  it.each([
    ['a page', 'text/html'],
    ['a picture of another kind', 'image/png'],
    ['something without a type', ''],
  ])('gives nothing for %s: the server serves one type', async (_, type) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer(new Blob(['x'], { type }))))

    await expect(fetchThankYouPicture(ADDRESS)).resolves.toBeNull()
  })

  it('gives nothing where the line fails, and never rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchThankYouPicture(ADDRESS)).resolves.toBeNull()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.reject(new Error('aborted')) }),
    )
    await expect(fetchThankYouPicture(ADDRESS)).resolves.toBeNull()
  })
})
