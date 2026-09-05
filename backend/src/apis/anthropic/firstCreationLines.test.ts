// AI-GENERATED — not an architecture reference
import Anthropic from '@anthropic-ai/sdk'
import { AnthropicClient } from './AnthropicClient'
import { FIRST_CREATION_TIMEOUT_MS } from './crea/firstCreation'

// The one call of the first creation, with the API itself taken out of the way: what the
// wrapper hands the SDK, and what it makes of a timeout, a bad answer and a cut-off one.

jest.mock('./crea/settings', () => ({
  resolveCreaModelParams: async () => ({
    model: 'claude-test',
    thinking: { type: 'disabled' },
    maxTokens: 8192,
    fastMode: false,
  }),
}))

type CreateMessage = (
  body: Anthropic.MessageCreateParamsNonStreaming,
  fastMode: boolean,
  requestOptions?: Anthropic.RequestOptions,
) => Promise<Anthropic.Message>

const message = (text: string, stopReason: Anthropic.Message['stop_reason'] = 'end_turn') =>
  ({
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0 },
    stop_reason: stopReason,
  }) as unknown as Anthropic.Message

function clientWith(createMessage: CreateMessage): AnthropicClient {
  const client = Object.create(AnthropicClient.prototype) as AnthropicClient
  // @ts-expect-error - replacing the one private method that talks to the API
  client.createMessage = createMessage
  return client
}

const entries = [{ memo: 'Ich habe Kuchen gebacken' }, { memo: 'Ich habe vorgelesen' }]

describe('firstCreationLines', () => {
  it('asks with the deadline as a request option and no retry, and hands the lines back', async () => {
    let seen: Anthropic.RequestOptions | undefined
    let body: Anthropic.MessageCreateParamsNonStreaming | undefined
    const client = clientWith(async (b, _fast, options) => {
      body = b
      seen = options
      return message(
        JSON.stringify({
          lines: [
            { entryIndex: 1, text: 'für das Vorlesen' },
            { entryIndex: 0, text: 'für den Kuchen' },
          ],
          suspicious: false,
          reason: '',
        }),
      )
    })
    const result = await client.firstCreationLines(entries, 'de')
    // ⛔ maxRetries 0: the SDK's timeout is per attempt, a retry would double the deadline.
    expect(seen).toEqual({ timeout: FIRST_CREATION_TIMEOUT_MS, maxRetries: 0 })
    expect(FIRST_CREATION_TIMEOUT_MS).toBe(60_000)
    // The system prompt is the moderation Crea's (cache sharing); the task is in the user block.
    expect(body?.system).toEqual([
      expect.objectContaining({ cache_control: { type: 'ephemeral' } }),
    ])
    expect(JSON.stringify(body?.messages)).toContain('Ich habe Kuchen gebacken')
    expect(result).toEqual({
      success: true,
      value: {
        answer: { lines: ['für den Kuchen', 'für das Vorlesen'], suspicious: false, reason: '' },
        model: 'claude-test',
      },
    })
  })

  it('reports a timeout as MODEL_TIMEOUT and any other API error as MODEL_ERROR', async () => {
    const timedOut = clientWith(async () => {
      throw new Anthropic.APIConnectionTimeoutError()
    })
    const timeout = await timedOut.firstCreationLines(entries, 'de')
    expect(timeout.success).toBe(false)
    if (!timeout.success) {
      expect(timeout.error.reason).toBe('MODEL_TIMEOUT')
    }

    const broken = clientWith(async () => {
      throw new Anthropic.APIConnectionError({ message: 'socket hang up' })
    })
    const error = await broken.firstCreationLines(entries, 'de')
    expect(!error.success && error.error.reason).toBe('MODEL_ERROR')
  })

  it('treats a cut-off answer and a malformed one as MODEL_ERROR, never as lines', async () => {
    const cutOff = clientWith(async () => message('{"lines":[', 'max_tokens'))
    expect((await cutOff.firstCreationLines(entries, 'de')).success).toBe(false)

    const oneLineShort = clientWith(async () =>
      message(
        JSON.stringify({ lines: [{ entryIndex: 0, text: 'x' }], suspicious: false, reason: '' }),
      ),
    )
    const result = await oneLineShort.firstCreationLines(entries, 'de')
    expect(!result.success && result.error.reason).toBe('MODEL_ERROR')
  })
})
