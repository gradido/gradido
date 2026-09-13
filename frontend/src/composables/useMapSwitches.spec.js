// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { query } }),
}))

const NEW = { mapEngine: 'MAPLIBRE', geoProvider: 'GMS' }

const answer = (switches) =>
  Promise.resolve({
    data: { matchingMapSwitches: { __typename: 'MatchingMapSwitches', ...switches } },
  })

// The kept answer lives in the module, so every test starts from a fresh copy of it.
const freshModule = async () => {
  vi.resetModules()
  return await import('./useMapSwitches')
}

describe('useMapSwitches', () => {
  beforeEach(() => {
    query.mockReset()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-13T08:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('asks the server, fresh, and answers its two switches', async () => {
    const { useMapSwitches } = await freshModule()
    const { matchingMapSwitches } = await import('@/graphql/queries')
    query.mockReturnValueOnce(answer(NEW))

    expect(await useMapSwitches().mapSwitches()).toEqual(NEW)
    expect(query).toHaveBeenCalledWith({ query: matchingMapSwitches, fetchPolicy: 'network-only' })
  })

  it('asks once for every map that opens while the question is out or the answer is young', async () => {
    const { useMapSwitches } = await freshModule()
    query.mockReturnValue(answer(NEW))

    // Two components at once - the big map and its list - and a third a little later.
    const both = await Promise.all([useMapSwitches().mapSwitches(), useMapSwitches().mapSwitches()])
    vi.setSystemTime(new Date('2026-09-13T08:04:59Z'))
    const later = await useMapSwitches().mapSwitches()

    expect(both).toEqual([NEW, NEW])
    expect(later).toEqual(NEW)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('asks again once the answer is five minutes old', async () => {
    const { useMapSwitches } = await freshModule()
    query.mockReturnValueOnce(answer(NEW))
    query.mockReturnValueOnce(answer({ mapEngine: 'LEAFLET', geoProvider: 'GMS' }))
    const { mapSwitches } = useMapSwitches()
    await mapSwitches()

    // Just under the limit: still the kept answer.
    vi.setSystemTime(new Date('2026-09-13T08:04:59.999Z'))
    expect(await mapSwitches()).toEqual(NEW)
    expect(query).toHaveBeenCalledTimes(1)

    // At the limit: an admin's switch arrives.
    vi.setSystemTime(new Date('2026-09-13T08:05:00Z'))
    expect(await mapSwitches()).toEqual({ mapEngine: 'LEAFLET', geoProvider: 'GMS' })
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('answers the old map and search when the question fails, and asks again next time', async () => {
    const { useMapSwitches, OLD_MAP_SWITCHES } = await freshModule()
    query.mockReturnValueOnce(Promise.reject(new Error('Network error')))
    query.mockReturnValueOnce(answer(NEW))
    const { mapSwitches } = useMapSwitches()

    expect(await mapSwitches()).toEqual({ mapEngine: 'LEAFLET', geoProvider: 'NOMINATIM' })
    expect(OLD_MAP_SWITCHES).toEqual({ mapEngine: 'LEAFLET', geoProvider: 'NOMINATIM' })
    // ⛔ The failure is not kept: the very next call, a second later, asks again.
    vi.setSystemTime(new Date('2026-09-13T08:00:01Z'))
    expect(await mapSwitches()).toEqual(NEW)
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('does not keep a question that failed at once as the answer', async () => {
    // A client that throws before it returns a promise. Clearing the question inside the
    // question would run before it is stored, and the failure would stand for good.
    const { useMapSwitches } = await freshModule()
    query.mockImplementationOnce(() => {
      throw new Error('no client')
    })
    query.mockReturnValueOnce(answer(NEW))
    const { mapSwitches } = useMapSwitches()

    expect(await mapSwitches()).toEqual({ mapEngine: 'LEAFLET', geoProvider: 'NOMINATIM' })
    expect(await mapSwitches()).toEqual(NEW)
  })
})
