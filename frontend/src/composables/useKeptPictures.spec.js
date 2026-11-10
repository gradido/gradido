// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed } from 'vue'
import {
  ensureKeptPictures,
  fetchKeptPictureFull,
  forgetKeptPictures,
  hasKeptPicture,
  keptPictureSource,
  removeKeptPicture,
  setKeptPicture,
  startKeptPictures,
} from './useKeptPictures'
import {
  forgetAllMemberAvatars,
  memberAvatarSource,
  rememberMemberAvatars,
} from './useMemberAvatars'

const HOME = '11111111-1111-4111-8111-111111111111'
const ME = 'eeee-me'
const OTHER_MEMBER = 'ffff-other'
const ANNA = { communityUuid: HOME, gradidoID: 'aaaa-anna' }
const BEN = { communityUuid: HOME, gradidoID: 'bbbb-ben' }
const DEVICE_KEY = 'gradido-kept-pictures'
const MONDAY = '2026-08-17T10:00:00.000Z'

const listAnswer = (...rows) => ({ data: { keptPictures: rows } })
const row = (member, picture) => ({ ...member, picture })

const client = (overrides = {}) => ({
  query: vi.fn().mockResolvedValue(listAnswer()),
  mutate: vi.fn().mockResolvedValue({ data: {} }),
  ...overrides,
})

const deferred = () => {
  let settle
  let fail
  const promise = new Promise((resolve, reject) => {
    settle = resolve
    fail = reject
  })
  return { promise, resolve: settle, reject: fail }
}

