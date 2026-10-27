import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  char,
  datetime,
  decimal,
  double,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  tinyint,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

import { AccountState } from '../enum/AccountState'
import { customBinary, customGeometry, customGradidoUnit, customMediumBlob } from './customTypes'

// The tables an empty database is built with (migration/createFromSchema.ts), so this file
// has to describe them exactly as the migrations leave them - column order, types,
// collations and index names included; migration/createFromSchema.test.ts holds the two
// against each other.
//
// The collation a table is created with, where it is not utf8mb4_unicode_ci. mysqlTable()
// takes no table options, so they live here. It is what a later `ALTER TABLE ... ADD`
// without its own COLLATE inherits; a column that differs from its table names its
// collation itself with `.collate()`.
export const tableCollations: Record<string, string> = {
  communities: 'utf8mb4_general_ci',
  contributions: 'utf8mb4_general_ci',
  contribution_links: 'utf8mb4_general_ci',
  dlt_transactions: 'utf8mb4_general_ci',
  events: 'utf8mb4_general_ci',
  federated_communities: 'utf8mb4_general_ci',
  login_elopage_buys: 'utf8mb4_general_ci',
  pending_transactions: 'utf8mb4_general_ci',
  user_aliases: 'utf8mb4_general_ci',
  user_contacts: 'utf8mb4_general_ci',
  user_roles: 'utf8mb4_general_ci',
}

export const communitiesTable = mysqlTable(
  'communities',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    foreign: boolean().default(true).notNull(),
    url: varchar({ length: 255 }).notNull(),
    publicKey: customBinary('public_key', { length: 32 }).notNull(),
    privateKey: customBinary('private_key', { length: 64 }).default(sql`NULL`),
    communityUuid: char('community_uuid', { length: 36 }).notNull(),
    authenticatedAt: datetime('authenticated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    name: varchar({ length: 40 }).default(sql`NULL`),
    description: varchar({ length: 255 }).default(sql`NULL`),
    gmsApiKey: varchar('gms_api_key', { length: 512 }).default(sql`NULL`),
    publicJwtKey: varchar('public_jwt_key', { length: 512 }).default(sql`NULL`),
    privateJwtKey: varchar('private_jwt_key', { length: 2048 }).default(sql`NULL`),
    // X25519, authenticated encryption; the private key only of the home community
    publicEncryptionKey: customBinary('public_encryption_key', { length: 32 }).notNull(),
    privateEncryptionKey: customBinary('private_encryption_key', { length: 32 }).default(sql`NULL`),
    location: customGeometry().default(null),
    hieroTopicId: varchar('hiero_topic_id', { length: 512 }).default(sql`NULL`),
    // TODO: update to not nullable
    creationDate: datetime('creation_date', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    /**
     * Whether this community pays a language model to key its matching entries.
     *
     * ⛔ Off for every existing row, and that is a decision rather than a default. The
     * keying run costs money per entry, and the first run on a server with a backlog
     * pays for the whole backlog at once. Somebody has to say when that happens, and
     * this column is where they say it.
     *
     * ⛔ Switching it ON is what starts the spending: the run then works through the
     * entries that have no words, up to a hundred per pass and a pass a minute, until the
     * backlog is gone. That is not a preference, it is a decision about a bill.
     *
     * Switching it OFF is read again before every group, so a pass in flight stops after
     * the group it is in - at most GROUP_SIZE more entries, not a whole pass. ⚠️ "At most
     * one group", not "nothing more": the group already running is paid for, and the very
     * first group of a pass is not re-checked, because the pass just read the column.
     *
     * Read through the cached home community (`dbIsMatchingKeyingActive`). The switch is
     * written via `dbUpdateHomeCommunity`, which invalidates that cache in every process
     * (Redis pub/sub), so the next read sees it. Should the message get lost, or the row be
     * written some other way, it is seen once the cache has timed out
     * (`DEFAULT_CACHE_TIMEOUT_MS`).
     *
     * Separate from `MATCHING_ACTIVE` on purpose. That one answers "do members see the
     * matching at all" - the menu entry and the routes - and it is compiled into the
     * frontend bundle at build time. Two different questions were riding on it: a
     * server that wants to show the feature had no way to say "but do not start
     * buying words yet", and switching it off to stop the spending would take the
     * feature off the screen with it.
     *
     * On the community rather than in the environment for two reasons. It is
     * switchable while the process runs, which a `CONFIG` value read at startup is
     * not - and the cost belongs to the community that has the members, which is the
     * same reason the model call sits on the community server and not on the GMS.
     *
     */
    matchingKeyingActive: boolean('matching_keying_active').default(false).notNull(),
  },
  (table) => [
    unique('url_key').on(table.url),
    unique('uuid_key').on(table.communityUuid),
    unique('public_key_key').on(table.publicKey),
  ],
)

export type CommunitiesSelect = typeof communitiesTable.$inferSelect
export type CommunitiesInsert = typeof communitiesTable.$inferInsert

export const federatedCommunitiesTable = mysqlTable(
  'federated_communities',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // TODO: remove home community entries from this table, because entries are redundant
    foreign: boolean().default(true).notNull(),
    publicKey: customBinary('public_key', { length: 32 }).notNull(),
    apiVersion: varchar('api_version', { length: 10 }).notNull(),
    endPoint: varchar('end_point', { length: 255 }).notNull(),
    lastAnnouncedAt: datetime('last_announced_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    verifiedAt: datetime('verified_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    lastErrorAt: datetime('last_error_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [uniqueIndex('public_api_key').on(table.publicKey, table.apiVersion)],
)

export type FederatedCommunitiesSelect = typeof federatedCommunitiesTable.$inferSelect
export type FederatedCommunitiesInsert = typeof federatedCommunitiesTable.$inferInsert

export const contributionsTable = mysqlTable(
  'contributions',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id').default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date' }).default(sql`NULL`),
    resubmissionAt: datetime('resubmission_at', { mode: 'date' }).default(sql`NULL`),
    contributionDate: datetime('contribution_date', { mode: 'date' }).default(sql`NULL`),
    memo: varchar({ length: 512 }).notNull(),
    amountLegacy: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    moderatorId: int('moderator_id').default(sql`NULL`),
    contributionLinkId: int('contribution_link_id', { unsigned: true }).default(sql`NULL`),
    confirmedBy: int('confirmed_by', { unsigned: true }).default(sql`NULL`),
    confirmedAt: datetime('confirmed_at', { mode: 'date' }).default(sql`NULL`),
    deniedAt: datetime('denied_at', { mode: 'date' }).default(sql`NULL`),
    deniedBy: int('denied_by', { unsigned: true }).default(sql`NULL`),
    type: varchar('contribution_type', { length: 12 })
      .collate('utf8mb4_unicode_ci')
      .default('ADMIN')
      .notNull(),
    status: varchar('contribution_status', { length: 12 })
      .collate('utf8mb4_unicode_ci')
      .default('PENDING')
      .notNull(),
    deletedAt: datetime('deleted_at', { mode: 'date' }).default(sql`NULL`),
    transactionId: int('transaction_id', { unsigned: true }).default(sql`NULL`),
    updatedAt: datetime('updated_at', { mode: 'date' }).default(sql`NULL`),
    updatedBy: int('updated_by', { unsigned: true }).default(sql`NULL`),
    deletedBy: int('deleted_by', { unsigned: true }).default(sql`NULL`),
    creationGroupsSetAt: datetime('creation_groups_set_at', { mode: 'date', fsp: 3 }).default(
      sql`NULL`,
    ),
  },
  (table) => [
    index('idx_contributions_user_created').on(table.userId, table.createdAt),
    index('idx_contributions_transaction_id').on(table.transactionId),
    index('idx_contributions_feed').on(
      table.status,
      table.contributionLinkId,
      table.confirmedAt,
      table.transactionId,
    ),
  ],
)

export type ContributionsSelect = typeof contributionsTable.$inferSelect
export type ContributionsInsert = typeof contributionsTable.$inferInsert

