// AI-GENERATED — not an architecture reference

/**
 * More words than a search needs: every word is another round of comparisons for every row, and
 * a text pasted into the field can hold hundreds. A search by the first ten still finds what the
 * whole text would, and possibly more.
 */
export const SEARCH_WORDS_AT_MOST = 10

/**
 * The words of what somebody typed into a search field. Each of them has to turn up somewhere in
 * a row, in any order, so that "Michael Müller" finds "Michael E." "Müller", and so does "Müller
 * Michael". Any white space separates, at either end too: a pasted address with a space behind it
 * is still the address. An empty list means nothing was asked for, and the caller decides what
 * that finds.
 *
 * Exempt from Result on purpose: every input produces an answer.
 */
export const searchWords = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean).slice(0, SEARCH_WORDS_AT_MOST)
