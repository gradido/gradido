// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { toProfile } from '@/composables/useMatches'
import { contactMapPair, isOneself, useContactOnMap } from './useContactOnMap'

const OWN_COMMUNITY = 'cccccccc-0000-4000-8000-cccccccccccc'
const ME = 'eeeeeeee-9999-4999-8999-eeeeeeeeeeee'
const TOBIAS = { gradidoID: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', communityUuid: OWN_COMMUNITY }
const IRA = {
  gradidoID: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
  communityUuid: 'dddddddd-3333-4333-8333-dddddddddddd',
}

// The instance's switch: a test turns the matching off to see that nothing is asked then.
const config = vi.hoisted(() => ({ MATCHING_ACTIVE: true }))
vi.mock('@/config', () => ({ default: config }))

// The member who asks. Findable with a home by default: both answers the map's door wants.
const state = vi.hoisted(() => ({}))
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

// The GMS's profile route (useMatches), which a test answers -- or holds back, or refuses.
// ⚠️ Only the composable is replaced: the rule for a usable point is the real one.
const profile = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useMatches', async (importOriginal) => ({
  ...(await importOriginal()),
  useMatches: () => ({ profile }),
}))

/** A promise that settles when the test says so: an answer that is still on its way. */
const held = () => {
  let settle
  let refuse
  const promise = new Promise((resolve, reject) => {
    settle = resolve
    refuse = reject
  })
  return { promise, resolve: settle, reject: refuse }
}

const at = (lat, lng) => ({ position: { lat, lng } })

beforeEach(() => {
  config.MATCHING_ACTIVE = true
  for (const key of Object.keys(state)) delete state[key]
  Object.assign(state, {
    gradidoID: ME,
    communityUuid: OWN_COMMUNITY,
    gmsAllowed: true,
    userLocation: { latitude: 49.28, longitude: 9.69 },
  })
  profile.mockReset()
  profile.mockResolvedValue(at(49.3, 9.7))
})

describe('isOneself', () => {
  it("knows the member's own id, however it is spelled", () => {
    expect(isOneself(ME, state)).toBe(true)
    expect(isOneself(ME.toUpperCase(), state)).toBe(true)
  })

  it('takes nobody else for the member', () => {
    expect(isOneself(TOBIAS.gradidoID, state)).toBe(false)
  })

  // Two missing ids are not one person: nobody signed in is nobody, and no id names nobody.
  it('takes nobody for the member where there is no id on one side or on both', () => {
    expect(isOneself(undefined, state)).toBe(false)
    expect(isOneself(null, state)).toBe(false)
    expect(isOneself(ME, {})).toBe(false)
    expect(isOneself(undefined, {})).toBe(false)
    expect(isOneself('', { gradidoID: '' })).toBe(false)
    expect(isOneself(null, null)).toBe(false)
  })
})

describe('contactMapPair', () => {
  it('names the contact by the pair', () => {
    expect(contactMapPair(IRA, state)).toEqual({
      gradidoID: IRA.gradidoID,
      communityUuid: IRA.communityUuid,
    })
  })

  it('writes this community out for a contact who names none', () => {
    expect(contactMapPair({ gradidoID: TOBIAS.gradidoID }, state)).toEqual(TOBIAS)
    expect(contactMapPair({ gradidoID: TOBIAS.gradidoID, communityUuid: null }, state)).toEqual(
      TOBIAS,
    )
  })

  it('names nobody where the instance offers no matching', () => {
    config.MATCHING_ACTIVE = false
    expect(contactMapPair(TOBIAS, state)).toBeNull()
  })

  it('names nobody for a member who is not findable', () => {
    state.gmsAllowed = false
    expect(contactMapPair(TOBIAS, state)).toBeNull()
  })

  it('names nobody for a member without a home on the map', () => {
    state.userLocation = null
    expect(contactMapPair(TOBIAS, state)).toBeNull()
    // The empty object the server once answered, alive in persisted stores: no home either.
    state.userLocation = {}
    expect(contactMapPair(TOBIAS, state)).toBeNull()
  })

  it('names nobody without a person, and nobody without any community to name', () => {
    expect(contactMapPair(null, state)).toBeNull()
    expect(contactMapPair({ communityUuid: OWN_COMMUNITY }, state)).toBeNull()
    state.communityUuid = null
    expect(contactMapPair({ gradidoID: TOBIAS.gradidoID }, state)).toBeNull()
  })

  it('does not name the member themselves, however the id is spelled', () => {
    expect(contactMapPair({ gradidoID: ME, communityUuid: OWN_COMMUNITY }, state)).toBeNull()
    expect(
      contactMapPair({ gradidoID: ME.toUpperCase(), communityUuid: OWN_COMMUNITY }, state),
    ).toBeNull()
    // And the control: somebody else in the same community is named.
    expect(contactMapPair(TOBIAS, state)).not.toBeNull()
  })
})

