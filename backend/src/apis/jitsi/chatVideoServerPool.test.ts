// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_VIDEO_CHECK_INTERVAL_MS,
  CHAT_VIDEO_CHECK_MAX_AGE_MS,
  ChatVideoServer,
  ChatVideoServerList,
} from '@/data/ChatVideoServer.logic'
import { ChatVideoServerPool } from './chatVideoServerPool'
import { JitsiProbeAnswer } from './jitsiProbe'
import { JitsiProbeError, JitsiProbeFailure } from './jitsiProbe.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.jitsi.chatVideoServerPool`)

type Answer = Result<JitsiProbeAnswer, JitsiProbeError>

const server = (host: string): ChatVideoServer => ({
  baseUrl: `https://${host}/`,
  host,
  operator: null,
  prefix: '',
})
const A = server('a.example')
const B = server('b.example')
const C = server('c.example')

const listOf =
  (...servers: ChatVideoServer[]) =>
  (): ChatVideoServerList => ({ source: 'DEFAULT', servers, rejected: [] })

const passes = (latencyMs: number): Answer => ({ success: true, value: { latencyMs } })
const fails = (host: string, reason: JitsiProbeFailure): Answer => ({
  success: false,
  error: new JitsiProbeError(host, reason, 'as the test says'),
})

