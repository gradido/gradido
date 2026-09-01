// AI-GENERATED — not an architecture reference
import { CONFIG } from '@/config'
import { AnthropicClient } from '../AnthropicClient'
import { MatchingKeyingRun } from './keyingRun'

// Everything this run reaches for, so that a pass which should do nothing can be
// shown to do nothing - rather than shown to fail on a missing database.
jest.mock('database', () => ({
  dbIsMatchingKeyingActive: jest.fn(),
  dbSelectMatchingEntriesNeedingKeying: jest.fn(),
  dbSelectPublishableMatchingEntry: jest.fn(),
  dbWriteMatchingEntryKeying: jest.fn(),
  getHomeCommunity: jest.fn(),
}))
jest.mock('@/apis/gms/GmsClient', () => ({
  getGmsMatchingVocabulary: jest.fn(),
  postGmsMatchingVocabulary: jest.fn(),
  putGmsMatchingEntry: jest.fn(),
}))
jest.mock('../AnthropicClient', () => ({
  AnthropicClient: { getInstance: jest.fn() },
}))

import {
  dbIsMatchingKeyingActive,
  dbSelectMatchingEntriesNeedingKeying,
  dbSelectPublishableMatchingEntry,
  dbWriteMatchingEntryKeying,
  getHomeCommunity,
} from 'database'
import {
  getGmsMatchingVocabulary,
  postGmsMatchingVocabulary,
  putGmsMatchingEntry,
} from '@/apis/gms/GmsClient'

const homeCommunity = getHomeCommunity as jest.Mock
const keyingActive = dbIsMatchingKeyingActive as jest.Mock
const pending = dbSelectMatchingEntriesNeedingKeying as jest.Mock
const vocabulary = getGmsMatchingVocabulary as jest.Mock
const client = AnthropicClient.getInstance as jest.Mock
const publishable = dbSelectPublishableMatchingEntry as jest.Mock
const writeKeying = dbWriteMatchingEntryKeying as jest.Mock
const putEntry = putGmsMatchingEntry as jest.Mock
const postWords = postGmsMatchingVocabulary as jest.Mock

// What "spending" means: the one call in the whole run that costs money. Every test
// below that says "does not spend" asserts on this, not on a step before it.
const keyEntries = jest.fn()

/**
 * One entry waiting to be keyed, and gone from the list once it has been.
 *
 * Twice, because a pass asks twice: once to find out whether there is any work at all,
 * and once for the batch itself. After that the real query no longer returns it - its
 * instruction version is current - and modelling that is what lets the batch loop
 * terminate the way it does in production.
 */
const oneEntryWaiting = (...waiting: ReturnType<typeof waitingEntry>[]) => {
  const batch = waiting.length ? waiting : [waitingEntry('e-1')]
  // Reset first, so that a test naming its own entries replaces the default rather
  // than queueing behind it - `…Once` values do not overwrite, they stack.
  pending.mockReset()
  pending.mockResolvedValueOnce(batch).mockResolvedValueOnce(batch).mockResolvedValue([])
}

/**
 * One entry on the keying run's list.
 *
 * `userLanguage` is a full locale on purpose. The GMS's column holds two characters
 * and its schema demands exactly two, so a stored `de-DE` reaching the report would
 * 400 it and lose a whole batch's words - and a fixture that was already two
 * characters could not tell whether the cut happens.
 */
const waitingEntry = (uuid: string, overrides: Record<string, unknown> = {}) => ({
  entry: { uuid, summary: `Satz zu ${uuid}`, matchingType: 'offer' },
  userGradidoId: `u-${uuid}`,
  userLanguage: 'de-DE',
  ...overrides,
})

/**
 * ⛔ The switch that decides whether a community pays for a language model.
 *
 * This is the one line in the delivery with money behind it, and it had no test
 * until this file: deploying without it would have started working out words for
 * every entry that already existed, on every server, the moment the release landed.
 * A switch nobody guards is a switch that gets refactored away.
 */
