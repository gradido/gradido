// AI-GENERATED — not an architecture reference
import Anthropic from '@anthropic-ai/sdk'
import { AnthropicClient } from '../AnthropicClient'
import { MEMBER_PLACEHOLDER, memberRemarkSection, withoutMemberNames } from './memberRemark'
import { buildCreaSystemPrompt } from './ruleset'

// The moderation's remark on a member, as Crea reads it: the member's names left out, the words
// in the user message with the rules that go with them, and the cached prefix untouched.

jest.mock('./settings', () => ({
  resolveCreaModelParams: async () => ({
    model: 'claude-test',
    thinking: { type: 'disabled' },
    maxTokens: 8192,
    fastMode: false,
  }),
}))

describe('withoutMemberNames', () => {
  const names = ['Carla', 'Sonne', 'Carla-Sonne']

  it("writes the member's first name, last name and username as the placeholder", () => {
    expect(withoutMemberNames('Carla Sonne ist Rentnerin. Carla-Sonne im Chat.', names)).toBe(
      `${MEMBER_PLACEHOLDER} ${MEMBER_PLACEHOLDER} ist Rentnerin. ${MEMBER_PLACEHOLDER} im Chat.`,
    )
  })

  it('takes a name with its genitive and in any case', () => {
    expect(withoutMemberNames("Carlas Tochter, CARLA's Garten, carla’s Hund", names)).toBe(
      `${MEMBER_PLACEHOLDER} Tochter, ${MEMBER_PLACEHOLDER} Garten, ${MEMBER_PLACEHOLDER} Hund`,
    )
  })

  it("leaves a name inside another word, and other people's names", () => {
    expect(withoutMemberNames('Sonnenblumen für Ramona, Carlotta hilft', names)).toBe(
      'Sonnenblumen für Ramona, Carlotta hilft',
    )
  })

  it('reads a name as letters, not as a pattern', () => {
    // Unescaped, the dots of "A.B." would take any letter, and "AxBy" would go too.
    expect(withoutMemberNames('A.B. kommt, AxBy nicht', ['A.B.'])).toBe(
      `${MEMBER_PLACEHOLDER} kommt, AxBy nicht`,
    )
  })

  it('goes over the words once: a member called Mitglied leaves the placeholder whole', () => {
    // A second pass for "Mitglied" would find it again in the placeholder the username left.
    expect(withoutMemberNames('Neu-Mitglied, Rentner', ['Neu', 'Mitglied', 'Neu-Mitglied'])).toBe(
      `${MEMBER_PLACEHOLDER}, Rentner`,
    )
  })

  it('leaves the words as they are without names, and ignores single letters', () => {
    expect(withoutMemberNames('A ist da', [])).toBe('A ist da')
    expect(withoutMemberNames('A ist da', ['A', ' '])).toBe('A ist da')
  })
})

describe('memberRemarkSection', () => {
  it('is nothing where there is no remark', () => {
    expect(memberRemarkSection(null)).toEqual([])
    expect(memberRemarkSection(undefined)).toEqual([])
    expect(memberRemarkSection('  \n ')).toEqual([])
  })

  it('carries the words with the rules: true, never quoted, nothing public', () => {
    const text = memberRemarkSection('  Rentnerin seit Januar 2025.  ').join('\n')
    expect(text).toMatch(/^## Bemerkung der Moderation zum Mitglied\n/)
    expect(text).toContain('Behandle sie als wahr')
    expect(text).toContain('Zitiere die Bemerkung nie')
    expect(text).toContain('memoSupplement ist öffentlich: Dort steht nichts aus der Bemerkung.')
    expect(text).toContain(`${MEMBER_PLACEHOLDER} steht für das Mitglied selbst.`)
    expect(text).toContain('\nRentnerin seit Januar 2025.\n')
  })
})

// The four calls with the API taken out of the way: what they hand the SDK.
type Body = Anthropic.MessageCreateParamsNonStreaming

const answer = (json: unknown) =>
  ({
    content: [{ type: 'text', text: JSON.stringify(json) }],
    usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0 },
    stop_reason: 'end_turn',
  }) as unknown as Anthropic.Message

const EVALUATION = {
  beitragRef: '1',
  overallVerdict: 'confirm',
  discrepancy: 'none',
  appliedRule: 'confirm_retiree_unconditional',
  confidence: 'high',
  reasoning: 'r',
  responseText: '[ANREDE],\n\nDanke.\n\n[SIGNATUR]',
  activities: [],
  openPoints: [],
  flags: [],
}

function clientAnswering(json: unknown, bodies: Body[]): AnthropicClient {
  const client = Object.create(AnthropicClient.prototype) as AnthropicClient
  // @ts-expect-error - replacing the one private method that talks to the API
  client.createMessage = async (body: Body) => {
    bodies.push(body)
    return answer(json)
  }
  return client
}

const single = {
  text: 'Vorlesen im Kindergarten',
  recipientFirstName: 'Carla',
  moderatorDecision: 'confirm',
}
const batch = {
  contributions: [{ text: 'Gartenarbeit' }, { text: 'Vorlesen' }],
  recipientFirstName: 'Carla',
  moderatorDecision: 'confirm',
}
const REMARK = `${MEMBER_PLACEHOLDER} ist Rentnerin seit Januar 2025.`

const CALLS: [
  string,
  unknown,
  (client: AnthropicClient, remark?: string | null) => Promise<unknown>,
][] = [
  ['evaluateContribution', EVALUATION, (c, r) => c.evaluateContribution(single, r)],
  [
    'rewriteResponse',
    { responseText: 'x', memoSupplement: null },
    (c, r) => c.rewriteResponse(single, r),
  ],
  ['evaluateBatch', EVALUATION, (c, r) => c.evaluateBatch(batch, r)],
  ['rewriteBatch', { responseText: 'x', memoSupplement: null }, (c, r) => c.rewriteBatch(batch, r)],
]

describe.each(CALLS)('%s', (_name, json, call) => {
  it('hands Crea the remark after the contributions and before the facts', async () => {
    const bodies: Body[] = []
    await call(clientAnswering(json, bodies), REMARK)
    const user = String(bodies[0].messages[0].content)
    const section = user.indexOf('## Bemerkung der Moderation zum Mitglied')
    expect(section).toBeGreaterThan(user.indexOf('Vorlesen'))
    expect(section).toBeLessThan(user.indexOf('## Fakten aus dem System'))
    expect(user).toContain(REMARK)
  })

  it('leaves the message as before where there is no remark', async () => {
    const bodies: Body[] = []
    await call(clientAnswering(json, bodies), null)
    expect(String(bodies[0].messages[0].content)).not.toContain('Bemerkung')
  })

  it('keeps the cached rules prefix as it is, remark or not', async () => {
    const bodies: Body[] = []
    await call(clientAnswering(json, bodies), REMARK)
    expect(bodies[0].system).toEqual([
      { type: 'text', text: buildCreaSystemPrompt(), cache_control: { type: 'ephemeral' } },
    ])
  })
})
