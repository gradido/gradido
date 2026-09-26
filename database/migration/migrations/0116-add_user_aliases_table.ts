import { transliterateToLatin } from 'shared'

/* MIGRATION TO add the user_aliases table and give every local user an alias */

// Frozen copy of the alias rules as they were when this migration was written, so a later
// change in `shared` cannot change or break it. Only the transliteration is imported: its
// letter tables are too large to copy for no gain.
const ALIAS_MAX_CHARS = 20
const VALID_ALIAS_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9]+(?:[_-][a-zA-Z0-9]+?)*$/
const RESERVED_ALIAS = [
  'admin',
  'email',
  'gast',
  'gdd',
  'gradido',
  'guest',
  'home',
  'root',
  'support',
  'temp',
  'tmp',
  'user',
  'usr',
  'var',
  'reserved',
  'undefined',
  'unknown',
]
const BATCH_SIZE = 500

const isValidAlias = (alias: string): boolean =>
  VALID_ALIAS_REGEX.test(alias) && !RESERVED_ALIAS.includes(alias.toLowerCase())

const transliterateForAlias = (text: string): string =>
  transliterateToLatin(text).replace(/[^a-zA-Z0-9]/g, '')

// Proposals for one person, best first; `member<id>` last, which is always valid and free
// unless somebody hoards its hundred variants.
function aliasCandidates(
  userId: number,
  firstName: string | null,
  lastName: string | null,
  email: string | null,
): string[] {
  const candidates: string[] = []
  const push = (value: string) => {
    const trimmed = value.slice(0, ALIAS_MAX_CHARS)
    if (value.length && !candidates.includes(trimmed) && isValidAlias(trimmed)) {
      candidates.push(trimmed)
    }
  }
  // Cut the last name before transliterating, never after: `Hückstädt` gives `BerndH`, then
  // `BerndHue` - not `BerndHu`, a replacement cut in half. NFC and whole characters, so a
  // decomposed `ü` (u + U+0308, as macOS sends it) is not split either.
  const lastChars = Array.from((lastName ?? '').normalize('NFC'))
  for (let taken = 1; taken <= lastChars.length; taken++) {
    push(transliterateForAlias((firstName ?? '') + lastChars.slice(0, taken).join('')))
  }
  push(transliterateForAlias(firstName ?? ''))
  push(transliterateForAlias(lastName ?? ''))
  const emailLocal = (email ?? '').split('@')[0] ?? ''
  push(transliterateForAlias(emailLocal.split('+')[0] ?? ''))
  candidates.push(`member${userId}`)
  return candidates
}

// Every candidate as it is first, only then with 1..99 appended - cut short to stay within
// the limit. `BerndHue` and `BerndHo` are easier to tell apart than `BerndH1` and `BerndH2`.
function pickFreeAlias(candidates: string[], taken: Set<string>): string | null {
  const isFree = (alias: string) => !taken.has(alias.toLowerCase())
  for (const candidate of candidates) {
    if (isFree(candidate)) {
      return candidate
    }
  }
  for (const candidate of candidates) {
    for (let suffix = 1; suffix <= 99; suffix++) {
      const numbered = candidate.slice(0, ALIAS_MAX_CHARS - String(suffix).length) + suffix
      if (isFree(numbered)) {
        return numbered
      }
    }
  }
  return null
}

