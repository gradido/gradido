// AI-GENERATED — not an architecture reference
import { transliterateToLatin } from 'shared'

/*
 * MIGRATION TO make `users.alias` mandatory: `varchar(20) NOT NULL`.
 *
 * 0116 gave a name to every local member that existed when it ran. Rows written after it by
 * another path than registration - the seeds, a dump restored from before 0116 - could still
 * carry none, and nothing in the database refused that. The cached copies of members of other
 * communities (`foreign = 1`) never had to carry one at all. From here on every row does.
 *
 * Before the column changes, every row without a name gets one:
 *
 *   - A local row by the same ladder as 0116 - a frozen copy, so a later change to the alias
 *     rules in `shared` cannot change or break this migration. Only the transliteration is
 *     imported: its letter tables are too large to copy for no gain. The name is recorded in
 *     `user_aliases` as 'migrated', as 0116 records the names it built.
 *   - A foreign row is a copy of what another community sent, and that community runs this
 *     migration too: every member there has a name, and the next transfer or message from them
 *     brings it here (storeForeignUser updates a row whose alias differs). Until then the row
 *     holds `member` plus the first eight hex digits of the member's gradido id: a valid name,
 *     free within the community in all but theory, and a placeholder nobody can mistake for a
 *     real one. Nothing from their real name: guessing a name for a member of another
 *     community would only put a wrong one on file, and `alias_key` (alias + community) could
 *     then block their real one.
 *
 * An empty string counts as no name, in `users` and in `user_aliases` alike.
 */

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

// Proposals for one local member, best first; `member<id>` last, which is always valid and
// free unless somebody hoards its hundred variants.
function aliasCandidates(
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
  return candidates
}

// The one proposal for a member of another community: see the header.
const foreignPlaceholder = (gradidoId: string): string =>
  `member${gradidoId.replace(/-/g, '').slice(0, 8)}`

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

type QueryFn = (query: string, values?: any[]) => Promise<Array<any>>

async function updateAliasesInBatches(
  queryFn: QueryFn,
  assigned: { id: number; alias: string }[],
  recordInUserAliases: boolean,
) {
  for (let start = 0; start < assigned.length; start += BATCH_SIZE) {
    const batch = assigned.slice(start, start + BATCH_SIZE)
    await queryFn(
      `UPDATE users SET alias = CASE id ${batch.map(() => 'WHEN ? THEN ?').join(' ')} END
        WHERE id IN (${batch.map(() => '?').join(', ')})`,
      [...batch.flatMap((user) => [user.id, user.alias]), ...batch.map((user) => user.id)],
    )
    if (recordInUserAliases) {
      // 'migrated', as 0116 marks the names it built: handed out, nobody asked yet - the
      // window at first login asks.
      await queryFn(
        `INSERT INTO user_aliases (user_id, alias, origin)
         VALUES ${batch.map(() => `(?, ?, 'migrated')`).join(', ')}`,
        batch.flatMap((user) => [user.id, user.alias]),
      )
    }
  }
}

async function nameLocalMembers(queryFn: QueryFn) {
  const users = await queryFn(
    `SELECT u.id, u.gradido_id, u.first_name, u.last_name, c.email
       FROM users u
       LEFT JOIN user_contacts c ON c.id = u.email_id
      WHERE u.\`foreign\` = 0 AND (u.alias IS NULL OR TRIM(u.alias) = '')`,
  )

  // Every name somebody holds, current or earlier (`user_aliases` is unique by alias since
  // 0141), plus the current name of every local row - the two agree unless something was
  // written past the query functions, which is the case this migration exists for.
  // Lowercased, because the columns compare case-insensitively (utf8mb4_unicode_ci).
  const takenRows = await queryFn(
    `SELECT a.alias FROM user_aliases a
      UNION
     SELECT u.alias FROM users u WHERE u.\`foreign\` = 0 AND u.alias IS NOT NULL`,
  )
  const taken = new Set<string>(takenRows.map((row) => String(row.alias).toLowerCase()))

  const assigned: { id: number; alias: string }[] = []
  for (const user of users) {
    const alias = pickFreeAlias(
      aliasCandidates(user.first_name, user.last_name, user.email),
      taken,
    ) ?? user.gradido_id.slice(0, 19).toLowerCase()
    // An alias that does not parse would still be written by raw SQL, and
    // `findUserByIdentifier` decides from the schema what KIND of identifier it was handed -
    // so its owner would be unreachable at their own gradido address. Better to stop the
    // migration than to store that.
    if (!isValidAlias(alias)) {
      throw new Error(`0164: no valid alias could be built for user ${user.id}`)
    }
    // Taken from here on, or the next member with the same name would get it too.
    taken.add(alias.toLowerCase())
    assigned.push({ id: user.id, alias })
  }
  await updateAliasesInBatches(queryFn, assigned, true)
}

async function nameForeignMembers(queryFn: QueryFn) {
  const users = await queryFn(
    `SELECT id, gradido_id, community_uuid FROM users
      WHERE \`foreign\` = 1 AND (alias IS NULL OR TRIM(alias) = '')`,
  )

  // `alias_key` is alias + community: a name is taken within its community only.
  const takenRows = await queryFn(
    `SELECT alias, community_uuid FROM users WHERE \`foreign\` = 1 AND alias IS NOT NULL`,
  )
  const takenByCommunity = new Map<string, Set<string>>()
  const takenIn = (communityUuid: string): Set<string> => {
    let taken = takenByCommunity.get(communityUuid)
    if (!taken) {
      taken = new Set<string>()
      takenByCommunity.set(communityUuid, taken)
    }
    return taken
  }
  for (const row of takenRows) {
    takenIn(String(row.community_uuid)).add(String(row.alias).toLowerCase())
  }

  const assigned: { id: number; alias: string }[] = []
  for (const user of users) {
    const taken = takenIn(String(user.community_uuid))
    const alias = pickFreeAlias([foreignPlaceholder(String(user.gradido_id))], taken)
    if (!alias || !isValidAlias(alias)) {
      throw new Error(`0164: no valid alias could be built for foreign user ${user.id}`)
    }
    taken.add(alias.toLowerCase())
    assigned.push({ id: user.id, alias })
  }
  // Not in `user_aliases`: that table holds the names of THIS community's members.
  await updateAliasesInBatches(queryFn, assigned, false)
}

export async function upgrade(queryFn: QueryFn) {
  // An empty name is no name. 0116 recorded every non-null value as 'adopted', an empty
  // string included; such a row would block nothing but is wrong, so it goes.
  await queryFn(`DELETE FROM user_aliases WHERE TRIM(alias) = '';`)

  await nameLocalMembers(queryFn)
  await nameForeignMembers(queryFn)

  await queryFn('ALTER TABLE `users` MODIFY COLUMN `alias` varchar(20) NOT NULL;')
}

export async function downgrade(queryFn: QueryFn) {
  // Only the column goes back. The names this migration built stay: they are valid names
  // their owners may already have used, and 0116's own rollback takes every 'migrated' name
  // back together with the table, should it come to that.
  await queryFn('ALTER TABLE `users` MODIFY COLUMN `alias` varchar(20) NULL DEFAULT NULL;')
}
