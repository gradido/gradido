// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { ChatVideoServerSelect, dbSelectChatVideoServers } from 'database'
import { Result } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_VIDEO_CHECK_INTERVAL_MS,
  CHAT_VIDEO_CHECK_MAX_AGE_MS,
  ChatVideoServer,
  ChatVideoServerListed,
  ChatVideoServerTable,
} from '@/data/ChatVideoServer.logic'
import { ChatVideoServerPool } from './chatVideoServerPool'
import { JitsiProbeAnswer } from './jitsiProbe'
import { JitsiProbeError, JitsiProbeFailure } from './jitsiProbe.logic'

// Only the pool's own reading of the table is replaced here -- everything else of `database`
// stays as it is. Every other test hands the pool its list itself.
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbSelectChatVideoServers: jest.fn(),
}))
const selectRows = dbSelectChatVideoServers as jest.MockedFunction<typeof dbSelectChatVideoServers>

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

/** A row of the table as the pool reads it: its id, its tick and its server. */
const row = (id: number, listedServer: ChatVideoServer, active = true): ChatVideoServerListed => ({
  id,
  active,
  server: listedServer,
})

/** The table with these servers, in this order, ids 1, 2, 3 …, each ticked. */
const tableOf =
  (...servers: ChatVideoServer[]) =>
  async (): Promise<ChatVideoServerTable> => ({
    servers: servers.map((listedServer, index) => row(index + 1, listedServer)),
    rejected: [],
  })

/** The table with these rows. */
const tableWith =
  (...rows: ChatVideoServerListed[]) =>
  async (): Promise<ChatVideoServerTable> => ({ servers: rows, rejected: [] })

const passes = (latencyMs: number): Answer => ({ success: true, value: { latencyMs } })
const fails = (host: string, reason: JitsiProbeFailure): Answer => ({
  success: false,
  error: new JitsiProbeError(host, reason, 'as the test says'),
})

/** A probe that answers per host as `answers` says. */
const probeAnswering = (answers: Record<string, Answer>) =>
  jest.fn(async (checked: ChatVideoServer) => answers[checked.host])

/**
 * A probe that holds every answer until the test lets it go: what makes a check that is under way
 * something a test can look at. `release()` answers every call so far, each with a pass.
 */
const heldProbe = () => {
  const waiting: ((answer: Answer) => void)[] = []
  const probe = jest.fn(
    (_checked: ChatVideoServer) => new Promise<Answer>((resolve) => waiting.push(resolve)),
  )
  const release = () => {
    for (const resolve of waiting.splice(0)) {
      resolve(passes(10))
    }
  }
  return { probe, release }
}