describe('the matching keying run and the switch it hangs on', () => {
  const wasMatchingActive = CONFIG.MATCHING_ACTIVE
  const wasGmsActive = CONFIG.GMS_ACTIVE

  beforeEach(() => {
    // reset, not clear: `clearAllMocks` empties the call log but leaves queued
    // `…Once` values behind, and a test whose run bails out early consumes none of
    // them - so they pile up and the next test gets somebody else's fixture.
    jest.resetAllMocks()
    // The run needs both switches: matching is what the community turned on, GMS is
    // where the words have to end up. Set here so that each test below changes the
    // one thing it is about.
    CONFIG.GMS_ACTIVE = true
    // Three switches, not two: the community also has to have said yes to paying for
    // the keying. On by default here so that each test below changes the one thing it
    // is about - the two tests that are ABOUT this switch set it themselves.
    keyingActive.mockResolvedValue(true)
    homeCommunity.mockResolvedValue({ id: 1, gmsApiKey: 'key' })
    pending.mockResolvedValue([])
    vocabulary.mockResolvedValue({ words: [], hasMore: false })
    keyEntries.mockResolvedValue(new Map())
    client.mockReturnValue({ keyMatchingEntries: keyEntries })
    writeKeying.mockResolvedValue({ success: true })
    publishable.mockResolvedValue({ entry: storedEntry(), userGradidoId: 'u-1' })
    putEntry.mockResolvedValue(true)
    postWords.mockResolvedValue(0)
  })

  /**
   * The row as it comes back from the database AFTER the keying was written - which
   * is what the publish reads and sends.
   *
   * The keyed columns are here on purpose: without them `GmsMatchingEntry` builds a
   * payload with no `keying` at all, and every assertion about publishing would pass
   * while the words never travelled.
   */
  const storedEntry = (overrides: Record<string, unknown> = {}) => ({
    uuid: 'e-1',
    matchingType: 'offer',
    summary: 'Ich repariere Fahrraeder',
    details: null,
    remote: false,
    keyWords: ['fahrradreparatur'],
    keySubject: 'fahrrad',
    keyActivity: 'reparieren',
    keyCategory: 'reparatur',
    keyArea: 'mobilitaet',
    keyActor: 'fahrradmechaniker',
    keySoughtActor: null,
    keyTraits: [],
    instructionVersion: 'gms176-1',
    keyedAt: new Date('2026-08-31T10:00:00.000Z'),
    ...overrides,
  })

  /** One record as the model answers. */
  const modelRecord = () => ({
    nr: 1,
    schluessel: ['fahrradreparatur'],
    sache: 'fahrrad',
    taetigkeit: 'reparieren',
    klasse: 'reparatur',
    gebiet: 'mobilitaet',
    wer: 'fahrradmechaniker',
    merkmal: [],
    gesuchter_beruf: '',
  })

  /** A model that answers the one waiting entry. */
  const modelAnswers = () => keyEntries.mockResolvedValue(new Map([[0, modelRecord()]]))

  afterEach(() => {
    CONFIG.MATCHING_ACTIVE = wasMatchingActive
    CONFIG.GMS_ACTIVE = wasGmsActive
  })

  it('does nothing at all while matching is off', async () => {
    CONFIG.MATCHING_ACTIVE = false

    await new MatchingKeyingRun().run()

    // Not one of them: no model, no database, no GMS. A pass that got as far as
    // reading the entry list would already have decided to spend.
    expect(client).not.toHaveBeenCalled()
    expect(homeCommunity).not.toHaveBeenCalled()
    expect(pending).not.toHaveBeenCalled()
  })

  it('does not even start its timer while matching is off', async () => {
    CONFIG.MATCHING_ACTIVE = false
    const run = new MatchingKeyingRun({ intervalMs: 10 })

    run.start()
    run.stop()

    expect(pending).not.toHaveBeenCalled()
  })

  it('stops before spending while the community has not switched the keying on', async () => {
    CONFIG.MATCHING_ACTIVE = true
    keyingActive.mockResolvedValue(false)
    oneEntryWaiting()

    await new MatchingKeyingRun().run()

    // ⛔ The case this switch exists for, and it is not hypothetical: a server that
    // shows the matching to its members while the decision about the model bill is
    // still open. MATCHING_ACTIVE is on, an entry is waiting, and nothing is bought.
    expect(keyEntries).not.toHaveBeenCalled()
    // Not even the entry list: the switch answers before the run looks at member data.
    expect(pending).not.toHaveBeenCalled()
  })

  it('reads the switch on every pass, so turning it off reaches a running process', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    const run = new MatchingKeyingRun()

    await run.run()
    expect(keyEntries).toHaveBeenCalledTimes(1)

    // ⛔ The entry has to be waiting for the SECOND pass too, or this test proves
    // nothing: `oneEntryWaiting` queues its batch for one pass and then hands back an
    // empty list for ever, so a second pass would stop at "nothing to do" whether the
    // switch is read or not. Measured, not assumed - with the guard deleted and
    // without this line the test stayed green.
    oneEntryWaiting()
    // ⚠️ The whole reason the value sits on the community row rather than in CONFIG.
    // A check that ran once at startup would keep spending until somebody restarts the
    // process, which is the opposite of what a switch is for.
    keyingActive.mockResolvedValue(false)
    await run.run()

    expect(keyEntries).toHaveBeenCalledTimes(1)
    expect(keyingActive).toHaveBeenCalledTimes(2)
    // ⭐ Sharper than counting model calls, and it costs nothing: `oneEntryWaiting`
    // resets this mock, so the count above is the SECOND pass alone. The switch
    // answers before the entry list is read, so that pass must not have touched the
    // database at all - any call here means the guard did not stop it.
    expect(pending).not.toHaveBeenCalled()
  })

  it('keys what is waiting once matching is on', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()

    await new MatchingKeyingRun().run()

    // The counterpart to the first test: without this one, "does nothing" would keep
    // passing after the run stopped working for an entirely different reason.
    expect(keyEntries).toHaveBeenCalled()
  })

  it('spends nothing when there is nothing waiting', async () => {
    CONFIG.MATCHING_ACTIVE = true

    await new MatchingKeyingRun().run()

    // A pass fires on every member save as well as on the timer, and almost every one
    // of them finds nothing - so "nothing to do" must cost neither a model call nor a
    // GMS round trip.
    expect(keyEntries).not.toHaveBeenCalled()
    expect(vocabulary).not.toHaveBeenCalled()
  })

  it('stops before spending when there is no model to ask', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    client.mockReturnValue(undefined)

    await new MatchingKeyingRun().run()

    expect(pending).not.toHaveBeenCalled()
  })

  it('stops before spending when the community has no GMS registration', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    homeCommunity.mockResolvedValue(undefined)

    // Without the vocabulary there is nothing to keep two communities using one word,
    // which is the whole point of keying. Better to wait than to coin in the dark.
    await new MatchingKeyingRun().run()

    expect(pending).not.toHaveBeenCalled()
  })

  it('stops before spending when the GMS itself is switched off', async () => {
    CONFIG.MATCHING_ACTIVE = true
    CONFIG.GMS_ACTIVE = false
    oneEntryWaiting()

    await new MatchingKeyingRun().run()

    // Words that cannot reach the GMS help nobody find anybody, so paying for them
    // buys nothing at all.
    expect(homeCommunity).not.toHaveBeenCalled()
    expect(pending).not.toHaveBeenCalled()
  })

  it('skips the pass when it has no vocabulary and cannot fetch one', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    vocabulary.mockRejectedValue(new Error('GMS unreachable'))

    await new MatchingKeyingRun().run()

    // Keying against an empty list would have every entry coin its own word for
    // something that already has one - paying a model to manufacture duplicates.
    expect(keyEntries).not.toHaveBeenCalled()
  })

  it('keys anyway when the refresh fails but a list is already in hand', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    const run = new MatchingKeyingRun()
    // A first pass that fills the list, then a GMS that goes away.
    vocabulary.mockResolvedValue({ words: [{ id: 1, word: 'fahrrad' }], hasMore: false })
    await run.run()
    keyEntries.mockClear()
    vocabulary.mockRejectedValue(new Error('GMS unreachable'))
    // A second entry arrives, so the second pass has something to do.
    oneEntryWaiting()

    await run.run()

    // A list one pass old costs at worst a duplicate word; stalling costs every entry.
    expect(keyEntries).toHaveBeenCalled()
  })

  describe('what it sends to the GMS after a keying', () => {
    beforeEach(() => {
      CONFIG.MATCHING_ACTIVE = true
      oneEntryWaiting()
      modelAnswers()
    })

    it('sends the entry as it stands at that moment, not as the pass read it', async () => {
      // The row the pass started with said `details: null`. The member corrected a
      // price while the model was thinking, and the correction has already gone to the
      // GMS - sending the old row would roll it back over there and leave it wrong.
      publishable.mockResolvedValue({
        entry: storedEntry({ details: 'Jetzt 20 Euro die Stunde' }),
        userGradidoId: 'u-1',
      })

      await new MatchingKeyingRun().run()

      expect(putEntry).toHaveBeenCalledTimes(1)
      const [, payload] = putEntry.mock.calls[0]
      expect(payload.details).toBe('Jetzt 20 Euro die Stunde')
      expect(payload.userUuid).toBe('u-1')
    })

    // ⛔ The point of the whole run, and nothing asserted it: the words have to be in
    // what goes over. `GmsMatchingEntry` leaves the group out entirely when the row
    // has no instruction version, so a re-read that missed the freshly written
    // columns would send a keyless entry - the GMS would keep its NULLs, the entry
    // would be off the to-do list for ever, and nothing would log a thing.
    it('carries the keying that was just written', async () => {
      await new MatchingKeyingRun().run()

      const [, payload] = putEntry.mock.calls[0]
      expect(payload.keying).toEqual(
        expect.objectContaining({
          keyWords: ['fahrradreparatur'],
          keySubject: 'fahrrad',
          keyActor: 'fahrradmechaniker',
          instructionVersion: 'gms176-1',
          keyedAt: '2026-08-31T10:00:00.000Z',
        }),
      )
    })

    // ⛔ A member can withdraw from the GMS, or delete their account, while the model
    // is thinking. The publish re-reads and refuses - and the words must not go
    // either, because the vocabulary is global, has no delete path, and every
    // community's prompt is built from it.
    it('reports no words for an entry it was not allowed to send', async () => {
      publishable.mockResolvedValue(undefined)

      await new MatchingKeyingRun().run()

      expect(putEntry).not.toHaveBeenCalled()
      expect(postWords).not.toHaveBeenCalled()
    })

    it('reports the words of an entry that did go', async () => {
      await new MatchingKeyingRun().run()

      expect(postWords).toHaveBeenCalledTimes(1)
      const [, language, words] = postWords.mock.calls[0]
      // Cut to the two characters the GMS column holds. The member's own column is
      // wider, and a `de-DE` arriving over there would 400 the whole report.
      expect(language).toBe('de')
      expect(words).toEqual(
        expect.arrayContaining(['fahrradreparatur', 'fahrrad', 'fahrradmechaniker']),
      )
    })

    // ⛔ One member withdrawing must not cost the rest of the batch their words. With
    // a single-entry fixture "the batch carries on" and "the batch stops here" look
    // exactly the same.
    it('carries on with the rest of the batch when one entry may not go', async () => {
      oneEntryWaiting(waitingEntry('e-1'), waitingEntry('e-2'))
      keyEntries.mockResolvedValue(
        new Map([
          [0, modelRecord()],
          [1, modelRecord()],
        ]),
      )
      publishable
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue({ entry: storedEntry({ uuid: 'e-2' }), userGradidoId: 'u-e-2' })

      await new MatchingKeyingRun().run()

      expect(putEntry).toHaveBeenCalledTimes(1)
      expect(putEntry.mock.calls[0][1].uuid).toBe('e-2')
      expect(postWords).toHaveBeenCalledTimes(1)
    })

    it('keeps on going when one publish throws', async () => {
      oneEntryWaiting(waitingEntry('e-1'), waitingEntry('e-2'))
      keyEntries.mockResolvedValue(
        new Map([
          [0, modelRecord()],
          [1, modelRecord()],
        ]),
      )
      putEntry.mockRejectedValueOnce(new Error('GMS unreachable')).mockResolvedValue(true)

      await new MatchingKeyingRun().run()

      // Both were tried - the first one's failure did not take the second with it.
      expect(putEntry).toHaveBeenCalledTimes(2)
      // And the first one's words still go: the entry is ours, the member consented,
      // it simply has not arrived yet. Holding them back would lose them for good.
      expect(postWords).toHaveBeenCalledTimes(1)
    })

    it('groups the words by the language of each member', async () => {
      oneEntryWaiting(waitingEntry('e-1'), waitingEntry('e-2', { userLanguage: 'es' }))
      keyEntries.mockResolvedValue(
        new Map([
          [0, modelRecord()],
          // Different words on purpose: identical ones are reported once and the
          // second report would rightly be skipped, which would hide the grouping.
          [1, { ...modelRecord(), schluessel: ['brotbacken'], sache: 'brot', wer: 'baecker' }],
        ]),
      )

      await new MatchingKeyingRun().run()

      // The language is what the GMS records against a word, and one batch can hold
      // members of several. Reporting them together would mark one language's words
      // with another's.
      const byLanguage = new Map(
        postWords.mock.calls.map(([, language, words]) => [language, words]),
      )
      expect([...byLanguage.keys()].sort()).toEqual(['de', 'es'])
      expect(byLanguage.get('de')).toEqual(expect.arrayContaining(['fahrradreparatur']))
      expect(byLanguage.get('es')).toEqual(expect.arrayContaining(['brotbacken']))
    })

    // ⛔ The worst of the lot. Pausing an entry DELETES it from the GMS; publishing
    // afterwards re-creates it in everyone's search, and nothing removes it again.
    it('sends nothing at all when the entry may no longer be over there', async () => {
      publishable.mockResolvedValue(undefined)

      await new MatchingKeyingRun().run()

      expect(putEntry).not.toHaveBeenCalled()
      // The keying is still stored - it is not lost, it just does not travel now.
      expect(writeKeying).toHaveBeenCalled()
    })

    // The repair that catches a throwing model call had no test at all: remove the
    // try/catch and every other test here still passes, while the regression - the
    // throw escaping through nudge()'s catch and the same ten entries standing first
    // in line at full price on every pass - comes back silently.
    it('survives a model call that throws, without writing anything', async () => {
      keyEntries.mockRejectedValue(new Error('the answer was truncated'))

      await expect(new MatchingKeyingRun().run()).resolves.toBeUndefined()
      expect(writeKeying).not.toHaveBeenCalled()
      expect(putEntry).not.toHaveBeenCalled()
    })

    it('keeps the pass going when a publish fails', async () => {
      putEntry.mockRejectedValue(new Error('GMS unreachable'))

      // The keying is stored here either way; what is missing over there travels with
      // the next edit or repair run. A failed publish must not cost the whole pass.
      await expect(new MatchingKeyingRun().run()).resolves.toBeUndefined()
      expect(writeKeying).toHaveBeenCalled()
    })

    it('does not send when the keying could not be stored', async () => {
      // The member rewrote the entry while the model was out, so the write guard
      // refused. Those words are about a sentence that is gone.
      writeKeying.mockResolvedValue({ success: false, error: new Error('no such row') })

      await new MatchingKeyingRun().run()

      expect(putEntry).not.toHaveBeenCalled()
    })
  })

  it('runs one pass at a time', async () => {
    CONFIG.MATCHING_ACTIVE = true
    oneEntryWaiting()
    const run = new MatchingKeyingRun()

    await Promise.all([run.run(), run.run(), run.run()])

    // Two passes would read the same entries and pay for the same words twice.
    expect(keyEntries).toHaveBeenCalledTimes(1)
  })
})
