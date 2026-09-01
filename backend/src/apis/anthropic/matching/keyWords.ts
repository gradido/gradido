// AI-GENERATED — not an architecture reference

/**
 * The one form a key word is stored, sent and compared in: lower case, German
 * umlauts spelled out, everything else dropped.
 *
 * ★ Textually identical to `normaliseKeyWord` in the GMS's
 * `backend/src/matching/keyWords.ts`, so that a `diff` of the two function bodies
 * settles whether they still agree. (Only these two folding functions are; the file
 * around them is not, and `indexWordsOf` below differs because this column is
 * nullable and the GMS's is not.) It has to be that way: words are compared
 * for equality and nothing else - a search shares a word with an entry or it does
 * not - so two spellings of one word have to collapse into one string, and both
 * sides have to collapse them the same way.
 *
 * The GMS folds again at its own door (`apiEntryKeyingSchema`), so what a server
 * that skipped this would lose is its own copy agreeing with the GMS's, not the
 * shape of what the GMS stores. That is the only thing the second fold buys - it
 * says nothing about whether a word is a good one.
 *
 * The honest cost: a character that is neither an ASCII letter nor a digit nor one of
 * the four German ones is dropped rather than transliterated, so `café` becomes `caf`
 * and a word in a non-Latin script becomes empty. Both are rare - the model is asked
 * for German words and answers in German even for a foreign sentence - and an empty
 * result is discarded rather than stored.
 */
export function normaliseKeyWord(word: string): string {
  return (
    word
      // First, because the rules below match the PRECOMPOSED umlauts. The same word
      // typed on macOS arrives decomposed - a plain `u` followed by U+0308 - and
      // without this the combining mark is simply dropped, so `Rasenlufter` goes into
      // the vocabulary beside `Rasenluefter` as a second word for one thing. Both
      // servers would agree on it, which is what makes it invisible: they agree on
      // two words where there should be one, and a coined word is never unlearned.
      .normalize('NFC')
      .toLowerCase()
      .replace(/\u00e4/g, 'ae')
      .replace(/\u00f6/g, 'oe')
      .replace(/\u00fc/g, 'ue')
      .replace(/\u00df/g, 'ss')
      .replace(/[^a-z0-9]/g, '')
  )
}

/**
 * Several words at once: normalised, emptied ones dropped, duplicates removed, order
 * kept.
 *
 * Dropping the empty ones is not tidiness. An empty string in an index shares a word
 * with every other entry that has one, so it would match everybody.
 */
export function normaliseKeyWords(words: readonly string[]): string[] {
  const seen = new Set<string>()
  const normalised: string[] = []
  for (const word of words) {
    const one = normaliseKeyWord(word)
    if (one && !seen.has(one)) {
      seen.add(one)
      normalised.push(one)
    }
  }
  return normalised
}

/** The keyed fields that decide what an entry is found under. */
export interface IndexableKeying {
  keyWords: string[] | null
  keySubject?: string | null
  keyActor?: string | null
  keySoughtActor?: string | null
}

/**
 * Everything an entry can be found under: the coined words plus the thing itself, the
 * person acting and the person being sought.
 *
 *     index = keyWords ∪ { keySubject, keyActor, keySoughtActor }
 *
 * ★ The GMS derives the same set again from what it is sent, and its copy is the one
 * a search reads. A community server has no way to state an index of its own: the
 * GMS's `apiEntryKeyingSchema` declares no such field, and valibot's `v.object`
 * drops what it does not declare. This one exists for the other half of the job: it
 * is the list of words reported to the shared vocabulary, so that a word coined here
 * is available to every other server before their next entry is keyed.
 *
 * Computed rather than asked of the model. Put to it as an instruction, the same
 * request was followed in 62 of 100 cases.
 */
export function indexWordsOf(keying: IndexableKeying): string[] {
  return normaliseKeyWords([
    ...(keying.keyWords ?? []),
    keying.keySubject ?? '',
    keying.keyActor ?? '',
    keying.keySoughtActor ?? '',
  ])
}
