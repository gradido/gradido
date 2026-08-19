import { sql } from 'drizzle-orm'
import {
  bigint,
  binary,
  boolean,
  char,
  datetime,
  decimal,
  index,
  int,
  longtext,
  mysqlTable,
  text,
  tinyint,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

import { customGradidoUnit, customMediumBlob } from './customTypes'

export const communitiesTable = mysqlTable(
  'communities',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(1).notNull(),
    url: varchar({ length: 255 }).notNull(),
    publicKey: binary('public_key', { length: 32 }).notNull(),
    privateKey: binary('private_key', { length: 64 }).default(sql`NULL`),
    communityUuid: char('community_uuid', { length: 36 }).default(sql`NULL`),
    authenticatedAt: datetime('authenticated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    name: varchar({ length: 40 }).default(sql`NULL`),
    description: varchar({ length: 255 }).default(sql`NULL`),
    gmsApiKey: varchar('gms_api_key', { length: 512 }).default(sql`NULL`),
    publicJwtKey: varchar('public_jwt_key', { length: 512 }).default(sql`NULL`),
    privateJwtKey: varchar('private_jwt_key', { length: 2048 }).default(sql`NULL`),
    // Warning: Can't parse geometry from database
    // geometryType: geometry("location"),
    hieroTopicId: varchar('hiero_topic_id', { length: 512 }).default(sql`NULL`),
    creationDate: datetime('creation_date', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [unique('url_key').on(table.url), unique('uuid_key').on(table.communityUuid)],
)

export type CommunitiesSelect = typeof communitiesTable.$inferSelect
export type CommunitiesInsert = typeof communitiesTable.$inferInsert

export const contributionsTable = mysqlTable(
  'contributions',
  {
    id: int().autoincrement().notNull(),
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
    contributionLinkId: int('contribution_link_id').default(sql`NULL`),
    confirmedBy: int('confirmed_by').default(sql`NULL`),
    confirmedAt: datetime('confirmed_at', { mode: 'date' }).default(sql`NULL`),
    deniedAt: datetime('denied_at', { mode: 'date' }).default(sql`NULL`),
    deniedBy: int('denied_by').default(sql`NULL`),
    type: varchar('contribution_type', { length: 12 }).default(sql`ADMIN`).notNull(),
    status: varchar('contribution_status', { length: 12 }).default(sql`PENDING`).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'date' }).default(sql`NULL`),
    transactionId: int('transaction_id').default(sql`NULL`),
    updatedAt: datetime('updated_at', { mode: 'date' }).default(sql`NULL`),
    updatedBy: int('updated_by').default(sql`NULL`),
    deletedBy: int('deleted_by').default(sql`NULL`),
  },
  (table) => [
    index('user_id').on(table.userId),
    index('created_at').on(table.createdAt),
    index('deleted_at').on(table.deletedAt),
  ],
)

export type ContributionsSelect = typeof contributionsTable.$inferSelect
export type ContributionsInsert = typeof contributionsTable.$inferInsert

// One moderator conversation with Crea in the admin chat window (CreaChat). The
// Anthropic Messages API is stateless, so the whole exchange lives here as a JSON array
// in `messages` — that is the shape every access needs: read the complete thread, append
// a user/assistant pair, save. Nothing ever reads or writes a single message.
export const creachatThreadsTable = mysqlTable(
  'creachat_threads',
  {
    id: char({ length: 36 }).notNull(),
    userId: int('user_id').notNull(),
    messages: longtext().notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    // Maintained by dbUpdateCreachatThreadMessages, not by an ON UPDATE clause: drizzle
    // cannot express one on a datetime column, and a column half-owned by the DDL and
    // half by the query is the kind of thing nobody can answer a question about later.
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

export const dltTransactionsTable = mysqlTable(
  'dlt_transactions',
  {
    id: int().autoincrement().notNull(),
    transactionId: int('transaction_id').default(sql`NULL`),
    userId: int('user_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id').default(sql`NULL`),
    typeId: int('type_id').notNull(),
    hieroTransactionId: varchar('hiero_transaction_id', { length: 255 }).default(sql`NULL`),
    verified: tinyint().default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    verifiedAt: datetime('verified_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    error: text().default(sql`NULL`),
  },
  (table) => [
    uniqueIndex('dlt_transactions_hiero_transacion_id_unique').on(table.hieroTransactionId),
  ],
)

export type DltTransactionSelect = typeof dltTransactionsTable.$inferSelect
export type DltTransactionInsert = typeof dltTransactionsTable.$inferInsert

export const matchingEntriesTable = mysqlTable(
  'matching_entries',
  {
    id: int().autoincrement().notNull(),
    uuid: char({ length: 36 }).notNull(),
    userId: int('user_id').notNull(),
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
      .notNull(),
  },
  (table) => [
    unique('uniq_matching_entries_uuid').on(table.uuid),
    index('idx_matching_entries_user_id').on(table.userId),
  ],
)

export type MatchingEntrySelect = typeof matchingEntriesTable.$inferSelect
export type MatchingEntryInsert = typeof matchingEntriesTable.$inferInsert

export const projectBrandingsTable = mysqlTable(
  'project_brandings',
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    alias: varchar({ length: 32 }).notNull(),
    description: text().default(sql`NULL`),
    spaceId: int('space_id').default(sql`NULL`),
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
    id: int().autoincrement().notNull(),
    previous: int().default(sql`NULL`),
    typeId: int('type_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id').default(sql`NULL`),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    balance: customGradidoUnit('balance_gdd4').default(sql`NULL`),
    balanceDate: datetime('balance_date', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    memo: varchar({ length: 512 }).notNull(),
    userId: int('user_id').notNull(),
    linkedUserId: int('linked_user_id').default(sql`NULL`),
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

export const transactionLinksTable = mysqlTable(
  'transaction_links',
  {
    id: int().autoincrement().notNull(),
    userId: int().notNull(),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    holdAvailableAmount: customGradidoUnit('hold_available_amount_gdd4').default(sql`NULL`),
    memo: varchar({ length: 512 }).notNull(),
    code: varchar({ length: 24 }).notNull(),
    createdAt: datetime({ mode: 'date' }).notNull(),
    deletedAt: datetime({ mode: 'date' }).default(sql`NULL`),
    validUntil: datetime({ mode: 'date' }).notNull(),
    redeemedAt: datetime({ mode: 'date' }).default(sql`NULL`),
    redeemedBy: int().default(sql`NULL`),
  },
  (table) => [index('idx_userId').on(table.userId)],
)

export type TransactionLinksSelect = typeof transactionLinksTable.$inferSelect
export type TransactionLinksInsert = typeof transactionLinksTable.$inferInsert

export const usersTable = mysqlTable(
  'users',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(0).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    communityUuid: varchar('community_uuid', { length: 36 }).default(sql`NULL`),
    alias: varchar({ length: 20 }).default(sql`NULL`),
    emailId: int('email_id').default(sql`NULL`),
    firstName: varchar('first_name', { length: 255 }).default(sql`NULL`),
    lastName: varchar('last_name', { length: 255 }).default(sql`NULL`),
    gmsPublishName: int('gms_publish_name').default(0).notNull(),
    humhubPublishName: int('humhub_publish_name').default(0).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    password: bigint({ mode: 'number' }),
    passwordEncryptionType: int('password_encryption_type').default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    language: varchar({ length: 4 }).default(sql`'de'`).notNull(),
    referrerId: int('referrer_id').default(sql`NULL`),
    contributionLinkId: int('contribution_link_id').default(sql`NULL`),
    publisherId: int('publisher_id').default(0),
    hideAmountGdd: tinyint().default(0),
    hideAmountGdt: tinyint().default(0),
    gmsAllowed: tinyint('gms_allowed').default(1).notNull(),
    // Warning: Can't parse geometry from database
    // geometryType: geometry("location"),
    gmsPublishLocation: int('gms_publish_location').default(2).notNull(),
    aboutMe: text('about_me').default(sql`NULL`),
    avatarVisibleToMembers: tinyint('avatar_visible_to_members').default(1).notNull(),
    gmsRegistered: tinyint('gms_registered').default(0).notNull(),
    gmsRegisteredAt: datetime('gms_registered_at', { mode: 'date', fsp: 3 }).default(sql`NULL`),
    humhubAllowed: tinyint('humhub_allowed').default(0).notNull(),
  },
  (table) => [
    index('idx_users_created_id_uuid').on(table.createdAt, table.id, table.communityUuid),
    unique('uuid_key').on(table.gradidoId, table.communityUuid),
    unique('alias_key').on(table.alias, table.communityUuid),
  ],
)

export type UserSelect = typeof usersTable.$inferSelect
export type UserInsert = typeof usersTable.$inferInsert

// The member's own profile picture. A side table rather than a column on `users`,
// because `users` is read on nearly every request and an image would weigh every one
// of those reads down. user_id is the primary key: one member, one picture, so a
// duplicate is impossible by shape rather than by care.
// Two renditions from one upload. avatarSmall is what other people see and what will
// federate; avatarFull is own-view only -- the printed card and the member's own look at
// their picture. Never hand avatarFull to anybody but its owner.
export const userAvatarsTable = mysqlTable('user_avatars', {
  userId: int('user_id').primaryKey().notNull(),
  avatarSmall: customMediumBlob('avatar_small').notNull(),
  avatarFull: customMediumBlob('avatar_full').notNull(),
  mimeType: varchar('mime_type', { length: 32 }).notNull(),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .default(sql`current_timestamp(3)`)
    .notNull(),
})

export type UserAvatarSelect = typeof userAvatarsTable.$inferSelect
export type UserAvatarInsert = typeof userAvatarsTable.$inferInsert

// Paying with a printed card. Three tables, split along who owns what: the PIN and the
// limits belong to the person, the code and the failure counter belong to the card, and
// the payment request is a short-lived thing that lives between "amount entered" and
// "money booked".
//
// The existence of a settings row IS the on/off switch -- enabling means setting a PIN,
// disabling means deleting it. "Enabled but without a PIN" therefore cannot exist.
export const thankYouCardSettingsTable = mysqlTable('thank_you_card_settings', {
  userId: int('user_id').primaryKey().notNull(),
  // Same derivation as users.password (argon2id, then a 64 bit shorthash), but with its
  // own salt -- a leak must not let one of the two secrets say anything about the other.
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
    id: int().autoincrement().notNull(),
    userId: int('user_id').notNull(),
    // "DK-" plus 32 hex characters: 16 fully random bytes, no timestamp. Length inside a
    // QR code is free, so there is no reason to spend part of it on the creation time
    // the way transaction links do.
    code: varchar({ length: 40 }).notNull(),
    label: varchar({ length: 64 }).notNull(),
    // Counted on the card, not on the person: once more than one card may be valid,
    // guessing at one must not block the other.
    failedAttempts: int('failed_attempts').default(0).notNull(),
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
    id: int().autoincrement().notNull(),
    cardId: int('card_id').notNull(),
    recipientId: int('recipient_id').notNull(),
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
