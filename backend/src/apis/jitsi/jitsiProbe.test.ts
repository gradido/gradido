// AI-GENERATED — not an architecture reference
import axios, { AxiosRequestConfig, CancelToken } from 'axios'
import { httpAgent, httpsAgent } from '@/apis/ConnectionAgents'
import { ChatVideoServer } from '@/data/ChatVideoServer.logic'
import { JITSI_PROBE_TIMEOUT_MS, probeJitsiServer } from './jitsiProbe'

const SERVER: ChatVideoServer = {
  baseUrl: 'https://meet.example.org/',
  host: 'meet.example.org',
  operator: 'Example e. V.',
  prefix: '',
}

// Short forms of what the servers answered on 25.09.2026 (the long ones in jitsiProbe.logic.test.ts).
const OPEN_CONFIG = "var config = {\n  hosts: {\n    domain: 'xmpp.example.org',\n  },\n};"
const TOKEN_CONFIG = `${OPEN_CONFIG}\nconfig.tokenAuthUrl = 'https://login.example.org/{room}';`
const ANONYMOUS =
  "<body xmlns='http://jabber.org/protocol/httpbind'><stream:features xmlns='jabber:client'>" +
  "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><mechanism>ANONYMOUS</mechanism>" +
  '</mechanisms></stream:features></body>'
const PLAIN = ANONYMOUS.replace('ANONYMOUS', 'PLAIN')

const answer = (status: number, data: string) => ({
  status,
  data,
  statusText: '',
  headers: {},
  config: {},
})

let get: jest.SpyInstance
let post: jest.SpyInstance

