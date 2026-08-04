import { Contribution as DbContribution } from 'database'
import { type HashtagMatch, matchLegacyHashtag } from './legacyHashtagRule'

// LEGACY-HASHTAG-ADOPTION -- a changeover aid, meant to be removed again.
//
// Group functions: adopt the hashtags that predate the group field into real links.
//
// Before the field existed, a "#word" in the memo was the only way to name a group. Nothing
// resolves that on read any more -- a "#word" is ordinary text. This is the one place that
// still reads a memo for a group, on purpose and only when an administrator asks for it.
//
// The rule itself lives in legacyHashtagRule, free of imports so it can be tested without a
// database. Everything here is the plumbing around it.
//
// ★ HOW TO REMOVE IT, once every group has been looked at
//
// This exists for the changeover only. Every piece carries the marker above, so
// `grep -rn LEGACY-HASHTAG-ADOPTION` finds all of it. In full:
//
//   backend  legacyHashtagAdoption.ts + legacyHashtagRule.ts (+ its test)  -- delete
//            model/LegacyHashtagCounts.ts                                  -- delete
//            CreationGroupResolver: legacyHashtagCounts + adoptLegacyHashtags   -- delete both
//            RIGHTS.ADOPT_LEGACY_HASHTAGS and its entry in ADMIN_RIGHTS    -- delete
//   admin    creationGroups.graphql: the query + the mutation                   -- delete
//            CreationGroups.vue: the adoption block, the modal, the state cell  -- delete
//            locales: creationGroupsAdmin.adoption in all 10 files              -- delete
//   database CreationGroup entity: hashtagsAdoptedAt / hashtagsAdoptedCount     -- delete
//            a new migration dropping those two columns (0109 downgrades)  -- add
//
// Nothing else reads the two columns and nothing else imports these files, so the removal
// is subtraction only -- no behaviour has to be replaced.

const READ_BATCH = 500
const INSERT_BATCH = 200

// Candidates are contributions that carry NO group at all.
//
// ★ Deliberately NOT also requiring creation_groups_set_at IS NULL, although the migration this
// replaces did. Two reasons:
//
//   1. It would exclude everything filed since the group field went live, because
//      setContributionCreationGroups stamps on EVERY submission -- including when the field was
//      left empty. A member who still types "#Amstetten" out of habit today could never be
//      found, which is precisely the case this is meant to catch during the changeover.
//   2. The stamp guards against an AUTOMATIC reading of the memo silently overriding what
//      someone chose. Nothing here is automatic: an administrator sees the count and
//      presses a button, and a moderator can move the contribution back afterwards.
//
// What the guard still does rule out is the case that matters: a contribution that already
// belongs to a group keeps it. Only "no group at all" is offered.
//
// ★ A DELETED contribution is offered as well, on purpose. This is raw SQL, so TypeORM's
// automatic `deleted_at IS NULL` never gets added -- and it is deliberately not written by
// hand either. The admin has its own tab for deleted contributions and that tab filters BY
// GROUP, so a deleted contribution left without one could not be found there at all. The
// migration this replaces held it the same way. ⚠️ This is a decision, not an oversight;
// LegacyHashtagAdoption.test.ts pins it down so a later tidy-up cannot quietly undo it.
//
// The SQL pre-filter is the bare tag, not the hashtag: it is a superset of both spellings
// (each contains the tag), so no candidate can be missed however many blanks sit between
// the '#' and the word. It over-returns -- memo is utf8mb4_general_ci and therefore
// case- and accent-insensitive, and a memo merely mentioning the word passes -- and that is
// the safe direction, because matchLegacyHashtag then decides.
//
// ⚠️ The pre-filter cannot use an index (leading wildcard). This walks the contributions
// table. That is affordable because it happens when an administrator asks, once per group,
// and never on a page render -- but it is a real cost on a large table, and if it ever
// becomes one, the honest fix is a bound on how far back it looks, not a silent cap here.
const forEachCandidate = async (
  tag: string,
  visit: (id: number, match: Exclude<HashtagMatch, null>) => void,
): Promise<void> => {
  let lastId = 0
  for (;;) {
    const rows: Array<{ id: number; memo: string }> = await DbContribution.query(
      `SELECT c.id, c.memo
         FROM contributions c
        WHERE c.id > ?
          AND c.memo LIKE CONCAT('%', ?, '%')
          AND NOT EXISTS (
                SELECT 1 FROM contribution_creation_groups cgt WHERE cgt.contribution_id = c.id)
        ORDER BY c.id
        LIMIT ${READ_BATCH}`,
      [lastId, tag],
    )
    if (rows.length === 0) {
      return
    }
    lastId = rows[rows.length - 1].id
    for (const row of rows) {
      const match = matchLegacyHashtag(row.memo, tag)
      if (match) {
        visit(row.id, match)
      }
    }
  }
}

export interface LegacyHashtagCounts {
  exact: number
  loose: number
}

// What a run would find right now. Counted fresh rather than read off the group, because
// the answer changes as contributions get a group by other means.
export const countLegacyHashtags = async (tag: string): Promise<LegacyHashtagCounts> => {
  const counts: LegacyHashtagCounts = { exact: 0, loose: 0 }
  await forEachCandidate(tag, (_id, match) => {
    counts[match] += 1
  })
  return counts
}

// Link the matching contributions to the group. Returns how many rows were written.
//
// Safe to run again: the guard above excludes anything that already carries a link, and the
// unique index behind INSERT IGNORE absorbs a repeat. Running twice is in fact the expected
// path -- adopt the exact spelling first, look at the numbers, then come back for the loose
// one.
//
// ⚠️ The guard is read once and NOT re-checked at insert time. A contribution that is given a
// group between the scan and the write therefore ends up in two. Left as it is on purpose,
// and the reasoning belongs on the record: a contribution may carry several groups by design,
// the next assignment deletes them all and rewrites the chosen one, and the alternative --
// holding contribution-level locks for the whole run -- would put them on a query that
// already walks the table without an index. The price of leaving it is that `written` counts
// rows attempted rather than rows inserted, so a run caught by that race reports a few too
// many. If the race ever has to go, the cheap way is INSERT ... SELECT with the same
// NOT EXISTS, which the database evaluates in one statement and which also yields the real
// affected-row count -- not a transaction around this loop.
export const adoptLegacyHashtags = async (
  creationGroupId: number,
  tag: string,
  includeLoose: boolean,
): Promise<number> => {
  const ids: number[] = []
  await forEachCandidate(tag, (id, match) => {
    if (match === 'exact' || includeLoose) {
      ids.push(id)
    }
  })
  let written = 0
  for (let i = 0; i < ids.length; i += INSERT_BATCH) {
    const chunk = ids.slice(i, i + INSERT_BATCH)
    await DbContribution.query(
      'INSERT IGNORE INTO contribution_creation_groups (contribution_id, creation_group_id) VALUES ' +
        chunk.map(() => '(?, ?)').join(', '),
      chunk.flatMap((id) => [id, creationGroupId]),
    )
    written += chunk.length
  }
  return written
}
