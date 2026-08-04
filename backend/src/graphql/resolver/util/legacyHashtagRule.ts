// LEGACY-HASHTAG-ADOPTION -- a changeover aid, meant to be removed again.
// Group functions: the rule that decides whether a memo names a group.
//
// Deliberately free of imports -- no database, no entities. This is the part that must not
// drift, so it has to be testable on its own, and anything reaching for `database` drags in
// shared-native, a Rust binding that needs cargo to build. A rule nobody can test locally
// is a rule that quietly changes.
//
// ★ This is the DISPLAY rule the wallet used before the group field existed, not the old
// SQL one. The two disagreed: SQL matched the hashtag as a substring ("%#tag%"), so
// "#feuerwehrfest" counted as "feuerwehr", while the display tokenised it and showed no
// group. What members actually SAW is the display rule, so that is what may become stored
// truth -- otherwise adopting would move contributions into groups nobody ever saw them in.
//
// Accent variants are deliberately not adopted: comparison is lower-cased but NOT
// accent-folded, so "#Alesund" does not become the group "ålesund". It never displayed as
// one. Note this differs from the database, where group_tags.tag is utf8mb4_unicode_ci and
// therefore accent-insensitive. The JS rule governs here, because the JS rule is what was
// on screen.

// A token ends at the first character that is not a letter, digit, '_' or '-'. That is what
// keeps "#feuerwehrfest" from counting as "feuerwehr".
const TOKEN = String.raw`([\p{L}\p{N}_-]+)`

// The spelling that always worked: '#' immediately followed by the token.
const EXACT_TAG = new RegExp(`#${TOKEN}`, 'gu')

// The common typo: '#', then blanks, then the token -- "# Amstetten".
//
// ⚠️ This one NEVER displayed as a group. Neither the display rule nor the old SQL rule
// matched it, so adopting it is a decision, not a repair -- which is why it is offered and
// counted separately. What makes it defensible is that the canonical list is the safety
// net: only a word naming an existing group counts at all, so "# 5" and "# Überschrift"
// stay ordinary text.
//
// Blanks only, no line break: a '#' at the end of a line with a word beneath it is far more
// likely to be layout than intent. (createGroupTag rejects a tag containing whitespace with
// this very case in mind, so the group side can never itself be "# x".)
const LOOSE_TAG = new RegExp(`#[ \\t]+${TOKEN}`, 'gu')

export type HashtagMatch = 'exact' | 'loose' | null

// Which way, if any, this memo names the given tag. Exact wins: a memo carrying both
// "#Amstetten" and "# Amstetten" is an exact hit, not a loose one -- reporting it as loose
// would file it under "never displayed as a group", which would be untrue of it.
export const matchLegacyHashtag = (memo: string | null, tag: string): HashtagMatch => {
  if (!memo?.includes('#')) {
    return null
  }
  const wanted = tag.toLowerCase()
  for (const match of memo.matchAll(EXACT_TAG)) {
    if (match[1].toLowerCase() === wanted) {
      return 'exact'
    }
  }
  for (const match of memo.matchAll(LOOSE_TAG)) {
    if (match[1].toLowerCase() === wanted) {
      return 'loose'
    }
  }
  return null
}
