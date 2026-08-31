// AI-GENERATED — not an architecture reference
import { getLogger } from 'log4js'
import { MATCHING_VOCABULARY_PAGE_MAX, MAX_REPORTED_KEY_WORDS } from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getGmsMatchingVocabulary, postGmsMatchingVocabulary } from './GmsClient'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.apis.gms.matchingVocabulary`)

/** How many words one fetch asks for. Well under what the GMS will serve at once. */
const PAGE_SIZE = 1000

/**
 * How many pages one walk will fetch before it gives up.
 *
 * A backstop against a runaway answer, not a budget: the walk starts from the
 * beginning every time (see `refresh`), so a page it never reaches is a page it will
 * never reach on any later pass either. At `PAGE_SIZE` that is 200.000 words, against
 * 2125 measured after 739 entries - so hitting it means something is wrong, and the
 * walk says so and does not claim to have read the list.
 */
const MAX_PAGES_PER_REFRESH = 200

/**
 * The shared matching vocabulary, kept locally.
 *
 * Every community's coined words in one list, held here so that it can be put in
 * front of the model before an entry is keyed. That list is the one thing standing
 * between "two people described the same thing" and "two people used the same word":
 * without it, a member here and a member on another server, months apart, coin
 * `vertikutierer` and `rasenluefter` and never find each other.
 *
 * Read from the beginning every pass rather than topped up from a remembered
 * position - `refresh` says why, and it is not a matter of taste.
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
    // ⚠️ Deliberately does NOT set the flag. A walk that ran out of pages read part of
    // a list, and a part of a list is not a list - the caller has to be able to tell
    // the difference, because keying against part of it coins a second word for
    // everything in the rest, permanently, in a table with no delete path.
    //
    // Not `info` either: this is the list every community's model sees being cut
    // short, at a number that is ours rather than the GMS's.
    logger.warn(
      `matching vocabulary: stopped after ${MAX_PAGES_PER_REFRESH} pages, the list is longer than this server will fetch`,
    )
  }

  /**
   * Whether a walk has ever run all the way to the end of the list.
   *
   * Sticky on purpose: it answers "is there a real list in hand", which is what
   * decides whether keying may happen at all. A single failed refresh after a good
   * one does not make the list in memory worthless - it makes it one pass old, and
   * one pass old costs at worst a duplicate word.
   *
   * ⚠️ What it therefore cannot tell you is whether the LATEST walk was complete. A
   * process that once read a short list and now hits the page cap every time still
   * answers true. The warning in `refresh` is what says that out loud; the flag is
   * only ever asked whether we have anything worth keying against.
   */
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

    // ⛔ ALL of them into the prompt list first, before a single call goes out. The
    // next batch of a backlog has to see what this one coined, or a thousand entries
    // coin the same word forty times - and that is true whether or not the GMS
    // answers. Doing it per chunk below would leave every word after the first
    // failure in neither list: not shown to the model, not queued for the GMS.
    for (const word of fresh) {
      this.remember(word)
    }
    if (!fresh.length) {
      return
    }

    // In chunks, and the chunking lives here rather than at the caller because this
    // is the class that knows the bound. A batch of ten entries can offer more words
    // than the GMS accepts in one call, and going over would 400 and lose all of them.
    for (let from = 0; from < fresh.length; from += MAX_REPORTED_KEY_WORDS) {
      const chunk = fresh.slice(from, from + MAX_REPORTED_KEY_WORDS)
      const added = await postGmsMatchingVocabulary(apiKey, language, chunk)
      // ⛔ Marked as sent only after the call came back, and per chunk, so a failure
      // half way does not claim the chunks that never went. Marking before would mean
      // a report that failed - a timeout, a 400, the GMS restarting - retired its
      // words for the life of the process: missing from the shared vocabulary until a
      // restart, while every other community coins its own words for the same things.
      for (const word of chunk) {
        this.reported.add(word)
      }
      logger.debug(`matching vocabulary: reported ${chunk.length} words, ${added} were new`)
    }
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
