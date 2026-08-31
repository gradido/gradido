// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  dbSelectMatchingEntriesNeedingKeying,
  dbSelectPublishableMatchingEntry,
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
 * How many batches may fail one after another before a pass gives up.
 *
 * One failure is a batch: something about those ten entries, or one bad minute at the
 * API. Two in a row is the API, and walking the rest of a backlog to find that out
 * costs a call per batch. The counter starts again after any batch that gets through.
 */
const MAX_FAILED_BATCHES_IN_A_ROW = 2

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
 * date IS the to-do - one column, written in the same statement as the words it
 * belongs to, so the two cannot disagree. An entry edited while a pass was running had
 * its keying cleared by that edit and is simply back on the list.
 *
 * What that does NOT cover, and it is worth saying rather than implying: an entry
 * whose keying was stored here but whose publish to the GMS failed is off this list
 * and still missing its words over there. The member's next edit or a bulk repair run
 * carries them across; nothing in this file retries it.
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
    // setTimeout rather than setInterval, as elsewhere in this backend. ⚠️ Note that
    // it does not by itself keep passes from piling up - the next timer is scheduled
    // without awaiting the pass - so what actually provides that is the single
    // in-flight promise in run(). This is house style, not the guarantee.
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

    // Is there anything to do at all? Asked first, because a pass fires on every
    // member save as well as on the timer, and in normal running almost every one of
    // them finds nothing. Refreshing the vocabulary first would spend a GMS round
    // trip per save to discover that.
    if (!(await dbSelectMatchingEntriesNeedingKeying(KEYING_INSTRUCTION_VERSION, 1)).length) {
      return
    }

    // Now that there is work: what other communities have coined since last time.
    // Once per pass rather than once per batch - a stale list is what makes two
    // people describing one thing end up with two words for it.
    try {
      await this.vocabulary.refresh(gms.apiKey)
    } catch (e) {
      if (!this.vocabulary.hasWholeList()) {
        // Never once read the list whole - a first start while the GMS is away, or a
        // walk that broke off half way. Keying against part of a list coins a second
        // word for everything in the missing part, and those words are never
        // unlearned. Asking "do we have any words?" instead would take the other
        // branch on the strength of one page out of three.
        logger.warn(
          `matching keying: the vocabulary has never been read whole and the GMS is not reachable (${e}), skipping`,
        )
        return
      }
      // A list one pass old costs at worst a duplicate, and the run is what fills the
      // vocabulary in the first place. Better to key than to stall.
      logger.warn(
        `matching keying: could not refresh the vocabulary (${e}), using the ${this.vocabulary.size()} words in hand`,
      )
    }

    // Entries this pass has already asked about and got nothing usable for. The
    // selector orders by id, so without this an entry the model never answers for
    // stands at the head of every batch and is paid for again in each of them - ten
    // times a pass, every pass, for ever. Held for the pass only: the next one tries
    // again, once, which is the right cadence for something that may just have been
    // a bad minute at the API.
    const givenUpOn = new Set<string>()
    let failures = 0

    for (let batch = 0; batch < MAX_BATCHES_PER_PASS; batch++) {
      const pending = await dbSelectMatchingEntriesNeedingKeying(
        KEYING_INSTRUCTION_VERSION,
        BATCH_SIZE,
        [...givenUpOn],
      )
      if (!pending.length) {
        return
      }
      let written = 0
      try {
        written = await this.keyBatch(client, gms, pending, givenUpOn)
      } catch (e) {
        // A model call can fail outright - a truncated answer, unparseable JSON, a
        // 500 from the API. Without this the throw would leave runPass through
        // nudge()'s catch, and the selector would hand back these same ten entries,
        // first in line, on every pass from now on.
        logger.error(
          `matching keying: the batch ${pending.map((row) => row.entry.uuid).join(', ')} failed: ${e}`,
        )
        // Set aside for the rest of the pass, exactly like the entries that came back
        // unusable. Otherwise one entry that makes the model overrun its token budget
        // takes its nine neighbours down with it AND stands first in line again, so
        // nothing behind them ever drains.
        for (const row of pending) {
          givenUpOn.add(row.entry.uuid)
        }
        // But not for ever within one pass: if the API is simply down, every batch
        // throws, and walking the whole backlog to discover that costs one call per
        // batch. Two is enough to tell "this batch" from "the API".
        failures++
        if (failures >= MAX_FAILED_BATCHES_IN_A_ROW) {
          logger.error('matching keying: two batches in a row failed, stopping the pass')
          return
        }
        continue
      }
      // A batch that got through is evidence the API is answering, so the count of
      // failures in a row starts again. Without this it counts failures in the whole
      // pass, and two unrelated hiccups an hour apart would abandon a draining
      // backlog on the strength of a name that says "in a row".
      failures = 0
      if (!written) {
        // Nothing was stored, so the same entries are first in line again next pass.
        // ⚠️ An entry the model will never answer usably therefore blocks everything
        // behind it, once a minute, at full price. There is no attempt counter to
        // stop that; what there is, is this line naming the count, the error above
        // naming the entries, and the pass stopping rather than paying ten times.
        logger.warn(
          `matching keying: ${pending.length} entries produced nothing, stopping the pass`,
        )
        return
      }
    }
    logger.info('matching keying run yielded with work left; continuing next pass')
  }

  /**
   * Returns how many entries actually got their keying stored.
   *
   * `givenUpOn` collects the ones this pass got nothing usable for, so the loop above
   * stops re-selecting them. They keep their NULLs and come round again next pass.
   */
  private async keyBatch(
    client: AnthropicClient,
    gms: { community: DbCommunity; apiKey: string },
    pending: MatchingEntryToKey[],
    givenUpOn: Set<string>,
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
      const row = pending[index]
      const record = records.get(index)
      if (!record) {
        // Named here, because the client only counts them - and without a uuid
        // nothing anywhere says WHICH entry the model keeps failing to answer for.
        logger.warn(`matching keying: no usable record for entry ${row.entry.uuid}`)
        givenUpOn.add(row.entry.uuid)
        continue
      }
      const { fields, dropped } = keyedFieldsFromAnswer(record)
      for (const reason of dropped) {
        logger.warn(`matching keying of entry ${row.entry.uuid}: dropped ${reason}`)
      }

      const written = await dbWriteMatchingEntryKeying(
        row.entry.uuid,
        row.entry.summary,
        row.entry.matchingType,
        { ...fields, instructionVersion: KEYING_INSTRUCTION_VERSION },
      )
      if (!written.success) {
        // ⛔ NOT added to `givenUpOn`. That set means "the model cannot key this"; a
        // refused write means the opposite - the member edited the entry while the
        // call was out, so what we have is about a version that no longer exists and
        // the new one is already back on the list. Setting it aside here would make
        // the run refuse, for the rest of the pass, the one entry it just proved
        // somebody is actively working on.
        // Almost always the member editing their entry while this call was out - the
        // sentence or the channel no longer matches, so these words are about an
        // entry that is gone. Their edit already put it back on the list.
        logger.info(
          `matching keying of entry ${row.entry.uuid} was not stored: ${written.error.message}`,
        )
        continue
      }

      stored++

      // ⛔ Two different reasons not to send, and only one of them says anything
      // about the words.
      //
      // REFUSED means the member has withdrawn from the GMS or deleted their account
      // while the model was thinking. Their words must not go either: the vocabulary
      // has no community bound, no delete path, and every community's model prompt is
      // built from it, so a word coined from what they wrote would be the one trace
      // of them that outlived their withdrawal.
      //
      // FAILED means the GMS did not answer. The entry is ours and the member
      // consented; it simply has not arrived yet. Holding its words back would lose
      // them for good - the entry now carries the current instruction version, so
      // nothing selects it again, and the recount over there can only count entries
      // it actually has. So the words go, and the entry follows with the member's
      // next edit or a repair run.
      const sent = await this.publish(gms, row.entry.uuid)
      if (sent === 'refused') {
        continue
      }

      // Two letters, because that is the width of the GMS's column and what its
      // schema demands. It is OUR column that is varchar(4), so a stored `de-DE`
      // would 400 the report and lose a whole batch's words.
      const language = row.userLanguage.slice(0, 2)
      const words = coinedByLanguage.get(language) ?? []
      words.push(...indexWordsOf(fields))
      coinedByLanguage.set(language, words)
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
   * Send the entry over, so it can actually be found by its words.
   *
   * ⛔ Read again first, and never sent from the row this pass started with. A model
   * call takes seconds, and every one of these happens in seconds:
   *
   *   - the member pauses the entry. Pausing DELETES it from the GMS, so sending the
   *     row we hold would put it straight back into everyone's search - the one thing
   *     the whole pause/delete arrangement exists to prevent.
   *   - the member corrects a price. That does not clear the keying (rightly - the
   *     sentence is unchanged), and their correction has already gone to the GMS, so
   *     sending our row would roll it back over there and leave it wrong.
   *   - the member withdraws from the GMS, or deletes their account.
   *
   * `dbSelectPublishableMatchingEntry` answers all four in one read - as of the read,
   * which is not the same as as of the request landing. A pause committing while this
   * PUT is in flight can still lose the race, and then a paused entry sits in the GMS
   * until the member's next edit or a repair run. Narrow, because the delete path
   * costs three database round trips before its own call, and bounded, because the
   * request now has a timeout - but not closed, and saying so is better than a
   * comment that reads as if it were.
   *
   * Answers with WHY it did not go, not just that it did not. `refused` is a
   * statement about consent and the caller must hold the words back; `failed` is a
   * statement about the network and it must not. A consent check that could not be
   * made answers `refused`, never `failed`.
   *
   * What this does NOT cover, and it is worth saying rather than implying: a member
   * whose very first sync to the GMS failed is unknown over there, and the per-entry
   * route answers 400 for an unknown member. Their keying stays here and reaches the
   * GMS with the next repair run. Nothing in this file retries it.
   */
  private async publish(
    gms: { community: DbCommunity; apiKey: string },
    uuid: string,
  ): Promise<'sent' | 'refused' | 'failed'> {
    // ⛔ The consent read stands OUTSIDE the try below, and that placement is the
    // whole guarantee. Inside it, a database hiccup - a reset connection, a pool
    // timeout, a restart - would be indistinguishable from a network failure at the
    // PUT and would answer `failed`, on which the caller reports the words. A read
    // that did not happen is not permission; it has to fail closed.
    let fresh: Awaited<ReturnType<typeof dbSelectPublishableMatchingEntry>>
    try {
      fresh = await dbSelectPublishableMatchingEntry(uuid)
    } catch (e) {
      logger.warn(`could not check whether entry ${uuid} may go to the GMS: ${e}`)
      return 'refused'
    }
    if (!fresh) {
      logger.info(`matching keying: entry ${uuid} may not be in the GMS right now, not sent`)
      return 'refused'
    }

    try {
      await putGmsMatchingEntry(
        gms.apiKey,
        new GmsUserMatchingEntry(fresh.userGradidoId, fresh.entry),
      )
      return 'sent'
    } catch (e) {
      // The keying is stored here, so nothing is lost and nothing is paid for twice.
      // What is missing over there is the entry itself, and the member's next edit or
      // a repair run carries it across. Told apart from a refusal on purpose - see
      // the caller.
      logger.warn(`could not publish the keying of entry ${uuid} to the GMS: ${e}`)
      return 'failed'
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