/** Lets every promise that is ready go on: the probe answers, the pool puts the state in place. */
const settle = () => new Promise((resolve) => setImmediate(resolve))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ChatVideoServerPool', () => {
  it('has no server before the first check is through', () => {
    const pool = new ChatVideoServerPool(tableOf(A), probeAnswering({ 'a.example': passes(50) }))
    expect(pool.pick()).toBeNull()
    expect(pool.state()).toEqual([])
  })

  it('reads chat_video_servers where it is given no other list', async () => {
    const stored: ChatVideoServerSelect = {
      id: 7,
      baseUrl: 'https://fairmeeting.net/',
      operator: 'fairmeeting (fairkom)',
      roomPrefix: 'GradidoAkademie',
      note: 'Akademie-Lizenz',
      active: true,
      createdAt: new Date(),
      updatedAt: null,
    }
    selectRows.mockResolvedValue([stored])
    const pool = new ChatVideoServerPool(
      undefined,
      probeAnswering({ 'fairmeeting.net': passes(5) }),
    )
    await pool.refreshNow()

    expect(selectRows).toHaveBeenCalledTimes(1)
    expect(pool.state()).toEqual([
      expect.objectContaining({
        id: 7,
        active: true,
        ok: true,
        server: {
          baseUrl: 'https://fairmeeting.net/',
          host: 'fairmeeting.net',
          operator: 'fairmeeting (fairkom)',
          prefix: 'GradidoAkademie',
        },
      }),
    ])
  })

  describe('a check', () => {
    it('checks every server and holds what it found, in the order of the list', async () => {
      const probe = probeAnswering({
        'a.example': passes(80),
        'b.example': fails('b.example', 'UNREACHABLE'),
        'c.example': fails('c.example', 'NO_ANONYMOUS'),
      })
      const pool = new ChatVideoServerPool(tableOf(A, B, C), probe)
      const before = Date.now()
      await pool.refreshNow()

      expect(probe.mock.calls.map(([checked]) => checked.host)).toEqual([
        'a.example',
        'b.example',
        'c.example',
      ])
      expect(pool.state()).toEqual([
        {
          id: 1,
          server: A,
          active: true,
          ok: true,
          reason: null,
          checkedAt: expect.any(Date),
          latencyMs: 80,
          picks: 0,
        },
        {
          id: 2,
          server: B,
          active: true,
          ok: false,
          reason: 'UNREACHABLE',
          checkedAt: expect.any(Date),
          latencyMs: null,
          picks: 0,
        },
        {
          id: 3,
          server: C,
          active: true,
          ok: false,
          reason: 'NO_ANONYMOUS',
          checkedAt: expect.any(Date),
          latencyMs: null,
          picks: 0,
        },
      ])
      expect(pool.state()[0].checkedAt.getTime()).toBeGreaterThanOrEqual(before)
    })

    // Two requests every ten minutes cost little, and the admin page shows whether a server
    // switched off answers again.
    it('checks the servers switched off as well, and says which are', async () => {
      const probe = probeAnswering({ 'a.example': passes(10), 'b.example': passes(20) })
      const pool = new ChatVideoServerPool(tableWith(row(1, A), row(2, B, false)), probe)
      await pool.refreshNow()

      expect(probe).toHaveBeenCalledTimes(2)
      expect(pool.state().map((state) => [state.id, state.active, state.ok])).toEqual([
        [1, true, true],
        [2, false, true],
      ])
    })

    it('says in one sentence how many answer, how many of them are chosen from, and names each one that does not', async () => {
      const pool = new ChatVideoServerPool(
        tableWith(row(1, A), row(2, B, false), row(3, C)),
        probeAnswering({
          'a.example': passes(80),
          'b.example': passes(70),
          'c.example': fails('c.example', 'LOGIN_REQUIRED'),
        }),
      )
      await pool.refreshNow()
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith(
        'chat video servers: 2 of 3 answer, 1 of them in the random choice -- c.example LOGIN_REQUIRED',
      )
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('says only the counts where every server answers', async () => {
      const pool = new ChatVideoServerPool(
        tableOf(A, B),
        probeAnswering({ 'a.example': passes(80), 'b.example': passes(90) }),
      )
      await pool.refreshNow()
      expect(logger.info).toHaveBeenCalledWith(
        'chat video servers: 2 of 2 answer, 2 of them in the random choice',
      )
    })

    it('leaves out a row the rules do not take, says why, and checks the others', async () => {
      const probe = probeAnswering({ 'a.example': passes(10) })
      const pool = new ChatVideoServerPool(
        async () => ({
          servers: [row(1, A)],
          rejected: [{ entry: '#2 http://plain.example/', reason: 'NOT_HTTPS' }],
        }),
        probe,
      )
      await pool.refreshNow()
      expect(logger.warn).toHaveBeenCalledWith(
        'chat video server left out: #2 http://plain.example/ (NOT_HTTPS)',
      )
      expect(pool.state().map((state) => state.id)).toEqual([1])
    })

    it('takes a server whose check threw as not answering, and the others as they are', async () => {
      const probe = jest.fn(async (checked: ChatVideoServer) => {
        if (checked.host === 'b.example') {
          throw new Error('a bug in the probe')
        }
        return passes(60)
      })
      const pool = new ChatVideoServerPool(tableOf(A, B), probe)
      await pool.refreshNow()
      expect(pool.state().map((state) => [state.server.host, state.ok, state.reason])).toEqual([
        ['a.example', true, null],
        ['b.example', false, 'UNREACHABLE'],
      ])
      expect(logger.error).toHaveBeenCalledWith('checking b.example threw', expect.any(Error))
    })

    it('reads the table anew for every check -- rows, addresses and ticks', async () => {
      let rows = [row(1, A)]
      const list = jest.fn(async () => ({ servers: rows, rejected: [] }))
      const pool = new ChatVideoServerPool(
        list,
        probeAnswering({ 'a.example': passes(1), 'b.example': passes(2), 'c.example': passes(3) }),
      )
      await pool.refreshNow()
      rows = [row(1, C, false), row(2, B)]
      await pool.refreshNow()

      expect(list).toHaveBeenCalledTimes(2)
      expect(pool.state().map((state) => [state.id, state.server.host, state.active])).toEqual([
        [1, 'c.example', false],
        [2, 'b.example', true],
      ])
    })

    it('keeps the picks of a row across checks -- also those made while a check ran', async () => {
      const pending: ((answer: Answer) => void)[] = []
      const probe = jest
        .fn()
        .mockResolvedValueOnce(passes(10))
        .mockImplementationOnce(() => new Promise<Answer>((resolve) => pending.push(resolve)))
      const pool = new ChatVideoServerPool(tableOf(A), probe)
      await pool.refreshNow()
      pool.pick()
      pool.pick()

      const second = pool.refreshNow()
      await settle()
      pool.pick()
      pending[0](passes(20))
      await second

      expect(pool.state()[0]).toMatchObject({ id: 1, latencyMs: 20, picks: 3 })
    })

    it('does not throw where the table cannot be read, and keeps what the last check found', async () => {
      const list = jest
        .fn()
        .mockImplementationOnce(tableOf(A))
        .mockRejectedValueOnce(new Error('the table could not be read'))
      const pool = new ChatVideoServerPool(list, probeAnswering({ 'a.example': passes(10) }))
      await pool.refreshNow()
      const found = pool.state()

      await expect(pool.refreshNow()).resolves.toBeUndefined()
      expect(logger.error).toHaveBeenCalledWith(
        'checking the chat video servers failed',
        expect.any(Error),
      )
      expect(pool.state()).toBe(found)
      expect(pool.pick()?.server).toEqual(A)
    })
  })

  describe('refreshNow', () => {
    // ⛔ Two checks at once would ask every server twice, and the one through last would put
    // its older view in place.
    it('never runs two checks at the same time: calls meanwhile share one more round', async () => {
      const { probe, release } = heldProbe()
      const pool = new ChatVideoServerPool(tableOf(A, B), probe)

      const first = pool.refreshNow()
      await settle()
      const second = pool.refreshNow()
      const third = pool.refreshNow()
      await settle()
      // One check under way: each server asked once, not three times.
      expect(probe).toHaveBeenCalledTimes(2)

      release()
      await settle()
      // The round after it, one for both calls.
      expect(probe).toHaveBeenCalledTimes(4)
      release()
      await Promise.all([first, second, third])
      expect(probe).toHaveBeenCalledTimes(4)
    })

    it('hands a call during a check the promise of that check', async () => {
      const { probe, release } = heldProbe()
      const pool = new ChatVideoServerPool(tableOf(A), probe)
      const first = pool.refreshNow()
      await settle()
      expect(pool.refreshNow()).toBe(first)
      release()
      await settle()
      release()
      await first
    })

    // ⛔ The check under way read the table before the change that asked for this one.
    it('goes through the table once more where it changed during a check -- a server switched off leaves the random choice', async () => {
      const { probe, release } = heldProbe()
      let rows = [row(1, A)]
      const pool = new ChatVideoServerPool(async () => ({ servers: rows, rejected: [] }), probe)
      const underway = pool.refreshNow()
      await settle()

      // The administrator takes the tick away while the check runs, and the mutation asks for a check.
      rows = [row(1, A, false)]
      const asked = pool.refreshNow()
      release()
      await settle()
      release()
      await Promise.all([underway, asked])

      expect(pool.state().map((state) => [state.id, state.active])).toEqual([[1, false]])
      expect(pool.pick()).toBeNull()
    })

    it('starts a new check once the last is through', async () => {
      const probe = probeAnswering({ 'a.example': passes(10) })
      const pool = new ChatVideoServerPool(tableOf(A), probe)
      await pool.refreshNow()
      await pool.refreshNow()
      expect(probe).toHaveBeenCalledTimes(2)
    })
  })

  describe('pick', () => {
    it('chooses among the servers that answer, each equally likely, and no other', async () => {
      const pool = new ChatVideoServerPool(
        tableOf(A, B, C),
        probeAnswering({
          'a.example': passes(80),
          'b.example': fails('b.example', 'NOT_JITSI'),
          'c.example': passes(90),
        }),
      )
      await pool.refreshNow()
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

    // Bernd, 26.09.2026: "Wenn eben nur ein Server mit einbezogen wird, dann sind alle anderen
    // Server nicht ausgewählt."
    it('chooses only among the servers ticked for the random choice -- one tick, one server', async () => {
      const pool = new ChatVideoServerPool(
        tableWith(row(1, A, false), row(2, B), row(3, C, false)),
        probeAnswering({ 'a.example': passes(1), 'b.example': passes(2), 'c.example': passes(3) }),
      )
      await pool.refreshNow()
      for (let draw = 0; draw < 50; draw++) {
        expect(pool.pick()?.server).toEqual(B)
      }
      expect(pool.state().map((state) => state.picks)).toEqual([0, 50, 0])
    })

    it('finds nothing where no server is ticked, however many answer', async () => {
      const pool = new ChatVideoServerPool(
        tableWith(row(1, A, false), row(2, B, false)),
        probeAnswering({ 'a.example': passes(1), 'b.example': passes(2) }),
      )
      await pool.refreshNow()
      expect(pool.pick()).toBeNull()
    })

    it('finds nothing where no server answers', async () => {
      const pool = new ChatVideoServerPool(
        tableOf(A, B),
        probeAnswering({
          'a.example': fails('a.example', 'UNREACHABLE'),
          'b.example': fails('b.example', 'NO_BOSH'),
        }),
      )
      await pool.refreshNow()
      expect(pool.pick()).toBeNull()
      expect(pool.state().map((state) => state.picks)).toEqual([0, 0])
    })

    it('hands out a server again once it answers again', async () => {
      const probe = jest
        .fn()
        .mockResolvedValueOnce(fails('a.example', 'UNREACHABLE'))
        .mockResolvedValueOnce(passes(30))
      const pool = new ChatVideoServerPool(tableOf(A), probe)
      await pool.refreshNow()
      expect(pool.pick()).toBeNull()
      await pool.refreshNow()
      expect(pool.pick()?.server).toEqual(A)
    })

    // Not the interval itself: during the seconds every regular check takes, the last check is a
    // little older than that, and no server would be found.
    it('hands out rooms on a check up to two intervals old, and none on an older one', async () => {
      const pool = new ChatVideoServerPool(tableOf(A), probeAnswering({ 'a.example': passes(30) }))
      await pool.refreshNow()
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
      const pool = new ChatVideoServerPool(tableOf(A), probe)
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
      const pool = new ChatVideoServerPool(tableOf(A), probeAnswering({}))
      pool.start(600_000)
      pool.start(600_000)
      expect(scheduled).toHaveLength(1)
    })

    it('goes on after a check that failed, and says so', async () => {
      const list = jest.fn().mockRejectedValueOnce(new Error('the table could not be read'))
      const pool = new ChatVideoServerPool(list, probeAnswering({}))
      pool.start(600_000)
      await scheduled[0].run()
      expect(logger.error).toHaveBeenCalledWith(
        'checking the chat video servers failed',
        expect.any(Error),
      )
      expect(scheduled.map((timer) => timer.ms)).toEqual([0, 600_000])
    })

    it('names where the list comes from, once', () => {
      const pool = new ChatVideoServerPool(tableOf(A), probeAnswering({}))
      pool.start(600_000)
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(logger.info).toHaveBeenCalledWith(
        'chat video servers: the list of the admin page (chat_video_servers), checked every 600000 ms',
      )
    })
  })
})
