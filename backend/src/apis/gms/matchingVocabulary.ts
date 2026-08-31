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
  private lastId = 0

  /** Everything known right now, for the instruction. */
  public current(): readonly string[] {
    return this.words
  }

  public size(): number {
    return this.words.length
  }

  /**
   * Fetch whatever the GMS has that we do not.
   *
   * Failing is not fatal and must not be: a keying run that cannot reach the GMS
   * still works, it just works with the list it had. The entries it keys may coin a
   * word that already existed somewhere - a duplicate, which is a thing the design
   * expects and cleans up later, rather than a lost entry.
   */
  public async refresh(apiKey: string): Promise<void> {
    for (let page = 0; page < MAX_PAGES_PER_REFRESH; page++) {
      const { words, hasMore } = await getGmsMatchingVocabulary(
        apiKey,
        this.lastId,
        Math.min(PAGE_SIZE, MATCHING_VOCABULARY_PAGE_MAX),
      )
      for (const row of words) {
        this.remember(row.word)
        // Whatever the order the answer arrives in, the cursor may only move forward.
        this.lastId = Math.max(this.lastId, row.id)
      }
      if (!hasMore || !words.length) {
        return
      }
    }
    logger.info(`matching vocabulary refresh stopped after ${MAX_PAGES_PER_REFRESH} pages`)
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
    const fresh = words.filter((word) => !this.known.has(word))
    for (const word of words) {
      this.remember(word)
    }
    if (!fresh.length) {
      return
    }
    const added = await postGmsMatchingVocabulary(apiKey, language, fresh)
    logger.debug(`matching vocabulary: reported ${fresh.length} words, ${added} were new`)
  }

  private remember(word: string): void {
    if (!word || this.known.has(word)) {
      return
    }
    this.known.add(word)
    this.words.push(word)
  }
}
