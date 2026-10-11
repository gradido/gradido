// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { getHomeCommunityDrizzle } from 'database'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { GmsUserCountError, GmsUserCountFailure, getGmsUserCount } from './GmsClient'
import {
  askGmsForMapMemberCount,
  MAP_MEMBER_COUNT_REFRESH_MS,
  MapMemberCount,
  MapMemberCountAnswer,
  mapMemberCount,
} from './mapMemberCount'

jest.mock('database', () => ({
  getHomeCommunityDrizzle: jest.fn(),
}))
// The request itself has its own tests (GmsClient.test.ts); here only who is asked, with what.
jest.mock('./GmsClient', () => ({
  ...jest.requireActual('./GmsClient'),
  getGmsUserCount: jest.fn(),
}))

const homeCommunity = getHomeCommunityDrizzle as jest.Mock
const gmsUserCount = getGmsUserCount as jest.Mock
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.mapMemberCount`)

const says = (count: number): MapMemberCountAnswer => ({ success: true, value: count })
const fails = (reason: GmsUserCountFailure, detail = 'status 404'): MapMemberCountAnswer => ({
  success: false,
  error: new GmsUserCountError(reason, detail),
})

/** A GMS that gives one answer per round, in this order, and the last one from then on. */
const gmsAnswering = (...answers: (MapMemberCountAnswer | Error)[]) => {
  let round = 0
  return jest.fn(async () => {
    const answer = answers[Math.min(round, answers.length - 1)]
    round += 1
    if (answer instanceof Error) {
      throw answer
    }
    return answer
  })
}

/** Lets a round that was started by a timer run to its end, where it sets the next timer. */
const letTheRoundFinish = async () => {
  for (let turn = 0; turn < 10; turn += 1) {
    await Promise.resolve()
  }
}

describe('MapMemberCount', () => {
  const originalActive = CONFIG.GMS_ACTIVE

  beforeEach(() => {
    jest.clearAllMocks()
    CONFIG.GMS_ACTIVE = true
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  afterAll(() => {
    CONFIG.GMS_ACTIVE = originalActive
  })

  it('knows nothing before the GMS has answered', () => {
    const count = new MapMemberCount(gmsAnswering(says(773)))

    expect(count.known()).toBeNull()
  })

  it('holds what the GMS last said', async () => {
    const count = new MapMemberCount(gmsAnswering(says(773), says(781)))

    await count.refresh()
    expect(count.known()).toBe(773)

    await count.refresh()
    expect(count.known()).toBe(781)
  })

  it('holds a map with nobody on it as a number, not as nothing', async () => {
    const count = new MapMemberCount(gmsAnswering(says(0)))

    await count.refresh()

    expect(count.known()).toBe(0)
  })

  // ⛔ A GMS that is briefly away must not take the number off every invitation.
  describe('a round that brings no number', () => {
    it.each([
      ['a GMS without the route', fails('NO_ROUTE')],
      ['a refusal', fails('REFUSED', 'status 500')],
      ['no answer in time', fails('UNREACHABLE', 'timeout of 30000ms exceeded')],
      ['an answer that is not a count', fails('UNREADABLE', 'count: expected number')],
      ['a community without a key', null],
      ['a home community that cannot be read', new Error('the database is away')],
    ])('leaves the last one standing: %s', async (_name, noNumber) => {
      const count = new MapMemberCount(gmsAnswering(says(773), noNumber))
      await count.refresh()

      await expect(count.refresh()).resolves.toBeUndefined()

      expect(count.known()).toBe(773)
    })

    it('leaves nothing standing where there never was a number', async () => {
      const count = new MapMemberCount(gmsAnswering(fails('NO_ROUTE')))

      await count.refresh()

      expect(count.known()).toBeNull()
    })

    it('takes the number again once the GMS answers', async () => {
      const count = new MapMemberCount(gmsAnswering(fails('NO_ROUTE'), says(773)))
      await count.refresh()

      await count.refresh()

      expect(count.known()).toBe(773)
    })
  })

  // A GMS released before the route answers 404 for as long as it runs: 96 rounds a day.
  describe('the log', () => {
    it('tells of a failure once, not on every round', async () => {
      const count = new MapMemberCount(gmsAnswering(fails('NO_ROUTE')))

      await count.refresh()
      await count.refresh()
      await count.refresh()

      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith(
        'members on the map: no number from the GMS: GMS_USER_COUNT_FAILED NO_ROUTE: status 404',
      )
    })

    it('tells of another failure when it changes', async () => {
      const count = new MapMemberCount(
        gmsAnswering(fails('NO_ROUTE'), fails('REFUSED', 'status 401')),
      )

      await count.refresh()
      await count.refresh()

      expect(logger.warn).toHaveBeenCalledTimes(2)
    })

    it('tells of the number when it comes and when it moves, and is quiet in between', async () => {
      const count = new MapMemberCount(
        gmsAnswering(fails('NO_ROUTE'), says(773), says(773), says(774)),
      )

      await count.refresh()
      await count.refresh()
      await count.refresh()
      await count.refresh()

      expect(logger.info).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenNthCalledWith(1, 'members on the map: 773 members on the map')
      expect(logger.info).toHaveBeenNthCalledWith(2, 'members on the map: 774 members on the map')
    })

    it('tells of a failure again after the GMS had answered in between', async () => {
      const count = new MapMemberCount(
        gmsAnswering(fails('NO_ROUTE'), says(773), fails('NO_ROUTE')),
      )

      await count.refresh()
      await count.refresh()
      await count.refresh()

      expect(logger.warn).toHaveBeenCalledTimes(2)
    })

    it('says a round that threw as an error, with what was thrown', async () => {
      const thrown = new Error('the database is away')
      const count = new MapMemberCount(gmsAnswering(thrown))

      await count.refresh()

      expect(logger.error).toHaveBeenCalledWith(
        'members on the map: the question could not be asked',
        thrown,
      )
    })
  })

  describe('start', () => {
    it('asks at once without being waited for, then once every interval', async () => {
      jest.useFakeTimers()
      const gms = gmsAnswering(says(773), says(774))
      const count = new MapMemberCount(gms)

      count.start(1000)
      // Not in the call itself: the server starts without waiting for the GMS.
      expect(gms).not.toHaveBeenCalled()
      expect(count.known()).toBeNull()

      jest.advanceTimersByTime(0)
      await letTheRoundFinish()
      expect(gms).toHaveBeenCalledTimes(1)
      expect(count.known()).toBe(773)

      jest.advanceTimersByTime(999)
      await letTheRoundFinish()
      expect(gms).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1)
      await letTheRoundFinish()
      expect(gms).toHaveBeenCalledTimes(2)
      expect(count.known()).toBe(774)
    })

    it('asks every quarter of an hour where it is told nothing else', async () => {
      jest.useFakeTimers()
      const gms = gmsAnswering(says(773))
      const count = new MapMemberCount(gms)

      count.start()
      jest.advanceTimersByTime(0)
      await letTheRoundFinish()
      jest.advanceTimersByTime(15 * 60 * 1000 - 1)
      await letTheRoundFinish()
      expect(gms).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1)
      await letTheRoundFinish()
      expect(gms).toHaveBeenCalledTimes(2)
      expect(MAP_MEMBER_COUNT_REFRESH_MS).toBe(15 * 60 * 1000)
    })

    it('goes on after a round that threw', async () => {
      jest.useFakeTimers()
      const gms = gmsAnswering(new Error('the database is away'), says(773))
      const count = new MapMemberCount(gms)

      count.start(1000)
      jest.advanceTimersByTime(0)
      await letTheRoundFinish()
      expect(count.known()).toBeNull()

      jest.advanceTimersByTime(1000)
      await letTheRoundFinish()
      expect(count.known()).toBe(773)
    })

    it('runs once, however often it is started', async () => {
      jest.useFakeTimers()
      const gms = gmsAnswering(says(773))
      const count = new MapMemberCount(gms)

      count.start(1000)
      count.start(1000)
      jest.advanceTimersByTime(0)
      await letTheRoundFinish()

      expect(gms).toHaveBeenCalledTimes(1)
    })

    it('asks nobody on a server without the GMS', async () => {
      jest.useFakeTimers()
      CONFIG.GMS_ACTIVE = false
      const gms = gmsAnswering(says(773))
      const count = new MapMemberCount(gms)

      count.start(1000)
      jest.advanceTimersByTime(5000)
      await letTheRoundFinish()

      expect(gms).not.toHaveBeenCalled()
      expect(count.known()).toBeNull()
    })
  })

  describe('asking the GMS', () => {
    it('asks with the key of this community and hands on what comes back', async () => {
      homeCommunity.mockResolvedValue({ gmsApiKey: 'the-community-key' })
      gmsUserCount.mockResolvedValue({ success: true, value: 773 })

      await expect(askGmsForMapMemberCount()).resolves.toEqual({ success: true, value: 773 })

      expect(gmsUserCount).toHaveBeenCalledTimes(1)
      expect(gmsUserCount).toHaveBeenCalledWith('the-community-key')
    })

    it('hands on a failure as it is', async () => {
      const failure = fails('NO_ROUTE')
      homeCommunity.mockResolvedValue({ gmsApiKey: 'the-community-key' })
      gmsUserCount.mockResolvedValue(failure)

      await expect(askGmsForMapMemberCount()).resolves.toBe(failure)
    })

    it.each([[null], ['']])('has nobody to ask with the key %p', async (gmsApiKey) => {
      homeCommunity.mockResolvedValue({ gmsApiKey })

      await expect(askGmsForMapMemberCount()).resolves.toBeNull()

      expect(gmsUserCount).not.toHaveBeenCalled()
    })

    // Entered on the admin page while the process runs: read on every round, not once.
    it('reads the key again on every round', async () => {
      homeCommunity
        .mockResolvedValueOnce({ gmsApiKey: null })
        .mockResolvedValueOnce({ gmsApiKey: 'entered-later' })
      gmsUserCount.mockResolvedValue({ success: true, value: 773 })
      const count = new MapMemberCount()

      await count.refresh()
      expect(count.known()).toBeNull()

      await count.refresh()
      expect(count.known()).toBe(773)
      expect(gmsUserCount).toHaveBeenCalledWith('entered-later')
    })
  })

  // What index.ts starts and the query reads.
  it('is one for the process, and knows nothing until it is started', () => {
    expect(mapMemberCount).toBeInstanceOf(MapMemberCount)
    expect(mapMemberCount.known()).toBeNull()
  })
})
