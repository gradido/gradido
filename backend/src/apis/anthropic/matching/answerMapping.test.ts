// AI-GENERATED — not an architecture reference
import type Anthropic from '@anthropic-ai/sdk'
import { AnthropicClient, CreaTruncatedError } from '../AnthropicClient'
import {
  KEYING_INSTRUCTION,
  type KeyingAnswerRecord,
  keyingUserMessage,
  vocabularyAppendix,
} from './instruction'

const entry = { matchingType: 'offer', summary: 'Ich repariere Fahrraeder', details: null }

const record = (nr: number, wort: string): KeyingAnswerRecord => ({
  nr,
  schluessel: [wort],
  sache: wort,
  taetigkeit: '',
  klasse: 'reparatur',
  gebiet: '',
  wer: '',
  merkmal: [],
  gesuchter_beruf: '',
})

/**
 * An answer as the API returns it, with the call itself taken out of the way - and
 * the request that would have gone out, kept for the tests that are about it.
 */
function answering(
  records: KeyingAnswerRecord[],
  stopReason: Anthropic.Message['stop_reason'] = 'end_turn',
): { client: AnthropicClient; sent: Anthropic.MessageCreateParamsNonStreaming[] } {
  const sent: Anthropic.MessageCreateParamsNonStreaming[] = []
  const client = Object.create(AnthropicClient.prototype) as AnthropicClient
  // @ts-expect-error - replacing the one private method that talks to the API
  client.createMessage = async (body: Anthropic.MessageCreateParamsNonStreaming) => {
    sent.push(body)
    return {
      content: [{ type: 'text', text: JSON.stringify({ eintraege: records }) }],
      usage: {
        input_tokens: 1,
        output_tokens: 1,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
      stop_reason: stopReason,
    }
  }
  return { client, sent }
}

const alone = { cacheSystem: false }

/**
 * How a model's answer is attributed back to the one entry it was asked about.
 *
 * ⛔ The line that throws away what an injection produces. A member can write an entry
 * header into their own sentence, and the model reads it as an entry of its own
 * (GMS-215). With one entry in the call there is no second member to hand those words
 * to - they come back as a record numbered 2, and the `nr` check is what drops them.
 * Take the first record instead, or the last, or any, and the smuggled words land on
 * the member's own entry and from there in the vocabulary every community feeds to its
 * model.
 *
 * Driven through the real client with the API call itself replaced, because the
 * mapping is a pure function of the answer, and the run that uses it mocks the whole
 * client away.
 */
describe('mapping a keying answer back to the one entry it was asked about', () => {
  it('takes the record numbered 1', async () => {
    const { client } = answering([record(1, 'fahrrad')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
  })

  // ⛔ What the model answered in the measurement, all three times: the member's own
  // record as number 1, the smuggled block as number 2 (GMS-215).
  it('drops the second record an entry header in the sentence comes back as', async () => {
    const { client } = answering([record(1, 'fahrrad'), record(2, 'schornsteinfeger')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
    expect(mine?.schluessel).toEqual(['fahrrad'])
  })

  // Order is no guide: position would put the smuggled words on the member's entry.
  it('follows the number, not the order the records arrive in', async () => {
    const { client } = answering([record(2, 'schornsteinfeger'), record(1, 'fahrrad')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
  })

  it('answers nothing when the only record carries another number', async () => {
    const { client } = answering([record(2, 'schornsteinfeger')])

    // Nothing is stored, the entry keeps its NULLs and comes round again. Anything
    // else here would be a keying the model gave for somebody else's block.
    await expect(client.keyMatchingEntry(entry, [], alone)).resolves.toBeUndefined()
  })

  it.each([
    ['a number below one', 0],
    ['a number past one', 3],
    ['a number that is not whole', 1.5],
  ])('drops a record with %s', async (_name, nr) => {
    const { client } = answering([record(nr, 'gratisgeld'), record(1, 'fahrrad')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
  })

  it('drops a record with no number at all', async () => {
    const { client } = answering([{ schluessel: ['gratisgeld'] }, record(1, 'fahrrad')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
  })

  // Two records claiming the entry is what an injected instruction would produce if it
  // got as far as the answer. The first wins, and the second is dropped rather than
  // allowed to overwrite it.
  it('keeps the first of two records claiming the entry', async () => {
    const { client } = answering([record(1, 'fahrrad'), record(1, 'gratisgeld')])

    const mine = await client.keyMatchingEntry(entry, [], alone)

    expect(mine?.sache).toBe('fahrrad')
  })

  it('answers nothing when the model gave no record at all', async () => {
    const { client } = answering([])

    await expect(client.keyMatchingEntry(entry, [], alone)).resolves.toBeUndefined()
  })

  // A truncated answer is incomplete JSON. Left to JSON.parse it would surface as a
  // syntax error naming nothing; named here, the log says why.
  it('refuses an answer the model ran out of room for', async () => {
    const { client } = answering([record(1, 'fahrrad')], 'max_tokens')

    await expect(client.keyMatchingEntry(entry, [], alone)).rejects.toBeInstanceOf(
      CreaTruncatedError,
    )
  })
})

/**
 * What goes out, and why it has to stay exactly this.
 *
 * The keying numbers are numbers about THIS request - the instruction and the
 * vocabulary as one system block, one entry as the message. A different message or a
 * split system text would be a new experiment, and it needs a new instruction version,
 * which keys every entry again - as the details line did (gms214-1).
 */
describe('what a keying call sends', () => {
  it('sends an entry without details in the message the keying has always sent', async () => {
    const { client, sent } = answering([record(1, 'fahrrad')])

    await client.keyMatchingEntry(entry, [], alone)

    expect(sent).toHaveLength(1)
    expect(sent[0].messages).toEqual([{ role: 'user', content: keyingUserMessage([entry]) }])
    // Spelled out once, because a change here would need a new instruction version.
    expect(sent[0].messages[0].content).toBe(
      'EINTRAG 1\nKanal: bietet an\nSatz: Ich repariere Fahrraeder',
    )
  })

  it('sends the details along, as the fourth line of the one entry', async () => {
    const { client, sent } = answering([record(1, 'programmierung')])

    await client.keyMatchingEntry(
      {
        matchingType: 'interest',
        summary: 'Performance-Optimierungen',
        details: 'Beim Programmieren',
      },
      [],
      alone,
    )

    expect(sent[0].messages[0].content).toBe(
      'EINTRAG 1\nKanal: interessiert sich fuer\nSatz: Performance-Optimierungen\nDetails: Beim Programmieren',
    )
  })

  it('sends instruction and vocabulary as one system block, character for character', async () => {
    const { client, sent } = answering([record(1, 'fahrrad')])
    const vocabulary = ['rasen', 'fahrrad']

    await client.keyMatchingEntry(entry, vocabulary, { cacheSystem: true })

    // ONE block, the measured shape. Split in two - the instruction cached on its own
    // - it would be a prompt nobody has measured.
    const system = sent[0].system as Anthropic.TextBlockParam[]
    expect(system).toHaveLength(1)
    expect(system[0].type).toBe('text')
    expect(system[0].text).toBe(KEYING_INSTRUCTION + vocabularyAppendix(vocabulary))
  })

  // The first call of a group writes the cache, and every later one reads it - but
  // only if it carries the marker too.
  it('marks that block for the cache when more calls with this vocabulary follow', async () => {
    const { client, sent } = answering([record(1, 'fahrrad')])

    await client.keyMatchingEntry(entry, ['fahrrad'], { cacheSystem: true })

    const system = sent[0].system as Anthropic.TextBlockParam[]
    expect(system[0].cache_control).toEqual({ type: 'ephemeral' })
  })

  // A call of its own would pay 1.25 times the input price for a cache nobody reads.
  it('leaves the cache out for a call of its own', async () => {
    const { client, sent } = answering([record(1, 'fahrrad')])

    await client.keyMatchingEntry(entry, ['fahrrad'], alone)

    const system = sent[0].system as Anthropic.TextBlockParam[]
    expect(system[0]).not.toHaveProperty('cache_control')
    // Nor through the back door: a marker on the request itself caches as well.
    expect(sent[0]).not.toHaveProperty('cache_control')
  })
})
