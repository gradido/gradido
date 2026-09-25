// AI-GENERATED — not an architecture reference
import { CONFIG } from '@/config'
import {
  CHAT_VIDEO_ROOM_RANDOM_LENGTH,
  chatVideoRoomName,
  chatVideoServerFrom,
  chatVideoServers,
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
