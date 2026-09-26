// AI-GENERATED — not an architecture reference
import { ChatVideoServerSelect, chatVideoServersTable } from 'database'
import { CONFIG } from '@/config'
import {
  CHAT_VIDEO_ROOM_RANDOM_LENGTH,
  CHAT_VIDEO_SERVER_MAX_LENGTH,
  chatVideoRoomName,
  chatVideoServerFrom,
  chatVideoServerFromForm,
  chatVideoServers,
  chatVideoServersFromRows,
  chatVideoServerValues,
  parseChatVideoServers,
} from './ChatVideoServer.logic'
import { CHAT_VIDEO_SERVERS_DEFAULT } from './ChatVideoServers.default'

const AKADEMIE = 'https://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie'

describe('parseChatVideoServers', () => {
  it('reads the Akademie entry: base address, operator, prefix', () => {
    expect(parseChatVideoServers(AKADEMIE)).toEqual({
      servers: [
        {
          baseUrl: 'https://fairmeeting.net/',
          host: 'fairmeeting.net',
          operator: 'fairmeeting (fairkom)',
          prefix: 'GradidoAkademie',
        },
      ],
      rejected: [],
    })
  })

  it('takes operator and prefix as optional, and ends the base address with a slash', () => {
    expect(parseChatVideoServers('https://meet.example.org').servers).toEqual([
      {
        baseUrl: 'https://meet.example.org/',
        host: 'meet.example.org',
        operator: null,
        prefix: '',
      },
    ])
    expect(parseChatVideoServers('https://example.org/jitsi||Room7').servers).toEqual([
      {
        baseUrl: 'https://example.org/jitsi/',
        host: 'example.org',
        operator: null,
        prefix: 'Room7',
      },
    ])
  })

  it('reads several entries, spaces and empty entries aside', () => {
    const { servers, rejected } = parseChatVideoServers(
      ' https://a.example/ | Verein A ;; https://b.example/|B e. V.|Pre ; ',
    )
    expect(servers.map((server) => [server.host, server.operator, server.prefix])).toEqual([
      ['a.example', 'Verein A', ''],
      ['b.example', 'B e. V.', 'Pre'],
    ])
    expect(rejected).toEqual([])
  })

  it('keeps a port in the host, and the host in lower case', () => {
    expect(parseChatVideoServers('https://Meet.Example.org:8443').servers).toEqual([
      {
        baseUrl: 'https://meet.example.org:8443/',
        host: 'meet.example.org:8443',
        operator: null,
        prefix: '',
      },
    ])
  })

  it('leaves out each entry that breaks a rule, with its reason, and takes the others', () => {
    const { servers, rejected } = parseChatVideoServers(
      [
        'http://plain.example/|Plain',
        'meet.example.org',
        'https://good.example/|Good',
        'https://query.example/?room=1',
        'https://user:secret@credentials.example/',
        'https://fragment.example/#x',
        'https://hyphen.example/||Gradido-Akademie',
        'https://space.example/||Gradido Akademie',
        'https://umlaut.example/||GradidoÄ',
        'https://fields.example/|A|B|C',
        'https://GOOD.example/other/|Twice|Again',
        'https://last.example/',
      ].join(';'),
    )
    expect(servers.map((server) => server.host)).toEqual(['good.example', 'last.example'])
    expect(rejected).toEqual([
      { entry: 'http://plain.example/|Plain', reason: 'NOT_HTTPS' },
      { entry: 'meet.example.org', reason: 'NOT_HTTPS' },
      { entry: 'https://query.example/?room=1', reason: 'NOT_A_BASE_ADDRESS' },
      { entry: 'https://user:secret@credentials.example/', reason: 'NOT_A_BASE_ADDRESS' },
      { entry: 'https://fragment.example/#x', reason: 'NOT_A_BASE_ADDRESS' },
      { entry: 'https://hyphen.example/||Gradido-Akademie', reason: 'BAD_PREFIX' },
      { entry: 'https://space.example/||Gradido Akademie', reason: 'BAD_PREFIX' },
      { entry: 'https://umlaut.example/||GradidoÄ', reason: 'BAD_PREFIX' },
      { entry: 'https://fields.example/|A|B|C', reason: 'TOO_MANY_FIELDS' },
      { entry: 'https://GOOD.example/other/|Twice|Again', reason: 'DUPLICATE_HOST' },
    ])
  })
})

