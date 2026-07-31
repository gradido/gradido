// Group functions: convert the existing inline "#tag" memos into real group links, once.
//
// Before the group field existed, a "#word" in the memo was the only way to name a group,
// and the code resolved it on every read. That cost more than it was worth: the resolution
// lived in four places that had drifted apart, and the SQL half could not use an index, so
// answering "which group is this in?" meant a full scan.
//
// After this migration the answer is a row in contribution_group_tags. A "#word" in a memo
// is ordinary text from here on.
//
// ★ The conversion follows the DISPLAY rule, not the old SQL rule.
// The two disagreed: the SQL side matched the hashtag as a substring ("%#tag%"), so
// "#feuerwehrfest" counted as "feuerwehr", while the display tokenised it and showed no
// group. What members actually SAW is the display rule, so that is what becomes the stored
// truth — otherwise this migration would move contributions into groups nobody ever saw
// them in. Same reason it runs here in TypeScript instead of as one clever UPDATE: the
// regex is the same one the display used.
//
// Accent variants are deliberately not converted. "#Alesund" never displayed as the group
// "ålesund", so it does not become one now.
//
// Only contributions that never made a statement are touched: no link row and no
// group_tags_set_at stamp. Anything else has already said what it belongs to.

const INLINE_TAG = /#([\p{L}\p{N}_-]+)/gu
const READ_BATCH = 500
const INSERT_BATCH = 200

// The conversion rule itself, kept here rather than imported so this migration cannot
// change behaviour later when the display code moves on. Exported only so a test can pin
// it: a token ends at the first character that is not a letter, digit, '_' or '-', which is
// what keeps "#feuerwehrfest" from counting as "feuerwehr".
export const inlineGroupTagIds = (memo: string, byTag: Map<string, number>): number[] => {
  if (!memo?.includes('#')) {
    return []
  }
  const found: number[] = []
  const seen = new Set<number>()
  for (const match of memo.matchAll(INLINE_TAG)) {
    const groupTagId = byTag.get(match[1].toLowerCase())
    if (groupTagId !== undefined && !seen.has(groupTagId)) {
      seen.add(groupTagId)
      found.push(groupTagId)
    }
  }
  return found
}

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  const canonical: Array<{ id: number; tag: string }> = await queryFn(
    'SELECT id, tag FROM group_tags',
  )
  if (canonical.length === 0) {
    // No groups defined yet, so there is nothing an inline hashtag could refer to.
    return
  }
  const byTag = new Map(canonical.map((entry) => [entry.tag.toLowerCase(), entry.id]))

  let lastId = 0
  let converted = 0
  for (;;) {
    const rows: Array<{ id: number; memo: string }> = await queryFn(
      `SELECT c.id, c.memo
         FROM contributions c
        WHERE c.id > ?
          AND c.group_tags_set_at IS NULL
          AND NOT EXISTS (
                SELECT 1 FROM contribution_group_tags cgt WHERE cgt.contribution_id = c.id)
        ORDER BY c.id
        LIMIT ${READ_BATCH}`,
      [lastId],
    )
    if (rows.length === 0) {
      break
    }
    lastId = rows[rows.length - 1].id

    const pairs: Array<[number, number]> = []
    for (const row of rows) {
      for (const groupTagId of inlineGroupTagIds(row.memo, byTag)) {
        pairs.push([row.id, groupTagId])
      }
    }

    for (let i = 0; i < pairs.length; i += INSERT_BATCH) {
      const chunk = pairs.slice(i, i + INSERT_BATCH)
      // INSERT IGNORE against uniq_contribution_group_tag: re-running the migration on a
      // partially converted database must not fail.
      await queryFn(
        'INSERT IGNORE INTO contribution_group_tags (contribution_id, group_tag_id) VALUES ' +
          chunk.map(() => '(?, ?)').join(', '),
        chunk.flat(),
      )
      converted += chunk.length
    }
  }
  if (converted > 0) {
    process.stdout.write(`Converted ${converted} inline hashtag(s) into group links\n`)
  }
}

export async function downgrade(_queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Deliberately does nothing. A converted link is indistinguishable from one a member or a
  // moderator set through the group field afterwards, so deleting them would throw away
  // real assignments. The rows are harmless on the way back: 0108's downgrade drops the
  // whole table anyway.
}