describe('useKeptPictures', () => {
  beforeEach(() => {
    localStorage.clear()
    forgetKeptPictures()
    forgetAllMemberAvatars()
  })

  it('keeps nothing before a member is signed in', () => {
    expect(hasKeptPicture(ANNA)).toBe(false)
    expect(keptPictureSource(ANNA)).toBeNull()
  })

  describe('the list', () => {
    it('asks once per page, past the Apollo cache, and shows the pictures it brings', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      await ensureKeptPictures(apollo)
      // Once who, once the pictures.
      expect(apollo.query).toHaveBeenCalledTimes(2)
      for (const [options] of apollo.query.mock.calls) {
        expect(options.fetchPolicy).toBe('no-cache')
      }
      expect(hasKeptPicture(ANNA)).toBe(true)
      expect(keptPictureSource(ANNA)).toBe('data:image/jpeg;base64,anna-mine')
      expect(keptPictureSource(BEN)).toBeNull()
    })

    it('shares one request between two callers', async () => {
      const answer = deferred()
      const apollo = client({ query: vi.fn().mockReturnValue(answer.promise) })
      startKeptPictures(ME, HOME)
      const first = ensureKeptPictures(apollo)
      const second = ensureKeptPictures(apollo)
      answer.resolve(listAnswer(row(ANNA, 'anna-mine')))
      await Promise.all([first, second])
      expect(apollo.query).toHaveBeenCalledTimes(2)
    })

    // Falle 5 on a first visit: nothing on the device, and the pictures may be a megabyte. The
    // pairs come in a request of their own, and from them on a circle waits with letters.
    it('knows whom before the pictures come, and shows letters until then', async () => {
      rememberMemberAvatars([{ ...ANNA, avatar: 'anna-own', avatarUpdatedAt: MONDAY }])
      const pictures = deferred()
      const apollo = client({
        query: vi.fn(({ query }) =>
          query.definitions[0].name.value === 'keptPicturePairsQuery'
            ? Promise.resolve(listAnswer(ANNA))
            : pictures.promise,
        ),
      })
      startKeptPictures(ME, HOME)
      const asked = ensureKeptPictures(apollo)
      await vi.waitFor(() => expect(hasKeptPicture(ANNA)).toBe(true))
      expect(memberAvatarSource({ ...ANNA, avatarUpdatedAt: MONDAY })).toBe('')
      expect(JSON.parse(localStorage.getItem(DEVICE_KEY)).keys).toEqual([
        `${HOME}/${ANNA.gradidoID}`,
      ])
      pictures.resolve(listAnswer(row(ANNA, 'anna-mine')))
      await asked
      expect(memberAvatarSource({ ...ANNA, avatarUpdatedAt: MONDAY })).toBe(
        'data:image/jpeg;base64,anna-mine',
      )
    })

    it('lets the pairs that arrive after the pictures change nothing', async () => {
      const pairs = deferred()
      const apollo = client({
        query: vi.fn(({ query }) =>
          query.definitions[0].name.value === 'keptPicturePairsQuery'
            ? pairs.promise
            : Promise.resolve(listAnswer(row(ANNA, 'anna-mine'))),
        ),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      pairs.resolve(listAnswer())
      await pairs.promise
      await Promise.resolve()
      expect(keptPictureSource(ANNA)).toBe('data:image/jpeg;base64,anna-mine')
    })

    it('asks nothing while nobody is signed in', async () => {
      const apollo = client()
      await ensureKeptPictures(apollo)
      expect(apollo.query).not.toHaveBeenCalled()
    })

    it('asks again on the next call where the first request failed', async () => {
      let online = false
      const apollo = client({
        query: vi.fn(() =>
          online
            ? Promise.resolve(listAnswer(row(ANNA, 'anna-mine')))
            : Promise.reject(new Error('offline')),
        ),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      expect(keptPictureSource(ANNA)).toBeNull()
      online = true
      await ensureKeptPictures(apollo)
      expect(apollo.query).toHaveBeenCalledTimes(4)
      expect(keptPictureSource(ANNA)).toBe('data:image/jpeg;base64,anna-mine')
    })

    it('names one person one way: a missing community is the home one, capitals do not count', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      expect(keptPictureSource({ gradidoID: ANNA.gradidoID })).toBe(
        'data:image/jpeg;base64,anna-mine',
      )
      expect(
        keptPictureSource({
          communityUuid: HOME.toUpperCase(),
          gradidoID: ANNA.gradidoID.toUpperCase(),
        }),
      ).toBe('data:image/jpeg;base64,anna-mine')
      expect(
        keptPictureSource({ communityUuid: 'another-community', gradidoID: ANNA.gradidoID }),
      ).toBeNull()
    })
  })

  // Falle 5: the first paint must already know whom the member keeps a picture of, so a circle
  // shows letters until the picture comes -- never the person's own face first.
  describe('the pairs on the device', () => {
    it('keeps only who the pictures are of, under the member they belong to -- never a picture', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      const stored = JSON.parse(localStorage.getItem(DEVICE_KEY))
      expect(stored).toEqual({ owner: ME, keys: [`${HOME}/${ANNA.gradidoID}`] })
      expect(localStorage.getItem(DEVICE_KEY)).not.toContain('anna-mine')
    })

    it('shows letters, not the own face, for a kept pair whose picture has not come yet', () => {
      localStorage.setItem(
        DEVICE_KEY,
        JSON.stringify({ owner: ME, keys: [`${HOME}/${ANNA.gradidoID}`] }),
      )
      rememberMemberAvatars([{ ...ANNA, avatar: 'anna-own', avatarUpdatedAt: MONDAY }])
      startKeptPictures(ME, HOME)
      expect(hasKeptPicture(ANNA)).toBe(true)
      expect(keptPictureSource(ANNA)).toBe('')
      expect(memberAvatarSource({ ...ANNA, avatarUpdatedAt: MONDAY })).toBe('')
    })

    it("does not take another member's pairs", () => {
      localStorage.setItem(
        DEVICE_KEY,
        JSON.stringify({ owner: OTHER_MEMBER, keys: [`${HOME}/${ANNA.gradidoID}`] }),
      )
      startKeptPictures(ME, HOME)
      expect(hasKeptPicture(ANNA)).toBe(false)
    })

    it('reads past a broken entry', () => {
      localStorage.setItem(DEVICE_KEY, '{not json')
      expect(() => startKeptPictures(ME, HOME)).not.toThrow()
      expect(hasKeptPicture(ANNA)).toBe(false)
    })
  })

  // Falle 3: every place that shows a face draws again when a picture is set or taken away.
  describe('in front of the own face', () => {
    it('comes first wherever a face is drawn, and draws again after setting and removing', async () => {
      rememberMemberAvatars([{ ...ANNA, avatar: 'anna-own', avatarUpdatedAt: MONDAY }])
      const apollo = client()
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      const face = computed(() => memberAvatarSource({ ...ANNA, avatarUpdatedAt: MONDAY }))
      expect(face.value).toBe('data:image/jpeg;base64,anna-own')

      await setKeptPicture(apollo, ANNA, { small: 'anna-mine', full: 'anna-mine-full' })
      expect(face.value).toBe('data:image/jpeg;base64,anna-mine')

      await removeKeptPicture(apollo, ANNA)
      expect(face.value).toBe('data:image/jpeg;base64,anna-own')
    })

    it('stays when the person withdraws their own picture', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      expect(memberAvatarSource({ ...ANNA, avatarUpdatedAt: null })).toBe(
        'data:image/jpeg;base64,anna-mine',
      )
    })
  })

  describe('setting and removing', () => {
    it('sends the person and both renditions, past the cache, and keeps the pair on the device', async () => {
      const apollo = client()
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      await setKeptPicture(apollo, { gradidoID: ANNA.gradidoID }, { small: 's', full: 'f' })
      expect(apollo.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            ref: { gradidoID: ANNA.gradidoID, communityUuid: null },
            pictureSmall: 's',
            pictureFull: 'f',
          },
          fetchPolicy: 'no-cache',
        }),
      )
      expect(keptPictureSource(ANNA)).toBe('data:image/jpeg;base64,s')
      expect(JSON.parse(localStorage.getItem(DEVICE_KEY)).keys).toEqual([
        `${HOME}/${ANNA.gradidoID}`,
      ])
    })

    it('shows nothing the server did not store', async () => {
      const apollo = client({ mutate: vi.fn().mockRejectedValue(new Error('KEPT_PICTURES_FULL')) })
      startKeptPictures(ME, HOME)
      await expect(setKeptPicture(apollo, ANNA, { small: 's', full: 'f' })).rejects.toThrow(
        'KEPT_PICTURES_FULL',
      )
      expect(hasKeptPicture(ANNA)).toBe(false)
    })

    it('takes the picture away, on the server first', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      await removeKeptPicture(apollo, ANNA)
      expect(apollo.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { ref: { gradidoID: ANNA.gradidoID, communityUuid: HOME } },
          fetchPolicy: 'no-cache',
        }),
      )
      expect(hasKeptPicture(ANNA)).toBe(false)
      expect(JSON.parse(localStorage.getItem(DEVICE_KEY)).keys).toEqual([])
    })

    it('keeps the picture where taking it away failed', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
        mutate: vi.fn().mockRejectedValue(new Error('offline')),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      await expect(removeKeptPicture(apollo, ANNA)).rejects.toThrow('offline')
      expect(hasKeptPicture(ANNA)).toBe(true)
    })
  })

  describe('the full size', () => {
    it('asks for one person, past the cache, and keeps nothing', async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue({ data: { keptPictureFull: 'big' } }),
      })
      startKeptPictures(ME, HOME)
      expect(await fetchKeptPictureFull(apollo, ANNA)).toBe('big')
      expect(apollo.query).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { ref: { gradidoID: ANNA.gradidoID, communityUuid: HOME } },
          fetchPolicy: 'no-cache',
        }),
      )
    })

    it('answers null where the request failed', async () => {
      const apollo = client({ query: vi.fn().mockRejectedValue(new Error('offline')) })
      startKeptPictures(ME, HOME)
      expect(await fetchKeptPictureFull(apollo, ANNA)).toBeNull()
    })
  })

  // Falle 7: signing out forgets everything, and an answer on its way across it writes nothing.
  describe('signing out', () => {
    it('forgets the pictures and the pairs, and nothing else on the device', async () => {
      localStorage.setItem('another-key', 'stays')
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      forgetKeptPictures()
      expect(hasKeptPicture(ANNA)).toBe(false)
      expect(localStorage.getItem(DEVICE_KEY)).toBeNull()
      expect(localStorage.getItem('another-key')).toBe('stays')
    })

    it('lets a list that arrives after signing out write nothing', async () => {
      const answer = deferred()
      const apollo = client({ query: vi.fn().mockReturnValue(answer.promise) })
      startKeptPictures(ME, HOME)
      const asked = ensureKeptPictures(apollo)
      forgetKeptPictures()
      answer.resolve(listAnswer(row(ANNA, 'anna-mine')))
      await asked
      startKeptPictures(OTHER_MEMBER, HOME)
      expect(hasKeptPicture(ANNA)).toBe(false)
      expect(localStorage.getItem(DEVICE_KEY)).toBeNull()
    })

    it('lets a picture set across signing out write nothing', async () => {
      const answer = deferred()
      const apollo = client({ mutate: vi.fn().mockReturnValue(answer.promise) })
      startKeptPictures(ME, HOME)
      const set = setKeptPicture(apollo, ANNA, { small: 's', full: 'f' })
      forgetKeptPictures()
      answer.resolve({ data: { setKeptPicture: true } })
      await set
      expect(hasKeptPicture(ANNA)).toBe(false)
      expect(localStorage.getItem(DEVICE_KEY)).toBeNull()
    })

    it('lets a full picture that arrives after signing out be nobody', async () => {
      const answer = deferred()
      const apollo = client({ query: vi.fn().mockReturnValue(answer.promise) })
      startKeptPictures(ME, HOME)
      const full = fetchKeptPictureFull(apollo, ANNA)
      forgetKeptPictures()
      answer.resolve({ data: { keptPictureFull: 'big' } })
      expect(await full).toBeNull()
    })

    it("starts the next member without the previous one's pictures", async () => {
      const apollo = client({
        query: vi.fn().mockResolvedValue(listAnswer(row(ANNA, 'anna-mine'))),
      })
      startKeptPictures(ME, HOME)
      await ensureKeptPictures(apollo)
      startKeptPictures(OTHER_MEMBER, HOME)
      expect(hasKeptPicture(ANNA)).toBe(false)
      const next = client()
      await ensureKeptPictures(next)
      expect(next.query).toHaveBeenCalledTimes(2)
    })
  })
})
