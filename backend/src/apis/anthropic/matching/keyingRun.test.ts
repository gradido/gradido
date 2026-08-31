// AI-GENERATED — not an architecture reference
import { CONFIG } from '@/config'
import { AnthropicClient } from '../AnthropicClient'
import { MatchingKeyingRun } from './keyingRun'

// Everything this run reaches for, so that a pass which should do nothing can be
// shown to do nothing - rather than shown to fail on a missing database.
jest.mock('database', () => ({
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
  dbSelectMatchingEntriesNeedingKeying,
  dbSelectPublishableMatchingEntry,
  dbWriteMatchingEntryKeying,
  getHomeCommunity,
} from 'database'
import { getGmsMatchingVocabulary, putGmsMatchingEntry } from '@/apis/gms/GmsClient'

const homeCommunity = getHomeCommunity as jest.Mock
const pending = dbSelectMatchingEntriesNeedingKeying as jest.Mock
const vocabulary = getGmsMatchingVocabulary as jest.Mock
const client = AnthropicClient.getInstance as jest.Mock
const publishable = dbSelectPublishableMatchingEntry as jest.Mock
const writeKeying = dbWriteMatchingEntryKeying as jest.Mock
const putEntry = putGmsMatchingEntry as jest.Mock

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
const oneEntryWaiting = () => {
  const waiting = [
    {
      entry: { uuid: 'e-1', summary: 'Ich repariere Fahrraeder', matchingType: 'offer' },
      userGradidoId: 'u-1',
      userLanguage: 'de',
    },
  ]
  pending.mockResolvedValueOnce(waiting).mockResolvedValueOnce(waiting).mockResolvedValue([])
}

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
    homeCommunity.mockResolvedValue({ id: 1, gmsApiKey: 'key' })
    pending.mockResolvedValue([])
    vocabulary.mockResolvedValue({ words: [], hasMore: false })
    keyEntries.mockResolvedValue(new Map())
    client.mockReturnValue({ keyMatchingEntries: keyEntries })
    writeKeying.mockResolvedValue({ success: true })
    publishable.mockResolvedValue({
      entry: {
        uuid: 'e-1',
        matchingType: 'offer',
        summary: 'Ich repariere Fahrraeder',
        details: null,
        remote: false,
      },
      userGradidoId: 'u-1',
    })
  })

  /** A model that answers the one waiting entry. */
  const modelAnswers = () =>
    keyEntries.mockResolvedValue(
      new Map([
        [
          0,
          {
            nr: 1,
            schluessel: ['fahrradreparatur'],
            sache: 'fahrrad',
            taetigkeit: 'reparieren',
            klasse: 'reparatur',
            gebiet: 'mobilitaet',
            wer: 'fahrradmechaniker',
            merkmal: [],
            gesuchter_beruf: '',
          },
        ],
      ]),
    )

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
        entry: {
          uuid: 'e-1',
          matchingType: 'offer',
          summary: 'Ich repariere Fahrraeder',
          details: 'Jetzt 20 Euro die Stunde',
          remote: false,
        },
        userGradidoId: 'u-1',
      })

      await new MatchingKeyingRun().run()

      expect(putEntry).toHaveBeenCalledTimes(1)
      const [, payload] = putEntry.mock.calls[0]
      expect(payload.details).toBe('Jetzt 20 Euro die Stunde')
      expect(payload.userUuid).toBe('u-1')
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
