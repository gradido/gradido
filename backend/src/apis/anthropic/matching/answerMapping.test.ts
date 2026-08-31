// AI-GENERATED — not an architecture reference
import type Anthropic from '@anthropic-ai/sdk'
import { AnthropicClient, CreaTruncatedError } from '../AnthropicClient'
import type { KeyingAnswerRecord } from './instruction'

/**
 * How a model's answer is attributed back to the entries it was asked about.
 *
 * ⛔ The one guard in this delivery with somebody else's data behind it. Ten members'
 * entries go into one call as numbered blocks, and `nr` is the only thread back. Get
 * the mapping wrong and one member's keying lands on another member's entry - keys
 * that look perfectly reasonable and are about a sentence they never wrote - and from
 * there the words go into the vocabulary every community feeds to its own model.
 *
 * Driven through the real client with the API call itself replaced, because the
 * mapping is a pure function of the answer and the batch, and the run that uses it
 * mocks the whole client away.
 */
describe('mapping a keying answer back to the entries it was asked about', () => {
  const entries = [
    { matchingType: 'offer', summary: 'Ich repariere Fahrraeder' },
    { matchingType: 'need', summary: 'Ich suche einen Installateur' },
    { matchingType: 'interest', summary: 'Ich interessiere mich fuer Imkerei' },
  ]

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

  /** An answer as the API returns it, with the call itself taken out of the way. */
  function answering(
    records: KeyingAnswerRecord[],
    stopReason: Anthropic.Message['stop_reason'] = 'end_turn',
  ): AnthropicClient {
    const client = Object.create(AnthropicClient.prototype) as AnthropicClient
    // @ts-expect-error - replacing the one private method that talks to the API
    client.createMessage = async () => ({
      content: [{ type: 'text', text: JSON.stringify({ eintraege: records }) }],
      usage: { input_tokens: 1, output_tokens: 1 },
      stop_reason: stopReason,
    })
    return client
  }

  it('gives each record to the entry whose number it carries', async () => {
    const client = answering([record(1, 'fahrrad'), record(2, 'wasserhahn'), record(3, 'biene')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.get(0)?.sache).toBe('fahrrad')
    expect(byIndex.get(1)?.sache).toBe('wasserhahn')
    expect(byIndex.get(2)?.sache).toBe('biene')
  })

  it('follows the number, not the order the records arrive in', async () => {
    // Position would put `biene` on the first member's bicycle.
    const client = answering([record(3, 'biene'), record(1, 'fahrrad')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.get(0)?.sache).toBe('fahrrad')
    expect(byIndex.get(2)?.sache).toBe('biene')
    expect(byIndex.has(1)).toBe(false)
  })

  // ⛔ The reason position is not used at all: a model that drops the second record
  // would otherwise hand the third entry's words to the second member.
  it('leaves an entry unanswered rather than shifting the rest up', async () => {
    const client = answering([record(1, 'fahrrad'), record(3, 'biene')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.has(1)).toBe(false)
    expect(byIndex.get(2)?.sache).toBe('biene')
  })

  it.each([
    ['a number below the batch', 0],
    ['a number past the batch', 4],
    ['a number that is not whole', 1.5],
  ])('drops a record with %s', async (_name, nr) => {
    const client = answering([record(nr, 'gratisgeld'), record(1, 'fahrrad')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.size).toBe(1)
    expect(byIndex.get(0)?.sache).toBe('fahrrad')
  })

  it('drops a record with no number at all', async () => {
    const client = answering([{ schluessel: ['gratisgeld'] }, record(1, 'fahrrad')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.size).toBe(1)
    expect(byIndex.get(0)?.sache).toBe('fahrrad')
  })

  // Two records claiming the same entry is what an injected instruction would produce
  // if it got as far as the answer. The first wins, and the second is dropped rather
  // than allowed to overwrite it.
  it('keeps the first of two records claiming the same entry', async () => {
    const client = answering([record(1, 'fahrrad'), record(1, 'gratisgeld')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    expect(byIndex.get(0)?.sache).toBe('fahrrad')
    expect(byIndex.size).toBe(1)
  })

  it('hands back only what was answered, rather than filling the gaps', async () => {
    const client = answering([record(1, 'fahrrad')])

    const byIndex = await client.keyMatchingEntries(entries, [])

    // The two entries with no record keep their NULLs and come round again. Anything
    // else here would be a keying invented for a sentence the model never answered.
    expect(byIndex.size).toBe(1)
    expect(byIndex.get(0)?.sache).toBe('fahrrad')
  })

  // A truncated answer is incomplete JSON. Left to JSON.parse it would surface as a
  // syntax error naming nothing; named here, the log says which batch and why.
  it('refuses an answer the model ran out of room for', async () => {
    const client = answering([record(1, 'fahrrad')], 'max_tokens')

    await expect(client.keyMatchingEntries(entries, [])).rejects.toBeInstanceOf(CreaTruncatedError)
  })
})
