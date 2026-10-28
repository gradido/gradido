// AI-GENERATED — not an architecture reference
// Unit test: what reaches the log where Crea answers without a text block. Her answer may speak of
// the moderation's remark on the member (crea/memberRemark.ts), so the log names the kinds of the
// blocks, never their words.
//
// Written to run under jest (today) and `bun test --isolate` (later) alike, as
// validateCommunities.test.ts is: the fakes are declared before `jest.mock`, and the module under
// test is imported in `beforeAll`, after every mock is registered.
import type Anthropic from '@anthropic-ai/sdk'
import type { AnthropicClient as AnthropicClientType } from './AnthropicClient'

const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  addContext: jest.fn(),
}

jest.mock('log4js', () => ({ getLogger: () => mockLogger }))
jest.mock('./crea/settings', () => ({
  resolveCreaModelParams: async () => ({
    model: 'claude-test',
    thinking: { type: 'enabled', budget_tokens: 1024 },
    maxTokens: 8192,
    fastMode: false,
  }),
}))

let AnthropicClient: typeof AnthropicClientType

beforeAll(async () => {
  ;({ AnthropicClient } = await import('./AnthropicClient'))
})

const THOUGHT = 'Sie ist Rentnerin seit Januar 2025, also gilt die Regel für Rentner.'

it('writes the kinds of the blocks to the log, never their words', async () => {
  const client = Object.create(AnthropicClient.prototype) as AnthropicClientType
  // @ts-expect-error - replacing the one private method that talks to the API
  client.createMessage = async () =>
    ({
      content: [{ type: 'thinking', thinking: THOUGHT, signature: 's' }],
      usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0 },
      stop_reason: 'end_turn',
    }) as unknown as Anthropic.Message

  await expect(
    client.evaluateContribution({ text: 'Vorlesen' }, '[MITGLIED] ist Rentnerin seit Januar 2025.'),
  ).rejects.toThrow('Crea returned no structured result')
  expect(mockLogger.error).toHaveBeenCalledWith('no text block in anthropic response', ['thinking'])
  expect(JSON.stringify(mockLogger.error.mock.calls)).not.toContain('Rentnerin')
})
