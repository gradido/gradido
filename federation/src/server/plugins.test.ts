// AI-GENERATED — not an architecture reference
import { describe, expect, it, jest } from 'bun:test'
import { parse } from 'graphql'
import { logPlugin } from './plugins'

const SEND_COMMAND = `mutation ($args: EncryptedTransferArgs!) {
  sendCommand(encryptedArgs: $args) { success data error }
}`

// A sealed command as it comes: a jwt of some 100 KB where a chat message carries a picture (P7b).
const JWT = `eyJhbGciOiJSUzI1NiJ9.${'x'.repeat(98_765)}.c2lnbmF0dXJl`

/** What the request log hands the logger for one request, by level. */
const logged = async (variables: Record<string, unknown>, errors?: unknown[]) => {
  const logger = { info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const request = { query: SEND_COMMAND, variables, operationName: null }
  const { willSendResponse } = await logPlugin.requestDidStart({ logger, request })
  await willSendResponse({
    request,
    operation: parse(SEND_COMMAND).definitions[0],
    contextValue: {},
    response: {
      body: {
        kind: 'single',
        singleResult: errors ? { errors } : { data: { sendCommand: {} } },
      },
    },
  })
  const text = (calls: unknown[][]) => calls.map((args) => args.join(' ')).join('\n')
  return { info: text(logger.info.mock.calls), error: text(logger.error.mock.calls) }
}

describe('the request log of the federation', () => {
  it('writes one line per request, with neither the document nor its variables', async () => {
    const { info } = await logged({
      args: { handshakeID: '4294967295', publicKey: 'ab'.repeat(32), jwt: JWT },
    })

    expect(info).toMatch(/^mutation sendCommand \d+ms ok$/)
  })

  it('says where the answer carries errors', async () => {
    const { info } = await logged({}, [{ message: 'x' }])

    expect(info).toMatch(/ errors$/)
  })

  // An error may quote back what the request carried.
  it('writes a long value in an error as its length', async () => {
    const { error } = await logged({}, [
      { message: 'Variable "$args" got invalid value', value: JWT },
    ])

    expect(error).not.toContain('x'.repeat(1000))
    expect(error).toContain(`"value": "*** ${JWT.length} characters"`)
    expect(error).toContain('got invalid value')
  })

  it('writes a value of 1000 characters in an error, and one of 1001 as its length', async () => {
    const { error } = await logged({}, [
      { message: 'x', exactly: 'a'.repeat(1000), oneMore: 'b'.repeat(1001) },
    ])

    expect(error).toContain(`"exactly": "${'a'.repeat(1000)}"`)
    expect(error).toContain('"oneMore": "*** 1001 characters"')
  })
})