/** A probe that answers per host as `answers` says. */
const probeAnswering = (answers: Record<string, Answer>) =>
  jest.fn(async (checked: ChatVideoServer) => answers[checked.host])

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ChatVideoServerPool', () => {
  it('has no server before the first check is through', () => {
    const pool = new ChatVideoServerPool(listOf(A), probeAnswering({ 'a.example': passes(50) }))
    expect(pool.pick()).toBeNull()
    expect(pool.state()).toEqual([])
  })

  describe('refresh', () => {
    it('checks every server and holds what it found, in the order of the list', async () => {
      const probe = probeAnswering({
        'a.example': passes(80),
        'b.example': fails('b.example', 'UNREACHABLE'),
        'c.example': fails('c.example', 'NO_ANONYMOUS'),
      })
      const pool = new ChatVideoServerPool(listOf(A, B, C), probe)
      const before = Date.now()
      await pool.refresh()

      expect(probe.mock.calls.map(([checked]) => checked.host)).toEqual([
        'a.example',
        'b.example',
        'c.example',
      ])
      expect(pool.state()).toEqual([
        { server: A, ok: true, reason: null, checkedAt: expect.any(Date), latencyMs: 80, picks: 0 },
        {
          server: B,
          ok: false,
          reason: 'UNREACHABLE',
          checkedAt: expect.any(Date),
          latencyMs: null,
          picks: 0,
        },
        {
          server: C,
          ok: false,
          reason: 'NO_ANONYMOUS',
          checkedAt: expect.any(Date),
          latencyMs: null,
          picks: 0,
        },
      ])
      expect(pool.state()[0].checkedAt.getTime()).toBeGreaterThanOrEqual(before)
    })

    it('says in one sentence how many answer, and names each one that does not', async () => {
      const pool = new ChatVideoServerPool(
        listOf(A, B, C),
        probeAnswering({
          'a.example': passes(80),
          'b.example': fails('b.example', 'UNREACHABLE'),
          'c.example': fails('c.example', 'LOGIN_REQUIRED'),
        }),
      )
      await pool.refresh()
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith(
        'chat video servers: 1 of 3 answer -- b.example UNREACHABLE, c.example LOGIN_REQUIRED',
      )
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('says only the count where every server answers', async () => {
      const pool = new ChatVideoServerPool(
        listOf(A, B),
        probeAnswering({ 'a.example': passes(80), 'b.example': passes(90) }),
      )
      await pool.refresh()
      expect(logger.info).toHaveBeenCalledWith('chat video servers: 2 of 2 answer')
    })

    it('takes a server whose check threw as not answering, and the others as they are', async () => {
      const probe = jest.fn(async (checked: ChatVideoServer) => {
        if (checked.host === 'b.example') {
          throw new Error('a bug in the probe')
        }
        return passes(60)
      })
      const pool = new ChatVideoServerPool(listOf(A, B), probe)
      await pool.refresh()
      expect(pool.state().map((state) => [state.server.host, state.ok, state.reason])).toEqual([
        ['a.example', true, null],
        ['b.example', false, 'UNREACHABLE'],
      ])
      expect(logger.error).toHaveBeenCalledWith('checking b.example threw', expect.any(Error))
    })

    it('reads the list anew for every check', async () => {
      let servers = [A]
      const pool = new ChatVideoServerPool(
        () => ({ source: 'DEFAULT', servers, rejected: [] }),
        probeAnswering({ 'a.example': passes(1), 'b.example': passes(2) }),
      )
      await pool.refresh()
      servers = [A, B]
      await pool.refresh()
      expect(pool.state().map((state) => state.server.host)).toEqual(['a.example', 'b.example'])
    })

    it('keeps the picks of a server across checks -- also those made while a check ran', async () => {
      const pending: ((answer: Answer) => void)[] = []
      const probe = jest
        .fn()
        .mockResolvedValueOnce(passes(10))
        .mockImplementationOnce(() => new Promise<Answer>((resolve) => pending.push(resolve)))
      const pool = new ChatVideoServerPool(listOf(A), probe)
      await pool.refresh()
      pool.pick()
      pool.pick()

      const second = pool.refresh()
      pool.pick()
      pending[0](passes(20))
      await second

      expect(pool.state()[0]).toMatchObject({ latencyMs: 20, picks: 3 })
    })
  })

  describe('pick', () => {
    it('chooses among the servers that answer, each equally likely, and no other', async () => {
      const pool = new ChatVideoServerPool(
        listOf(A, B, C),
        probeAnswering({
          'a.example': passes(80),
          'b.example': fails('b.example', 'NOT_JITSI'),
          'c.example': passes(90),
        }),
      )
      await pool.refresh()
      const chosen = new Map<string, number>()
      for (let draw = 0; draw < 1000; draw++) {
        const host = pool.pick()?.server.host ?? 'none'
        chosen.set(host, (chosen.get(host) ?? 0) + 1)
      }
      expect([...chosen.keys()].sort()).toEqual(['a.example', 'c.example'])
      // Half and half: 500 each, give or take -- 100 is more than six standard deviations.
      for (const host of ['a.example', 'c.example']) {
        expect(chosen.get(host)).toBeGreaterThan(400)
        expect(chosen.get(host)).toBeLessThan(600)
      }
      expect(pool.state().map((state) => state.picks)).toEqual([
        chosen.get('a.example'),
        0,
        chosen.get('c.example'),
      ])
    })

    it('finds nothing where no server answers', async () => {
      const pool = new ChatVideoServerPool(
        listOf(A, B),
        probeAnswering({
          'a.example': fails('a.example', 'UNREACHABLE'),
          'b.example': fails('b.example', 'NO_BOSH'),
        }),
      )
      await pool.refresh()
      expect(pool.pick()).toBeNull()
      expect(pool.state().map((state) => state.picks)).toEqual([0, 0])
    })

    it('hands out a server again once it answers again', async () => {
      const probe = jest
        .fn()
        .mockResolvedValueOnce(fails('a.example', 'UNREACHABLE'))
        .mockResolvedValueOnce(passes(30))
      const pool = new ChatVideoServerPool(listOf(A), probe)
      await pool.refresh()
      expect(pool.pick()).toBeNull()
      await pool.refresh()
      expect(pool.pick()?.server).toEqual(A)
    })

    // Not the interval itself: during the seconds every regular check takes, the last check is a
    // little older than that, and no server would be found.
    it('hands out rooms on a check up to two intervals old, and none on an older one', async () => {
      const pool = new ChatVideoServerPool(listOf(A), probeAnswering({ 'a.example': passes(30) }))
      await pool.refresh()
      const checkedAt = pool.state()[0].checkedAt.getTime()
      const now = jest.spyOn(Date, 'now')
      try {
        now.mockReturnValue(checkedAt + CHAT_VIDEO_CHECK_INTERVAL_MS + 10_000)
        expect(pool.pick()?.server).toEqual(A)
        now.mockReturnValue(checkedAt + CHAT_VIDEO_CHECK_MAX_AGE_MS)
        expect(pool.pick()?.server).toEqual(A)
        now.mockReturnValue(checkedAt + CHAT_VIDEO_CHECK_MAX_AGE_MS + 1)
        expect(pool.pick()).toBeNull()
      } finally {
        now.mockRestore()
      }
    })
  })

  describe('start', () => {
    let scheduled: { run: () => Promise<void>; ms: number }[]
    let unref: jest.Mock

    beforeEach(() => {
      scheduled = []
      unref = jest.fn()
      jest.spyOn(global, 'setTimeout').mockImplementation(((
        run: () => Promise<void>,
        ms: number,
      ) => {
        scheduled.push({ run, ms })
        return { unref }
      }) as unknown as typeof setTimeout)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('checks at once, then every interval, on a timer that keeps no process alive', async () => {
      const probe = probeAnswering({ 'a.example': passes(40) })
      const pool = new ChatVideoServerPool(listOf(A), probe)
      pool.start(600_000)

      // Scheduled, not run: start() does not wait for the first check.
      expect(scheduled.map((timer) => timer.ms)).toEqual([0])
      expect(probe).not.toHaveBeenCalled()
      await scheduled[0].run()
      expect(probe).toHaveBeenCalledTimes(1)
      expect(pool.pick()?.server).toEqual(A)

      // The next check comes one interval after this one is through, not earlier.
      expect(scheduled.map((timer) => timer.ms)).toEqual([0, 600_000])
      await scheduled[1].run()
      expect(probe).toHaveBeenCalledTimes(2)
      expect(unref).toHaveBeenCalledTimes(3)
    })

    it('starts once', () => {
      const pool = new ChatVideoServerPool(listOf(A), probeAnswering({}))
      pool.start(600_000)
      pool.start(600_000)
      expect(scheduled).toHaveLength(1)
    })

    it('goes on after a check that threw, and says so', async () => {
      const list = jest
        .fn()
        .mockReturnValueOnce(listOf(A)())
        .mockImplementationOnce(() => {
          throw new Error('the list could not be read')
        })
      const pool = new ChatVideoServerPool(list, probeAnswering({}))
      pool.start(600_000)
      await scheduled[0].run()
      expect(logger.error).toHaveBeenCalledWith(
        'checking the chat video servers failed',
        expect.any(Error),
      )
      expect(scheduled.map((timer) => timer.ms)).toEqual([0, 600_000])
    })

    it('names where the list comes from, and each entry left out, once', () => {
      const pool = new ChatVideoServerPool(
        () => ({
          source: 'CHAT_VIDEO_SERVERS',
          servers: [A],
          rejected: [{ entry: 'http://plain.example/', reason: 'NOT_HTTPS' }],
        }),
        probeAnswering({}),
      )
      pool.start(600_000)
      expect(logger.info).toHaveBeenCalledWith(
        'chat video servers: 1 from CHAT_VIDEO_SERVERS, checked every 600000 ms',
      )
      expect(logger.warn).toHaveBeenCalledWith(
        'chat video server left out: http://plain.example/ (NOT_HTTPS)',
      )
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('says so loudly where CHAT_VIDEO_SERVERS holds no usable entry', () => {
      const pool = new ChatVideoServerPool(
        () => ({
          source: 'CHAT_VIDEO_SERVERS',
          servers: [],
          rejected: [{ entry: 'fairmeeting.net', reason: 'NOT_HTTPS' }],
        }),
        probeAnswering({}),
      )
      pool.start(600_000)
      expect(logger.error).toHaveBeenCalledWith(
        'CHAT_VIDEO_SERVERS is set, but holds no usable entry: no video rooms here',
      )
    })
  })
})
