import { mysqlTable, mysqlSchema, AnyMySqlColumn, unique, int, varchar, binary, char, datetime, index, text, decimal, timestamp, tinyint, bigint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const communities = mysqlTable("communities", {
	id: int().autoincrement().notNull(),
	foreign: tinyint().default(1).notNull(),
	url: varchar({ length: 255 }).notNull(),
	publicKey: binary("public_key", { length: 32 }).notNull(),
	privateKey: binary("private_key", { length: 64 }).default(sql`NULL`),
	communityUuid: char("community_uuid", { length: 36 }).default(sql`NULL`),
	authenticatedAt: datetime("authenticated_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	name: varchar({ length: 40 }).default(sql`NULL`),
	description: varchar({ length: 255 }).default(sql`NULL`),
	gmsApiKey: varchar("gms_api_key", { length: 512 }).default(sql`NULL`),
	publicJwtKey: varchar("public_jwt_key", { length: 512 }).default(sql`NULL`),
	privateJwtKey: varchar("private_jwt_key", { length: 2048 }).default(sql`NULL`),
	// Warning: Can't parse geometry from database
	// geometryType: geometry("location"),
	hieroTopicId: varchar("hiero_topic_id", { length: 512 }).default(sql`NULL`),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
},
(table) => [
	unique("url_key").on(table.url),
	unique("uuid_key").on(table.communityUuid),
]);

export const communityHandshakeStates = mysqlTable("community_handshake_states", {
	id: int().autoincrement().notNull(),
	handshakeId: int("handshake_id").notNull(),
	oneTimeCode: int("one_time_code").default(sql`NULL`),
	publicKey: binary("public_key", { length: 32 }).notNull(),
	apiVersion: varchar("api_version", { length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('\'OPEN_CONNECTION\'').notNull(),
	lastError: text("last_error").default(sql`NULL`),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
},
(table) => [
	index("idx_public_key").on(table.publicKey),
]);

export const contributions = mysqlTable("contributions", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").default(sql`NULL`),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`NULL`),
	resubmissionAt: datetime("resubmission_at", { mode: 'string'}).default(sql`NULL`),
	contributionDate: datetime("contribution_date", { mode: 'string'}).default(sql`NULL`),
	memo: varchar({ length: 512 }).notNull(),
	amount: decimal({ precision: 40, scale: 20 }).notNull(),
	moderatorId: int("moderator_id").default(sql`NULL`),
	contributionLinkId: int("contribution_link_id").default(sql`NULL`),
	confirmedBy: int("confirmed_by").default(sql`NULL`),
	confirmedAt: datetime("confirmed_at", { mode: 'string'}).default(sql`NULL`),
	deniedAt: datetime("denied_at", { mode: 'string'}).default(sql`NULL`),
	deniedBy: int("denied_by").default(sql`NULL`),
	contributionType: varchar("contribution_type", { length: 12 }).default('\'ADMIN\'').notNull(),
	contributionStatus: varchar("contribution_status", { length: 12 }).default('\'PENDING\'').notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default(sql`NULL`),
	transactionId: int("transaction_id").default(sql`NULL`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`NULL`),
	updatedBy: int("updated_by").default(sql`NULL`),
	deletedBy: int("deleted_by").default(sql`NULL`),
},
(table) => [
	index("user_id").on(table.userId),
	index("created_at").on(table.createdAt),
	index("deleted_at").on(table.deletedAt),
]);

export const contributionLinks = mysqlTable("contribution_links", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	memo: varchar({ length: 512 }).notNull(),
	validFrom: datetime("valid_from", { mode: 'string'}).notNull(),
	validTo: datetime("valid_to", { mode: 'string'}).default(sql`NULL`),
	amount: bigint({ mode: "number" }).notNull(),
	cycle: varchar({ length: 12 }).default('\'ONCE\'').notNull(),
	maxPerCycle: int("max_per_cycle").default(1).notNull(),
	maxAmountPerMonth: bigint("max_amount_per_month", { mode: "number" }).default(sql`NULL`),
	totalMaxCountOfContribution: int("total_max_count_of_contribution").default(sql`NULL`),
	maxAccountBalance: bigint("max_account_balance", { mode: "number" }).default(sql`NULL`),
	minGapHours: int("min_gap_hours").default(sql`NULL`),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`current_timestamp()`).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default(sql`NULL`),
	code: varchar({ length: 24 }).notNull(),
	linkEnabled: tinyint("link_enabled").default(1).notNull(),
});

export const contributionMessages = mysqlTable("contribution_messages", {
	id: int().autoincrement().notNull(),
	contributionId: int("contribution_id").notNull(),
	userId: int("user_id").notNull(),
	message: varchar({ length: 2000 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`current_timestamp()`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`NULL`),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default(sql`NULL`),
	deletedBy: int("deleted_by").default(sql`NULL`),
	type: varchar({ length: 12 }).default('\'DIALOG\'').notNull(),
	isModerator: tinyint("is_moderator").default(0).notNull(),
},
(table) => [
	index("contribution_id").on(table.contributionId),
]);

export const dltTransactions = mysqlTable("dlt_transactions", {
	id: int().autoincrement().notNull(),
	transactionId: int("transaction_id").default(sql`NULL`),
	userId: int("user_id").default(sql`NULL`),
	transactionLinkId: int("transaction_link_id").default(sql`NULL`),
	typeId: int("type_id").notNull(),
	messageId: varchar("message_id", { length: 64 }).default(sql`NULL`),
	verified: tinyint().default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	verifiedAt: datetime("verified_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	error: text().default(sql`NULL`),
});

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	affectedUserId: int("affected_user_id").notNull(),
	actingUserId: int("acting_user_id").notNull(),
	involvedUserId: int("involved_user_id").default(sql`NULL`),
	involvedTransactionId: int("involved_transaction_id").default(sql`NULL`),
	involvedContributionId: int("involved_contribution_id").default(sql`NULL`),
	involvedContributionMessageId: int("involved_contribution_message_id").default(sql`NULL`),
	involvedTransactionLinkId: int("involved_transaction_link_id").default(sql`NULL`),
	involvedContributionLinkId: int("involved_contribution_link_id").default(sql`NULL`),
	amount: bigint({ mode: "number" }).default(sql`NULL`),
});

export const federatedCommunities = mysqlTable("federated_communities", {
	id: int().autoincrement().notNull(),
	foreign: tinyint().default(1).notNull(),
	publicKey: binary("public_key", { length: 32 }).notNull(),
	apiVersion: varchar("api_version", { length: 10 }).notNull(),
	endPoint: varchar("end_point", { length: 255 }).notNull(),
	lastAnnouncedAt: datetime("last_announced_at", { mode: 'string', fsp: 3 }).default('NULL'),
	verifiedAt: datetime("verified_at", { mode: 'string', fsp: 3 }).default('NULL'),
	lastErrorAt: datetime("last_error_at", { mode: 'string', fsp: 3 }).default('NULL'),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default('NULL'),
},
(table) => [
	unique("public_api_key").on(table.publicKey, table.apiVersion),
]);

export const loginElopageBuys = mysqlTable("login_elopage_buys", {
	id: int().autoincrement().notNull(),
	elopageUserId: int("elopage_user_id").default(sql`NULL`),
	affiliateProgramId: int("affiliate_program_id").default(sql`NULL`),
	publisherId: int("publisher_id").default(sql`NULL`),
	orderId: int("order_id").default(sql`NULL`),
	productId: int("product_id").default(sql`NULL`),
	productPrice: int("product_price").notNull(),
	payerEmail: varchar("payer_email", { length: 255 }).notNull(),
	publisherEmail: varchar("publisher_email", { length: 255 }).notNull(),
	payed: tinyint().notNull(),
	successDate: datetime("success_date", { mode: 'string'}).notNull(),
	event: varchar({ length: 255 }).notNull(),
});

export const migrations = mysqlTable("migrations", {
	version: int().default(sql`NULL`),
	fileName: varchar({ length: 256 }).default(sql`NULL`),
	date: datetime({ mode: 'string'}).default(sql`current_timestamp()`),
});

export const openaiThreads = mysqlTable("openai_threads", {
	id: varchar({ length: 128 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`current_timestamp()`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`current_timestamp()`),
	userId: int("user_id").notNull(),
});

export const pendingTransactions = mysqlTable("pending_transactions", {
	id: int().autoincrement().notNull(),
	state: int().notNull(),
	previous: int().default(sql`NULL`),
	typeId: int("type_id").default(sql`NULL`),
	transactionLinkId: int("transaction_link_id").default(sql`NULL`),
	amount: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	balance: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	balanceDate: datetime("balance_date", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	decay: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	decayStart: datetime("decay_start", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	memo: varchar({ length: 512 }).notNull(),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	userId: int("user_id").notNull(),
	userGradidoId: char("user_gradido_id", { length: 36 }).notNull(),
	userName: varchar("user_name", { length: 512 }).default(sql`NULL`),
	userCommunityUuid: char("user_community_uuid", { length: 36 }).notNull(),
	linkedUserId: int("linked_user_id").default(sql`NULL`),
	linkedUserGradidoId: char("linked_user_gradido_id", { length: 36 }).notNull(),
	linkedUserName: varchar("linked_user_name", { length: 512 }).default(sql`NULL`),
	linkedUserCommunityUuid: char("linked_user_community_uuid", { length: 36 }).notNull(),
	linkedTransactionId: int("linked_transaction_id").default(sql`NULL`),
});

export const projectBrandings = mysqlTable("project_brandings", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	alias: varchar({ length: 32 }).notNull(),
	description: text().default(sql`NULL`),
	spaceId: int("space_id").default(sql`NULL`),
	spaceUrl: varchar("space_url", { length: 255 }).default(sql`NULL`),
	newUserToSpace: tinyint("new_user_to_space").default(0).notNull(),
	logoUrl: varchar("logo_url", { length: 255 }).default(sql`NULL`),
});

export const transactions = mysqlTable("transactions", {
	id: int().autoincrement().notNull(),
	previous: int().default(sql`NULL`),
	typeId: int("type_id").default(sql`NULL`),
	transactionLinkId: int("transaction_link_id").default(sql`NULL`),
	amount: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	balance: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	balanceDate: datetime("balance_date", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	decay: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	decayStart: datetime("decay_start", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	memo: varchar({ length: 512 }).notNull(),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	userId: int("user_id").notNull(),
	userCommunityUuid: char("user_community_uuid", { length: 36 }).default(sql`NULL`),
	userGradidoId: char("user_gradido_id", { length: 36 }).notNull(),
	userName: varchar("user_name", { length: 512 }).default(sql`NULL`),
	linkedUserId: int("linked_user_id").default(sql`NULL`),
	linkedUserCommunityUuid: char("linked_user_community_uuid", { length: 36 }).default(sql`NULL`),
	linkedUserGradidoId: char("linked_user_gradido_id", { length: 36 }).default(sql`NULL`),
	linkedUserName: varchar("linked_user_name", { length: 512 }).default(sql`NULL`),
	linkedTransactionId: int("linked_transaction_id").default(sql`NULL`),
},
(table) => [
	index("user_id").on(table.userId),
	unique("previous").on(table.previous),
]);

export const transactionLinks = mysqlTable("transaction_links", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	amount: decimal({ precision: 40, scale: 20 }).notNull(),
	holdAvailableAmount: decimal("hold_available_amount", { precision: 40, scale: 20 }).notNull(),
	memo: varchar({ length: 512 }).notNull(),
	code: varchar({ length: 24 }).notNull(),
	createdAt: datetime({ mode: 'string'}).notNull(),
	deletedAt: datetime({ mode: 'string'}).default(sql`NULL`),
	validUntil: datetime({ mode: 'string'}).notNull(),
	redeemedAt: datetime({ mode: 'string'}).default(sql`NULL`),
	redeemedBy: int().default(sql`NULL`),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	foreign: tinyint().default(0).notNull(),
	gradidoId: char("gradido_id", { length: 36 }).notNull(),
	communityUuid: varchar("community_uuid", { length: 36 }).default(sql`NULL`),
	alias: varchar({ length: 20 }).default(sql`NULL`),
	emailId: int("email_id").default(sql`NULL`),
	firstName: varchar("first_name", { length: 255 }).default(sql`NULL`),
	lastName: varchar("last_name", { length: 255 }).default(sql`NULL`),
	gmsPublishName: int("gms_publish_name").default(0).notNull(),
	humhubPublishName: int("humhub_publish_name").default(0).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	password: bigint({ mode: "number" }),
	passwordEncryptionType: int("password_encryption_type").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	language: varchar({ length: 4 }).default(sql`'de'`).notNull(),
	referrerId: int("referrer_id").default(sql`NULL`),
	contributionLinkId: int("contribution_link_id").default(sql`NULL`),
	publisherId: int("publisher_id").default(0),
	hideAmountGdd: tinyint().default(0),
	hideAmountGdt: tinyint().default(0),
	gmsAllowed: tinyint("gms_allowed").default(1).notNull(),
	// Warning: Can't parse geometry from database
	// geometryType: geometry("location"),
	gmsPublishLocation: int("gms_publish_location").default(2).notNull(),
	gmsRegistered: tinyint("gms_registered").default(0).notNull(),
	gmsRegisteredAt: datetime("gms_registered_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	humhubAllowed: tinyint("humhub_allowed").default(0).notNull(),
},
(table) => [
	unique("uuid_key").on(table.gradidoId, table.communityUuid),
	unique("alias_key").on(table.alias, table.communityUuid),
	unique("email_id").on(table.emailId),
]);

export const userContacts = mysqlTable("user_contacts", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	userId: int("user_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerificationCode: bigint("email_verification_code", { mode: "number" }).default(sql`NULL`),
	emailOptInTypeId: int("email_opt_in_type_id").default(sql`NULL`),
	emailResendCount: int("email_resend_count").default(0),
	emailChecked: tinyint("email_checked").default(0).notNull(),
	gmsPublishEmail: tinyint("gms_publish_email").default(0).notNull(),
	countryCode: varchar("country_code", { length: 255 }).default(sql`NULL`),
	phone: varchar({ length: 255 }).default(sql`NULL`),
	gmsPublishPhone: int("gms_publish_phone").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	deletedAt: datetime("deleted_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
},
(table) => [
	unique("email").on(table.email),
	unique("email_verification_code").on(table.emailVerificationCode),
]);

export const userRoles = mysqlTable("user_roles", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	role: varchar({ length: 40 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default(sql`NULL`),
},
(table) => [
	index("user_id").on(table.userId),
]);
