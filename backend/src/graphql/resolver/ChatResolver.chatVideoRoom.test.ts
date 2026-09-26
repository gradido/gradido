// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { ChatVideoServerSelect, dbSelectChatVideoServers } from 'database'
import { chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { probeJitsiServer } from '@/apis/jitsi/jitsiProbe'
import { JitsiProbeError } from '@/apis/jitsi/jitsiProbe.logic'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  CHAT_VIDEO_ROOMS_MAX_PER_REQUEST,
  chatVideoServers,
  chatVideoServerValues,
} from '@/data/ChatVideoServer.logic'
import { CHAT_VIDEO_SERVERS_DEFAULT } from '@/data/ChatVideoServers.default'
import { Context, newRequestBudget } from '@/server/context'
import { ChatResolver } from './ChatResolver'

// No server is asked here: the probe answers as the test says. No database either: the rows of
// chat_video_servers are what each test lays down, as the pool reads them (V3). The pool is the
// one of the process, as the resolver reads it, and its timer is never started -- the tests check
// it with refreshNow(). ChatResolver.test.ts asks the query through the server, logged in.
jest.mock('@/apis/jitsi/jitsiProbe', () => ({ probeJitsiServer: jest.fn() }))
const probe = probeJitsiServer as jest.MockedFunction<typeof probeJitsiServer>
jest.mock('database', () => ({
  ...jest.requireActual('database'),
  dbSelectChatVideoServers: jest.fn(),
}))
const selectRows = dbSelectChatVideoServers as jest.MockedFunction<typeof dbSelectChatVideoServers>

const resolverLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatResolver`)

const AKADEMIE = 'https://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie'

/**
 * The table as the backend's start fills an empty one from `configured` (CHAT_VIDEO_SERVERS; ''
 * is the default list): every server a row, ticked -- unless `off` names its host.
 */
const tableSeededFrom = (configured: string, off: string[] = []): void => {
  const rows: ChatVideoServerSelect[] = chatVideoServers(configured).servers.map(
    (server, index) => ({
      id: index + 1,
      ...chatVideoServerValues(server, null, !off.includes(server.host)),
      createdAt: new Date(),
      updatedAt: null,
    }),
  )
  selectRows.mockResolvedValue(rows)
}

/** A request with a budget of its own. The query names nobody, so it needs no user. */
const aRequest = (): Context => ({ token: null, setHeaders: [], requestBudget: newRequestBudget() })

const ask = (request: Context = aRequest()) => new ChatResolver().chatVideoRoom(request)

/** Every server passes, or only those named. */
const serversPass = (only?: string[]) =>
  probe.mockImplementation(async (server) =>
    !only || only.includes(server.host)
      ? { success: true, value: { latencyMs: 50 } }
      : { success: false, error: new JitsiProbeError(server.host, 'UNREACHABLE', 'test') },
  )

beforeEach(() => {
  jest.clearAllMocks()
  tableSeededFrom('')
})

describe('chatVideoRoom', () => {
  it('answers CHAT_VIDEO_NO_SERVER until the first check is through', () => {
    expect(() => ask()).toThrow('CHAT_VIDEO_NO_SERVER')
  })

  it('hands out a room on a server of the default list, and names who runs it', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    const room = ask()
    const entry = CHAT_VIDEO_SERVERS_DEFAULT.find(
      (server) => server.baseUrl === `https://${room.host}/`,
    )
    expect(entry).toBeDefined()
    expect(room.url).toMatch(
      new RegExp(`^https://${room.host.replace(/\./g, '\\.')}/[a-z0-9]{12}$`),
    )
    expect(room.operator).toBe(entry?.operator)
  })

  it('names another room every time', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    const names = new Set(Array.from({ length: 20 }, () => new URL(ask().url).pathname))
    expect(names.size).toBe(20)
  })

  it('hands out rooms only on servers that passed the last check', async () => {
    serversPass(['meet.systemli.org'])
    await chatVideoServerPool.refreshNow()
    for (let call = 0; call < 20; call++) {
      expect(ask().host).toBe('meet.systemli.org')
    }
  })

  // The tick "in the random choice" (E-035): every row is checked, only ticked ones are handed out.
  it('hands out rooms only on servers ticked in the random choice', async () => {
    const hosts = chatVideoServers('').servers.map((server) => server.host)
    tableSeededFrom(
      '',
      hosts.filter((host) => host !== 'meet.ffmuc.net'),
    )
    serversPass()
    await chatVideoServerPool.refreshNow()
    for (let call = 0; call < 20; call++) {
      expect(ask().host).toBe('meet.ffmuc.net')
    }
  })

  it('answers CHAT_VIDEO_NO_SERVER where no server passed', async () => {
    serversPass([])
    await chatVideoServerPool.refreshNow()
    expect(() => ask()).toThrow('CHAT_VIDEO_NO_SERVER')
  })

  it("puts the server's prefix before the random part -- the Akademie's fairmeeting rooms", async () => {
    tableSeededFrom(AKADEMIE)
    serversPass()
    await chatVideoServerPool.refreshNow()
    const room = ask()
    expect(room.url).toMatch(/^https:\/\/fairmeeting\.net\/GradidoAkademie[a-z0-9]{12}$/)
    expect(room).toMatchObject({ host: 'fairmeeting.net', operator: 'fairmeeting (fairkom)' })
  })

  it('answers operator null where the row names nobody', async () => {
    tableSeededFrom('https://meet.example.org')
    serversPass()
    await chatVideoServerPool.refreshNow()
    expect(ask()).toMatchObject({ host: 'meet.example.org', operator: null })
  })

  it('hands out five rooms in one request and refuses the sixth; the next request starts anew', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    const request = aRequest()
    for (let room = 0; room < CHAT_VIDEO_ROOMS_MAX_PER_REQUEST; room++) {
      ask(request)
    }
    expect(() => ask(request)).toThrow('Too many chat video rooms requested at once')
    expect(ask(aRequest()).url).toMatch(/^https:\/\//)
  })

  // ⛔ Whoever knows the room name can join the call.
  it('logs the host it handed a room out on, and nowhere the room name', async () => {
    serversPass(['meet.ffmuc.net'])
    await chatVideoServerPool.refreshNow()
    const room = ask()
    const name = new URL(room.url).pathname.slice(1)
    expect(resolverLogger.trace).toHaveBeenCalledWith(
      'chat video room handed out on meet.ffmuc.net',
    )
    for (const level of ['trace', 'debug', 'info', 'warn', 'error'] as const) {
      expect(JSON.stringify(resolverLogger[level].mock.calls)).not.toContain(name)
    }
  })
})