describe('chatVideoServers', () => {
  const defaultHosts = CHAT_VIDEO_SERVERS_DEFAULT.map((entry) => new URL(entry.baseUrl).host)

  it('is the default list where the configuration sets nothing', () => {
    for (const nothing of ['', '   ']) {
      const list = chatVideoServers(nothing)
      expect(list.source).toBe('DEFAULT')
      expect(list.servers.map((server) => server.host)).toEqual(defaultHosts)
      expect(list.rejected).toEqual([])
    }
  })

  // ⛔ Bernd's agreement with fairkom covers the prefix, not a server to fall back on.
  it('is the configured list alone where one is set -- no public server is added', () => {
    const list = chatVideoServers(AKADEMIE)
    expect(list.source).toBe('CHAT_VIDEO_SERVERS')
    expect(list.servers.map((server) => server.host)).toEqual(['fairmeeting.net'])
  })

  it('stays the configured list where none of its entries can be used', () => {
    const list = chatVideoServers('http://fairmeeting.net/|fairmeeting (fairkom)|GradidoAkademie')
    expect(list.source).toBe('CHAT_VIDEO_SERVERS')
    expect(list.servers).toEqual([])
    expect(list.rejected.map((rejection) => rejection.reason)).toEqual(['NOT_HTTPS'])
  })

  it('reads CHAT_VIDEO_SERVERS when asked without an argument', () => {
    const before = CONFIG.CHAT_VIDEO_SERVERS
    try {
      CONFIG.CHAT_VIDEO_SERVERS = AKADEMIE
      expect(chatVideoServers().servers.map((server) => server.host)).toEqual(['fairmeeting.net'])
      CONFIG.CHAT_VIDEO_SERVERS = ''
      expect(chatVideoServers().source).toBe('DEFAULT')
    } finally {
      CONFIG.CHAT_VIDEO_SERVERS = before
    }
  })
})

describe('the default list', () => {
  it('keeps its own rules: https, a base address ending in "/", no prefix, each host once', () => {
    expect(CHAT_VIDEO_SERVERS_DEFAULT.length).toBeGreaterThan(0)
    const hosts = new Set<string>()
    for (const entry of CHAT_VIDEO_SERVERS_DEFAULT) {
      const result = chatVideoServerFrom(entry)
      expect(result).toEqual({ success: true, value: expect.any(Object) })
      if (!result.success) {
        continue
      }
      // Written the way it is taken: nothing is appended or lower-cased on the way.
      expect(result.value.baseUrl).toBe(entry.baseUrl)
      expect(result.value.baseUrl).toMatch(/^https:\/\/[^/]+\/$/)
      expect(entry.prefix).toBeUndefined()
      expect(hosts.has(result.value.host)).toBe(false)
      hosts.add(result.value.host)
      // A name the wallet can show, or none at all.
      expect(entry.operator === null || entry.operator.trim().length > 0).toBe(true)
    }
  })

  it('holds none of the servers the rules keep out', () => {
    const hosts = CHAT_VIDEO_SERVERS_DEFAULT.map((entry) => new URL(entry.baseUrl).host)
    // fairmeeting without a prefix is fairkom's product; meet.jit.si wants a login; the
    // redirector throws the room name away.
    for (const outside of ['fairmeeting.net', 'meet.jit.si', 'jitsi.random-redirect.de']) {
      expect(hosts).not.toContain(outside)
    }
  })
})

