-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `communities` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`foreign` tinyint(4) NOT NULL DEFAULT 1,
	`url` varchar(255) NOT NULL,
	`public_key` binary(32) NOT NULL,
	`private_key` binary(64) DEFAULT 'NULL',
	`community_uuid` char(36) DEFAULT 'NULL',
	`authenticated_at` datetime(3) DEFAULT 'NULL',
	`name` varchar(40) DEFAULT 'NULL',
	`description` varchar(255) DEFAULT 'NULL',
	`gms_api_key` varchar(512) DEFAULT 'NULL',
	`public_jwt_key` varchar(512) DEFAULT 'NULL',
	`private_jwt_key` varchar(2048) DEFAULT 'NULL',
	`location` geometry DEFAULT 'NULL',
	`hiero_topic_id` varchar(512) DEFAULT 'NULL',
	`creation_date` datetime(3) DEFAULT 'NULL',
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`updated_at` datetime(3) DEFAULT 'NULL',
	CONSTRAINT `url_key` UNIQUE(`url`),
	CONSTRAINT `uuid_key` UNIQUE(`community_uuid`)
);
--> statement-breakpoint
CREATE TABLE `community_handshake_states` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`handshake_id` int(10) unsigned NOT NULL,
	`one_time_code` int(10) unsigned DEFAULT 'NULL',
	`public_key` binary(32) NOT NULL,
	`api_version` varchar(255) NOT NULL,
	`status` varchar(255) NOT NULL DEFAULT '''OPEN_CONNECTION''',
	`last_error` text DEFAULT 'NULL',
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`updated_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)'
);
--> statement-breakpoint
CREATE TABLE `contributions` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int(10) DEFAULT 'NULL',
	`created_at` datetime DEFAULT 'NULL',
	`resubmission_at` datetime DEFAULT 'NULL',
	`contribution_date` datetime DEFAULT 'NULL',
	`memo` varchar(512) NOT NULL,
	`amount` decimal(40,20) NOT NULL,
	`moderator_id` int(10) DEFAULT 'NULL',
	`contribution_link_id` int(10) unsigned DEFAULT 'NULL',
	`confirmed_by` int(10) unsigned DEFAULT 'NULL',
	`confirmed_at` datetime DEFAULT 'NULL',
	`denied_at` datetime DEFAULT 'NULL',
	`denied_by` int(10) unsigned DEFAULT 'NULL',
	`contribution_type` varchar(12) NOT NULL DEFAULT '''ADMIN''',
	`contribution_status` varchar(12) NOT NULL DEFAULT '''PENDING''',
	`deleted_at` datetime DEFAULT 'NULL',
	`transaction_id` int(10) unsigned DEFAULT 'NULL',
	`updated_at` datetime DEFAULT 'NULL',
	`updated_by` int(10) unsigned DEFAULT 'NULL',
	`deleted_by` int(10) unsigned DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `contribution_links` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`memo` varchar(512) NOT NULL,
	`valid_from` datetime NOT NULL,
	`valid_to` datetime DEFAULT 'NULL',
	`amount` bigint(20) NOT NULL,
	`cycle` varchar(12) NOT NULL DEFAULT '''ONCE''',
	`max_per_cycle` int(10) unsigned NOT NULL DEFAULT 1,
	`max_amount_per_month` bigint(20) DEFAULT 'NULL',
	`total_max_count_of_contribution` int(10) unsigned DEFAULT 'NULL',
	`max_account_balance` bigint(20) DEFAULT 'NULL',
	`min_gap_hours` int(10) unsigned DEFAULT 'NULL',
	`created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
	`deleted_at` datetime DEFAULT 'NULL',
	`code` varchar(24) NOT NULL,
	`link_enabled` tinyint(4) NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `contribution_messages` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`contribution_id` int(10) unsigned NOT NULL,
	`user_id` int(10) unsigned NOT NULL,
	`message` varchar(2000) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT 'current_timestamp()',
	`updated_at` datetime DEFAULT 'NULL',
	`deleted_at` datetime DEFAULT 'NULL',
	`deleted_by` int(10) unsigned DEFAULT 'NULL',
	`type` varchar(12) NOT NULL DEFAULT '''DIALOG''',
	`is_moderator` tinyint(1) NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `dlt_transactions` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`transaction_id` int(10) unsigned DEFAULT 'NULL',
	`user_id` int(10) unsigned DEFAULT 'NULL',
	`transaction_link_id` int(10) unsigned DEFAULT 'NULL',
	`type_id` int(10) unsigned NOT NULL,
	`message_id` varchar(64) DEFAULT 'NULL',
	`verified` tinyint(4) NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`verified_at` datetime(3) DEFAULT 'NULL',
	`error` text DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`affected_user_id` int(10) unsigned NOT NULL,
	`acting_user_id` int(10) unsigned NOT NULL,
	`involved_user_id` int(10) unsigned DEFAULT 'NULL',
	`involved_transaction_id` int(10) unsigned DEFAULT 'NULL',
	`involved_contribution_id` int(10) unsigned DEFAULT 'NULL',
	`involved_contribution_message_id` int(10) unsigned DEFAULT 'NULL',
	`involved_transaction_link_id` int(10) unsigned DEFAULT 'NULL',
	`involved_contribution_link_id` int(10) unsigned DEFAULT 'NULL',
	`amount` bigint(20) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `federated_communities` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`foreign` tinyint(4) NOT NULL DEFAULT 1,
	`public_key` binary(32) NOT NULL,
	`api_version` varchar(10) NOT NULL,
	`end_point` varchar(255) NOT NULL,
	`last_announced_at` datetime(3) DEFAULT 'NULL',
	`verified_at` datetime(3) DEFAULT 'NULL',
	`last_error_at` datetime(3) DEFAULT 'NULL',
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`updated_at` datetime(3) DEFAULT 'NULL',
	CONSTRAINT `public_api_key` UNIQUE(`public_key`,`api_version`)
);
--> statement-breakpoint
CREATE TABLE `login_elopage_buys` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`elopage_user_id` int(11) DEFAULT 'NULL',
	`affiliate_program_id` int(11) DEFAULT 'NULL',
	`publisher_id` int(11) DEFAULT 'NULL',
	`order_id` int(11) DEFAULT 'NULL',
	`product_id` int(11) DEFAULT 'NULL',
	`product_price` int(11) NOT NULL,
	`payer_email` varchar(255) NOT NULL,
	`publisher_email` varchar(255) NOT NULL,
	`payed` tinyint(4) NOT NULL,
	`success_date` datetime NOT NULL,
	`event` varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`version` int(11) DEFAULT 'NULL',
	`fileName` varchar(256) DEFAULT 'NULL',
	`date` datetime DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `openai_threads` (
	`id` varchar(128) NOT NULL,
	`createdAt` timestamp DEFAULT 'current_timestamp()',
	`updatedAt` timestamp DEFAULT 'current_timestamp()',
	`user_id` int(10) unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pending_transactions` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`state` int(10) NOT NULL,
	`previous` int(10) unsigned DEFAULT 'NULL',
	`type_id` int(10) DEFAULT 'NULL',
	`transaction_link_id` int(10) unsigned DEFAULT 'NULL',
	`amount` decimal(40,20) DEFAULT 'NULL',
	`balance` decimal(40,20) DEFAULT 'NULL',
	`balance_date` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`decay` decimal(40,20) DEFAULT 'NULL',
	`decay_start` datetime(3) DEFAULT 'NULL',
	`memo` varchar(512) NOT NULL,
	`creation_date` datetime(3) DEFAULT 'NULL',
	`user_id` int(10) unsigned NOT NULL,
	`user_gradido_id` char(36) NOT NULL,
	`user_name` varchar(512) DEFAULT 'NULL',
	`user_community_uuid` char(36) NOT NULL,
	`linked_user_id` int(10) unsigned DEFAULT 'NULL',
	`linked_user_gradido_id` char(36) NOT NULL,
	`linked_user_name` varchar(512) DEFAULT 'NULL',
	`linked_user_community_uuid` char(36) NOT NULL,
	`linked_transaction_id` int(10) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `project_brandings` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`alias` varchar(32) NOT NULL,
	`description` text DEFAULT 'NULL',
	`space_id` int(10) unsigned DEFAULT 'NULL',
	`space_url` varchar(255) DEFAULT 'NULL',
	`new_user_to_space` tinyint(1) NOT NULL DEFAULT 0,
	`logo_url` varchar(255) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`previous` int(10) unsigned DEFAULT 'NULL',
	`type_id` int(10) DEFAULT 'NULL',
	`transaction_link_id` int(10) unsigned DEFAULT 'NULL',
	`amount` decimal(40,20) DEFAULT 'NULL',
	`balance` decimal(40,20) DEFAULT 'NULL',
	`balance_date` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`decay` decimal(40,20) DEFAULT 'NULL',
	`decay_start` datetime(3) DEFAULT 'NULL',
	`memo` varchar(512) NOT NULL,
	`creation_date` datetime(3) DEFAULT 'NULL',
	`user_id` int(10) unsigned NOT NULL,
	`user_community_uuid` char(36) DEFAULT 'NULL',
	`user_gradido_id` char(36) NOT NULL,
	`user_name` varchar(512) DEFAULT 'NULL',
	`linked_user_id` int(10) unsigned DEFAULT 'NULL',
	`linked_user_community_uuid` char(36) DEFAULT 'NULL',
	`linked_user_gradido_id` char(36) DEFAULT 'NULL',
	`linked_user_name` varchar(512) DEFAULT 'NULL',
	`linked_transaction_id` int(10) DEFAULT 'NULL',
	CONSTRAINT `previous` UNIQUE(`previous`)
);
--> statement-breakpoint
CREATE TABLE `transaction_links` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`userId` int(10) unsigned NOT NULL,
	`amount` decimal(40,20) NOT NULL,
	`hold_available_amount` decimal(40,20) NOT NULL,
	`memo` varchar(512) NOT NULL,
	`code` varchar(24) NOT NULL,
	`createdAt` datetime NOT NULL,
	`deletedAt` datetime DEFAULT 'NULL',
	`validUntil` datetime NOT NULL,
	`redeemedAt` datetime DEFAULT 'NULL',
	`redeemedBy` int(10) unsigned DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`foreign` tinyint(1) NOT NULL DEFAULT 0,
	`gradido_id` char(36) NOT NULL,
	`community_uuid` varchar(36) DEFAULT 'NULL',
	`alias` varchar(20) DEFAULT 'NULL',
	`email_id` int(10) DEFAULT 'NULL',
	`first_name` varchar(255) DEFAULT 'NULL',
	`last_name` varchar(255) DEFAULT 'NULL',
	`gms_publish_name` int(10) unsigned NOT NULL DEFAULT 0,
	`humhub_publish_name` int(10) unsigned NOT NULL DEFAULT 0,
	`deleted_at` datetime(3) DEFAULT 'NULL',
	`password` bigint(20) unsigned DEFAULT 0,
	`password_encryption_type` int(10) NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`language` varchar(4) NOT NULL DEFAULT '''de''',
	`referrer_id` int(10) unsigned DEFAULT 'NULL',
	`contribution_link_id` int(10) unsigned DEFAULT 'NULL',
	`publisher_id` int(11) DEFAULT 0,
	`hideAmountGDD` tinyint(1) DEFAULT 0,
	`hideAmountGDT` tinyint(1) DEFAULT 0,
	`gms_allowed` tinyint(1) NOT NULL DEFAULT 1,
	`location` geometry DEFAULT 'NULL',
	`gms_publish_location` int(10) unsigned NOT NULL DEFAULT 2,
	`gms_registered` tinyint(1) NOT NULL DEFAULT 0,
	`gms_registered_at` datetime(3) DEFAULT 'NULL',
	`humhub_allowed` tinyint(1) NOT NULL DEFAULT 0,
	CONSTRAINT `uuid_key` UNIQUE(`gradido_id`,`community_uuid`),
	CONSTRAINT `alias_key` UNIQUE(`alias`,`community_uuid`),
	CONSTRAINT `email_id` UNIQUE(`email_id`)
);
--> statement-breakpoint
CREATE TABLE `user_contacts` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`type` varchar(100) NOT NULL,
	`user_id` int(10) unsigned NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verification_code` bigint(20) unsigned DEFAULT 'NULL',
	`email_opt_in_type_id` int(11) DEFAULT 'NULL',
	`email_resend_count` int(11) DEFAULT 0,
	`email_checked` tinyint(4) NOT NULL DEFAULT 0,
	`gms_publish_email` tinyint(1) NOT NULL DEFAULT 0,
	`country_code` varchar(255) DEFAULT 'NULL',
	`phone` varchar(255) DEFAULT 'NULL',
	`gms_publish_phone` int(10) unsigned NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`updated_at` datetime(3) DEFAULT 'NULL',
	`deleted_at` datetime(3) DEFAULT 'NULL',
	CONSTRAINT `email` UNIQUE(`email`),
	CONSTRAINT `email_verification_code` UNIQUE(`email_verification_code`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int(10) unsigned NOT NULL,
	`role` varchar(40) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT 'current_timestamp(3)',
	`updated_at` datetime(3) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE INDEX `idx_public_key` ON `community_handshake_states` (`public_key`);--> statement-breakpoint
CREATE INDEX `user_id` ON `contributions` (`user_id`);--> statement-breakpoint
CREATE INDEX `created_at` ON `contributions` (`created_at`);--> statement-breakpoint
CREATE INDEX `deleted_at` ON `contributions` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `contribution_id` ON `contribution_messages` (`contribution_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `user_roles` (`user_id`);
*/