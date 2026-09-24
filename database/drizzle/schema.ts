import { mysqlTable, mysqlSchema, AnyMySqlColumn, unique, int, varchar, binary, char, datetime, index, text, decimal, timestamp } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const communities = mysqlTable("communities", {
	id: int().autoincrement().notNull(),
	foreign: tinyint().default(1).notNull(),
	url: varchar({ length: 255 }).notNull(),
	publicKey: binary("public_key", { length: 32 }).notNull(),
	privateKey: binary("private_key", { length: 64 }).default('NULL'),
	communityUuid: char("community_uuid", { length: 36 }).default('NULL'),
	authenticatedAt: datetime("authenticated_at", { mode: 'string', fsp: 3 }).default('NULL'),
	name: varchar({ length: 40 }).default('NULL'),
	description: varchar({ length: 255 }).default('NULL'),
	gmsApiKey: varchar("gms_api_key", { length: 512 }).default('NULL'),
	publicJwtKey: varchar("public_jwt_key", { length: 512 }).default('NULL'),
	privateJwtKey: varchar("private_jwt_key", { length: 2048 }).default('NULL'),
	// Warning: Can't parse geometry from database
	// geometryType: geometry("location"),
	hieroTopicId: varchar("hiero_topic_id", { length: 512 }).default('NULL'),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default('NULL'),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default('NULL'),
},
(table) => [
	unique("url_key").on(table.url),
	unique("uuid_key").on(table.communityUuid),
]);