/**
 * The table holds every name a member owns, not only the ones they left behind:
 * `users.alias` marks which of them is the current one. Taking a new name inserts a
 * row, reclaiming an earlier one only moves the marker, and leaving a name writes
 * nothing - its row is already there.
 *
 * `origin` says where a name came from, and this migration writes two of the four:
 *
 * 'adopted' for the names that were ALREADY THERE. This migration is the only one that
 * has ever written `users.alias` - every value it finds was put there by a person, at
 * registration or in the settings. So the question the window at first login asks is
 * long answered for them, and it costs them none of the four: they chose under the old
 * rules, before a quota existed. Recording them as 'assigned' would have been wrong
 * twice - it would put a window in front of people who chose years ago and tell them
 * "we suggested a name for you", which is simply untrue.
 *
 * 'migrated' for the ones this migration builds itself, for members who had no name.
 * Those are genuinely unanswered, and they are exactly who the window is for. The value
 * behaves like 'assigned' everywhere except in `downgrade`, which is the whole reason
 * it is told apart from it.
 */
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE user_aliases (
      id int unsigned NOT NULL AUTO_INCREMENT,
      user_id int unsigned NOT NULL,
      alias varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
      community_uuid varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      origin varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chosen',
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY alias (alias, community_uuid),
      KEY user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  // The names that were already there get their row FIRST, as 'adopted' - see the note
  // above: a person put them there, so the question is answered and nothing is owed.
  // Doing this before a single name is handed out is what keeps them apart from this
  // migration's own work - and that separation is the only reason the rollback below
  // can take back what it gave without stripping a name somebody held long before.
  await queryFn(`
    INSERT INTO user_aliases (user_id, alias, community_uuid, origin)
    SELECT u.id, u.alias, u.community_uuid, 'adopted'
      FROM users u
     WHERE u.foreign = 0 AND u.alias IS NOT NULL AND u.community_uuid IS NOT NULL;`)

  // Give every local member without one a name. The proposal is transliterated rather
  // than filtered: a name may hold any alphabet, and dropping what an alias cannot take
  // would leave a member with a Greek name holding two letters and one with a Chinese
  // name holding none.
  const users = await queryFn(
    `SELECT u.id, u.first_name, u.last_name, u.community_uuid, c.email
       FROM users u
       LEFT JOIN user_contacts c ON c.id = u.email_id
      WHERE u.foreign = 0 AND u.alias IS NULL`,
  )

  // Only local rows count, exactly as `aliasExists` decides at runtime: a `foreign = 1`
  // row is a cached copy of a member of another community, and aliases are unique per
  // community - so a name held over there must not push somebody here one rung further
  // down the ladder for no reason. Lowercased, because the column compares
  // case-insensitively (utf8mb4_unicode_ci).
  const takenRows = await queryFn(
    `SELECT u.alias FROM users u WHERE u.foreign = 0 AND u.alias IS NOT NULL`,
  )
  const taken = new Set<string>(takenRows.map((row) => String(row.alias).toLowerCase()))

  const assigned: { id: number; alias: string; communityUuid: string | null }[] = []
  for (const user of users) {
    const alias = pickFreeAlias(
      aliasCandidates(user.id, user.first_name, user.last_name, user.email),
      taken,
    )
    // The whole point of the ladder. An alias that does not parse would still be
    // written by raw SQL, and `findUserByIdentifier` decides from the schema what KIND
    // of identifier it was handed - so its owner would be unreachable at their own
    // gradido address. Better to stop the migration than to store that.
    if (!alias || !isValidAlias(alias)) {
      throw new Error(`no valid alias could be built for user ${user.id}`)
    }
    // Taken from here on, or the next member with the same name would get it too.
    taken.add(alias.toLowerCase())
    assigned.push({ id: user.id, alias, communityUuid: user.community_uuid })
  }

  for (let start = 0; start < assigned.length; start += BATCH_SIZE) {
    const batch = assigned.slice(start, start + BATCH_SIZE)
    await queryFn(
      `UPDATE users SET alias = CASE id ${batch.map(() => 'WHEN ? THEN ?').join(' ')} END
        WHERE id IN (${batch.map(() => '?').join(', ')})`,
      [...batch.flatMap((user) => [user.id, user.alias]), ...batch.map((user) => user.id)],
    )
    // Marked as this migration's own, not merely 'assigned'. Both mean "handed out,
    // nobody asked yet" everywhere else - the difference exists solely for the rollback.
    const withCommunity = batch.filter((user) => user.communityUuid)
    if (withCommunity.length) {
      await queryFn(
        `INSERT INTO user_aliases (user_id, alias, community_uuid, origin)
         VALUES ${withCommunity.map(() => `(?, ?, ?, 'migrated')`).join(', ')}`,
        withCommunity.flatMap((user) => [user.id, user.alias, user.communityUuid]),
      )
    }
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Taken back before the table goes, and only this migration's own work: `migrated`
  // marks the names it handed out. Everything else stays - `adopted` and `chosen` are
  // names the member answered for, a migrated one they later kept included: once
  // somebody said "this is mine", withdrawing the feature is no reason to take it away.
  //
  // Two wider rules were tried and both destroy data: deriving the name from the member
  // again would clear a name somebody picked years ago that happens to match, and
  // clearing everything that is not `chosen` would clear every name that existed before
  // this table.
  await queryFn(`
    UPDATE users u
      JOIN user_aliases a ON a.user_id = u.id AND a.alias = u.alias
       SET u.alias = NULL
     WHERE a.origin = 'migrated';`)

  await queryFn(`DROP TABLE IF EXISTS user_aliases;`)
}
