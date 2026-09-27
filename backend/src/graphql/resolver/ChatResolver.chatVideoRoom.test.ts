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

const ask = (request: Context = aRequest(), serverId?: number | null) =>
  new ChatResolver().chatVideoRoom({ serverId }, request)

/** What a member may choose (V5). */
const choices = () => new ChatResolver().chatVideoServerChoices()

/** The id of the row the default list puts `host` in (ids 1, 2, 3 … in the list's order). */
const idOf = (host: string): number =>
  chatVideoServers('').servers.findIndex((server) => server.host === host) + 1

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

// V5: the member chooses the server -- from the servers a room may be handed out on right now.
describe('chatVideoServerChoices', () => {
  // The pool is the process's: the first check of this file ran long before. What it lists before
  // any check is through, the pool's own test holds (chatVideoServerPool.test.ts).
  it('lists none where no server passed the last check', async () => {
    serversPass([])
    await chatVideoServerPool.refreshNow()
    expect(choices()).toEqual([])
  })

  it('lists the servers that passed and are ticked, in the order of the list, with id, host and operator', async () => {
    const hosts = chatVideoServers('').servers.map((server) => server.host)
    tableSeededFrom('', ['meet.opensuse.org'])
    serversPass(hosts.filter((host) => host !== 'meet.systemli.org'))
    await chatVideoServerPool.refreshNow()
    const listed = choices()
    expect(listed.map((choice) => choice.host)).toEqual(
      hosts.filter((host) => host !== 'meet.systemli.org' && host !== 'meet.opensuse.org'),
    )
    for (const choice of listed) {
      const entry = CHAT_VIDEO_SERVERS_DEFAULT.find(
        (server) => server.baseUrl === `https://${choice.host}/`,
      )
      expect(choice).toEqual({
        id: idOf(choice.host),
        host: choice.host,
        operator: entry?.operator,
      })
    }
  })

  it('answers operator null where the row names nobody', async () => {
    tableSeededFrom('https://meet.example.org')
    serversPass()
    await chatVideoServerPool.refreshNow()
    expect(choices()).toEqual([{ id: 1, host: 'meet.example.org', operator: null }])
  })
})

describe('chatVideoRoom on the server the member chose', () => {
  it('hands out every room on that server', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    for (let call = 0; call < 20; call++) {
      const room = ask(aRequest(), idOf('meet.meerfarbig.net'))
      expect(room.host).toBe('meet.meerfarbig.net')
      expect(room.url).toMatch(/^https:\/\/meet\.meerfarbig\.net\/[a-z0-9]{12}$/)
      expect(room.operator).toBe('meerfarbig GmbH & Co. KG')
    }
  })

  it("puts that server's prefix before the random part", async () => {
    tableSeededFrom(`https://meet.example.org;${AKADEMIE}`)
    serversPass()
    await chatVideoServerPool.refreshNow()
    expect(ask(aRequest(), 2).url).toMatch(
      /^https:\/\/fairmeeting\.net\/GradidoAkademie[a-z0-9]{12}$/,
    )
  })

  // ⛔ No other server in its place: the member chose this one, and the wallet says so.
  it('answers CHAT_VIDEO_SERVER_UNAVAILABLE where the server did not pass the last check', async () => {
    serversPass(['meet.ffmuc.net'])
    await chatVideoServerPool.refreshNow()
    expect(() => ask(aRequest(), idOf('meet.systemli.org'))).toThrow(
      'CHAT_VIDEO_SERVER_UNAVAILABLE',
    )
  })

  it('answers CHAT_VIDEO_SERVER_UNAVAILABLE where the server is not ticked any more', async () => {
    tableSeededFrom('', ['meet.systemli.org'])
    serversPass()
    await chatVideoServerPool.refreshNow()
    expect(() => ask(aRequest(), idOf('meet.systemli.org'))).toThrow(
      'CHAT_VIDEO_SERVER_UNAVAILABLE',
    )
  })

  it('answers CHAT_VIDEO_SERVER_UNAVAILABLE for a row that is not in the list', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    expect(() => ask(aRequest(), 99)).toThrow('CHAT_VIDEO_SERVER_UNAVAILABLE')
  })

  it("counts a chosen room in the request's budget as well", async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    const request = aRequest()
    for (let room = 0; room < CHAT_VIDEO_ROOMS_MAX_PER_REQUEST; room++) {
      ask(request, idOf('meet.ffmuc.net'))
    }
    expect(() => ask(request, idOf('meet.ffmuc.net'))).toThrow(
      'Too many chat video rooms requested at once',
    )
  })

  it('logs the host of a chosen room as well, and nowhere the room name', async () => {
    serversPass()
    await chatVideoServerPool.refreshNow()
    const room = ask(aRequest(), idOf('meet.weimarnetz.de'))
    const name = new URL(room.url).pathname.slice(1)
    expect(resolverLogger.trace).toHaveBeenCalledWith(
      'chat video room handed out on meet.weimarnetz.de',
    )
    for (const level of ['trace', 'debug', 'info', 'warn', 'error'] as const) {
      expect(JSON.stringify(resolverLogger[level].mock.calls)).not.toContain(name)
    }
  })
})