describe('chatVideoRoomName', () => {
  const ROOM = new RegExp(`^[a-z0-9]{${CHAT_VIDEO_ROOM_RANDOM_LENGTH}}$`)

  it('is 12 lower case letters and digits, after the prefix', () => {
    expect(chatVideoRoomName('')).toMatch(ROOM)
    const named = chatVideoRoomName('GradidoAkademie')
    expect(named.startsWith('GradidoAkademie')).toBe(true)
    expect(named.slice('GradidoAkademie'.length)).toMatch(ROOM)
  })

  it('is a different name every time', () => {
    const names = new Set(Array.from({ length: 1000 }, () => chatVideoRoomName('')))
    expect(names.size).toBe(1000)
  })

  // 252 = 7 x 36. A byte from 252 up would make a..d likelier than the rest.
  it('draws a byte from 252 up again instead of using it', () => {
    const bytes = [252, 253, 254, 255, 10, 11, 12, 13, 14, 15, 16, 17]
    const random = jest
      .fn()
      .mockReturnValueOnce(Buffer.from(bytes))
      .mockReturnValueOnce(Buffer.from([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]))
    expect(chatVideoRoomName('', random)).toBe('klmnopqrstuv')
    expect(random).toHaveBeenCalledTimes(2)
  })

  it('makes every character equally likely: seven byte values each, four drawn again', () => {
    const count = new Map<string, number>()
    const drawnAgain: number[] = []
    for (let byte = 0; byte < 256; byte++) {
      const random = jest
        .fn()
        .mockReturnValueOnce(Buffer.alloc(CHAT_VIDEO_ROOM_RANDOM_LENGTH, byte))
        .mockReturnValue(Buffer.alloc(CHAT_VIDEO_ROOM_RANDOM_LENGTH, 35))
      const name = chatVideoRoomName('', random)
      if (random.mock.calls.length > 1) {
        drawnAgain.push(byte)
      } else {
        count.set(name[0], (count.get(name[0]) ?? 0) + 1)
      }
    }
    expect(drawnAgain).toEqual([252, 253, 254, 255])
    expect(count.size).toBe(36)
    expect([...count.values()].every((times) => times === 7)).toBe(true)
  })
})

describe('the lengths of an entry', () => {
  // ⛔ The rules and the table must agree: an entry the rules take and the column refuses would
  // fail at the insert, as a raw error of the driver on the admin page -- or, at the start, as a
  // seed that stops halfway.
  it('are the columns of chat_video_servers', () => {
    // A varchar column carries its length at run time; its type in the table does not say so.
    const lengthOf = (column: unknown) => (column as { length?: number }).length
    expect(CHAT_VIDEO_SERVER_MAX_LENGTH).toEqual({
      baseUrl: lengthOf(chatVideoServersTable.baseUrl),
      operator: lengthOf(chatVideoServersTable.operator),
      prefix: lengthOf(chatVideoServersTable.roomPrefix),
      note: lengthOf(chatVideoServersTable.note),
    })
  })

  it('take an address as long as its column, as it is stored, and refuse one character more', () => {
    // 18 characters, then a path that ends the address at exactly 255 with its '/'.
    const longest = `https://a.example/${'x'.repeat(236)}`
    expect(`${longest}/`).toHaveLength(CHAT_VIDEO_SERVER_MAX_LENGTH.baseUrl)
    expect(chatVideoServerFrom({ baseUrl: longest, operator: null }).success).toBe(true)
    expect(chatVideoServerFrom({ baseUrl: `${longest}y`, operator: null })).toEqual({
      success: false,
      error: 'TOO_LONG',
    })
  })

  it('take an operator and a prefix as long as their columns, and refuse one character more', () => {
    const at = (operator: string, prefix: string) =>
      chatVideoServerFrom({ baseUrl: 'https://a.example/', operator, prefix })
    expect(at(` ${'o'.repeat(120)} `, 'P'.repeat(40)).success).toBe(true)
    expect(at('o'.repeat(121), '')).toEqual({ success: false, error: 'TOO_LONG' })
    expect(at('', 'P'.repeat(41))).toEqual({ success: false, error: 'TOO_LONG' })
  })

  it('keep an over-long entry of CHAT_VIDEO_SERVERS out of the seed, and take the others', () => {
    const list = chatVideoServers(
      `https://a.example/|${'o'.repeat(121)};https://b.example/|B e. V.`,
    )
    expect(list.servers.map((server) => server.host)).toEqual(['b.example'])
    expect(list.rejected.map((rejection) => rejection.reason)).toEqual(['TOO_LONG'])
  })
})

describe('chatVideoServerValues', () => {
  it('stores no prefix as NULL, and a server of the seed as active, without a note', () => {
    const server = {
      baseUrl: 'https://a.example/',
      host: 'a.example',
      operator: 'A e. V.',
      prefix: '',
    }
    expect(chatVideoServerValues(server)).toEqual({
      baseUrl: 'https://a.example/',
      operator: 'A e. V.',
      roomPrefix: null,
      note: null,
      active: true,
    })
  })
})

