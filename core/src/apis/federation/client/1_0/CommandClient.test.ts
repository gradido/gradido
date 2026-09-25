// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { EncryptedTransferArgs } from '../../../../graphql/model/EncryptedTransferArgs'
import { CommandClient } from './CommandClient'

// ⛔ spyOn on the prototype, not mock.module: Bun cannot restore a module mock.

const client = new CommandClient({
  endPoint: 'http://peer.invalid/api/',
  apiVersion: '1_0',
} as DbFederatedCommunity)
const args = new EncryptedTransferArgs()

/** The other community's answer to the mutation, as graphql-request hands it over. */
let answer: ReturnType<typeof spyOn>

beforeEach(() => {
  answer = spyOn(GraphQLClient.prototype, 'rawRequest')
})

afterEach(() => {
  answer.mockRestore()
})

const answers = (sendCommand: { success: boolean; data?: string | null; error?: string }) =>
  answer.mockResolvedValue({ data: { sendCommand }, status: 200 } as never)

/**
 * E-034: the command's answer (`data`) has to reach the sender -- SendEmailCommand answers what
 * became of the mail. sendCommand cannot hand it over, because every string it returns is an
 * error; sendCommandForAnswer does, and sendCommand stays what it was for its other callers.
 */
describe('CommandClient.sendCommandForAnswer', () => {
  it('hands back what the other community answered', async () => {
    answers({ success: true, data: 'muted' })

    expect(await client.sendCommandForAnswer(args)).toEqual({ success: true, value: 'muted' })
    expect(answer).toHaveBeenCalledTimes(1)
  })

  it('hands back null where the other community answered nothing', async () => {
    answers({ success: true })
    expect(await client.sendCommandForAnswer(args)).toEqual({ success: true, value: null })

    answers({ success: true, data: null })
    expect(await client.sendCommandForAnswer(args)).toEqual({ success: true, value: null })
  })

  it('hands back the error where the other community refused the command', async () => {
    answers({ success: false, error: 'Recipient user not found' })

    expect(await client.sendCommandForAnswer(args)).toEqual({
      success: false,
      error: 'sendCommand failed with response error: Recipient user not found',
    })
  })

  it('hands back the error where the request itself failed', async () => {
    answer.mockRejectedValue(new Error('connect ECONNREFUSED'))

    expect(await client.sendCommandForAnswer(args)).toEqual({
      success: false,
      error: 'connect ECONNREFUSED',
    })
  })
})

describe('CommandClient.sendCommand', () => {
  // processXComSendCoins reads a string as an error: an answer must not become one.
  it('answers true where the command ran, whatever it answered', async () => {
    answers({ success: true, data: 'mailed' })
    expect(await client.sendCommand(args)).toBe(true)

    answers({ success: true })
    expect(await client.sendCommand(args)).toBe(true)
  })

  it('answers the error as a string where the command did not run', async () => {
    answers({ success: false, error: 'Recipient user not found' })
    expect(await client.sendCommand(args)).toBe(
      'sendCommand failed with response error: Recipient user not found',
    )

    answer.mockRejectedValue(new Error('connect ECONNREFUSED'))
    expect(await client.sendCommand(args)).toBe('connect ECONNREFUSED')
  })
})
