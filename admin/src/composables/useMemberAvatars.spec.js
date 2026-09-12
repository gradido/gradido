// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMemberAvatars,
  forgetAllMemberAvatars,
  memberAvatarProps,
  memberAvatarSource,
} from './useMemberAvatars'

const WHEN = '2026-09-12T04:00:00.000Z'
const margret = {
  gradidoID: 'g-margret',
  communityUuid: 'home',
  alias: 'margret',
  firstName: 'Margret',
  lastName: 'von Gradido',
  avatarUpdatedAt: WHEN,
}

const clientAnswering = (members) => ({
  query: vi.fn().mockResolvedValue({ data: { memberAvatars: members } }),
})

describe('useMemberAvatars (admin)', () => {
  beforeEach(() => {
    forgetAllMemberAvatars()
  })

  it('asks for the members it does not hold, by the whole pair', async () => {
    const client = clientAnswering([])

    await fetchMemberAvatars(client, [margret])

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query.mock.calls[0][0].variables).toEqual({
      refs: [{ gradidoID: 'g-margret', communityUuid: 'home' }],
    })
  })

  /**
   * ⛔ The rule the whole store is built on: a picture counts as current while its DATE
   * matches the one the list brought. Without it a page of twenty rows would fetch twenty
   * pictures on every paging step.
   */
  it('asks again only when the date says the picture changed', async () => {
    const first = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(first, [margret])
    expect(memberAvatarSource(margret)).toBe('data:image/jpeg;base64,face')

    const again = clientAnswering([])
    await fetchMemberAvatars(again, [margret])
    expect(again.query).not.toHaveBeenCalled()

    const later = { ...margret, avatarUpdatedAt: '2026-09-13T04:00:00.000Z' }
    // The held picture no longer answers for the newer date -- it is not "current".
    expect(memberAvatarSource(later)).toBe('')
    const third = clientAnswering([])
    await fetchMemberAvatars(third, [later])
    expect(third.query).toHaveBeenCalledTimes(1)
  })

  // A member without a date has nothing to show, and the reason is none of this side's
  // business. Asking anyway would be a round trip for an answer that is already known.
  it('leaves out members the list brought no date for', async () => {
    const client = clientAnswering([])

    await fetchMemberAvatars(client, [
      { ...margret, avatarUpdatedAt: null },
      { alias: 'nobody' },
      null,
    ])

    expect(client.query).not.toHaveBeenCalled()
  })

  // One entry per MEMBER: a moderator who wrote three messages on the page is one face.
  it('names a member once, however many rows they are in', async () => {
    const client = clientAnswering([])

    await fetchMemberAvatars(client, [margret, { ...margret }, { ...margret }])

    expect(client.query.mock.calls[0][0].variables.refs).toHaveLength(1)
  })

  // Best effort: the moderation list survives a failed picture.
  it('keeps quiet when the request fails', async () => {
    const client = { query: vi.fn().mockRejectedValue(new Error('no')) }

    await expect(fetchMemberAvatars(client, [margret])).resolves.toBeUndefined()
    expect(memberAvatarSource(margret)).toBe('')
  })

  // Other people's faces do not outlive the session that fetched them.
  it('forgets everything on demand', async () => {
    const client = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(client, [margret])
    expect(memberAvatarSource(margret)).not.toBe('')

    forgetAllMemberAvatars()

    expect(memberAvatarSource(margret)).toBe('')
  })

  /**
   * ⛔ Letters, colour and picture from ONE call. The letters follow the alias, the colour
   * the real initials (AS-010) -- two values that have to agree about which member they
   * describe.
   */
  it('hands a circle everything about one member at once', async () => {
    const client = clientAnswering([
      { gradidoID: 'g-margret', communityUuid: 'home', avatar: 'face', avatarUpdatedAt: WHEN },
    ])
    await fetchMemberAvatars(client, [margret])

    expect(memberAvatarProps(margret)).toEqual({
      initials: 'MA',
      colorSeed: 'Mv',
      colorIndex: null,
      src: 'data:image/jpeg;base64,face',
    })
  })
})
