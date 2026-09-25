// AI-GENERATED — not an architecture reference
import { getLogger } from 'config-schema/test/testSetup'
import { chatVideoServerPool } from '@/apis/jitsi/chatVideoServerPool'
import { probeJitsiServer } from '@/apis/jitsi/jitsiProbe'
import { JitsiProbeError } from '@/apis/jitsi/jitsiProbe.logic'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CHAT_VIDEO_ROOMS_MAX_PER_REQUEST } from '@/data/ChatVideoServer.logic'
import { CHAT_VIDEO_SERVERS_DEFAULT } from '@/data/ChatVideoServers.default'
import { Context, newRequestBudget } from '@/server/context'
import { ChatResolver } from './ChatResolver'

// No server is asked here: the probe answers as the test says. The pool is the one of the
// process, as the resolver reads it, and its timer is never started -- the tests check it
// with refresh(). ChatResolver.test.ts asks the query through the server, logged in.
jest.mock('@/apis/jitsi/jitsiProbe', () => ({ probeJitsiServer: jest.fn() }))
const probe = probeJitsiServer as jest.MockedFunction<typeof probeJitsiServer>

const resolverLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ChatResolver`)

const AKADEMIE = 'https://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie'

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

const configuredBefore = CONFIG.CHAT_VIDEO_SERVERS

beforeEach(() => {
  jest.clearAllMocks()
  CONFIG.CHAT_VIDEO_SERVERS = ''
})

afterAll(() => {
  CONFIG.CHAT_VIDEO_SERVERS = configuredBefore
})

describe('chatVideoRoom', () => {
  it('answers CHAT_VIDEO_NO_SERVER until the first check is through', () => {
    expect(() => ask()).toThrow('CHAT_VIDEO_NO_SERVER')
  })

  it('hands out a room on a server of the default list, and names who runs it', async () => {
    serversPass()
    await chatVideoServerPool.refresh()
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
    await chatVideoServerPool.refresh()
    const names = new Set(Array.from({ length: 20 }, () => new URL(ask().url).pathname))
    expect(names.size).toBe(20)
  })

  it('hands out rooms only on servers that passed the last check', async () => {
    serversPass(['meet.systemli.org'])
    await chatVideoServerPool.refresh()
    for (let call = 0; call < 20; call++) {
      expect(ask().host).toBe('meet.systemli.org')
    }
  })

  it('answers CHAT_VIDEO_NO_SERVER where no server passed', async () => {
    serversPass([])
    await chatVideoServerPool.refresh()
    expect(() => ask()).toThrow('CHAT_VIDEO_NO_SERVER')
  })

  it("puts the server's prefix before the random part -- the Akademie's fairmeeting rooms", async () => {
    CONFIG.CHAT_VIDEO_SERVERS = AKADEMIE
    serversPass()
    await chatVideoServerPool.refresh()
    const room = ask()
    expect(room.url).toMatch(/^https:\/\/fairmeeting\.net\/GradidoAkademie[a-z0-9]{12}$/)
    expect(room).toMatchObject({ host: 'fairmeeting.net', operator: 'fairmeeting (fairkom)' })
  })

  it('answers operator null where the list names nobody', async () => {
    CONFIG.CHAT_VIDEO_SERVERS = 'https://meet.example.org'
    serversPass()
    await chatVideoServerPool.refresh()
    expect(ask()).toMatchObject({ host: 'meet.example.org', operator: null })
  })

  it('hands out five rooms in one request and refuses the sixth; the next request starts anew', async () => {
    serversPass()
    await chatVideoServerPool.refresh()
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
    await chatVideoServerPool.refresh()
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