export const contributionLinksTable = mysqlTable('contribution_links', {
  id: int('id', { unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).collate('utf8mb4_unicode_ci').notNull(),
  memo: varchar('memo', { length: 512 }).notNull(),
  validFrom: datetime('valid_from', { mode: 'date' }).notNull(),
  validTo: datetime('valid_to', { mode: 'date' }),
  amountLegacy: customGradidoUnit('amount_legacy'),
  amountGdd4: customGradidoUnit('amount_gdd4'),
  cycle: varchar('cycle', { length: 12 }).collate('utf8mb4_unicode_ci').notNull().default('ONCE'),
  maxPerCycle: int('max_per_cycle', { unsigned: true }).notNull().default(1),
  maxAmountPerMonthLegacy: customGradidoUnit('max_amount_per_month_legacy'),
  maxAmountPerMonthGdd4: customGradidoUnit('max_amount_per_month_gdd4'),
  totalMaxCountOfContribution: int('total_max_count_of_contribution', {
    unsigned: true,
  }),
  maxAccountBalanceLegacy: customGradidoUnit('max_account_balance_legacy'),
  maxAccountBalanceGdd4: customGradidoUnit('max_account_balance_gdd4'),
  minGapHours: int('min_gap_hours', { unsigned: true }),
  createdAt: datetime('created_at', { mode: 'date' }).default(sql`current_timestamp()`).notNull(),
  deletedAt: datetime('deleted_at', { mode: 'date' }),
  code: varchar('code', { length: 24 }).collate('utf8mb4_unicode_ci').notNull(),
  linkEnabled: tinyint('link_enabled', { unsigned: false }).notNull().default(1),
})

export type ContributionLinksSelect = typeof contributionLinksTable.$inferSelect
export type ContributionLinksInsert = typeof contributionLinksTable.$inferInsert

export const contributionCreationGroupsTable = mysqlTable(
  'contribution_creation_groups',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    contributionId: int('contribution_id', { unsigned: true }).notNull(),
    creationGroupId: int('creation_group_id', { unsigned: true }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    unique('uniq_contribution_creation_group').on(table.contributionId, table.creationGroupId),
    index('idx_ccg_contribution_id').on(table.contributionId),
    index('idx_ccg_creation_group_id').on(table.creationGroupId),
  ],
)

export type ContributionCreationGroupSelect = typeof contributionCreationGroupsTable.$inferSelect
export type ContributionCreationGroupInsert = typeof contributionCreationGroupsTable.$inferInsert

export const contributionMessagesTable = mysqlTable(
  'contribution_messages',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    contributionId: int('contribution_id', { unsigned: true }).notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    message: varchar({ length: 2000 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date' }).default(sql`current_timestamp()`).notNull(),
    updatedAt: datetime('updated_at', { mode: 'date' }).default(sql`NULL`),
    deletedAt: datetime('deleted_at', { mode: 'date' }).default(sql`NULL`),
    deletedBy: int('deleted_by', { unsigned: true }).default(sql`NULL`),
    type: varchar({ length: 12 }).default('DIALOG').notNull(),
    isModerator: boolean('is_moderator').default(false).notNull(),
  },
  (table) => [index('contribution_id').on(table.contributionId)],
)

export type ContributionMessageSelect = typeof contributionMessagesTable.$inferSelect
export type ContributionMessageInsert = typeof contributionMessagesTable.$inferInsert

// One moderator conversation with Crea in the admin chat window (CreaChat). The
// Anthropic Messages API is stateless, so the whole exchange lives here as a JSON array
// in `messages` — that is the shape every access needs: read the complete thread, append
// a user/assistant pair, save. Nothing ever reads or writes a single message.
export const creachatThreadsTable = mysqlTable(
  'creachat_threads',
  {
    id: char({ length: 36 }).primaryKey().notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    messages: longtext().notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    // Maintained by dbUpdateCreachatThreadMessages, not by an ON UPDATE clause: a column
    // half-owned by the DDL and half by the query is the kind of thing nobody can answer a
    // question about later.
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    index('idx_creachat_threads_user_id').on(table.userId),
    index('idx_creachat_threads_updated_at').on(table.updatedAt),
  ],
)

export type CreachatThreadSelect = typeof creachatThreadsTable.$inferSelect
export type CreachatThreadInsert = typeof creachatThreadsTable.$inferInsert

export const creaRecordsTable = mysqlTable(
  'crea_records',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    recordUuid: char('record_uuid', { length: 36 }).notNull(),
    contributionRef: varchar('contribution_ref', { length: 64 }).notNull(),
    communityUuid: char('community_uuid', { length: 36 }).default(sql`NULL`),
    personPseudonym: varchar('person_pseudonym', { length: 64 }).default(sql`NULL`),
    activity: varchar({ length: 255 }).notNull(),
    categoryKey: varchar('category_key', { length: 48 }).notNull(),
    outputType: varchar('output_type', { length: 24 }).notNull(),
    hours: double().default(sql`NULL`),
    hoursEstimated: boolean('hours_estimated').default(false).notNull(),
    creaVerdict: varchar('crea_verdict', { length: 12 }).notNull(),
    confidence: varchar({ length: 8 }).notNull(),
    appliedRule: varchar('applied_rule', { length: 48 }).default(sql`NULL`),
    discrepancy: varchar({ length: 24 }).default('none').notNull(),
    overallVerdict: varchar('overall_verdict', { length: 12 }).default(sql`NULL`),
    moderatorFinal: varchar('moderator_final', { length: 24 }).default(sql`NULL`),
    moderatorComment: text('moderator_comment').default(sql`NULL`),
    rawText: text('raw_text').default(sql`NULL`),
    taxonomyVersion: int('taxonomy_version', { unsigned: true }).default(1).notNull(),
    rulesetVersion: int('ruleset_version', { unsigned: true }).default(1).notNull(),
    behaviorVersion: int('behavior_version', { unsigned: true }).default(1).notNull(),
    model: varchar({ length: 48 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .onUpdateNow({ fsp: 3 })
      .notNull(),
  },
  (table) => [
    unique('uniq_crea_records_record_uuid').on(table.recordUuid),
    index('idx_crea_records_contribution_ref').on(table.contributionRef),
    index('idx_crea_records_community_uuid').on(table.communityUuid),
    index('idx_crea_records_person_pseudonym').on(table.personPseudonym),
    index('idx_crea_records_category_key').on(table.categoryKey),
  ],
)

export type CreaRecordSelect = typeof creaRecordsTable.$inferSelect
export type CreaRecordInsert = typeof creaRecordsTable.$inferInsert

// A single-row singleton (id = 1), no autoincrement.
export const creaSettingsTable = mysqlTable('crea_settings', {
  id: int({ unsigned: true }).primaryKey().notNull(),
  model: varchar({ length: 64 }).default(sql`NULL`),
  effort: varchar({ length: 12 }).default(sql`NULL`),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .onUpdateNow({ fsp: 3 })
    .notNull(),
  fastMode: boolean('fast_mode').default(false).notNull(),
  firstCreationSignerUserId: int('first_creation_signer_user_id', { unsigned: true }).default(
    sql`NULL`,
  ),
})

export type CreaSettingSelect = typeof creaSettingsTable.$inferSelect
export type CreaSettingInsert = typeof creaSettingsTable.$inferInsert

// `tag` is stored without the leading '#'.
export const creationGroupsTable = mysqlTable(
  'creation_groups',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    tag: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 255 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .onUpdateNow({ fsp: 3 })
      .notNull(),
    hashtagsAdoptedAt: datetime('hashtags_adopted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    hashtagsAdoptedCount: int('hashtags_adopted_count', { unsigned: true }).default(sql`NULL`),
  },
  (table) => [unique('uniq_creation_groups_tag').on(table.tag)],
)

export type CreationGroupSelect = typeof creationGroupsTable.$inferSelect
export type CreationGroupInsert = typeof creationGroupsTable.$inferInsert

export const dltTransactionsTable = mysqlTable(
  'dlt_transactions',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    transactionId: int('transaction_id', { unsigned: true }).default(sql`NULL`),
    userId: int('user_id', { unsigned: true }).default(sql`NULL`),
    transactionLinkId: int('transaction_link_id', { unsigned: true }).default(sql`NULL`),
    typeId: int('type_id', { unsigned: true }).notNull(),
    hieroTransactionId: varchar('hiero_transaction_id', { length: 255 }).default(sql`NULL`),
    verified: tinyint().default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    verifiedAt: datetime('verified_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    error: text().default(sql`NULL`),
  },
  (table) => [
    uniqueIndex('hiero_transaction_id').on(table.hieroTransactionId),
    index('idx_dlt_transaction_id').on(table.transactionId),
    index('idx_dlt_transaction_link_id').on(table.transactionLinkId),
    index('idx_dlt_user_id').on(table.userId),
  ],
)

export type DltTransactionSelect = typeof dltTransactionsTable.$inferSelect
export type DltTransactionInsert = typeof dltTransactionsTable.$inferInsert

export const eventsTable = mysqlTable(
  'events',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    type: varchar({ length: 100 }).collate('utf8mb4_unicode_ci').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    affectedUserId: int('affected_user_id', { unsigned: true }).notNull(),
    actingUserId: int('acting_user_id', { unsigned: true }).notNull(),
    involvedUserId: int('involved_user_id', { unsigned: true }).default(sql`NULL`),
    involvedTransactionId: int('involved_transaction_id', { unsigned: true }).default(sql`NULL`),
    involvedContributionId: int('involved_contribution_id', { unsigned: true }).default(sql`NULL`),
    involvedContributionMessageId: int('involved_contribution_message_id', {
      unsigned: true,
    }).default(sql`NULL`),
    involvedTransactionLinkId: int('involved_transaction_link_id', { unsigned: true }).default(
      sql`NULL`,
    ),
    involvedContributionLinkId: int('involved_contribution_link_id', { unsigned: true }).default(
      sql`NULL`,
    ),
    amountLegacy: customGradidoUnit('amount_legacy').default(sql`NULL`),
    amountGdd4: customGradidoUnit('amount_gdd4').default(sql`NULL`),
  },
  (table) => [
    index('IDX_events_type_affected_user_created').on(
      table.type,
      table.affectedUserId,
      table.createdAt,
    ),
  ],
)

export type EventSelect = typeof eventsTable.$inferSelect
export type EventInsert = typeof eventsTable.$inferInsert

export const matchingEntriesTable = mysqlTable(
  'matching_entries',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    uuid: char({ length: 36 }).notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    matchingType: varchar('matching_type', { length: 12 }).notNull(),
    summary: varchar({ length: 160 }).notNull(),
    details: text().default(sql`NULL`),
    // boolean() rather than tinyint() as the neighbours use: both are tinyint(1) in
    // MySQL, but boolean() maps 1/0 to true/false on the way out. These two values are
    // forwarded to the GMS as JSON, where a 1 instead of a true would be a changed
    // payload — this keeps the conversion in one place instead of at every call site.
    remote: boolean().default(false).notNull(),
    active: boolean().default(true).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .onUpdateNow({ fsp: 3 })
      .notNull(),
    // --- the keying ------------------------------------------------------------
    //
    // What a language model made of `summary`: the words this entry can be found
    // under, and seven fields saying what it is about. Asked for here, on this
    // server, because this is where the sentence and the model access are - the GMS
    // stores what it is sent and never calls a model itself.
    //
    // All NULL until an entry has been keyed, and that IS the queue: an entry with
    // no instruction version is one the keying run has not done yet, and an entry
    // with an old one is one an improved instruction has not seen. There is no
    // separate to-do table to keep in step.
    //
    // The German names are the fields of the instruction the model answers - what to
    // search for when comparing a stored row against the measurements.

    // `schluessel` - every word the model coined, normalised. JSON because MySQL has
    // no array type; the GMS stores the same list in a real one.
    keyWords: json('key_words').$type<string[]>().default(sql`NULL`),
    // `sache` - what it is about. Goes into the index, so normalised like a key word.
    keySubject: varchar('key_subject', { length: 64 }).default(sql`NULL`),
    // `taetigkeit` - what happens with it, in the infinitive. Not in the index, so
    // kept as the model wrote it.
    keyActivity: varchar('key_activity', { length: 64 }).default(sql`NULL`),
    // `klasse` - one of twelve, see apis/anthropic/matching/instruction.
    keyCategory: varchar('key_category', { length: 64 }).default(sql`NULL`),
    // `gebiet` - the field the subject belongs to. Not in the index.
    keyArea: varchar('key_area', { length: 64 }).default(sql`NULL`),
    // `wer` - the person acting or being sought. In the index.
    keyActor: varchar('key_actor', { length: 64 }).default(sql`NULL`),
    // `gesuchter_beruf` - who solves this problem. Only on the 'need' channel, and
    // empty even there when no trade is being sought. In the index.
    keySoughtActor: varchar('key_sought_actor', { length: 64 }).default(sql`NULL`),
    // `merkmal` - condition, level, material, professional or private, who it is for.
    // Short phrases rather than words, so these are NOT normalised.
    keyTraits: json('key_traits').$type<string[]>().default(sql`NULL`),
    instructionVersion: varchar('instruction_version', { length: 32 }).default(sql`NULL`),
    keyedAt: datetime('keyed_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    // --- end of the keying -----------------------------------------------------
  },
  (table) => [
    unique('uniq_matching_entries_uuid').on(table.uuid),
    index('idx_matching_entries_user_id').on(table.userId),
    // What the keying run asks on its timer and on every member save: which entries
    // still need working out. Without it that walks the whole table to answer
    // "none" - which is the answer almost every time, once the backlog is drained.
    // `active` leads because its test is an equality and the version's is a range,
    // and everything after a range can only filter. See migration 0126.
    index('IDX_matching_entries_keying').on(table.active, table.instructionVersion),
  ],
)

export type MatchingEntrySelect = typeof matchingEntriesTable.$inferSelect
export type MatchingEntryInsert = typeof matchingEntriesTable.$inferInsert

// The entry an event link notes at a registration, until the address is confirmed and the
// entry is made of it (migration 0160): one row an account, there only while it waits.
export const eventMatchingEntriesTable = mysqlTable(
  'event_matching_entries',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // `unsigned`, because `users.id` is `int(10) unsigned` and migration 0160 mirrors it.
    userId: int('user_id', { unsigned: true }).notNull(),
    summary: varchar({ length: 160 }).notNull(),
    details: text().default(sql`NULL`),
    // boolean() for the reason given at `matching_entries.remote`: the value goes on into an
    // entry, and from there to the GMS as JSON.
    remote: boolean().default(true).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [uniqueIndex('event_matching_entries_user_unique').on(table.userId)],
)

export type EventMatchingEntrySelect = typeof eventMatchingEntriesTable.$inferSelect
export type EventMatchingEntryInsert = typeof eventMatchingEntriesTable.$inferInsert

// The invitation onto the map that is due after an event link (migration 0161): the
// confirmation made the entry of the link, and the wallet has not invited the member yet.
export const eventMatchingArrivalsTable = mysqlTable(
  'event_matching_arrivals',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // `unsigned`, as in event_matching_entries: `users.id` is `int(10) unsigned`.
    userId: int('user_id', { unsigned: true }).notNull(),
    matchingEntryUuid: char('matching_entry_uuid', { length: 36 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [uniqueIndex('event_matching_arrivals_user_unique').on(table.userId)],
)

export type EventMatchingArrivalSelect = typeof eventMatchingArrivalsTable.$inferSelect
export type EventMatchingArrivalInsert = typeof eventMatchingArrivalsTable.$inferInsert

// ⚠️ `payer_email` and `publisher_email` are utf8mb3_bin: compared byte by byte, so
// case-sensitive.
export const loginElopageBuysTable = mysqlTable('login_elopage_buys', {
  id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
  elopageUserId: int('elopage_user_id').default(sql`NULL`),
  affiliateProgramId: int('affiliate_program_id').default(sql`NULL`),
  publisherId: int('publisher_id').default(sql`NULL`),
  orderId: int('order_id').default(sql`NULL`),
  productId: int('product_id').default(sql`NULL`),
  productPrice: int('product_price').notNull(),
  payerEmail: varchar('payer_email', { length: 255 })
    .charSet('utf8mb3')
    .collate('utf8mb3_bin')
    .notNull(),
  publisherEmail: varchar('publisher_email', { length: 255 })
    .charSet('utf8mb3')
    .collate('utf8mb3_bin')
    .notNull(),
  payed: tinyint().notNull(),
  successDate: datetime('success_date', { mode: 'date' }).notNull(),
  event: varchar({ length: 255 }).notNull(),
})

export type LoginElopageBuySelect = typeof loginElopageBuysTable.$inferSelect
export type LoginElopageBuyInsert = typeof loginElopageBuysTable.$inferInsert

// Mirrors the table as the migrations leave it, not the TypeORM entity: the entity reads
// `type_id` and the gdd4 columns as not null and `linked_user_gradido_id` as nullable, the
// table has it the other way round.
export const pendingTransactionsTable = mysqlTable('pending_transactions', {
  id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
  state: int().notNull(),
  previous: int({ unsigned: true }).default(sql`NULL`),
  typeId: int('type_id').default(sql`NULL`),
  transactionLinkId: int('transaction_link_id', { unsigned: true }).default(sql`NULL`),
  amountLegacy: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
    sql`NULL`,
  ),
  amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
  balanceLegacy: decimal('balance_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
    sql`NULL`,
  ),
  balance: customGradidoUnit('balance_gdd4').default(sql`NULL`),
  balanceDate: datetime('balance_date', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
  decayLegacy: decimal('decay_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
    sql`NULL`,
  ),
  decay: customGradidoUnit('decay_gdd4').default(sql`NULL`),
  decayStart: datetime('decay_start', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  decayCalculationType: int('decay_calculation_type').default(0),
  memo: varchar({ length: 512 }).notNull(),
  creationDate: datetime('creation_date', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  userId: int('user_id', { unsigned: true }).notNull(),
  userGradidoId: char('user_gradido_id', { length: 36 }).notNull(),
  userName: varchar('user_name', { length: 512 }).collate('utf8mb4_unicode_ci').default(sql`NULL`),
  userCommunityUuid: char('user_community_uuid', { length: 36 }).notNull(),
  linkedUserId: int('linked_user_id', { unsigned: true }).default(sql`NULL`),
  linkedUserGradidoId: char('linked_user_gradido_id', { length: 36 }).notNull(),
  linkedUserName: varchar('linked_user_name', { length: 512 })
    .collate('utf8mb4_unicode_ci')
    .default(sql`NULL`),
  linkedUserCommunityUuid: char('linked_user_community_uuid', { length: 36 }).notNull(),
  linkedTransactionId: int('linked_transaction_id').default(sql`NULL`),
})

export type PendingTransactionSelect = typeof pendingTransactionsTable.$inferSelect
export type PendingTransactionInsert = typeof pendingTransactionsTable.$inferInsert

export const projectBrandingsTable = mysqlTable(
  'project_brandings',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    alias: varchar({ length: 32 }).notNull(),
    description: text().default(sql`NULL`),
    spaceId: int('space_id', { unsigned: true }).default(sql`NULL`),
    spaceUrl: varchar('space_url', { length: 255 }).default(sql`NULL`),
    newUserToSpace: tinyint('new_user_to_space').default(0).notNull(),
    logoUrl: varchar('logo_url', { length: 255 }).default(sql`NULL`),
  },
  (table) => [uniqueIndex('project_brandings_alias_unique').on(table.alias)],
)

export type ProjectBrandingSelect = typeof projectBrandingsTable.$inferSelect
export type ProjectBrandingInsert = typeof projectBrandingsTable.$inferInsert

export const transactionsTable = mysqlTable(
  'transactions',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    previous: int({ unsigned: true }).default(sql`NULL`),
    typeId: int('type_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id', { unsigned: true }).default(sql`NULL`),
    thankYouCardId: int('thank_you_card_id', { unsigned: true }).default(sql`NULL`),
    // The picture sent with a transfer (`transaction_pictures`, migration 0154), on both rows.
    transactionPictureId: int('transaction_picture_id', { unsigned: true }).default(sql`NULL`),
    amountLegacy: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    balanceLegacy: decimal('balance_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    balance: customGradidoUnit('balance_gdd4').default(sql`NULL`),
    balanceDate: datetime('balance_date', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    decayLegacy: decimal('decay_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    decay: customGradidoUnit('decay_gdd4').default(sql`NULL`),
    decayStart: datetime('decay_start', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    decayCalculationType: int('decay_calculation_type').default(0),
    memo: varchar({ length: 512 }).notNull(),
    creationDate: datetime('creation_date', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    userId: int('user_id', { unsigned: true }).notNull(),
    userCommunityUuid: char('user_community_uuid', { length: 36 }).default(sql`NULL`),
    userGradidoId: char('user_gradido_id', { length: 36 }).notNull(),
    userName: varchar('user_name', { length: 512 }).default(sql`NULL`),
    // The counterparty of a SEND or RECEIVE row, written by executeTransaction on both
    // rows of a transfer. `linkedUserId` is set for a member of this community; the uuid
    // pair alone identifies a member of another one.
    linkedUserId: int('linked_user_id', { unsigned: true }).default(sql`NULL`),
    linkedUserCommunityUuid: char('linked_user_community_uuid', { length: 36 }).default(sql`NULL`),
    linkedUserGradidoId: char('linked_user_gradido_id', { length: 36 }).default(sql`NULL`),
    linkedUserName: varchar('linked_user_name', { length: 512 }).default(sql`NULL`),
    linkedTransactionId: int('linked_transaction_id').default(sql`NULL`),
  },
  (table) => [
    index('user_id').on(table.userId),
    unique('previous').on(table.previous),
    index('idx_transactions_balance_date_id').on(table.balanceDate, table.id),
    index('idx_transaction_link_id').on(table.transactionLinkId),
    index('idx_linked_user_id').on(table.linkedUserId),
  ],
)

export type TransactionSelect = typeof transactionsTable.$inferSelect
export type TransactionInsert = typeof transactionsTable.$inferInsert

// The reaction to a transfer (migration 0159): one row for the emoji the RECIPIENT of a transfer
// answered it with -- one a transfer, which the unique key holds. Taken back, the row is deleted.
//
// `transactionId` is the recipient's RECEIVE row; the sender's SEND row is found from it, since
// the two rows of a transfer of this community name each other (`linkedTransactionId`).
//
// ⛔ `emoji` is compared byte by byte in the database (utf8mb4_bin): the tables' own
// collation takes most emoji for one and the same character.
export const transactionReactionsTable = mysqlTable(
  'transaction_reactions',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    transactionId: int('transaction_id', { unsigned: true }).notNull(),
    emoji: varchar({ length: 16 }).collate('utf8mb4_bin').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [uniqueIndex('transaction_reactions_transaction_unique').on(table.transactionId)],
)

export type TransactionReactionSelect = typeof transactionReactionsTable.$inferSelect
export type TransactionReactionInsert = typeof transactionReactionsTable.$inferInsert

// Received transfers the member has seen (migration 0165, Chat E-086): one row a transfer, hung
// on the recipient's RECEIVE booking as a reaction is. A transfer received after the start
// (`transactionReadsStartTable`) without a row here counts as unread -- the gold dot, the bold
// line under the name, the mark in the menu.
export const transactionReadsTable = mysqlTable('transaction_reads', {
  transactionId: int('transaction_id', { unsigned: true }).primaryKey().notNull(),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

// One row (`id` 1): the highest booking id when migration 0165 ran. Transfers received up to it
// count as seen.
export const transactionReadsStartTable = mysqlTable('transaction_reads_start', {
  id: tinyint({ unsigned: true }).primaryKey().notNull(),
  transactionId: int('transaction_id', { unsigned: true }).notNull(),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

// Transfers that pass a received thank-you on (migration 0166, the trail of the waves of
// gratitude): one row for the sender's SEND booking of such a transfer, naming the RECEIVE
// booking of the same member it passes on. Written after the booking (executeTransaction);
// nothing shows it. One thank-you may be passed on by more than one transfer.
export const transactionPassOnsTable = mysqlTable(
  'transaction_pass_ons',
  {
    transactionId: int('transaction_id', { unsigned: true }).primaryKey().notNull(),
    originTransactionId: int('origin_transaction_id', { unsigned: true }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    index('transaction_pass_ons_origin_transaction_id_idx').on(table.originTransactionId),
  ],
)

export type TransactionPassOnSelect = typeof transactionPassOnsTable.$inferSelect
export type TransactionPassOnInsert = typeof transactionPassOnsTable.$inferInsert

export const transactionLinksTable = mysqlTable(
  'transaction_links',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int({ unsigned: true }).notNull(),
    amountLegacy: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    holdAvailableAmountLegacy: decimal('hold_available_amount_legacy', {
      precision: 40,
      scale: 20,
      mode: 'string',
    }).default(sql`NULL`),
    holdAvailableAmount: customGradidoUnit('hold_available_amount_gdd4').default(sql`NULL`),
    memo: varchar({ length: 512 }).notNull(),
    code: varchar({ length: 24 }).notNull(),
    createdAt: datetime({ mode: 'date' }).notNull(),
    deletedAt: datetime({ mode: 'date' }).default(sql`NULL`),
    validUntil: datetime({ mode: 'date' }).notNull(),
    redeemedAt: datetime({ mode: 'date' }).default(sql`NULL`),
    redeemedBy: int({ unsigned: true }).default(sql`NULL`),
  },
  (table) => [
    index('idx_userId').on(table.userId),
    index('idx_user_id_valid_until').on(table.userId, table.validUntil, table.id),
  ],
)

export type TransactionLinksSelect = typeof transactionLinksTable.$inferSelect
export type TransactionLinksInsert = typeof transactionLinksTable.$inferInsert

export const usersTable = mysqlTable(
  'users',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    foreign: boolean().default(false).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    communityUuid: varchar('community_uuid', { length: 36 })
      .collate('utf8mb4_general_ci')
      .notNull(),
    // Mandatory since migration 0164, for the cached copies of members of other communities
    // (`foreign = 1`) as well: they are filed with the alias that community sent, or not at all.
    alias: varchar({ length: 20 }).notNull(),
    emailId: int('email_id').default(sql`NULL`),
    firstName: varchar('first_name', { length: 255 }).default(sql`NULL`),
    lastName: varchar('last_name', { length: 255 }).default(sql`NULL`),
    gmsPublishName: int('gms_publish_name', { unsigned: true }).default(0).notNull(),
    humhubPublishName: int('humhub_publish_name', { unsigned: true }).default(0).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    // ⚠️ mode 'bigint' and unsigned, both load-bearing - same reason as
    // thank_you_card_settings.pin: the derivation returns a full unsigned 64 bit word
    // (`deriveKey` in shared-native/napi/passwordHashing.cpp), and as a JS number almost every value
    // loses precision. `unsigned` also keeps drizzle-kit from turning the column signed,
    // which every hash from 2^63 up would overflow.
    password: bigint({ mode: 'bigint', unsigned: true }).default(0n),
    passwordEncryptionType: int('password_encryption_type').default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    language: varchar({ length: 4 }).default(sql`'de'`).notNull(),
    referrerId: int('referrer_id', { unsigned: true }).default(sql`NULL`),
    contributionLinkId: int('contribution_link_id', { unsigned: true }).default(sql`NULL`),
    publisherId: int('publisher_id').default(0),
    hideAmountGdd: boolean('hideAmountGDD').default(false),
    hideAmountGdt: boolean('hideAmountGDT').default(false),
    gmsAllowed: boolean('gms_allowed').default(false).notNull(),
    // The member's own position, as a POINT. Readable at last -- the line that used to
    // stand here said "Can't parse geometry from database", which is what drizzle-kit
    // writes when it meets a spatial column. What it takes is in customGeometry; the
    // short version is that mysql2 hands a point over as `{ x, y }` and a write has to
    // go through ST_GeomFromText().
    location: customGeometry().default(null),
    gmsPublishLocation: int('gms_publish_location', { unsigned: true }).default(1).notNull(),
    aboutMe: text('about_me').default(sql`NULL`),
    avatarVisibleToMembers: boolean('avatar_visible_to_members').default(true).notNull(),
    // ES-021: a person may create, a project account may not. 1 for every account that
    // exists today - the distinction is made by the holder, never by a migration.
    creationAllowed: boolean('creation_allowed').default(true).notNull(),
    // The transfers in the conversations and the mail about one received: the holder's switch,
    // on by default (migration 0147).
    transfersInChat: boolean('transfers_in_chat').default(true).notNull(),
    gmsRegistered: boolean('gms_registered').default(false).notNull(),
    gmsRegisteredAt: datetime('gms_registered_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    humhubAllowed: boolean('humhub_allowed').default(false).notNull(),
    // Where the account stands, as one value (migration 0148). A MySQL ENUM: one byte a row,
    // and a value outside the list is refused by the server in strict mode, which the Drizzle
    // pool sets (AppDatabase). ⛔ Append only - see AccountState.
    accountState: mysqlEnum('account_state', AccountState)
      .default(AccountState.REGISTERED)
      .notNull(),
    gender: varchar({ length: 8 }).default(sql`NULL`),
    salutation: varchar({ length: 255 }).default(sql`NULL`),
    creaSignature: varchar('crea_signature', { length: 255 }).default(sql`NULL`),
  },
  (table) => [
    index('IDX_users_email_id').on(table.emailId),
    index('idx_users_created_id_uuid').on(table.createdAt, table.id, table.communityUuid),
    // Who brought a member here. Read by the overview tile and, from the contact list on,
    // by every page of contacts and every tap on a name -- see migration 0139.
    index('idx_users_referrer_id').on(table.referrerId),
    unique('uuid_key').on(table.gradidoId, table.communityUuid),
    unique('alias_key').on(table.alias, table.communityUuid),
  ],
)

export type UserSelect = typeof usersTable.$inferSelect
export type UserInsert = typeof usersTable.$inferInsert

// A member's addresses - every one they ever held stays; `users.email_id` marks the one in
// force (see queries/userContacts.typeorm.ts for the life of a row). Mirrors the table as
// the migrations leave it, not the TypeORM entity: `email_opt_in_type_id` is nullable here
// and `type` is not, the other way round from the entity.
//
// ⚠️ The verification and veto codes are unsigned 64 bit words: mode 'bigint' and
// unsigned, for the reason users.password gives - as a JS number almost every code would
// come back as a different one. (The entity reads them as strings.)
export const userContactsTable = mysqlTable(
  'user_contacts',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    type: varchar({ length: 100 }).collate('utf8mb4_unicode_ci').notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    email: varchar({ length: 255 }).collate('utf8mb4_unicode_ci').notNull(),
    emailVerificationCode: bigint('email_verification_code', {
      mode: 'bigint',
      unsigned: true,
    }).default(sql`NULL`),
    changeVetoCode: bigint('change_veto_code', { mode: 'bigint', unsigned: true }).default(
      sql`NULL`,
    ),
    emailOptInTypeId: int('email_opt_in_type_id').default(sql`NULL`),
    emailResendCount: int('email_resend_count').default(0),
    emailChecked: boolean('email_checked').default(false).notNull(),
    gmsPublishEmail: boolean('gms_publish_email').default(false).notNull(),
    countryCode: varchar('country_code', { length: 255 }).default(sql`NULL`),
    phone: varchar({ length: 255 }).collate('utf8mb4_unicode_ci').default(sql`NULL`),
    gmsPublishPhone: int('gms_publish_phone', { unsigned: true }).default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`NULL`)
      .onUpdateNow({ fsp: 3 }),
    deletedAt: datetime('deleted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [
    unique('email').on(table.email),
    unique('email_verification_code').on(table.emailVerificationCode),
    unique('IDX_user_contacts_change_veto_code').on(table.changeVetoCode),
    index('IDX_user_contacts_user_created').on(table.userId, table.createdAt),
  ],
)

export type UserContactSelect = typeof userContactsTable.$inferSelect
export type UserContactInsert = typeof userContactsTable.$inferInsert

// Every name a member owns; `users.alias` marks the current one (see migration 0116).
// `origin` is one of the AliasOrigin values next to the UserAlias entity.
export const userAliasesTable = mysqlTable(
  'user_aliases',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    alias: varchar({ length: 20 }).collate('utf8mb4_unicode_ci').notNull(),
    origin: varchar({ length: 8 }).collate('utf8mb4_unicode_ci').default('chosen').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [unique('alias').on(table.alias), index('user_id').on(table.userId)],
)

export type UserAliasSelect = typeof userAliasesTable.$inferSelect
export type UserAliasInsert = typeof userAliasesTable.$inferInsert

// The member's own profile picture. A side table rather than a column on `users`,
// because `users` is read on nearly every request and an image would weigh every one
// of those reads down. user_id is the primary key: one member, one picture, so a
// duplicate is impossible by shape rather than by care.
// Two renditions from one upload, and since AS-018 the difference between them is SIZE,
// not audience. avatarSmall is the everyday picture -- every list, every booking row, and
// what will federate. avatarFull is the 512 crop: the printed card, the member's own look
// at their picture, and, on a click, one other member looked at properly.
//
// ⛔ Both are handed to other members only through a query that carries
// mayBeShownToMembers() (see queries/userAvatars.ts). The rule is the switch, the deletion
// and the community scope -- never the rendition. A reader that reaches either column
// without that guard is a leak whichever column it picks.
//
// ⚠️ The header of migration 0114 describes the original rule ("avatar_full ... must never
// leave the community"). It is left standing as the history it is; this comment is the one
// that is current.
export const userAvatarsTable = mysqlTable('user_avatars', {
  userId: int('user_id', { unsigned: true }).primaryKey().notNull(),
  avatarSmall: customMediumBlob('avatar_small').notNull(),
  avatarFull: customMediumBlob('avatar_full').notNull(),
  mimeType: varchar('mime_type', { length: 32 }).notNull(),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

export type UserAvatarSelect = typeof userAvatarsTable.$inferSelect
export type UserAvatarInsert = typeof userAvatarsTable.$inferInsert

// What a member is allowed to do beyond being a member: ADMIN, MODERATOR and the rest of
// ROLES.ts. No row at all is the normal case -- that is an ordinary member.
//
// 0 or 1 per member, by shape: `user_id` is UNIQUE since migration 0135. A join on it
// cannot multiply a member's row, and a second role for the same member is refused by the
// database -- which is why writes go through dbUpsertUserRole rather than an insert.
export const userRolesTable = mysqlTable(
  'user_roles',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    role: varchar({ length: 40 }).notNull(),
    // A moderator's visibility scope: a JSON array of creation-group names plus the
    // sentinels '*all' / '*untagged', as text. NULL is no restriction, which is what
    // every moderator from before the column had. Read through
    // describeModeratorCreationGroups, never on its own.
    visibleCreationGroups: text('visible_creation_groups').default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [uniqueIndex('user_id').on(table.userId)],
)

export type UserRoleSelect = typeof userRolesTable.$inferSelect
export type UserRoleInsert = typeof userRolesTable.$inferInsert

// A member's favourites: the people they marked with the heart (see migration 0128).
//
// Keyed by the uuid PAIR of the favourite, never by their alias -- an alias changes, the
// pair does not, and a favourite that stored the alias would point at nobody after a
// rename. The pair also reaches across community borders, which a local user id cannot.
//
// The primary key IS the rule "one heart per person": a second insert is not a mistake,
// it is the same heart, and the query treats it so.
export const userFavoritesTable = mysqlTable(
  'user_favorites',
  {
    // `unsigned`, because migration 0128 writes `int(10) unsigned` -- a schema that mirrors
    // the table in part is what the transactions row was fixed for two commits earlier.
    userId: int('user_id', { unsigned: true }).notNull(),
    favoriteCommunityUuid: varchar('favorite_community_uuid', { length: 36 }).notNull(),
    favoriteGradidoId: varchar('favorite_gradido_id', { length: 36 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.favoriteCommunityUuid, table.favoriteGradidoId],
    }),
    index('idx_user_favorites_user_id').on(table.userId),
  ],
)

export type UserFavoriteSelect = typeof userFavoritesTable.$inferSelect
export type UserFavoriteInsert = typeof userFavoritesTable.$inferInsert

export const userCreationGroupsTable = mysqlTable(
  'user_creation_groups',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    creationGroupId: int('creation_group_id', { unsigned: true }).notNull(),
    sortOrder: int('sort_order', { unsigned: true }).default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .onUpdateNow({ fsp: 3 })
      .notNull(),
  },
  (table) => [
    unique('uniq_user_creation_group').on(table.userId, table.creationGroupId),
    index('idx_ucg_user_id').on(table.userId),
    index('idx_ucg_creation_group_id').on(table.creationGroupId),
  ],
)

export type UserCreationGroupSelect = typeof userCreationGroupsTable.$inferSelect
export type UserCreationGroupInsert = typeof userCreationGroupsTable.$inferInsert

// When a member of ANOTHER community last changed the picture their community lets members
// see, as this community last heard it (see migration 0137, AS-019). Written by the backend
// timer refreshForeignMemberAvatarDates, read by the booking list and the contact list.
//
// Keyed by the uuid PAIR, like the wallet's picture store and `user_favorites`: a booking can
// name a member of another community whose `users` row was never stored.
//
// `avatarUpdatedAt` null: asked, and nothing to show there (no picture, switch off, deleted)
// -- the way a withdrawal arrives. A pair without a row has no answer yet. Existing members
// of other communities have no row until the timer's first answer and show letters until
// then, as before.
export const foreignMemberAvatarDatesTable = mysqlTable(
  'foreign_member_avatar_dates',
  {
    communityUuid: varchar('community_uuid', { length: 36 }).notNull(),
    gradidoId: varchar('gradido_id', { length: 36 }).notNull(),
    avatarUpdatedAt: datetime('avatar_updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    checkedAt: datetime('checked_at', { mode: 'date', fsp: 3 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.communityUuid, table.gradidoId] })],
)

export type ForeignMemberAvatarDateSelect = typeof foreignMemberAvatarDatesTable.$inferSelect
export type ForeignMemberAvatarDateInsert = typeof foreignMemberAvatarDatesTable.$inferInsert

// Paying with a printed card. Three tables, split along who owns what: the PIN and the
// limits belong to the person, the code and the failure counter belong to the card, and
// the payment request is a short-lived thing that lives between "amount entered" and
// "money booked".
//
// The existence of a settings row IS the on/off switch -- enabling means setting a PIN,
// disabling means deleting it. "Enabled but without a PIN" therefore cannot exist.
export const thankYouCardSettingsTable = mysqlTable('thank_you_card_settings', {
  userId: int('user_id', { unsigned: true }).primaryKey().notNull(),
  // A keyed BLAKE2b, cut to 64 bit (see backend/src/password/PinEncryptor.ts) -- NOT the
  // users.password derivation, deliberately, and with its own salt: a leak must not let
  // one of the two secrets say anything about the other.
  //
  // ⚠️ mode 'bigint' and unsigned, both load-bearing. The derivation returns a full 64 bit
  // word, and only one value in 2048 is small enough to survive as a JS number — 2^53 out
  // of 2^64 — so virtually every value would lose precision that way; everything above
  // 2^63 would additionally overflow a signed column. Either one turns "correct PIN" into
  // "wrong PIN", and it did: see the pool options in `AppDatabase.ts`, which is where the
  // reading actually went through a double. users.password is `bigint unsigned` for the
  // same reason.
  pin: bigint({ mode: 'bigint', unsigned: true }).notNull(),
  pinSalt: varchar('pin_salt', { length: 64 }).notNull(),
  // HOW `pin` was derived -- today always 2, a keyed BLAKE2b (see
  // backend/src/data/PinDerivation.enum.ts for why, and why 1 is reserved). The column is
  // here for the NEXT change of derivation: a hash cannot be converted, so the day one
  // arrives, every row must already say which derivation made its hash.
  pinDerivation: tinyint('pin_derivation', { unsigned: true }).notNull().default(2),
  maxPerPayment: customGradidoUnit('max_per_payment_gdd4').notNull(),
  maxPerDay: customGradidoUnit('max_per_day_gdd4').notNull(),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

export type ThankYouCardSettingsSelect = typeof thankYouCardSettingsTable.$inferSelect
export type ThankYouCardSettingsInsert = typeof thankYouCardSettingsTable.$inferInsert

// One row per printed card. userId is indexed, not the primary key: blocking a card
// creates the plural all by itself, because a blocked card is kept rather than deleted.
//
// ⛔ Never delete a row here. A kept row is what lets a scan of an old card say "this
// card is blocked" instead of running into nothing, and what lets an old receipt still
// name the card a payment was made with.
export const thankYouCardsTable = mysqlTable(
  'thank_you_cards',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id', { unsigned: true }).notNull(),
    // "DK-" plus 32 hex characters: 16 fully random bytes, no timestamp. Length inside a
    // QR code is free, so there is no reason to spend part of it on the creation time
    // the way transaction links do.
    code: varchar({ length: 40 }).notNull(),
    label: varchar({ length: 64 }).notNull(),
    // Counted on the card, not on the person: once more than one card may be valid,
    // guessing at one must not block the other.
    failedAttempts: int('failed_attempts', { unsigned: true }).default(0).notNull(),
    blockedAt: datetime('blocked_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('thank_you_cards_code_unique').on(table.code),
    index('thank_you_cards_user_id_idx').on(table.userId),
  ],
)

export type ThankYouCardSelect = typeof thankYouCardsTable.$inferSelect
export type ThankYouCardInsert = typeof thankYouCardsTable.$inferInsert

// The payment request (PS-022). It exists so that the PIN is ONE way to confirm a
// payment and a later tap on the payer's own device can be another, without touching the
// booking path again.
//
// ⚠️ state is set to 'consumed' BEFORE the booking runs. A TypeORM transaction does not
// cover Drizzle writes, so the two cannot be made atomic; consuming first means a crash
// in between leaves "request used, no money moved" instead of "money moved, request
// still open", and only the second of those can be booked twice.
export const thankYouCardPaymentsTable = mysqlTable(
  'thank_you_card_payments',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    cardId: int('card_id', { unsigned: true }).notNull(),
    recipientId: int('recipient_id', { unsigned: true }).notNull(),
    amount: customGradidoUnit('amount_gdd4').notNull(),
    memo: varchar({ length: 512 }).notNull(),
    state: varchar({ length: 16 }).default('open').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    validUntil: datetime('valid_until', { mode: 'date', fsp: 3 }).notNull(),
  },
  (table) => [index('thank_you_card_payments_card_id_idx').on(table.cardId)],
)

export type ThankYouCardPaymentSelect = typeof thankYouCardPaymentsTable.$inferSelect
export type ThankYouCardPaymentInsert = typeof thankYouCardPaymentsTable.$inferInsert

// The first creation (ES-002..ES-011): one process per member, from "sentences saved"
// to "thanked" or "waiting for a human". The contributions themselves are ordinary rows
// in `contributions` (type USER) — this table only remembers which of them belong to
// the process, what state it is in, and the one message that is shown three times
// (thread of the first contribution, mail, window).
//
// `contribution_ids` is a JSON list rather than a child table: the window and the healing
// path both need "all contributions of this process" as one value, nothing ever asks
// for a single link, and a member has at most a handful of entries.
//
// ⚠️ Two ORMs, no shared transaction: the contributions are written through TypeORM, this
// row through Drizzle. The interaction is therefore a state machine that heals on the
// next read, never an atomic block (see FirstCreation.context.ts).
export const firstCreationsTable = mysqlTable(
  'first_creations',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // `unsigned`, because `users.id` is `int(10) unsigned` and migration 0130 mirrors it.
    userId: int('user_id', { unsigned: true }).notNull(),
    status: varchar({ length: 16 }).notNull(),
    reviewReason: varchar('review_reason', { length: 16 }).default(sql`NULL`),
    entriesCount: tinyint('entries_count', { unsigned: true }).notNull(),
    contributionIds: json('contribution_ids').$type<number[]>().notNull(),
    message: text().default(sql`NULL`),
    model: varchar({ length: 64 }).default(sql`NULL`),
    testMode: varchar('test_mode', { length: 16 }).default(sql`NULL`),
    signerUserId: int('signer_user_id', { unsigned: true }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    // Maintained by the update queries, not by an ON UPDATE clause — same reason as
    // creachat_threads.
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [unique('first_creations_user_id_key').on(table.userId)],
)

export type FirstCreationSelect = typeof firstCreationsTable.$inferSelect
export type FirstCreationInsert = typeof firstCreationsTable.$inferInsert

// The chat (see migration 0142). A message is filed once per SERVER, not once per member:
// one row here, whoever it is for, and the read pointer on each member's own row. Members
// are uuid PAIRS (community + member), never users.id -- a member of another community has
// no users row here. The states are plain varchar columns; the unions are what the code
// may write into them.
//
// The three states a sender reads about their own message are an object AND a union of the
// same name. The object is the one list of values: the columns below are typed by it, and
// the backend registers that very object as a GraphQL enum (graphql/enum/ChatMessageNotify.ts,
// ChatMessageDeliveryState.ts and ChatMessageMailState.ts), so the schema offers the values the
// code may write, and a value added here reaches both. The union is what the writers need: they write plain
// strings (`'delivered'`, in core and in sendEmail), which a TypeScript enum would refuse.
export type ChatConversationKind = 'direct' | 'group'
/**
 * A member's part in a group (P5, E-050 F4); in a direct conversation both are 'member'. An
 * object and a union like the three states below: the backend registers the object as the
 * GraphQL enum ChatGroupRole (graphql/enum/ChatGroupRole.ts).
 */
export const ChatConversationMemberRole = {
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
} as const
export type ChatConversationMemberRole =
  (typeof ChatConversationMemberRole)[keyof typeof ChatConversationMemberRole]
/** What the sender asked for: 'email' means the message goes out as a mail as well. */
export const ChatMessageNotify = { EMAIL: 'email', NONE: 'none' } as const
export type ChatMessageNotify = (typeof ChatMessageNotify)[keyof typeof ChatMessageNotify]
/** Whether the own copy reached the other server; a local one is delivered on arrival. */
export const ChatMessageDeliveryState = {
  DELIVERED: 'delivered',
  PENDING: 'pending',
  FAILED: 'failed',
} as const
export type ChatMessageDeliveryState =
  (typeof ChatMessageDeliveryState)[keyof typeof ChatMessageDeliveryState]
/**
 * What became of the mail about a message (E-034, migration 0144): mailed, or asked for and
 * muted by the recipient. The column is NULL where no mail was asked for, or where it is not
 * known (a row from before 0144, an answer from a server from before it).
 */
export const ChatMessageMailState = { MAILED: 'mailed', MUTED: 'muted' } as const
export type ChatMessageMailState = (typeof ChatMessageMailState)[keyof typeof ChatMessageMailState]

export const chatConversationsTable = mysqlTable(
  'chat_conversations',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    conversationUuid: char('conversation_uuid', { length: 36 }).notNull(),
    kind: varchar({ length: 16 }).$type<ChatConversationKind>().notNull(),
    // NULL for a direct conversation; for a group the community of its founder.
    homeCommunityUuid: char('home_community_uuid', { length: 36 }).default(sql`NULL`),
    // Direct conversations only, built by directChatPairKey (queries/chatConversations.ts).
    directPairKey: varchar('direct_pair_key', { length: 150 }).default(sql`NULL`),
    title: varchar({ length: 100 }).default(sql`NULL`),
    createdByCommunityUuid: char('created_by_community_uuid', { length: 36 }).notNull(),
    createdByGradidoId: char('created_by_gradido_id', { length: 36 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('chat_conversations_conversation_uuid_unique').on(table.conversationUuid),
    uniqueIndex('chat_conversations_direct_pair_key_unique').on(table.directPairKey),
  ],
)

export type ChatConversationSelect = typeof chatConversationsTable.$inferSelect
export type ChatConversationInsert = typeof chatConversationsTable.$inferInsert

export const chatConversationMembersTable = mysqlTable(
  'chat_conversation_members',
  {
    conversationId: int('conversation_id', { unsigned: true }).notNull(),
    communityUuid: char('community_uuid', { length: 36 }).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    role: varchar({ length: 16 }).$type<ChatConversationMemberRole>().default('member').notNull(),
    joinedAt: datetime('joined_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    // Unread: the messages of this conversation with a higher id, written by somebody else.
    lastReadMessageId: int('last_read_message_id', { unsigned: true }).default(sql`NULL`),
    mutedAt: datetime('muted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.communityUuid, table.gradidoId] }),
    index('chat_conversation_members_member_idx').on(table.communityUuid, table.gradidoId),
  ],
)

export type ChatConversationMemberSelect = typeof chatConversationMembersTable.$inferSelect
export type ChatConversationMemberInsert = typeof chatConversationMembersTable.$inferInsert

export const chatMessagesTable = mysqlTable(
  'chat_messages',
  {
    // The order of arrival on this server, and the only order a conversation has.
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // The same on both servers of a message that crossed the border.
    messageUuid: char('message_uuid', { length: 36 }).notNull(),
    conversationId: int('conversation_id', { unsigned: true }).notNull(),
    senderCommunityUuid: char('sender_community_uuid', { length: 36 }).notNull(),
    senderGradidoId: char('sender_gradido_id', { length: 36 }).notNull(),
    subject: text().default(sql`NULL`),
    body: text().notNull(),
    // The first writer of a forwarded message (E-059, migration 0150): both set on a copy that was
    // forwarded -- through several forwardings, the one who wrote the words --, both NULL on
    // every other message.
    forwardedFromCommunityUuid: char('forwarded_from_community_uuid', { length: 36 }).default(
      sql`NULL`,
    ),
    forwardedFromGradidoId: char('forwarded_from_gradido_id', { length: 36 }).default(sql`NULL`),
    // The message this one answers (migration 0157), by its uuid; NULL on every other message.
    // Read from the answered message when the thread is shown -- nothing of it is copied.
    replyToMessageUuid: char('reply_to_message_uuid', { length: 36 }).default(sql`NULL`),
    notify: varchar({ length: 8 }).$type<ChatMessageNotify>().notNull(),
    mailState: varchar('mail_state', { length: 8 })
      .$type<ChatMessageMailState>()
      .default(sql`NULL`),
    deliveryState: varchar('delivery_state', { length: 16 })
      .$type<ChatMessageDeliveryState>()
      .notNull(),
    lastAttemptAt: datetime('last_attempt_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    delaySeconds: int('delay_seconds', { unsigned: true }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    // When the text was changed last (E-060, migration 0151) -- the database's clock, utc, as
    // dbUpdateChatMessageBody writes it; NULL for a message nobody changed.
    editedAt: datetime('edited_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    // When the reactions to it were changed last (migration 0158) -- set, replaced or taken
    // back --, by the database's clock in utc, as dbUpdateChatMessageReactedAt writes it; NULL for a
    // message nobody reacted to. The reactions themselves are in `chat_message_reactions`.
    reactedAt: datetime('reacted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    deletedAt: datetime('deleted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [
    uniqueIndex('chat_messages_message_uuid_unique').on(table.messageUuid),
    index('chat_messages_conversation_id_idx').on(table.conversationId, table.id),
    index('chat_messages_edited_at_idx').on(table.editedAt),
    index('chat_messages_reacted_at_idx').on(table.reactedAt),
  ],
)

export type ChatMessageSelect = typeof chatMessagesTable.$inferSelect
export type ChatMessageInsert = typeof chatMessagesTable.$inferInsert

// The reactions to chat messages (migration 0158): one row for a member's reaction to a message
// -- one a member and message, which the unique key holds. Taken back, the row is deleted; when
// anything about a message's reactions changed, its `reacted_at` says so.
//
// The member by their pair, as `chat_conversation_members` names a member. `id` is the order the
// members reacted in; a reaction changed for another keeps its place.
//
// ⛔ `emoji` is compared byte by byte in the database (utf8mb4_bin): the tables' own
// collation takes most emoji for one and the same character.
export const chatMessageReactionsTable = mysqlTable(
  'chat_message_reactions',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    messageId: int('message_id', { unsigned: true }).notNull(),
    communityUuid: char('community_uuid', { length: 36 }).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    emoji: varchar({ length: 16 }).collate('utf8mb4_bin').notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('chat_message_reactions_message_member_unique').on(
      table.messageId,
      table.communityUuid,
      table.gradidoId,
    ),
  ],
)

export type ChatMessageReactionSelect = typeof chatMessageReactionsTable.$inferSelect
export type ChatMessageReactionInsert = typeof chatMessageReactionsTable.$inferInsert

// The pictures in chat messages (P7, migration 0146), stored in the form of the avatar's
// (`user_avatars`): the JPEG's bytes in a mediumblob, its mime type, a time stamp -- so that
// both kinds of picture can move to another storage in one go (E-041). What a chat picture has
// beyond that: the message it belongs to, its place in that message, and its size, which the
// bubble takes its room from before the picture has come.
//
// ⛔ Hung on `message_uuid`, not on the message's id: the picture is filed BEFORE its message
// (deliverChatMessageLocally), and the uuid names the message on both servers (P7b).
//
// ⛔ `image` is read by one query only, and only for a member of the message's conversation
// (dbSelectChatMessageImageForMember). Every list of pictures reads the columns beside it.
export const chatMessageImagesTable = mysqlTable(
  'chat_message_images',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    // What the wallet fetches the picture by.
    imageUuid: char('image_uuid', { length: 36 }).notNull(),
    messageUuid: char('message_uuid', { length: 36 }).notNull(),
    // Ready for several pictures in one message; 0 while a message carries one.
    position: tinyint({ unsigned: true }).default(0).notNull(),
    width: smallint({ unsigned: true }).notNull(),
    height: smallint({ unsigned: true }).notNull(),
    image: customMediumBlob('image').notNull(),
    // Always 'image/jpeg', as in user_avatars.
    mimeType: varchar('mime_type', { length: 32 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('chat_message_images_image_uuid_unique').on(table.imageUuid),
    uniqueIndex('chat_message_images_message_uuid_position_unique').on(
      table.messageUuid,
      table.position,
    ),
  ],
)

export type ChatMessageImageSelect = typeof chatMessageImagesTable.$inferSelect
export type ChatMessageImageInsert = typeof chatMessageImagesTable.$inferInsert

// The Jitsi servers the chat's video calls take a room from (migration 0145), as an
// administrator keeps them on the admin page "Chat". The table IS the list: the backend reads
// it afresh for every check, and CHAT_VIDEO_SERVERS only fills it once, while it is empty.
//
// `baseUrl` is stored as the backend's chatVideoServerFrom builds it -- https, ending in '/'
// -- so the unique key sees the same server however it was typed. `active` is the tick "in
// the random choice": every row is checked, only active ones are handed out. What the checks
// find is not stored; it is the view of the running process (chatVideoServerPool).
export const chatVideoServersTable = mysqlTable(
  'chat_video_servers',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    baseUrl: varchar('base_url', { length: 255 }).notNull(),
    operator: varchar({ length: 120 }).default(sql`NULL`),
    // Letters and digits only; NULL for none -- the room name is then the random part alone.
    roomPrefix: varchar('room_prefix', { length: 40 }).default(sql`NULL`),
    note: varchar({ length: 255 }).default(sql`NULL`),
    active: boolean().default(true).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [uniqueIndex('chat_video_servers_base_url_unique').on(table.baseUrl)],
)

export type ChatVideoServerSelect = typeof chatVideoServersTable.$inferSelect
export type ChatVideoServerInsert = typeof chatVideoServersTable.$inferInsert

// What a thank-you greeting has beyond the transaction link it is (migration 0152): the motif
// of the card, its first line and the name the sender wrote under "Für wen?". Amount, memo,
// code and validity are the link's own.
//
// ⛔ Hung on the link's `code`, not on its id: the greeting is filed BEFORE its link
// (createTransactionLink), and the code is what names the link before it is saved. No foreign
// key -- a link is soft-deleted.
export const thankYouGreetingsTable = mysqlTable(
  'thank_you_greetings',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    transactionLinkCode: varchar('transaction_link_code', { length: 24 }).notNull(),
    // One of the wallet's motif keys; NULL is for a greeting with a photo of its own.
    motif: varchar({ length: 32 }).default(sql`NULL`),
    // Also the beginning of the link's memo, which is what goes into the booking.
    line: varchar({ length: 120 }).default(sql`NULL`),
    // Written freely by the sender; no account stands behind it.
    recipientName: varchar('recipient_name', { length: 64 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('thank_you_greetings_transaction_link_code_unique').on(table.transactionLinkCode),
  ],
)

export type ThankYouGreetingSelect = typeof thankYouGreetingsTable.$inferSelect
export type ThankYouGreetingInsert = typeof thankYouGreetingsTable.$inferInsert

/**
 * The two renditions of a greeting's own picture (ZE-019): the small one, in the chat's
 * measure, stays with the booking the greeting becomes; the large one serves the page the link
 * opens as and goes when the thank-you is accepted or deleted.
 */
export const ThankYouGreetingPictureRendition = { SMALL: 'small', LARGE: 'large' } as const
export type ThankYouGreetingPictureRendition =
  (typeof ThankYouGreetingPictureRendition)[keyof typeof ThankYouGreetingPictureRendition]

// The picture of a thank-you greeting that carries a photo of the member's own instead of a
// motif (migration 0153), stored in the form of a chat message's picture (`chat_message_images`)
// and of the avatar: the JPEG's bytes in a mediumblob, its mime type, a time stamp -- so that
// every kind of picture can move to another storage in one go (E-041). One row for each
// rendition.
//
// ⛔ Hung on the link's `code`, as the greeting is: both are filed BEFORE their link
// (createTransactionLink). No foreign key -- a link is soft-deleted.
//
// ⛔ A table of its own, not columns of `thank_you_greetings`: the lists of links and of
// bookings read a greeting's whole row, and a picture there would travel with every one of them.
// `image` is read by one query only (dbSelectThankYouGreetingPictureImage), for one picture,
// after the rule has said who is asking (backend/src/data/ThankYouGreetingPicture.logic.ts).
export const thankYouGreetingPicturesTable = mysqlTable(
  'thank_you_greeting_pictures',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    transactionLinkCode: varchar('transaction_link_code', { length: 24 }).notNull(),
    rendition: varchar({ length: 8 }).$type<ThankYouGreetingPictureRendition>().notNull(),
    // The size the decoder found when the server encoded the picture again.
    width: smallint({ unsigned: true }).notNull(),
    height: smallint({ unsigned: true }).notNull(),
    image: customMediumBlob('image').notNull(),
    // Always 'image/jpeg', as in user_avatars.
    mimeType: varchar('mime_type', { length: 32 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('thank_you_greeting_pictures_code_rendition_unique').on(
      table.transactionLinkCode,
      table.rendition,
    ),
  ],
)

export type ThankYouGreetingPictureSelect = typeof thankYouGreetingPicturesTable.$inferSelect
export type ThankYouGreetingPictureInsert = typeof thankYouGreetingPicturesTable.$inferInsert

// A picture sent with a transfer (migration 0154): one of the motifs of the thank-you greeting
// by its key, or -- with `motif` NULL -- a photo of the member's own, whose bytes are in
// `transaction_picture_images`. The booking points at this row from both of its rows
// (`transactions.transaction_picture_id`).
//
// What a list may read: the booking list asks this table once for a page, and never the other.
export const transactionPicturesTable = mysqlTable('transaction_pictures', {
  id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
  // One of the wallet's motif keys; NULL is for a photo of the member's own.
  motif: varchar({ length: 32 }).default(sql`NULL`),
  createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

export type TransactionPictureSelect = typeof transactionPicturesTable.$inferSelect
export type TransactionPictureInsert = typeof transactionPicturesTable.$inferInsert

// The photo of a transfer's picture, stored in the form of a chat message's picture
// (`chat_message_images`), of the avatar and of a greeting's picture: the JPEG's bytes in a
// mediumblob, its mime type, a time stamp -- so that every kind of picture can move to another
// storage in one go (E-041). One row for a picture, in the chat's measure.
//
// ⛔ `image` is read by one query only (dbSelectTransactionPictureImageForMember), and the rule
// about who gets it is in that query.
export const transactionPictureImagesTable = mysqlTable(
  'transaction_picture_images',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    transactionPictureId: int('transaction_picture_id', { unsigned: true }).notNull(),
    // The size the decoder found when the server encoded the picture again.
    width: smallint({ unsigned: true }).notNull(),
    height: smallint({ unsigned: true }).notNull(),
    image: customMediumBlob('image').notNull(),
    // Always 'image/jpeg', as in user_avatars.
    mimeType: varchar('mime_type', { length: 32 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('transaction_picture_images_picture_unique').on(table.transactionPictureId),
  ],
)

export type TransactionPictureImageSelect = typeof transactionPictureImagesTable.$inferSelect
export type TransactionPictureImageInsert = typeof transactionPictureImagesTable.$inferInsert
