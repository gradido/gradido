// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  dbSelectMatchingEntriesNeedingKeying,
  dbWriteMatchingEntryKeying,
  getHomeCommunity,
  type MatchingEntryToKey,
} from 'database'
import { getLogger } from 'log4js'
import { putGmsMatchingEntry } from '@/apis/gms/GmsClient'
import { MatchingVocabulary } from '@/apis/gms/matchingVocabulary'
import { GmsUserMatchingEntry } from '@/apis/gms/model/GmsMatchingEntry'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { AnthropicClient } from '../AnthropicClient'
import { KEYING_INSTRUCTION_VERSION } from './instruction'
import { keyedFieldsFromAnswer } from './keyedFields'
import { indexWordsOf } from './keyWords'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.anthropic.matching.keyingRun`)

/**
 * How many entries go into one model call.
 *
 * Ten, which is what the measurements used. It is a ceiling, not a quota: in normal
 * running an entry arrives when a member saves it, so a pass finds one and sends one.
 * The batch fills up when there is a backlog - a community joining, or a re-keying
 * after the instruction changed - which is exactly the case where the vocabulary in
 * front of the model would otherwise be paid for once per entry instead of once per
 * ten.
 */
const BATCH_SIZE = 10

/**
 * How many batches one pass works through before it yields.
 *
 * A pass that finds a large backlog works it off over several passes instead of
 * holding the process for minutes and spending a community's whole model budget in
 * one go.
 */
const MAX_BATCHES_PER_PASS = 10

/**
 * How often the run looks for work.
 *
 * Every write nudges it, so a member's fresh entry is keyed within seconds rather
 * than waiting for this. The interval is the net underneath: it catches what a failed
 * model call or a restart left behind, and it is what starts a re-keying after the
 * instruction version has been raised.
 */
const DEFAULT_INTERVAL_MS = 60_000

/**
 * Works out the keying of matching entries, in the background.
 *
 * ⛔ Why not in the member's save button - the one rule this file exists to keep. A
 * model call takes seconds and can fail; a member pressing save must not wait for it
 * and must not lose their entry to it. And the bulk repair route hands over many
 * entries at once, so a call per entry inside it would put dozens of model calls into
 * a single request. So the write returns at once, the keying follows a moment later,
 * and the honest price is that for that moment an entry is stored but not yet
 * findable by word. The same arrangement, for the same reasons, as the GMS's
 * embedding backfill.
 *
 * There is no queue table. An entry whose `instruction_version` is missing or out of
 * date IS the to-do, which means nothing can fall off the list: an entry edited while
 * a pass was running had its keying cleared by that edit and is simply back on it.
 */
export class MatchingKeyingRun {
  private readonly vocabulary = new MatchingVocabulary()
  private pass: Promise<void> | undefined
  private timer: ReturnType<typeof setTimeout> | undefined
  private readonly intervalMs: number

  public constructor(options: { intervalMs?: number } = {}) {
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  }

  public start(): void {
    if (this.timer) {
      return
    }
    // Said out loud, both ways round. A run that is off because a switch is off looks
    // exactly like a run that is broken, and the difference matters the first time
    // somebody turns matching on and wonders why no entry ever gets its words.
    if (!CONFIG.MATCHING_ACTIVE) {
      logger.info('matching keying run stays off: MATCHING_ACTIVE is false')
      return
    }
    if (!CONFIG.ANTHROPIC_ACTIVE || !CONFIG.ANTHROPIC_API_KEY) {
      logger.info('matching keying run stays off: no anthropic access configured')
      return
    }
    logger.info(`matching keying run started, instruction ${KEYING_INSTRUCTION_VERSION}`)
    // setTimeout rather than setInterval, as elsewhere in this backend: a pass that
    // takes longer than the interval must not have the next one queued up behind it.
    const tick = () => {
      this.nudge()
      this.timer = setTimeout(tick, this.intervalMs)
      this.timer.unref?.()
    }
    this.timer = setTimeout(tick, this.intervalMs)
    this.timer.unref?.()
    this.nudge()
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  /**
   * Ask for a pass. Returns at once - callers are request handlers, and a member
   * saving an entry must not wait for a language model.
   */
  public nudge(): void {
    this.run().catch((error) => {
      logger.error(`matching keying run failed: ${error}`)
    })
  }

  /** Awaitable single pass - this is what the tests drive. */
  public async run(): Promise<void> {
    // One pass at a time. Two would read the same entries and pay for the same words
    // twice, and would report the same coinings against each other.
    if (this.pass) {
      return await this.pass
    }
    this.pass = this.runPass().finally(() => {
      this.pass = undefined
    })
    return await this.pass
  }

  private async runPass(): Promise<void> {
    // Checked here as well as in start(), because a nudge from a resolver does not go
    // through start() - and a member saving an entry must not start a run the
    // community switched off.
    if (!CONFIG.MATCHING_ACTIVE) {
      return
    }
    const client = AnthropicClient.getInstance()
    if (!client) {
      // No key, or Anthropic switched off. Entries are stored and served as before,
      // they simply never get their words - a deliberate degradation, not a failure.
      return
    }
    const gms = await this.gmsAccess()
    if (!gms) {
      return
    }

    // Before anything is keyed, and once per pass rather than once per batch: what
    // other communities have coined since last time. A stale list is what makes two
    // people describing one thing end up with two words for it.
    await this.vocabulary.refresh(gms.apiKey)

    for (let batch = 0; batch < MAX_BATCHES_PER_PASS; batch++) {
      const pending = await dbSelectMatchingEntriesNeedingKeying(
        KEYING_INSTRUCTION_VERSION,
        BATCH_SIZE,
      )
      if (!pending.length) {
        return
      }
      const written = await this.keyBatch(client, gms, pending)
      if (!written) {
        // The same entries would come back on the next turn of this loop, and be paid
        // for again. Something is wrong with them or with the answers - the log says
        // which - and the next pass is soon enough to find out.
        logger.warn(
          `matching keying: ${pending.length} entries produced nothing, stopping the pass`,
        )
        return
      }
    }
    logger.info('matching keying run yielded with work left; continuing next pass')
  }

  /** Returns how many entries actually got their keying stored. */
  private async keyBatch(
    client: AnthropicClient,
    gms: { community: DbCommunity; apiKey: string },
    pending: MatchingEntryToKey[],
  ): Promise<number> {
    const records = await client.keyMatchingEntries(
      pending.map((row) => ({
        matchingType: row.entry.matchingType,
        summary: row.entry.summary,
      })),
      this.vocabulary.current(),
    )

    // Grouped by language, because that is what the GMS records against a word: which
    // language it was first coined in. One batch can hold members of several.
    const coinedByLanguage = new Map<string, string[]>()
    let stored = 0

    for (let index = 0; index < pending.length; index++) {
      const record = records.get(index)
      if (!record) {
        // Already logged by the client. Nothing is written, so this entry stays on
        // the list and the next pass tries again.
        continue
      }
      const row = pending[index]
      const { fields, dropped } = keyedFieldsFromAnswer(record)
      for (const reason of dropped) {
        logger.warn(`matching keying of entry ${row.entry.uuid}: dropped ${reason}`)
      }

      const written = await dbWriteMatchingEntryKeying(row.entry.uuid, row.entry.summary, {
        ...fields,
        instructionVersion: KEYING_INSTRUCTION_VERSION,
      })
      if (!written.success) {
        // Almost always the member editing their entry while this call was out - the
        // summary no longer matches, so these words are about a sentence that is
        // gone. Their edit already put the entry back on the list.
        logger.info(
          `matching keying of entry ${row.entry.uuid} was not stored: ${written.error.message}`,
        )
        continue
      }

      stored++
      const words = coinedByLanguage.get(row.userLanguage) ?? []
      words.push(...indexWordsOf(fields))
      coinedByLanguage.set(row.userLanguage, words)

      await this.publish(gms, row, fields)
    }

    for (const [language, words] of coinedByLanguage) {
      try {
        await this.vocabulary.report(gms.apiKey, language, words)
      } catch (e) {
        // The words are in our own copy either way, so this batch keyed consistently.
        // What another community misses is the chance to reuse them - which the GMS
        // repairs by itself the next time it counts, from the entries it was sent.
        logger.warn(`could not report coined words to the GMS: ${e}`)
      }
    }
    return stored
  }

  /**
   * Send the freshly keyed entry over, so it can actually be found by its words.
   *
   * The entry is rebuilt from the row plus what was just written rather than read
   * back: a read would race the member's next edit, and this is the state that was
   * stored a line ago.
   */
  private async publish(
    gms: { community: DbCommunity; apiKey: string },
    row: MatchingEntryToKey,
    fields: ReturnType<typeof keyedFieldsFromAnswer>['fields'],
  ): Promise<void> {
    try {
      await putGmsMatchingEntry(
        gms.apiKey,
        new GmsUserMatchingEntry(row.userGradidoId, {
          ...row.entry,
          ...fields,
          instructionVersion: KEYING_INSTRUCTION_VERSION,
          keyedAt: new Date(),
        }),
      )
    } catch (e) {
      // The keying is stored here, so nothing is lost and nothing is paid for twice.
      // What is missing over there is the entry's words, and the member's next edit
      // or a repair run carries them across.
      logger.warn(`could not publish the keying of entry ${row.entry.uuid} to the GMS: ${e}`)
    }
  }

  /** The home community's GMS credentials, or nothing when there is no GMS to talk to. */
  private async gmsAccess(): Promise<{ community: DbCommunity; apiKey: string } | undefined> {
    if (!CONFIG.GMS_ACTIVE) {
      return undefined
    }
    const community = await getHomeCommunity()
    if (!community?.gmsApiKey) {
      logger.warn('no home community with a gms api key, cannot reach the GMS')
      return undefined
    }
    return { community, apiKey: community.gmsApiKey }
  }
}

/**
 * The one run of this process. A second would read the same entries as the first and
 * buy the same words twice.
 */
export const matchingKeyingRun = new MatchingKeyingRun()
