// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { query, state } = vi.hoisted(() => ({ query: vi.fn(), state: { gmsAllowed: true } }))

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query } }),
}))

// The composable no longer reads the store. The mock stays so that a gate on `gmsAllowed`,
// put back, finds a store to read from and the test below can say so - without it such a gate
// would throw, and every test would fail for a reason that names nothing.
vi.mock('vuex', () => ({
  useStore: () => ({ state }),
}))

// What the backend hands out (the operator's GMS_DASHBOARD_URL, closed with a slash); the API
// answers under the same origin at /gms/.
const DASHBOARD = 'https://ki-playground-gms.gradido.net/'
const BASE = 'https://ki-playground-gms.gradido.net/gms/'

const answer = (gmsDashboardUrl = DASHBOARD) => Promise.resolve({ data: { gmsDashboardUrl } })

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

  it('asks the backend for the dashboard address, fresh, and answers the API address', async () => {
    const { useGmsBase } = await freshModule()
    const { gmsDashboardUrl } = await import('@/graphql/queries')
    query.mockReturnValueOnce(answer())

    expect(await useGmsBase().gmsBase()).toBe(BASE)
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith({
      query: gmsDashboardUrl,
      fetchPolicy: 'network-only',
    })
  })

  // ⛔ The reason the address has a query of its own. The token query mints a member token on
  // the way, which sends the member's gradidoID to the GMS - for a place search that needs
  // neither, and for members the GMS then answers 400.
  it('never asks for a member token to get it', async () => {
    const { useGmsBase } = await freshModule()
    const { authenticateGmsUserSearch } = await import('@/graphql/queries')
    query.mockReturnValue(answer())

    await useGmsBase().gmsBase()

    expect(query).not.toHaveBeenCalledWith(
      expect.objectContaining({ query: authenticateGmsUserSearch }),
    )
  })

  // Bernd, 18.09.2026, taking back his decision of 13.09.: the router sends a member without
  // "findable" to the home tab, and the search on the map there is how they set their home.
  it('gives a member who switched findable off the address as well', async () => {
    const { useGmsBase } = await freshModule()
    state.gmsAllowed = false
    query.mockReturnValueOnce(answer())

    expect(await useGmsBase().gmsBase()).toBe(BASE)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('answers no address where the server has no GMS', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(answer(null))
    const { gmsBase } = useGmsBase()

    expect(await gmsBase()).toBeNull()
    // Nothing was kept, so the next search asks again.
    expect(await gmsBase()).toBeNull()
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('asks once for every search that starts while the question is out or the address is young', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(answer())

    const both = await Promise.all([useGmsBase().gmsBase(), useGmsBase().gmsBase()])
    vi.setSystemTime(new Date('2026-09-13T08:04:59Z'))
    const later = await useGmsBase().gmsBase()

    expect(both).toEqual([BASE, BASE])
    expect(later).toBe(BASE)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('asks again once the address is five minutes old', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValue(answer())
    const { gmsBase } = useGmsBase()
    await gmsBase()

    vi.setSystemTime(new Date('2026-09-13T08:04:59.999Z'))
    await gmsBase()
    expect(query).toHaveBeenCalledTimes(1)

    vi.setSystemTime(new Date('2026-09-13T08:05:00Z'))
    await gmsBase()
    expect(query).toHaveBeenCalledTimes(2)
  })

  // A backend that is away, or one that does not know the query yet.
  it('answers no address when the question fails, and asks again next time', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValueOnce(Promise.reject(new Error('Network error')))
    query.mockReturnValueOnce(answer())
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
    query.mockReturnValueOnce(answer())
    const { gmsBase } = useGmsBase()

    expect(await gmsBase()).toBeNull()
    expect(await gmsBase()).toBe(BASE)
  })

  it('answers no address for a dashboard that is no absolute URL', async () => {
    const { useGmsBase } = await freshModule()
    query.mockReturnValueOnce(answer('user-search'))

    expect(await useGmsBase().gmsBase()).toBeNull()
  })
})
