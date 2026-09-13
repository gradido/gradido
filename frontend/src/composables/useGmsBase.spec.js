// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { query, state } = vi.hoisted(() => ({ query: vi.fn(), state: { gmsAllowed: true } }))

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query } }),
}))

vi.mock('vuex', () => ({
  useStore: () => ({ state }),
}))

// The page the backend mints the token for (GMS_DASHBOARD_URL + the user search route); the
// API answers under the same origin at /gms/.
const PAGE = 'https://ki-playground-gms.gradido.net/user-search'
const BASE = 'https://ki-playground-gms.gradido.net/gms/'

const access = (url = PAGE) =>
  Promise.resolve({
    data: {
      authenticateGmsUserSearch: { __typename: 'GmsUserAuthenticationResult', url, token: 't' },
    },
  })

// The kept address lives in the module, so every test starts from a fresh copy of it.
const freshModule = async () => {
  vi.resetModules()
  return await import('./useGmsBase')
}

describe('useGmsBase', () => {
  beforeEach(() => {
    query.mockReset()
    state.gmsAllowed = true
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-13T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks for the access of a member who takes part, fresh, and answers the API address', async () => {
    const { useGmsBase } = await freshModule()
    const { authenticateGmsUserSearch } = await import('@/graphql/queries')
    query.mockReturnValueOnce(access())

    expect(await useGmsBase().gmsBase()).toBe(BASE)
    expect(query).toHaveBeenCalledWith({
      query: authenticateGmsUserSearch,
      fetchPolicy: 'network-only',
    })
  })

  // Bernd, 13.09.2026: a member who switched "findable" off is not in the GMS, and asking
  // would send their id there.
  it('asks nothing for a member who switched findable off', async () => {
    const { useGmsBase } = await freshModule()
    state.gmsAllowed = false

    expect(await useGmsBase().gmsBase()).toBeNull()
    expect(query).not.toHaveBeenCalled()
  })

  it('gives such a member no address, even with one kept from somebody who takes part', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(access())
    const { gmsBase } = useGmsBase()
    expect(await gmsBase()).toBe(BASE)

    state.gmsAllowed = false

    expect(await gmsBase()).toBeNull()
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('asks once for every search that starts while the question is out or the address is young', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(access())

    const both = await Promise.all([useGmsBase().gmsBase(), useGmsBase().gmsBase()])
    vi.setSystemTime(new Date('2026-09-13T08:04:59Z'))
    const later = await useGmsBase().gmsBase()

    expect(both).toEqual([BASE, BASE])
    expect(later).toBe(BASE)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('asks again once the address is five minutes old', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(access())
    const { gmsBase } = useGmsBase()
    await gmsBase()

    vi.setSystemTime(new Date('2026-09-13T08:04:59.999Z'))
    await gmsBase()
    expect(query).toHaveBeenCalledTimes(1)

    vi.setSystemTime(new Date('2026-09-13T08:05:00Z'))
    await gmsBase()
    expect(query).toHaveBeenCalledTimes(2)
  })

  // The GMS answers 400 for a member it does not hold, and the backend passes that on.
  it('answers no address when the question fails, and asks again next time', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValueOnce(Promise.reject(new Error('Request failed with status code 400')))
    query.mockReturnValueOnce(access())
    const { gmsBase } = useGmsBase()

    expect(await gmsBase()).toBeNull()
    vi.setSystemTime(new Date('2026-09-13T08:00:01Z'))
    expect(await gmsBase()).toBe(BASE)
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('does not keep a question that failed at once as the answer', async () => {
    const { useGmsBase } = await freshModule()
    query.mockImplementationOnce(() => {
      throw new Error('no client')
    })
    query.mockReturnValueOnce(access())
    const { gmsBase } = useGmsBase()

    expect(await gmsBase()).toBeNull()
    expect(await gmsBase()).toBe(BASE)
  })

  it('answers no address for a page that is no absolute URL', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValueOnce(access('user-search'))

    expect(await useGmsBase().gmsBase()).toBeNull()
  })
})
