// AI-GENERATED — not an architecture reference

/**
 * What kind of thing happens in a matching entry - exactly one of twelve.
 *
 * A closed list, and closed is what makes it useful: the model is handed these twelve
 * words and told to pick one, so anything else is an answer that ignored the
 * instruction rather than a category nobody thought of. A free-text column here would
 * fill up with fifty spellings of four ideas.
 *
 * German, like every keyed value, because the vocabulary the matching rests on is
 * German (plan decision E-1). Nothing here is ever shown to a member - it describes
 * the entry for the search, not for a screen.
 *
 * Same twelve words, in the same order, as `KEY_CATEGORIES` in the GMS's
 * `types/MatchingKey.ts`: the GMS refuses a category that is not on its list, so a
 * value this server allows and that one does not would be an entry that syncs
 * everywhere except where it is searched.
 */
export const KEY_CATEGORIES = [
  // something changes hands
  'besitzwechsel',
  'leihe',
  'schenkung',
  // something is done to a thing
  'reparatur',
  'pflege',
  'herstellung',
  'transport',
  // something is done for a person
  'unterricht',
  'beratung',
  'hilfe',
  'betreuung',
  // no exchange at all - the third channel, where two people simply share an interest
  'neigung',
] as const

export type KeyCategory = (typeof KEY_CATEGORIES)[number]

export function isKeyCategory(value: string): value is KeyCategory {
  return (KEY_CATEGORIES as readonly string[]).includes(value)
}
