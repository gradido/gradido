import { AppDatabase } from '../src/AppDatabase'
import { upgrade } from './migrations/0109-migrate_inline_hashtags_to_group_tags'

// The companion to inlineHashtagConversion.test.ts, which pins the rule without a database.
// This one RUNS the migration, because a migration that runs once on production is the last
// place to find out that one of its two statements has a typo in it. On a fresh test
// database there are no groups yet, so the loop would otherwise never execute at all.
//
// Everything here is namespaced with "migtest-", so running the conversion over the whole
// test database cannot touch another suite's fixtures: it only ever links a memo to a group
// that exists, and these two groups exist nowhere else.

const db = AppDatabase.getInstance()
const query = async (sql: string, values?: unknown[]): Promise<Array<Record<string, unknown>>> =>
  db.getDataSource().query(sql, values)

const SHORT_TAG = 'migtest-fire'
const LONG_TAG = 'migtest-fire-south'
const IN_LONG = 'migration test: helped at the #migtest-fire-south festival'
const NAMES_NOTHING = 'migration test: the #migtest-firehouse was great'
const ALREADY_DECIDED = 'migration test: mentions #migtest-fire but has already spoken'

const addContribution = async (memo: string): Promise<number> => {
  const result = await query(
    `INSERT INTO contributions
       (user_id, contribution_date, memo, amount_gdd4, contribution_type, contribution_status)
     VALUES (?, NOW(), ?, 0, 'USER', 'PENDING')`,
    [999_001, memo],
  )
  return (result as unknown as { insertId: number }).insertId
}

const linkedTags = async (contributionId: number): Promise<string[]> => {
  const rows = await query(
    `SELECT gt.tag FROM contribution_group_tags cgt
       INNER JOIN group_tags gt ON gt.id = cgt.group_tag_id
      WHERE cgt.contribution_id = ? ORDER BY gt.tag`,
    [contributionId],
  )
  return rows.map((row) => row.tag as string)
}

let inLongId: number
let namesNothingId: number
let alreadyDecidedId: number

beforeAll(async () => {
  await db.init()
  await query('INSERT INTO group_tags (tag, name) VALUES (?, ?), (?, ?)', [
    SHORT_TAG,
    'Fire brigade',
    LONG_TAG,
    'Fire brigade south',
  ])
  inLongId = await addContribution(IN_LONG)
  namesNothingId = await addContribution(NAMES_NOTHING)
  alreadyDecidedId = await addContribution(ALREADY_DECIDED)
  // This one used the group field and chose "no group": already a statement, so the
  // conversion must leave it alone however its memo reads.
  await query('UPDATE contributions SET group_tags_set_at = NOW() WHERE id = ?', [
    alreadyDecidedId,
  ])

  await upgrade(query)
})

afterAll(async () => {
  await query('DELETE FROM contribution_group_tags WHERE contribution_id IN (?, ?, ?)', [
    inLongId,
    namesNothingId,
    alreadyDecidedId,
  ])
  await query('DELETE FROM contributions WHERE id IN (?, ?, ?)', [
    inLongId,
    namesNothingId,
    alreadyDecidedId,
  ])
  await query('DELETE FROM group_tags WHERE tag IN (?, ?)', [SHORT_TAG, LONG_TAG])
  await db.destroy()
})

describe('0109 against a real database', () => {
  it('links the group the memo actually names', async () => {
    expect(await linkedTags(inLongId)).toEqual([LONG_TAG])
  })

  it('does not also link the shorter group whose tag is a prefix', async () => {
    // The old SQL rule matched "%#migtest-fire%" and would have linked both.
    expect(await linkedTags(inLongId)).not.toContain(SHORT_TAG)
  })

  it('leaves a hashtag that names no group alone', async () => {
    expect(await linkedTags(namesNothingId)).toEqual([])
  })

  it('leaves a contribution that already made a statement alone', async () => {
    expect(await linkedTags(alreadyDecidedId)).toEqual([])
  })

  it('can run twice without failing', async () => {
    await upgrade(query)
    expect(await linkedTags(inLongId)).toEqual([LONG_TAG])
  })
})
