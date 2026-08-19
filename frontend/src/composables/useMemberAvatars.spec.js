// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  claimMissingMemberAvatars,
  forgetAllMemberAvatars,
  forgetWithdrawnMemberAvatars,
  memberAvatarKey,
  memberAvatarProps,
  memberAvatarSource,
  memberAvatarStoreEpoch,
  missingMemberAvatars,
  rememberMemberAvatars,
  storedMemberAvatar,
} from './useMemberAvatars'

const COMMUNITY = '11111111-1111-4111-8111-111111111111'
const ANNA = { communityUuid: COMMUNITY, gradidoID: 'aaaa-anna' }
const BEN = { communityUuid: COMMUNITY, gradidoID: 'bbbb-ben' }

const MONDAY = new Date('2026-08-17T10:00:00.000Z')
const TUESDAY = new Date('2026-08-18T10:00:00.000Z')

const answered = (ref, avatar, avatarUpdatedAt) => [{ ...ref, avatar, avatarUpdatedAt }]

describe('useMemberAvatars', () => {
  beforeEach(() => {
    localStorage.clear()
    forgetAllMemberAvatars()
  })

  it('has nothing to offer before anything was fetched', () => {
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
  })

  it('keeps a picture and hands it back while the date still matches', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    expect(storedMemberAvatar(ANNA, MONDAY)).toBe('anna-picture')
  })

  // The freshness rule. Without it a member who replaces their picture would go on being
  // shown with the old one on every device that had already seen them.
  it('refuses a picture whose date has moved on', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    expect(storedMemberAvatar(ANNA, TUESDAY)).toBeNull()
  })

  // A Date and the string a JSON round trip leaves behind are the same moment. Reading
  // them as different would refetch every picture on every load, silently and forever.
  it('reads a date and its serialised form as the same moment', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    expect(storedMemberAvatar(ANNA, MONDAY.toISOString())).toBe('anna-picture')
  })

  // ★ The privacy rule, and the reason this file is tested at all: no date means the
  // member has nothing to show any more -- they switched it off, or the account is gone.
  // The stored picture must not answer for them.
  it('shows nothing for a member the list no longer reports a date for', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    expect(storedMemberAvatar(ANNA, null)).toBeNull()
    expect(storedMemberAvatar(ANNA, undefined)).toBeNull()
  })

  // ...and refusing to show it is not enough: it has to leave the device, or it comes back
  // the moment anything reports a date again.
  it('deletes the picture of a member who withdrew it', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    forgetWithdrawnMemberAvatars([{ ...ANNA, avatarUpdatedAt: null }])
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
    expect(localStorage.getItem('gradido-avatars')).not.toContain('anna-picture')
  })

  it('leaves the others alone while doing so', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    rememberMemberAvatars(answered(BEN, 'ben-picture', MONDAY))
    forgetWithdrawnMemberAvatars([
      { ...ANNA, avatarUpdatedAt: null },
      { ...BEN, avatarUpdatedAt: MONDAY },
    ])
    expect(storedMemberAvatar(BEN, MONDAY)).toBe('ben-picture')
  })

  describe('what still has to be asked for', () => {
    it('names the members whose picture is missing or has changed', () => {
      rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
      const missing = missingMemberAvatars([
        { ...ANNA, avatarUpdatedAt: MONDAY },
        { ...ANNA, avatarUpdatedAt: TUESDAY },
        { ...BEN, avatarUpdatedAt: MONDAY },
      ])
      expect(missing).toEqual([
        { communityUuid: COMMUNITY, gradidoID: ANNA.gradidoID },
        { communityUuid: COMMUNITY, gradidoID: BEN.gradidoID },
      ])
    })

    it('asks for nothing on a second visit where nothing changed', () => {
      rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
      expect(missingMemberAvatars([{ ...ANNA, avatarUpdatedAt: MONDAY }])).toEqual([])
    })

    // Asking about them would be a request the server answers with silence anyway, and it
    // would put members who deliberately hid their picture back on the wire on every load.
    it('never asks about a member with nothing to show', () => {
      expect(missingMemberAvatars([{ ...ANNA, avatarUpdatedAt: null }])).toEqual([])
    })
  })

  // Two communities can hand out the same gradidoID; the pair is the identity (AS-004).
  it('keeps members of different communities apart', () => {
    const elsewhere = {
      communityUuid: '22222222-2222-4222-8222-222222222222',
      gradidoID: 'aaaa-anna',
    }
    rememberMemberAvatars(answered(ANNA, 'anna-here', MONDAY))
    rememberMemberAvatars(answered(elsewhere, 'anna-elsewhere', MONDAY))
    expect(memberAvatarKey(ANNA)).not.toBe(memberAvatarKey(elsewhere))
    expect(storedMemberAvatar(ANNA, MONDAY)).toBe('anna-here')
    expect(storedMemberAvatar(elsewhere, MONDAY)).toBe('anna-elsewhere')
  })

  it('treats a member without a community the same way every time', () => {
    const local = { gradidoID: 'cccc-old' }
    rememberMemberAvatars([
      { ...local, communityUuid: null, avatar: 'old-picture', avatarUpdatedAt: MONDAY },
    ])
    expect(storedMemberAvatar(local, MONDAY)).toBe('old-picture')
  })

  // ⛔ The wallet and the admin share one origin. localStorage.clear() here would take the
  // other app's session and the shared theme key with it -- this has bitten before, which
  // is why it is asserted rather than trusted.
  it('takes only its own key when logging out', () => {
    localStorage.setItem('gradido-frontend', 'the-other-blob')
    localStorage.setItem('gradido-theme-mode', 'dark')
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))

    forgetAllMemberAvatars()

    expect(localStorage.getItem('gradido-avatars')).toBeNull()
    expect(localStorage.getItem('gradido-frontend')).toBe('the-other-blob')
    expect(localStorage.getItem('gradido-theme-mode')).toBe('dark')
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
  })

  // The three lines carrying the withdrawal rule cover for each other, so no single
  // injection can shake it -- which also means none of them is measured by an ordinary
  // case. This one pokes the hole only a broken writer could leave: an entry with no date.
  // Without the guard in storedMemberAvatar it would match a dateless request exactly, and
  // the withdrawn face would be back on screen.
  it('refuses an entry with no date, which should never have been stored', () => {
    localStorage.setItem(
      'gradido-avatars',
      JSON.stringify({
        [memberAvatarKey(ANNA)]: { avatar: 'anna-picture', updatedAt: null, usedAt: 1 },
      }),
    )
    expect(storedMemberAvatar(ANNA, null)).toBeNull()
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
  })

  // Logging out when storage refuses to delete. The pictures are still lying there, so
  // dropping the in-memory map would invite the very next read to load them straight back
  // for whoever signs in next -- an empty map is the stricter answer, and this is the case
  // that tells the two apart.
  it('stays silent after logging out even when storage refuses to delete', () => {
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    const removeItem = Storage.prototype.removeItem
    Storage.prototype.removeItem = () => {
      throw new Error('storage said no')
    }
    try {
      forgetAllMemberAvatars()
    } finally {
      Storage.prototype.removeItem = removeItem
    }

    // The proof that the fixture is real: the picture IS still lying in storage.
    expect(localStorage.getItem('gradido-avatars')).toContain('anna-picture')
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
  })

  it('survives storage that cannot be read', () => {
    localStorage.setItem('gradido-avatars', 'not json at all')
    expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
    rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
    expect(storedMemberAvatar(ANNA, MONDAY)).toBe('anna-picture')
  })

  // Without a cap this grows for as long as the browser keeps the key, and the member pays
  // for every face they ever shared a booking with.
  describe('the cap', () => {
    const member = (index) => ({ communityUuid: COMMUNITY, gradidoID: `member-${index}` })
    // One millisecond per write, so the order is a fact rather than a race. Without this
    // 205 writes share a couple of dozen timestamps and the comparator cannot be measured.
    const store = (index) => {
      vi.advanceTimersByTime(1)
      rememberMemberAvatars([
        { ...member(index), avatar: `picture-${index}`, avatarUpdatedAt: MONDAY },
      ])
    }

    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('keeps exactly the cap, not merely no more than it', () => {
      for (let index = 0; index < 205; index++) store(index)
      const stored = JSON.parse(localStorage.getItem('gradido-avatars'))
      // ⛔ `toBe`, not `toBeLessThanOrEqual`: an eviction that threw away 195 of the 200 it
      // should have kept satisfied the old assertion, and so did dropping the sort entirely.
      expect(Object.keys(stored).length).toBe(200)
      expect(storedMemberAvatar(member(204), MONDAY)).toBe('picture-204')
      expect(storedMemberAvatar(member(0), MONDAY)).toBeNull()
    })

    /**
     * ⛔ The case that tells a real comparator from no comparator at all.
     *
     * `Map.set` on a key that is already there keeps its ORIGINAL position, while the fetch
     * time moves to the end -- so this is the one arrangement where insertion order and
     * `storedAt` order disagree. Filling to the cap and then refreshing the very first
     * member makes them disagree about exactly one entry.
     *
     * Without it, `sort(() => 0)`, no sort at all, and a half-done rename of the field the
     * comparator reads all pass.
     */
    it('drops the oldest FETCH, not the oldest position in the map', () => {
      for (let index = 0; index < 200; index++) store(index)
      store(0) // refreshed: first in the map, newest by fetch time
      store(200) // one over the cap, so exactly one entry has to go

      expect(storedMemberAvatar(member(0), MONDAY)).toBe('picture-0')
      expect(storedMemberAvatar(member(1), MONDAY)).toBeNull()
    })

    /**
     * An earlier build wrote `usedAt` where this one writes `storedAt`, and those entries
     * are still lying in the browsers that ran it. Read verbatim, every comparison between
     * two of them is `undefined - undefined` -- NaN, and the sort order is then unspecified.
     */
    it('carries over the fetch time an earlier build wrote under another name', () => {
      localStorage.setItem(
        'gradido-avatars',
        JSON.stringify({
          [memberAvatarKey(ANNA)]: {
            avatar: 'anna-picture',
            updatedAt: MONDAY.getTime(),
            usedAt: 7,
          },
        }),
      )
      expect(storedMemberAvatar(ANNA, MONDAY)).toBe('anna-picture')

      rememberMemberAvatars(answered(BEN, 'ben-picture', TUESDAY))
      const stored = JSON.parse(localStorage.getItem('gradido-avatars'))
      expect(stored[memberAvatarKey(ANNA)].storedAt).toBe(7)
    })
  })

  describe('what the request asks for', () => {
    /**
     * ⚠️ One entry per MEMBER, not per booking row. The caller maps rows, so a member who
     * paid the same shop twenty-five times would otherwise be named twenty-five times in
     * one request -- and MEMBER_AVATARS_MAX_REFS counts what is sent, not who is meant, so
     * the cap would be measured against the page size instead of against the people on it.
     */
    it('names a member once however many bookings they are in', () => {
      const rows = Array.from({ length: 25 }, () => ({ ...ANNA, avatarUpdatedAt: MONDAY }))
      expect(missingMemberAvatars(rows)).toEqual([
        { communityUuid: COMMUNITY, gradidoID: ANNA.gradidoID },
      ])
    })

    // A second booking list arriving before the first answer would otherwise ask for
    // exactly the same faces again, and a third one after that.
    it('does not ask again for what a request is already waiting on', () => {
      const rows = [{ ...ANNA, avatarUpdatedAt: MONDAY }]
      const first = claimMissingMemberAvatars(rows)
      expect(first.refs).toHaveLength(1)
      expect(claimMissingMemberAvatars(rows).refs).toEqual([])

      // ...but a request that fails must not silence the member for the rest of the page.
      first.done()
      expect(claimMissingMemberAvatars(rows).refs).toHaveLength(1)
    })
  })

  describe('an answer that arrives late', () => {
    /**
     * ⛔ The one thing a late answer must never do. The newer list reported that Anna has
     * nothing to show, `forgetWithdrawnMemberAvatars` deleted her, and then the request the
     * older list sent comes back carrying her face. Writing it would undo a withdrawal --
     * on this device only, so nobody would ever see why.
     */
    it('cannot put back a face the newest list withdrew', () => {
      forgetWithdrawnMemberAvatars([{ ...ANNA, avatarUpdatedAt: null }])
      rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
      expect(storedMemberAvatar(ANNA, MONDAY)).toBeNull()
    })

    // ★ ...while everything else in the same answer is kept. Discarding the whole answer
    // because a newer list arrived costs the member every portrait in it, downloaded and
    // thrown away, and the list shows initials although the bytes had already come.
    it('keeps the members the newest list said nothing about', () => {
      forgetWithdrawnMemberAvatars([{ ...ANNA, avatarUpdatedAt: null }])
      rememberMemberAvatars([
        { ...ANNA, avatar: 'anna-picture', avatarUpdatedAt: MONDAY },
        { ...BEN, avatar: 'ben-picture', avatarUpdatedAt: MONDAY },
      ])
      expect(storedMemberAvatar(BEN, MONDAY)).toBe('ben-picture')
    })

    /**
     * ⛔ And the one a counter inside the component could not catch. The logout action wipes
     * this store synchronously, while Apollo's cancellation of the request in flight is two
     * deferrals later -- so an answer delivered in that gap resolves normally. The caller
     * reads the epoch before the request and compares it after; this is what makes that
     * possible, and what makes a wipe visible to a component that no longer exists.
     */
    it('counts a logout, so a request that crossed it can be recognised', () => {
      const before = memberAvatarStoreEpoch()
      forgetAllMemberAvatars()
      expect(memberAvatarStoreEpoch()).not.toBe(before)
    })
  })

  describe('what a booking row hands the avatar', () => {
    const NAPOLI = {
      ...ANNA,
      alias: 'napoli',
      firstName: 'Pizzeria',
      lastName: 'Napoli',
      avatarUpdatedAt: MONDAY,
    }

    it('is the whole set from one call, so the pair cannot be split', () => {
      expect(memberAvatarProps(NAPOLI)).toEqual({
        name: 'Pizzeria Napoli',
        initials: 'NA',
        colorSeed: 'PN',
        src: '',
      })
    })

    it('carries the picture once the wallet holds it', () => {
      rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
      expect(memberAvatarSource(NAPOLI)).toBe('data:image/jpeg;base64,anna-picture')
    })

    // Built once per stored picture: a booking list re-renders whenever ANY member's
    // picture arrives, and an ~11 KB string per row per render is the cost this avoids.
    it('hands out the same string rather than building it again', () => {
      rememberMemberAvatars(answered(ANNA, 'anna-picture', MONDAY))
      expect(memberAvatarSource(NAPOLI)).toBe(memberAvatarSource(NAPOLI))
    })

    // A booking whose counterparty the backend could not resolve. Nothing here may throw --
    // a throw inside a computed takes the whole row, and in the sidebar the whole list.
    it('says nothing rather than failing for a row with no counterparty', () => {
      expect(memberAvatarProps(null)).toEqual({
        name: '',
        initials: '',
        colorSeed: '',
        src: '',
      })
    })
  })
})