beforeEach(() => {
  get = jest.spyOn(axios, 'get')
  post = jest.spyOn(axios, 'post')
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('probeJitsiServer', () => {
  it('passes a server whose rooms open without an account, and says how long it took', async () => {
    get.mockResolvedValue(answer(200, OPEN_CONFIG))
    post.mockResolvedValue(answer(200, ANONYMOUS))
    const result = await probeJitsiServer(SERVER)
    expect(result).toEqual({ success: true, value: { latencyMs: expect.any(Number) } })
  })

  it('asks config.js, then opens a BOSH session addressed to the domain config.js names', async () => {
    get.mockResolvedValue(answer(200, OPEN_CONFIG))
    post.mockResolvedValue(answer(200, ANONYMOUS))
    await probeJitsiServer(SERVER)

    expect(get).toHaveBeenCalledTimes(1)
    const [configUrl, getOptions] = get.mock.calls[0] as [string, AxiosRequestConfig]
    expect(configUrl).toBe('https://meet.example.org/config.js')
    expect(getOptions).toMatchObject({
      httpAgent,
      httpsAgent,
      timeout: JITSI_PROBE_TIMEOUT_MS,
      responseType: 'text',
      cancelToken: expect.anything(),
    })
    // Every status comes back as an answer, and text that reads as JSON stays text.
    expect(getOptions.validateStatus?.(404)).toBe(true)
    const keep = getOptions.transformResponse as (data: unknown) => unknown
    expect(keep('{"hosts":1}')).toBe('{"hosts":1}')

    expect(post).toHaveBeenCalledTimes(1)
    const [boshUrl, body, postOptions] = post.mock.calls[0] as [string, string, AxiosRequestConfig]
    expect(boshUrl).toBe('https://meet.example.org/http-bind')
    expect(body).toMatch(/^<body rid='\d+' xmlns='http:\/\/jabber.org\/protocol\/httpbind' /)
    expect(body).toContain("to='xmpp.example.org'")
    expect(postOptions).toMatchObject({
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      timeout: JITSI_PROBE_TIMEOUT_MS,
      cancelToken: expect.anything(),
    })
  })

  it("addresses the session to the server's host where config.js names no domain", async () => {
    get.mockResolvedValue(answer(200, "var config = { hosts: { muc: 'conference.x' } };"))
    post.mockResolvedValue(answer(200, ANONYMOUS))
    await probeJitsiServer({ ...SERVER, baseUrl: 'https://meet.example.org:8443/' })
    expect(post.mock.calls[0][1]).toContain("to='meet.example.org'")
  })

  it('is UNREACHABLE where config.js does not come -- not found, refused, timed out', async () => {
    for (const thrown of [
      new Error('getaddrinfo ENOTFOUND meet.example.org'),
      new Error('connect ECONNREFUSED 10.0.0.1:443'),
      new Error(`timeout of ${JITSI_PROBE_TIMEOUT_MS}ms exceeded`),
    ]) {
      get.mockRejectedValueOnce(thrown)
      const result = await probeJitsiServer(SERVER)
      expect(result.success).toBe(false)
      expect(!result.success && result.error).toMatchObject({
        host: 'meet.example.org',
        reason: 'UNREACHABLE',
        detail: thrown.message,
      })
    }
    expect(post).not.toHaveBeenCalled()
  })

  it('never throws, not even for something thrown that is no Error', async () => {
    get.mockRejectedValueOnce('socket hang up')
    const result = await probeJitsiServer(SERVER)
    expect(!result.success && result.error).toMatchObject({
      reason: 'UNREACHABLE',
      detail: 'socket hang up',
    })
  })

  // ⛔ The deadline is the whole request's: axios' own timeout counts only idle time on the socket.
  it('gives up on an answer that is not complete after 5 s -- and not before', async () => {
    jest.useFakeTimers()
    let token: CancelToken | undefined
    get.mockImplementation(
      (_url: string, options: AxiosRequestConfig) =>
        new Promise((_resolve, reject) => {
          token = options.cancelToken
          options.cancelToken?.promise.then(reject)
        }),
    )
    const probe = probeJitsiServer(SERVER)
    // The token carries the reason from the moment the request is given up: a settled promise
    // would show it only some microtasks later, and a deadline of 0 ms would look like 5 s.
    expect(token).toBeDefined()
    jest.advanceTimersByTime(JITSI_PROBE_TIMEOUT_MS - 1)
    expect(token?.reason).toBeUndefined()
    jest.advanceTimersByTime(1)
    expect(token?.reason?.message).toBe(`no complete answer within ${JITSI_PROBE_TIMEOUT_MS} ms`)
    const result = await probe
    expect(!result.success && result.error).toMatchObject({
      reason: 'UNREACHABLE',
      detail: `no complete answer within ${JITSI_PROBE_TIMEOUT_MS} ms`,
    })
  })

  it('is NOT_JITSI where config.js is missing or is no Jitsi configuration', async () => {
    get.mockResolvedValueOnce(answer(404, 'Not Found'))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NOT_JITSI', detail: 'config.js answered 404' }),
    })
    get.mockResolvedValueOnce(answer(200, '<!DOCTYPE html><html><body>Welcome</body></html>'))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NOT_JITSI' }),
    })
    expect(post).not.toHaveBeenCalled()
  })

  it('is LOGIN_REQUIRED where config.js sends people to a login, and asks no further', async () => {
    get.mockResolvedValue(answer(200, TOKEN_CONFIG))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'LOGIN_REQUIRED' }),
    })
    expect(post).not.toHaveBeenCalled()
  })

  it('is NO_ANONYMOUS where the XMPP server wants an account', async () => {
    get.mockResolvedValue(answer(200, OPEN_CONFIG))
    post.mockResolvedValue(answer(200, PLAIN))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NO_ANONYMOUS', detail: 'http-bind' }),
    })
  })

  it('is NO_BOSH where http-bind opens no session -- an error status, no answer, a page', async () => {
    get.mockResolvedValue(answer(200, OPEN_CONFIG))
    post.mockResolvedValueOnce(answer(403, '<!DOCTYPE html><title>Just a moment...</title>'))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NO_BOSH', detail: 'http-bind answered 403' }),
    })
    post.mockRejectedValueOnce(new Error('socket hang up'))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NO_BOSH', detail: 'socket hang up' }),
    })
    post.mockResolvedValueOnce(answer(200, '<html>websocket only</html>'))
    expect(await probeJitsiServer(SERVER)).toEqual({
      success: false,
      error: expect.objectContaining({ reason: 'NO_BOSH', detail: 'http-bind' }),
    })
  })
})