describe('chatVideoServerFromForm', () => {
  const FORM = {
    baseUrl: ' https://fairmeeting.net ',
    operator: ' fairmeeting (fairkom) ',
    roomPrefix: ' GradidoAkademie ',
    note: ' Akademie-Lizenz ',
    active: false,
  }

  it('makes the row to store of what an administrator typed, and names the server', () => {
    expect(chatVideoServerFromForm(FORM)).toEqual({
      success: true,
      value: {
        server: {
          baseUrl: 'https://fairmeeting.net/',
          host: 'fairmeeting.net',
          operator: 'fairmeeting (fairkom)',
          prefix: 'GradidoAkademie',
        },
        values: {
          baseUrl: 'https://fairmeeting.net/',
          operator: 'fairmeeting (fairkom)',
          roomPrefix: 'GradidoAkademie',
          note: 'Akademie-Lizenz',
          active: false,
        },
      },
    })
  })

  it('stores empty fields as none', () => {
    const result = chatVideoServerFromForm({
      baseUrl: 'https://a.example/',
      operator: '  ',
      roomPrefix: '',
      note: '   ',
      active: true,
    })
    expect(result.success && result.value.values).toEqual({
      baseUrl: 'https://a.example/',
      operator: null,
      roomPrefix: null,
      note: null,
      active: true,
    })
  })

  it('follows the rules of CHAT_VIDEO_SERVERS', () => {
    const refused = (change: Partial<typeof FORM>) => {
      const result = chatVideoServerFromForm({ ...FORM, ...change })
      return result.success ? 'taken' : result.error
    }
    expect(refused({ baseUrl: 'http://fairmeeting.net/' })).toBe('NOT_HTTPS')
    expect(refused({ baseUrl: 'fairmeeting.net' })).toBe('NOT_HTTPS')
    expect(refused({ baseUrl: 'https://fairmeeting.net/?room=1' })).toBe('NOT_A_BASE_ADDRESS')
    expect(refused({ roomPrefix: 'Gradido-Akademie' })).toBe('BAD_PREFIX')
    expect(refused({ roomPrefix: 'Gradido Akademie' })).toBe('BAD_PREFIX')
    expect(refused({ operator: 'o'.repeat(121) })).toBe('TOO_LONG')
  })

  it('takes a note as long as its column, and refuses one character more', () => {
    expect(chatVideoServerFromForm({ ...FORM, note: 'n'.repeat(255) }).success).toBe(true)
    expect(chatVideoServerFromForm({ ...FORM, note: 'n'.repeat(256) })).toEqual({
      success: false,
      error: 'TOO_LONG',
    })
  })
})

describe('chatVideoServersFromRows', () => {
  const stored = (
    id: number,
    baseUrl: string,
    change: Partial<ChatVideoServerSelect> = {},
  ): ChatVideoServerSelect => ({
    id,
    baseUrl,
    operator: null,
    roomPrefix: null,
    note: null,
    active: true,
    createdAt: new Date(),
    updatedAt: null,
    ...change,
  })

  it('names the server of every row, in the order of the rows, with its id and its tick', () => {
    const table = chatVideoServersFromRows([
      stored(4, 'https://fairmeeting.net/', {
        operator: 'fairmeeting (fairkom)',
        roomPrefix: 'GradidoAkademie',
      }),
      stored(2, 'https://meet.ffmuc.net/', { active: false }),
    ])
    expect(table).toEqual({
      servers: [
        {
          id: 4,
          active: true,
          server: {
            baseUrl: 'https://fairmeeting.net/',
            host: 'fairmeeting.net',
            operator: 'fairmeeting (fairkom)',
            prefix: 'GradidoAkademie',
          },
        },
        {
          id: 2,
          active: false,
          server: {
            baseUrl: 'https://meet.ffmuc.net/',
            host: 'meet.ffmuc.net',
            operator: null,
            prefix: '',
          },
        },
      ],
      rejected: [],
    })
  })

  it('leaves out a row that breaks a rule, and a second row of a host, and takes the others', () => {
    const table = chatVideoServersFromRows([
      stored(1, 'https://a.example/'),
      stored(2, 'http://b.example/'),
      stored(3, 'https://c.example/', { roomPrefix: 'with space' }),
      stored(4, 'https://a.example/other/'),
      stored(5, 'https://d.example/'),
    ])
    expect(table.servers.map(({ id }) => id)).toEqual([1, 5])
    expect(table.rejected).toEqual([
      { entry: '#2 http://b.example/', reason: 'NOT_HTTPS' },
      { entry: '#3 https://c.example/', reason: 'BAD_PREFIX' },
      { entry: '#4 https://a.example/other/', reason: 'DUPLICATE_HOST' },
    ])
  })
})