describe('useContactOnMap', () => {
  it('begins about nobody', () => {
    const { onMap } = useContactOnMap()
    expect(onMap.value).toBeNull()
    expect(profile).not.toHaveBeenCalled()
  })

  it('asks the GMS about exactly this pair and offers the way to somebody who stands there', async () => {
    const { onMap, ask } = useContactOnMap()
    await ask(IRA)

    expect(profile).toHaveBeenCalledTimes(1)
    expect(profile).toHaveBeenCalledWith(IRA.gradidoID, IRA.communityUuid)
    expect(onMap.value).toEqual({ gradidoID: IRA.gradidoID, communityUuid: IRA.communityUuid })
  })

  it('offers no way to somebody the GMS does not hold', async () => {
    profile.mockRejectedValue(
      Object.assign(new Error('community-user/profile: HTTP 404'), { status: 404 }),
    )
    const { onMap, ask } = useContactOnMap()
    await ask(TOBIAS)

    expect(profile).toHaveBeenCalledTimes(1)
    expect(onMap.value).toBeNull()
  })

  it.each([
    ['no point at all', {}],
    ['a point without numbers', { position: { lat: undefined, lng: undefined } }],
    ['a latitude off the globe', at(91, 9.7)],
    ['a longitude off the globe', at(49.3, 181)],
  ])('offers no way to somebody held with %s', async (_, person) => {
    profile.mockResolvedValue(person)
    const { onMap, ask } = useContactOnMap()
    await ask(TOBIAS)

    expect(profile).toHaveBeenCalledTimes(1)
    expect(onMap.value).toBeNull()
  })

  // The same through what the real route makes of the GMS's answer (toProfile), the GMS's own
  // `[lng, lat]` included -- and the control: the same person with a place is offered the way.
  it.each([
    ['no location at all', {}],
    ['a location of null', { location: null }],
    ['an empty location', { location: [] }],
    ['a latitude off the globe', { location: [9.7, 91] }],
  ])('offers no way to somebody the GMS answers with %s', async (_, answer) => {
    const answered = { uuid: TOBIAS.gradidoID, alias: 'Tobias', entries: [], ...answer }
    profile.mockImplementation(async () => toProfile(answered))
    const { onMap, ask } = useContactOnMap()
    await ask(TOBIAS)
    expect(onMap.value).toBeNull()

    profile.mockImplementation(async () => toProfile({ ...answered, location: [9.7, 49.3] }))
    await ask(TOBIAS)
    expect(onMap.value).toEqual(TOBIAS)
  })

  it('does not ask at all for a member who may not open the map', async () => {
    state.gmsAllowed = false
    const { onMap, ask } = useContactOnMap()
    await ask(TOBIAS)

    // Not asked and refused: NOT ASKED. The token for the question is minted with the id of the
    // one who asks, and a member who is not findable has left the service it would go to.
    expect(profile).not.toHaveBeenCalled()
    expect(onMap.value).toBeNull()
  })

  it('does not ask about the member themselves', async () => {
    const { onMap, ask } = useContactOnMap()
    await ask({ gradidoID: ME, communityUuid: OWN_COMMUNITY })

    expect(profile).not.toHaveBeenCalled()
    expect(onMap.value).toBeNull()
  })

  it('lets go of what was known the moment another person is asked about', async () => {
    const { onMap, ask } = useContactOnMap()
    await ask(TOBIAS)
    expect(onMap.value).toEqual(TOBIAS)

    const answer = held()
    profile.mockReturnValue(answer.promise)
    ask(IRA)
    // Before the GMS has said anything about Ira: Tobias's way is gone already.
    expect(onMap.value).toBeNull()

    answer.resolve(at(52.5, 13.4))
    await flushPromises()
    expect(onMap.value).toEqual({ gradidoID: IRA.gradidoID, communityUuid: IRA.communityUuid })
  })

  it('lets an answer go that comes after the window has moved on to somebody else', async () => {
    const first = held()
    profile.mockReturnValueOnce(first.promise)
    const { onMap, ask } = useContactOnMap()
    ask(TOBIAS)

    // Ira is not on the map; Tobias's answer says he is, and comes late.
    profile.mockRejectedValueOnce(Object.assign(new Error('HTTP 404'), { status: 404 }))
    await ask(IRA)
    expect(onMap.value).toBeNull()

    first.resolve(at(49.3, 9.7))
    await flushPromises()
    expect(onMap.value).toBeNull()
  })

  it('lets an answer go that comes after the window has closed', async () => {
    const answer = held()
    profile.mockReturnValue(answer.promise)
    const { onMap, ask } = useContactOnMap()
    ask(TOBIAS)
    await ask(null)

    answer.resolve(at(49.3, 9.7))
    await flushPromises()
    expect(onMap.value).toBeNull()
  })

  it('lets a refusal go that comes late, too: the next person keeps their way', async () => {
    const first = held()
    profile.mockReturnValueOnce(first.promise)
    const { onMap, ask } = useContactOnMap()
    ask(TOBIAS)
    await ask(IRA)
    expect(onMap.value).toEqual({ gradidoID: IRA.gradidoID, communityUuid: IRA.communityUuid })

    first.reject(Object.assign(new Error('HTTP 404'), { status: 404 }))
    await flushPromises()
    expect(onMap.value).toEqual({ gradidoID: IRA.gradidoID, communityUuid: IRA.communityUuid })
  })
})
