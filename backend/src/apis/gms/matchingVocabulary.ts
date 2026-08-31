// AI-GENERATED — not an architecture reference
import { getLogger } from 'log4js'
import { MATCHING_VOCABULARY_PAGE_MAX } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getGmsMatchingVocabulary, postGmsMatchingVocabulary } from './GmsClient'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.matchingVocabulary`)

/** How many words one fetch asks for. Well under what the GMS will serve at once. */
const PAGE_SIZE = 1000

/**
 * How many pages one top-up will walk before it stops.
 *
 * Only ever reached on a first start against a long-running GMS, and stopping early
 * is harmless: the list is short by whatever is left, and the next pass carries on
 * from the same cursor.
 */
const MAX_PAGES_PER_REFRESH = 20

/**
 * The shared matching vocabulary, kept locally.
 *
 * Every community's coined words in one list, held here so that it can be put in
 * front of the model before an entry is keyed. That list is the one thing standing
 * between "two people described the same thing" and "two people used the same word":
 * without it, a member here and a member on another server, months apart, coin
 * `vertikutierer` and `rasenluefter` and never find each other.
 *
 * Topped up rather than refetched. Word ids are handed out in the order words were
 * first coined and never reused, so remembering the last one seen and asking for what
 * came after it misses nothing, however much arrived in between.
 *
 * Held in memory and gone on restart, which costs one full walk through the list on
 * the next start and nothing else. Measured, the list was 2125 words after 739
 * entries, and it converges rather than growing with the entries - the first few
 * hundred entries coin nearly all of it.
 */
export class MatchingVocabulary {
  private words: string[] = []
  private known = new Set<string>()
  /**
   * What the GMS has confirmed it holds - which is NOT the same as what we know.
   *
   * Two sets, because the two answer different questions. `known` decides what goes
   * in front of the model, and a word this server coined belongs there the moment it
   * exists, or the next batch of a backlog coins it again. `reported` decides what
   * still has to be sent, and a word may only leave that queue when the GMS has
   * actually taken it - otherwise a failed report retires the word for the life of
   * the process and no other community ever learns it.
   */
  private reported = new Set<string>()
  private walkedWholeList = false

  /** Everything known right now, for the instruction. */
  public current(): readonly string[] {
    return this.words
  }

  public size(): number {
    return this.words.length
  }

  /**
   * Fetch the whole list, from the beginning, every time.
   *
   * ⛔ Not from a remembered cursor, and that is a correction rather than a
   * simplification. Ids come from a postgres identity, which allocates at INSERT and
   * not at COMMIT - so a slow writer (the recount, inserting words no report arrived
   * for, inside a statement that scans the whole entry table) can take ids 500-600
   * while a fast one takes 601 and commits first. A page fetched in that window
   * carries 601 and not 500-600, and a cursor moved to 601 would never see those
   * hundred words again. They are exactly the words the recount had just repaired
   * into existence, and the community would coin duplicates for every one of them.
   *
   * The price is the whole list per pass. Measured, it was 2125 words after 739
   * entries and it converges rather than growing with them - three requests. When it
   * stops being three, the answer is a cursor on something that orders by COMMIT
   * rather than by allocation, not a bigger page.
   *
   * Throws when the GMS cannot be reached, and the caller decides what that means -
   * which is not the same answer in both cases. With a list already in hand, keying
   * against a slightly old one costs at worst a duplicate word. With none, every entry
   * in the pass coins its own word for things that already have one, and those
   * duplicates are the expensive kind: they are what the vocabulary exists to prevent.
   */
  public async refresh(apiKey: string): Promise<void> {
    let afterId = 0
    for (let page = 0; page < MAX_PAGES_PER_REFRESH; page++) {
      const { words, hasMore } = await getGmsMatchingVocabulary(
        apiKey,
        afterId,
        Math.min(PAGE_SIZE, MATCHING_VOCABULARY_PAGE_MAX),
      )
      for (const row of words) {
        this.remember(row.word)
        // Anything the GMS handed us is by definition already there, so it never
        // needs reporting back.
        this.reported.add(row.word)
        afterId = Math.max(afterId, row.id)
      }
      if (!hasMore || !words.length) {
        this.walkedWholeList = true
        return
      }
    }
    // Not `info`: this is the list every community's model sees being silently cut
    // short, and the number it is cut at is ours, not the GMS's.
    logger.warn(
      `matching vocabulary: stopped after ${MAX_PAGES_PER_REFRESH} pages, the list is longer than this server will fetch`,
    )
  }

  /** Whether a walk has ever run to the end. A part of the list is not the list. */
  public hasWholeList(): boolean {
    return this.walkedWholeList
  }

  /**
   * Report words this server just coined, and hold on to them.
   *
   * Both halves matter. Reporting makes a word available to every other community
   * before their next entry is keyed. Remembering it locally makes it available to
   * OUR next batch without waiting for a round trip - which is what keeps a backlog
   * of a thousand entries from coining the same word forty times.
   *
   * The language is the member's, and this is the only place the GMS can learn it:
   * the sentence never leaves this server. Words first coined in a language other
   * than German come out measurably rougher, and the GMS keeps that mark so they can
   * be read through first.
   */
  public async report(apiKey: string, language: string, words: readonly string[]): Promise<void> {
    // Deduplicated here and not only by the sets: one batch keys ten entries, and the
    // words they share would otherwise be sent ten times and counted ten times
    // against what the GMS accepts per call.
    const fresh = Array.from(new Set(words.filter((word) => word && !this.reported.has(word))))

    // Into the prompt list straight away, whatever the GMS says next. The next batch
    // of a backlog has to see what this one coined, or a thousand entries coin the
    // same word forty times - and that is true whether or not the GMS is reachable.
    for (const word of fresh) {
      this.remember(word)
    }
    if (!fresh.length) {
      return
    }

    const added = await postGmsMatchingVocabulary(apiKey, language, fresh)
    // ⛔ Marked as sent only after the call came back. Doing it before would mean a
    // report that failed - a timeout, a 400, the GMS restarting - retired its words
    // for the life of the process: they would be missing from the shared vocabulary
    // until a restart, and every other community would go on coining their own words
    // for the same things.
    for (const word of fresh) {
      this.reported.add(word)
    }
    logger.debug(`matching vocabulary: reported ${fresh.length} words, ${added} were new`)
  }

  /**
   * Into the list the model sees. Deliberately says nothing about `reported` - the
   * words this fills come from two places, and only one of them is evidence that the
   * GMS has them.
   */
  private remember(word: string): void {
    if (!word || this.known.has(word)) {
      return
    }
    this.known.add(word)
    this.words.push(word)
  }
}
