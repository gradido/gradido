// AI-GENERATED — not an architecture reference

/**
 * Whether two sentences of matching entries count as the same: the same words, whatever their
 * case and the blanks around them.
 *
 * The one comparison for every place that asks it: a project link finds the entry it stands for
 * by it (at the confirmation of a registration and for a signed-in member), and an edit keeps the
 * "genau" of an entry by it (KA-020: it falls where the sentence becomes another).
 *
 * ⚠️ Not what the GMS compares. It folds the case in its database, after the locale there and
 * without trimming, and the keying of an entry compares byte for byte. A member who changes only
 * the case keeps the "genau" here and loses the keying.
 */
export const sameWords = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase()
