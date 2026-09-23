// AI-GENERATED — not an architecture reference
// `user_aliases.community_uuid` goes away; the unique key becomes `alias` alone.
//
// The column was written but never read for anything the owning user does not already say:
// the table only holds names of local members, and every one of those belongs to the home
// community. `dbAliasHeldByOther` and `dbFindAliasOwner` already look a name up by `alias`
// alone, so UNIQUE (alias) states the rule the code has been enforcing all along.
//
// One ALTER, so the index is swapped and the column dropped together: should two rows share
// an alias under different community_uuids, the new key is refused and nothing has changed.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`user_aliases\`
      DROP INDEX IF EXISTS \`alias\`,
      ADD UNIQUE KEY \`alias\` (\`alias\`),
      DROP COLUMN IF EXISTS \`community_uuid\`;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE \`user_aliases\`
      ADD COLUMN IF NOT EXISTS \`community_uuid\` varchar(36) COLLATE utf8mb4_unicode_ci NULL
        AFTER \`alias\`;`)
  // Filled from the owner. A row whose user is gone falls back to the home community, which
  // is the only value the column ever held.
  await queryFn(`
    UPDATE \`user_aliases\` a
      LEFT JOIN \`users\` u ON u.id = a.user_id
       SET a.community_uuid = COALESCE(
             u.community_uuid,
             (SELECT c.community_uuid FROM \`communities\` c WHERE c.foreign = 0 LIMIT 1)
           );`)
  await queryFn(`
    ALTER TABLE \`user_aliases\`
      MODIFY COLUMN \`community_uuid\` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
      DROP INDEX IF EXISTS \`alias\`,
      ADD UNIQUE KEY \`alias\` (\`alias\`, \`community_uuid\`);`)
}
