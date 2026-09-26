// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import { newRequestBudget } from './context'
import { logPlugin } from './plugins'

/**
 * Everything the request log hands the logger when a request starts, written out as the log
 * would write it: strings as they are, objects through inspect.
 */
const logged = (variables: Record<string, unknown>): string => {
  const logger = { debug: jest.fn(), info: jest.fn() }
  logPlugin.requestDidStart({
    logger,
    request: { query: 'mutation ($x: String!) { x(y: $x) }', variables, operationName: null },
  })
  return [...logger.debug.mock.calls, ...logger.info.mock.calls]
    .map((args) =>
      args
        .map((arg: unknown) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 5 })))
        .join(' '),
    )
    .join('\n')
}

const ROOM = 'https://meet.example.org/k7m2x9q4t8wz'

describe('the request log', () => {
  it('writes no chat message -- the text may hold the address of a video room', () => {
    const text = logged({
      ref: { communityUuid: 'c', gradidoID: 'g' },
      body: `Video call: ${ROOM}`,
      notify: 'EMAIL',
    })
    expect(text).not.toContain('k7m2x9q4t8wz')
    expect(text).toContain('"body": "***"')
    // The rest of the request is still there to read.
    expect(text).toContain('"notify": "EMAIL"')
  })

  it("writes no letter's subject", () => {
    const text = logged({
      recipientIdentifier: 'g',
      subject: 'About Saturday',
      memo: 'Shall we meet at ten?',
    })
    expect(text).not.toContain('About Saturday')
    expect(text).toContain('"subject": "***"')
  })

  it('writes no password and no table code, as before', () => {
    const text = logged({
      password: 'Aa12345_',
      passwordNew: 'Bb12345_',
      presenceCode: '1790000000.c2lnbmF0dXJl',
    })
    for (const secret of ['Aa12345_', 'Bb12345_', 'c2lnbmF0dXJl']) {
      expect(text).not.toContain(secret)
    }
  })
})

/** What the request log writes at level trace when it sends the answer of a request. */
const answerTraced = (context: Record<string, unknown>, data: unknown): string => {
  const logger = { debug: jest.fn(), info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const hooks = logPlugin.requestDidStart({
    logger,
    request: { query: 'query { x }', variables: {}, operationName: null },
  })
  hooks.willSendResponse({ context, response: { data } })
  return logger.trace.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('the answer in the request log', () => {
  it('is left out where the request was handed a video room', () => {
    const traced = answerTraced(
      { requestBudget: { ...newRequestBudget(), chatVideoRoomsServed: 1 } },
      { room0: { url: ROOM, host: 'meet.example.org', operator: null } },
    )
    expect(traced).not.toContain('k7m2x9q4t8wz')
    expect(traced).toBe('Response-Data: left out, it holds a video room')
  })

  it('is written at level trace for every other request, as before', () => {
    const traced = answerTraced(
      { requestBudget: newRequestBudget() },
      { contactList: { contactCount: 3 } },
    )
    expect(traced).toContain('"contactCount": 3')
  })
})
