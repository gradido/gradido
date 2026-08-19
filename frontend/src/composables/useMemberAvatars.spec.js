// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeEach } from 'vitest'
import {
  forgetAllMemberAvatars,
  forgetWithdrawnMemberAvatars,
  memberAvatarKey,
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
  it('stays under the cap by dropping what was fetched longest ago', () => {
    const many = Array.from({ length: 205 }, (_, index) => ({
      communityUuid: COMMUNITY,
      gradidoID: `member-${index}`,
      avatar: `picture-${index}`,
      avatarUpdatedAt: MONDAY,
    }))
    for (const one of many) {
      rememberMemberAvatars([one])
    }
    const stored = JSON.parse(localStorage.getItem('gradido-avatars'))
    expect(Object.keys(stored).length).toBeLessThanOrEqual(200)
    // The newest survive, the oldest are gone.
    expect(storedMemberAvatar({ communityUuid: COMMUNITY, gradidoID: 'member-204' }, MONDAY)).toBe(
      'picture-204',
    )
    expect(
      storedMemberAvatar({ communityUuid: COMMUNITY, gradidoID: 'member-0' }, MONDAY),
    ).toBeNull()
  })
})
