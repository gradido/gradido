// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  dbIsMatchingKeyingActive,
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
 * How many entries share one snapshot of the vocabulary.
 *
 * Ten, which is what the measurements used. It is no longer how many entries go into
 * one model call - every entry has a call of its own, see `keyGroup` - but how many
 * are keyed against the same list, and so against one prompt cache entry: the first
 * call of the group writes it, the others read it. It is a ceiling, not a quota: in
 * normal running an entry arrives when a member saves it, so a pass finds one and
 * sends one. The group fills up when there is a backlog - a community joining, or a
 * re-keying after the instruction changed.
 */
const GROUP_SIZE = 10

/**
 * How many groups one pass works through before it yields.
 *
 * A pass that finds a large backlog works it off over several passes instead of
 * holding the process for minutes and spending a community's whole model budget in
 * one go.
 */
const MAX_GROUPS_PER_PASS = 10

/**
 * How many model calls may fail one after another before a pass gives up.
 *
 * Counted per call, because a call is one entry: one failure is something about that
 * sentence - an answer that ran out of room, JSON the model broke - or one bad moment
 * at the API. Two in a row is the API, and walking the rest of a backlog to find that
 * out costs a call per entry. The count runs on from one group into the next and
 * starts again after any call that gets through.
 */
const MAX_FAILED_CALLS_IN_A_ROW = 2

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
  /**
   * What `matching_keying_active` said last time, so the log says something when it
   * changes and nothing when it does not.
   *
   * `undefined` until the first pass reads it, which is what makes the very first
   * answer worth a line too - including "off", because a silent off is the state
   * somebody will be puzzled by: they switch MATCHING_ACTIVE on, see the matching
   * appear, and no words are ever bought. Without this the only way to find out why
   * is to read this file.
   */
  private keyingActiveLastSeen: boolean | undefined

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
    // Has this community said yes to paying for it? Asked here rather than in
    // `start()` alone, and asked on EVERY pass rather than once: the value lives on
    // the community row precisely so it can be turned off while the process runs, and
    // a check that only ran at startup would answer with whatever was true then.
    //
    // ⛔ Separate from MATCHING_ACTIVE above, which is a different question. That one
    // says whether members see the matching at all; this one says whether keying them
    // is paid for. A server can want the first without the second - showing the
    // feature while a decision about the model bill is still open is the ordinary
    // case, and it is exactly the case ki-playground is in.
    //
    // Before the entry count on purpose. Both are one indexed read, and this one can
    // say no without the run having looked at member data at all.
    const keyingActive = await dbIsMatchingKeyingActive()
    if (keyingActive !== this.keyingActiveLastSeen) {
      this.keyingActiveLastSeen = keyingActive
      logger.info(
        keyingActive
          ? 'matching keying: switched ON for this community (communities.matching_keying_active)'
          : 'matching keying: OFF for this community - entries are stored and served, they simply never get their words. Turn it on in the admin panel, under Crea settings',
      )
    }
    if (!keyingActive) {
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
    // Once per pass rather than once per group - a stale list is what makes two
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
    // stands at the head of every group and is paid for again in each of them - ten
    // times a pass, every pass, for ever. Held for the pass only: the next one tries
    // again, once, which is the right cadence for something that may just have been
    // a bad minute at the API.
    const givenUpOn = new Set<string>()
    // Held here rather than in `keyGroup`, because "in a row" does not stop at the end
    // of a group: the last call of one group and the first of the next are two in a
    // row as much as any other two.
    let failedInARow = 0

    for (let group = 0; group < MAX_GROUPS_PER_PASS; group++) {
      // ⛔ Again, every group, not once per pass. A pass buys up to
      // MAX_GROUPS_PER_PASS * GROUP_SIZE entries and nothing bounds its wall clock -
      // a hundred sequential model calls with no deadline - so reading the switch only
      // at the top meant an admin who unticked the box to stop a bill still paid for
      // the rest of it. "Off" has to mean the next group, not the next pass.
      //
      // The cost is one indexed read against one row per group, set against ten model
      // calls.
      //
      // ⚠️ Not read again inside a group, and that is worth saying: an admin who
      // unticks while a group is under way still pays for the rest of it, at most nine
      // more calls.
      //
      // ⚠️ Skipped for the first group, and that is a small dishonesty worth naming:
      // the pre-loop read is not adjacent to it. Between them sit the "is there work"
      // probe and `vocabulary.refresh`, which walks the GMS list page by page over the
      // network. On a first start against a large list that window is not short, and
      // an admin who unticks during it still pays for group 0.
      if (group > 0 && !(await dbIsMatchingKeyingActive())) {
        // Before the group, not after: nothing in it has been bought. Saying
        // "after this group" would tell an operator reconciling the log against the
        // invoice that another ten entries are still coming.
        logger.info('matching keying: switched off mid-pass, stopping before the next group')
        return
      }
      const pending = await dbSelectMatchingEntriesNeedingKeying(
        KEYING_INSTRUCTION_VERSION,
        GROUP_SIZE,
        [...givenUpOn],
      )
      if (!pending.length) {
        return
      }
      const done = await this.keyGroup(client, gms, pending, givenUpOn, failedInARow)
      failedInARow = done.failedInARow
      if (failedInARow >= MAX_FAILED_CALLS_IN_A_ROW) {
        // If the API is simply down, every call throws, and walking the whole backlog
        // to discover that costs one call per entry. Two is enough to tell "this
        // entry" from "the API".
        logger.error('matching keying: two model calls in a row failed, stopping the pass')
        return
      }
      if (!done.stored) {
        // Nothing was stored, so the same entries are first in line again next pass.
        // ⚠️ A group the model will never answer usably therefore blocks everything
        // behind it, once a minute, at full price. One such entry no longer does - it
        // is a call of its own, and the entries beside it get stored - but a whole
        // group of them would. There is no attempt counter to stop that; what there
        // is, is this line naming the count, the lines above naming the entries, and
        // the pass stopping rather than paying for the groups behind them.
        logger.warn(
          `matching keying: ${pending.length} entries produced nothing, stopping the pass`,
        )
        return
      }
    }
    logger.info('matching keying run yielded with work left; continuing next pass')
  }

  /**
   * Keys one group: one model call per entry, one after the other, all of them against
   * the same snapshot of the vocabulary.
   *
   * ⛔ Never several entries in one call - `AnthropicClient.keyMatchingEntry` says why,
   * and takes one entry so that nobody can hand it more. Nothing else about keying
   * changed with that: the group is still chosen ten at a time, its words are still
   * reported once at the end, and the everyday case - a member saves, a pass finds one
   * entry - always was a call of its own, with the same message it gets now.
   *
   * Returns how many entries actually got their keying stored, and how many entries in
   * a row have failed so far - counted on from `failedInARow`, which is where the
   * previous group left off.
   *
   * `givenUpOn` collects the ones this pass got nothing usable for, so the loop above
   * stops re-selecting them. They keep their NULLs and come round again next pass.
   */
  private async keyGroup(
    client: AnthropicClient,
    gms: { community: DbCommunity; apiKey: string },
    pending: MatchingEntryToKey[],
    givenUpOn: Set<string>,
    failedInARow: number,
  ): Promise<{ stored: number; failedInARow: number }> {
    // ⛔ ONE snapshot of the vocabulary for the whole group, taken here and handed to
    // every call of it - not refreshed after each entry, although nearly each of them
    // coins a word (45-53 of 53 did, against a mature vocabulary). Two reasons, both
    // measured (GMS-215):
    //  - it is how the numbers were taken: ten entries against one list, exactly as
    //    when the ten shared a call.
    //  - it is what the prompt cache stands on. The system text is the instruction
    //    plus this list; refreshed per entry it would change with nearly every call,
    //    every call would write the cache and none would read it, and a re-keying
    //    would cost more than with no cache at all.
    // A COPY, because `current()` hands out the live array, and `report()` appends to
    // it. A snapshot that is the live array is only a snapshot as long as nobody
    // reports.
    const vocabulary = [...this.vocabulary.current()]
    // The cache marker whenever more than one call reads this snapshot, on ALL of
    // them, the last one included: the first call writes the cache, and a call reads
    // it only if it carries the marker too. A group of one - the everyday case - would
    // pay the write and never read it.
    const cacheSystem = pending.length > 1

    // Grouped by language, because that is what the GMS records against a word: which
    // language it was first coined in. One group can hold members of several.
    const coinedByLanguage = new Map<string, string[]>()
    let stored = 0

    for (const row of pending) {
      let keyed: { stored: boolean; words: string[] }
      try {
        keyed = await this.keyEntry(client, gms, row, vocabulary, cacheSystem, givenUpOn)
      } catch (e) {
        // A model call can fail outright - a truncated answer, unparseable JSON, a 500
        // from the API - and so, more rarely, can the database write after it.
        // ⛔ Caught HERE, per entry, and not left to the pass: a throw that left this
        // method half way through the group would leave the entries before it stored
        // and published, with their words never reported - missing from the list the
        // next group is shown, so it coins its own for the same things.
        logger.error(`matching keying of entry ${row.entry.uuid} failed: ${e}`)
        // Set aside for the rest of the pass, exactly like an entry that came back
        // unusable - this one and no other, so an entry that makes the model overrun
        // its token budget does not stand first in line again, and nothing it shares a
        // group with pays for it.
        givenUpOn.add(row.entry.uuid)
        failedInARow++
        if (failedInARow >= MAX_FAILED_CALLS_IN_A_ROW) {
          break
        }
        continue
      }
      // An entry that got through is evidence the API is answering, so the count of
      // failures in a row starts again. Without this it counts failures in the whole
      // pass, and two unrelated hiccups far apart would abandon a draining backlog on
      // the strength of a name that says "in a row".
      failedInARow = 0
      if (!keyed.stored) {
        continue
      }
      stored++
      if (!keyed.words.length) {
        continue
      }
      // Two letters, because that is the width of the GMS's column and what its
      // schema demands. It is OUR column that is varchar(4), so a stored `de-DE`
      // would 400 the report and lose a whole group's words.
      const language = row.userLanguage.slice(0, 2)
      const words = coinedByLanguage.get(language) ?? []
      words.push(...keyed.words)
      coinedByLanguage.set(language, words)
    }

    // ⛔ Reached whatever happened above - after the last entry, and after two failures
    // in a row ended the group early - because nothing in the loop can throw past its
    // catch. Every word collected belongs to an entry that is stored and cleared for
    // the GMS, and the next group has to be shown it: see the catch above.
    for (const [language, words] of coinedByLanguage) {
      try {
        await this.vocabulary.report(gms.apiKey, language, words)
      } catch (e) {
        // The words are in our own copy either way, so this group keyed consistently.
        // What another community misses is the chance to reuse them - which the GMS
        // repairs by itself the next time it counts, from the entries it was sent.
        logger.warn(`could not report coined words to the GMS: ${e}`)
      }
    }
    return { stored, failedInARow }
  }

  /**
   * Keys one entry: asks the model, stores the answer, sends the entry over.
   *
   * Answers whether the keying was stored, and the words it coined that may be
   * reported - none when the member may not be in the GMS any more. Throws when the
   * model call or the database write throws; the caller counts that and sets the
   * entry aside.
   */
  private async keyEntry(
    client: AnthropicClient,
    gms: { community: DbCommunity; apiKey: string },
    row: MatchingEntryToKey,
    vocabulary: readonly string[],
    cacheSystem: boolean,
    givenUpOn: Set<string>,
  ): Promise<{ stored: boolean; words: string[] }> {
    // Field by field, so that what goes to the model can be read here: the channel, the
    // sentence, and the details it reads the sentence with (cut short in the message).
    const record = await client.keyMatchingEntry(
      {
        matchingType: row.entry.matchingType,
        summary: row.entry.summary,
        details: row.entry.details,
      },
      vocabulary,
      { cacheSystem },
    )
    if (!record) {
      // Named here, because the client does not know which entry it was asked about -
      // and without a uuid nothing anywhere says WHICH entry the model keeps failing
      // to answer for.
      logger.warn(`matching keying: no usable record for entry ${row.entry.uuid}`)
      givenUpOn.add(row.entry.uuid)
      return { stored: false, words: [] }
    }
    const { fields, dropped } = keyedFieldsFromAnswer(record)
    for (const reason of dropped) {
      logger.warn(`matching keying of entry ${row.entry.uuid}: dropped ${reason}`)
    }

    // The row as this pass read it, whole: the guard stores the words only while the
    // entry still says what the model was shown.
    const written = await dbWriteMatchingEntryKeying(row.entry, {
      ...fields,
      instructionVersion: KEYING_INSTRUCTION_VERSION,
    })
    if (!written.success) {
      // ⛔ NOT added to `givenUpOn`. That set means "the model cannot key this"; a
      // refused write means the opposite - the member edited the entry while the
      // call was out, so what we have is about a version that no longer exists and
      // the new one is already back on the list. Setting it aside here would make
      // the run refuse, for the rest of the pass, the one entry it just proved
      // somebody is actively working on.
      // Almost always the member editing their entry while this call was out - the
      // sentence, the channel or the details no longer match, so these words are
      // about an entry that is gone. Their edit already put it back on the list.
      logger.info(
        `matching keying of entry ${row.entry.uuid} was not stored: ${written.error.message}`,
      )
      return { stored: false, words: [] }
    }

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
      return { stored: true, words: [] }
    }
    return { stored: true, words: indexWordsOf(fields) }
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
   *   - the member switches "from anywhere" on or off. That does not clear the keying
   *     (rightly - the model is not told about it), and their change has already gone
   *     to the GMS, so sending our row would roll it back over there and leave it
   *     wrong. The same goes for new details saved after the words were stored;
   *     saved before, they make the write guard refuse the words.
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
