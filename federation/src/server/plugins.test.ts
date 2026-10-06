// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import { logPlugin } from './plugins'

const SEND_COMMAND = `mutation ($args: EncryptedTransferArgs!) {
  sendCommand(encryptedArgs: $args) { success data error }
}`

/** Everything the request log hands the logger for one request, written out as the log would. */
const logged = async (variables: Record<string, unknown>, errors?: unknown[]): Promise<string> => {
  const logger = { info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const { willSendResponse } = await logPlugin.requestDidStart({
    logger,
    request: { query: SEND_COMMAND, variables, operationName: null },
  })
  await willSendResponse({
    context: {},
    response: errors ? { errors } : { data: { sendCommand: {} } },
  })
  return [...logger.info.mock.calls, ...logger.trace.mock.calls, ...logger.error.mock.calls]
    .map((args) =>
      args
        .map((arg: unknown) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 5 })))
        .join(' '),
    )
    .join('\n')
}

// A sealed command as it comes: a jwt of some 100 KB where a chat message carries a picture (P7b).
const JWT = `eyJhbGciOiJSUzI1NiJ9.${'x'.repeat(98_765)}.c2lnbmF0dXJl`

describe('the request log of the federation', () => {
  it('writes a long value as its length, not the value', async () => {
    const text = await logged({
      args: { handshakeID: '4294967295', publicKey: 'ab'.repeat(32), jwt: JWT },
    })

    expect(text).not.toContain('x'.repeat(1000))
    expect(text).toContain(`"jwt": "*** ${JWT.length} characters"`)
    // What is short enough to read stays there to read.
    expect(text).toContain('"handshakeID": "4294967295"')
    expect(text).toContain(`"publicKey": "${'ab'.repeat(32)}"`)
    expect(text).toContain('sendCommand(encryptedArgs: $args)')
  })

  it('writes a value of 1000 characters, and one of 1001 as its length', async () => {
    const text = await logged({ exactly: 'a'.repeat(1000), oneMore: 'b'.repeat(1001) })

    expect(text).toContain(`"exactly": "${'a'.repeat(1000)}"`)
    expect(text).toContain('"oneMore": "*** 1001 characters"')
  })

  it('still masks the password, however short', async () => {
    const text = await logged({ password: 'secret', passwordNew: 'new secret' })

    expect(text).not.toContain('secret')
    expect(text).toContain('"password": "***"')
    expect(text).toContain('"passwordNew": "***"')
  })

  // An error may quote back what the request carried.
  it('writes a long value in an error as its length too', async () => {
    const text = await logged({}, [{ message: 'Variable "$args" got invalid value', value: JWT }])

    expect(text).not.toContain('x'.repeat(1000))
    expect(text).toContain(`"value": "*** ${JWT.length} characters"`)
    expect(text).toContain('got invalid value')
  })

  // ⛔ The log writes a copy. The request goes on to the resolver as it came -- its long values and
  // its password too.
  it('leaves the request itself as it came', async () => {
    const variables = { password: 'secret', args: { handshakeID: '1', publicKey: 'ab', jwt: JWT } }

    await logged(variables)

    expect(variables).toEqual({
      password: 'secret',
      args: { handshakeID: '1', publicKey: 'ab', jwt: JWT },
    })
  })
})