export const communityHandshakeStates = mysqlTable("community_handshake_states", {
	id: int().autoincrement().notNull(),
	handshakeId: int("handshake_id").notNull(),
	oneTimeCode: int("one_time_code").default('NULL'),
	publicKey: binary("public_key", { length: 32 }).notNull(),
	apiVersion: varchar("api_version", { length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('\'OPEN_CONNECTION\'').notNull(),
	lastError: text("last_error").default('NULL'),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
},
(table) => [
	index("idx_public_key").on(table.publicKey),
]);

export const contributions = mysqlTable("contributions", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").default('NULL'),
	createdAt: datetime("created_at", { mode: 'string'}).default('NULL'),
	resubmissionAt: datetime("resubmission_at", { mode: 'string'}).default('NULL'),
	contributionDate: datetime("contribution_date", { mode: 'string'}).default('NULL'),
	memo: varchar({ length: 512 }).notNull(),
	amountLegacy: decimal("amount_legacy", { precision: 40, scale: 20 }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
	moderatorId: int("moderator_id").default('NULL'),
	contributionLinkId: int("contribution_link_id").default('NULL'),
	confirmedBy: int("confirmed_by").default('NULL'),
	confirmedAt: datetime("confirmed_at", { mode: 'string'}).default('NULL'),
	deniedAt: datetime("denied_at", { mode: 'string'}).default('NULL'),
	deniedBy: int("denied_by").default('NULL'),
	contributionType: varchar("contribution_type", { length: 12 }).default('\'ADMIN\'').notNull(),
	contributionStatus: varchar("contribution_status", { length: 12 }).default('\'PENDING\'').notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default('NULL'),
	transactionId: int("transaction_id").default('NULL'),
	updatedAt: datetime("updated_at", { mode: 'string'}).default('NULL'),
	updatedBy: int("updated_by").default('NULL'),
	deletedBy: int("deleted_by").default('NULL'),
},
(table) => [
	index("idx_contributions_feed").on(table.contributionStatus, table.contributionLinkId, table.confirmedAt, table.transactionId),
]);

export const contributionLinks = mysqlTable("contribution_links", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	memo: varchar({ length: 512 }).notNull(),
	validFrom: datetime("valid_from", { mode: 'string'}).notNull(),
	validTo: datetime("valid_to", { mode: 'string'}).default('NULL'),
	amountLegacy: bigint("amount_legacy", { mode: "number" }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
	cycle: varchar({ length: 12 }).default('\'ONCE\'').notNull(),
	maxPerCycle: int("max_per_cycle").default(1).notNull(),
	maxAmountPerMonthLegacy: bigint("max_amount_per_month_legacy", { mode: "number" }).default('NULL'),
	maxAmountPerMonthGdd4: bigint("max_amount_per_month_gdd4", { mode: "number" }).default('NULL'),
	totalMaxCountOfContribution: int("total_max_count_of_contribution").default('NULL'),
	maxAccountBalanceLegacy: bigint("max_account_balance_legacy", { mode: "number" }).default('NULL'),
	maxAccountBalanceGdd4: bigint("max_account_balance_gdd4", { mode: "number" }).default('NULL'),
	minGapHours: int("min_gap_hours").default('NULL'),
	createdAt: datetime("created_at", { mode: 'string'}).default('current_timestamp()').notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default('NULL'),
	code: varchar({ length: 24 }).notNull(),
	linkEnabled: tinyint("link_enabled").default(1).notNull(),
});

export const contributionMessages = mysqlTable("contribution_messages", {
	id: int().autoincrement().notNull(),
	contributionId: int("contribution_id").notNull(),
	userId: int("user_id").notNull(),
	message: varchar({ length: 2000 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default('current_timestamp()').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default('NULL'),
	deletedAt: datetime("deleted_at", { mode: 'string'}).default('NULL'),
	deletedBy: int("deleted_by").default('NULL'),
	type: varchar({ length: 12 }).default('\'DIALOG\'').notNull(),
	isModerator: tinyint("is_moderator").default(0).notNull(),
},
(table) => [
	index("contribution_id").on(table.contributionId),
]);

export const dltTransactions = mysqlTable("dlt_transactions", {
	id: int().autoincrement().notNull(),
	transactionId: int("transaction_id").default('NULL'),
	userId: int("user_id").default('NULL'),
	transactionLinkId: int("transaction_link_id").default('NULL'),
	typeId: int("type_id").notNull(),
	messageId: varchar("message_id", { length: 64 }).default('NULL'),
	verified: tinyint().default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	verifiedAt: datetime("verified_at", { mode: 'string', fsp: 3 }).default('NULL'),
	error: text().default('NULL'),
},
(table) => [
	index("idx_dlt_user_id").on(table.userId),
	index("idx_dlt_transaction_id").on(table.transactionId),
	index("idx_dlt_transaction_link_id").on(table.transactionLinkId),
]);

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	affectedUserId: int("affected_user_id").notNull(),
	actingUserId: int("acting_user_id").notNull(),
	involvedUserId: int("involved_user_id").default('NULL'),
	involvedTransactionId: int("involved_transaction_id").default('NULL'),
	involvedContributionId: int("involved_contribution_id").default('NULL'),
	involvedContributionMessageId: int("involved_contribution_message_id").default('NULL'),
	involvedTransactionLinkId: int("involved_transaction_link_id").default('NULL'),
	involvedContributionLinkId: int("involved_contribution_link_id").default('NULL'),
	amountLegacy: bigint("amount_legacy", { mode: "number" }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
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
	elopageUserId: int("elopage_user_id").default('NULL'),
	affiliateProgramId: int("affiliate_program_id").default('NULL'),
	publisherId: int("publisher_id").default('NULL'),
	orderId: int("order_id").default('NULL'),
	productId: int("product_id").default('NULL'),
	productPrice: int("product_price").notNull(),
	payerEmail: varchar("payer_email", { length: 255 }).notNull(),
	publisherEmail: varchar("publisher_email", { length: 255 }).notNull(),
	payed: tinyint().notNull(),
	successDate: datetime("success_date", { mode: 'string'}).notNull(),
	event: varchar({ length: 255 }).notNull(),
});

export const migrations = mysqlTable("migrations", {
	version: int().default('NULL'),
	fileName: varchar({ length: 256 }).default('NULL'),
	date: datetime({ mode: 'string'}).default('current_timestamp()'),
});

export const openaiThreads = mysqlTable("openai_threads", {
	id: varchar({ length: 128 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('current_timestamp()'),
	updatedAt: timestamp({ mode: 'string' }).default('current_timestamp()'),
	userId: int("user_id").notNull(),
});

export const pendingTransactions = mysqlTable("pending_transactions", {
	id: int().autoincrement().notNull(),
	state: int().notNull(),
	previous: int().default('NULL'),
	typeId: int("type_id").default('NULL'),
	transactionLinkId: int("transaction_link_id").default('NULL'),
	amountLegacy: decimal("amount_legacy", { precision: 40, scale: 20 }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
	balanceLegacy: decimal("balance_legacy", { precision: 40, scale: 20 }).default('NULL'),
	balanceGdd4: bigint("balance_gdd4", { mode: "number" }).default('NULL'),
	balanceDate: datetime("balance_date", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	decayLegacy: decimal("decay_legacy", { precision: 40, scale: 20 }).default('NULL'),
	decayGdd4: bigint("decay_gdd4", { mode: "number" }).default('NULL'),
	decayStart: datetime("decay_start", { mode: 'string', fsp: 3 }).default('NULL'),
	decayCalculationType: int("decay_calculation_type").default(0),
	memo: varchar({ length: 512 }).notNull(),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default('NULL'),
	userId: int("user_id").notNull(),
	userGradidoId: char("user_gradido_id", { length: 36 }).notNull(),
	userName: varchar("user_name", { length: 512 }).default('NULL'),
	userCommunityUuid: char("user_community_uuid", { length: 36 }).notNull(),
	linkedUserId: int("linked_user_id").default('NULL'),
	linkedUserGradidoId: char("linked_user_gradido_id", { length: 36 }).notNull(),
	linkedUserName: varchar("linked_user_name", { length: 512 }).default('NULL'),
	linkedUserCommunityUuid: char("linked_user_community_uuid", { length: 36 }).notNull(),
	linkedTransactionId: int("linked_transaction_id").default('NULL'),
});

export const projectBrandings = mysqlTable("project_brandings", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	alias: varchar({ length: 32 }).notNull(),
	description: text().default('NULL'),
	spaceId: int("space_id").default('NULL'),
	spaceUrl: varchar("space_url", { length: 255 }).default('NULL'),
	newUserToSpace: tinyint("new_user_to_space").default(0).notNull(),
	logoUrl: varchar("logo_url", { length: 255 }).default('NULL'),
},
(table) => [
	unique("project_brandings_alias_unique").on(table.alias),
]);

export const transactions = mysqlTable("transactions", {
	id: int().autoincrement().notNull(),
	previous: int().default('NULL'),
	typeId: int("type_id").default('NULL'),
	transactionLinkId: int("transaction_link_id").default('NULL'),
	amountLegacy: decimal("amount_legacy", { precision: 40, scale: 20 }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
	balanceLegacy: decimal("balance_legacy", { precision: 40, scale: 20 }).default('NULL'),
	balanceGdd4: bigint("balance_gdd4", { mode: "number" }).default('NULL'),
	balanceDate: datetime("balance_date", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	decayLegacy: decimal("decay_legacy", { precision: 40, scale: 20 }).default('NULL'),
	decayGdd4: bigint("decay_gdd4", { mode: "number" }).default('NULL'),
	decayStart: datetime("decay_start", { mode: 'string', fsp: 3 }).default('NULL'),
	decayCalculationType: int("decay_calculation_type").default(0),
	memo: varchar({ length: 512 }).notNull(),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default('NULL'),
	userId: int("user_id").notNull(),
	userCommunityUuid: char("user_community_uuid", { length: 36 }).default('NULL'),
	userGradidoId: char("user_gradido_id", { length: 36 }).notNull(),
	userName: varchar("user_name", { length: 512 }).default('NULL'),
	linkedUserId: int("linked_user_id").default('NULL'),
	linkedUserCommunityUuid: char("linked_user_community_uuid", { length: 36 }).default('NULL'),
	linkedUserGradidoId: char("linked_user_gradido_id", { length: 36 }).default('NULL'),
	linkedUserName: varchar("linked_user_name", { length: 512 }).default('NULL'),
	linkedTransactionId: int("linked_transaction_id").default('NULL'),
},
(table) => [
	index("user_id").on(table.userId),
	index("idx_transactions_balance_date_id").on(table.balanceDate, table.id),
	index("idx_transaction_link_id").on(table.transactionLinkId),
	index("idx_linked_user_id").on(table.linkedUserId),
	unique("previous").on(table.previous),
]);

export const transactionLinks = mysqlTable("transaction_links", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	amountLegacy: decimal("amount_legacy", { precision: 40, scale: 20 }).default('NULL'),
	amountGdd4: bigint("amount_gdd4", { mode: "number" }).default('NULL'),
	holdAvailableAmountLegacy: decimal("hold_available_amount_legacy", { precision: 40, scale: 20 }).default('NULL'),
	holdAvailableAmountGdd4: bigint("hold_available_amount_gdd4", { mode: "number" }).default('NULL'),
	memo: varchar({ length: 512 }).notNull(),
	code: varchar({ length: 24 }).notNull(),
	createdAt: datetime({ mode: 'string'}).notNull(),
	deletedAt: datetime({ mode: 'string'}).default('NULL'),
	validUntil: datetime({ mode: 'string'}).notNull(),
	redeemedAt: datetime({ mode: 'string'}).default('NULL'),
	redeemedBy: int().default('NULL'),
},
(table) => [
	index("idx_userId").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	foreign: tinyint().default(0).notNull(),
	gradidoId: char("gradido_id", { length: 36 }).notNull(),
	communityUuid: varchar("community_uuid", { length: 36 }).default('NULL'),
	alias: varchar({ length: 20 }).default('NULL'),
	emailId: int("email_id").default('NULL'),
	firstName: varchar("first_name", { length: 255 }).default('NULL'),
	lastName: varchar("last_name", { length: 255 }).default('NULL'),
	gmsPublishName: int("gms_publish_name").default(0).notNull(),
	humhubPublishName: int("humhub_publish_name").default(0).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string', fsp: 3 }).default('NULL'),
	password: bigint({ mode: "number" }),
	passwordEncryptionType: int("password_encryption_type").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	language: varchar({ length: 4 }).default('\'de\'').notNull(),
	referrerId: int("referrer_id").default('NULL'),
	contributionLinkId: int("contribution_link_id").default('NULL'),
	publisherId: int("publisher_id").default(0),
	hideAmountGdd: tinyint().default(0),
	hideAmountGdt: tinyint().default(0),
	gmsAllowed: tinyint("gms_allowed").default(1).notNull(),
	// Warning: Can't parse geometry from database
	// geometryType: geometry("location"),
	gmsPublishLocation: int("gms_publish_location").default(2).notNull(),
	gmsRegistered: tinyint("gms_registered").default(0).notNull(),
	gmsRegisteredAt: datetime("gms_registered_at", { mode: 'string', fsp: 3 }).default('NULL'),
	humhubAllowed: tinyint("humhub_allowed").default(0).notNull(),
},
(table) => [
	index("idx_users_created_id_uuid").on(table.createdAt, table.id, table.communityUuid),
	unique("uuid_key").on(table.gradidoId, table.communityUuid),
	unique("alias_key").on(table.alias, table.communityUuid),
]);

export const userContacts = mysqlTable("user_contacts", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	userId: int("user_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerificationCode: bigint("email_verification_code", { mode: "number" }).default('NULL'),
	emailOptInTypeId: int("email_opt_in_type_id").default('NULL'),
	emailResendCount: int("email_resend_count").default(0),
	emailChecked: tinyint("email_checked").default(0).notNull(),
	gmsPublishEmail: tinyint("gms_publish_email").default(0).notNull(),
	countryCode: varchar("country_code", { length: 255 }).default('NULL'),
	phone: varchar({ length: 255 }).default('NULL'),
	gmsPublishPhone: int("gms_publish_phone").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default('NULL'),
	deletedAt: datetime("deleted_at", { mode: 'string', fsp: 3 }).default('NULL'),
},
(table) => [
	unique("email").on(table.email),
	unique("email_verification_code").on(table.emailVerificationCode),
]);

export const userRoles = mysqlTable("user_roles", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	role: varchar({ length: 40 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string', fsp: 3 }).default('current_timestamp(3)').notNull(),
	updatedAt: datetime("updated_at", { mode: 'string', fsp: 3 }).default('NULL'),
},
(table) => [
	index("user_id").on(table.userId),
]);
