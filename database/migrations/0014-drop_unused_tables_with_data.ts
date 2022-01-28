/* MIGRATION TO DROP UNUSED TABLES
 *
 * This migration removes all tables with static or unused data and entity definition.
 * Base for evaluation are the production data from 27.01.2022 which had 28 tables present
 * The migration reduces the amount of tables to 16
 */

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE \`address_types\`;`)
  await queryFn(`DROP TABLE \`admin_errors\`;`)
  await queryFn(`DROP TABLE \`blockchain_types\`;`)
  await queryFn(`DROP TABLE \`community_profiles\`;`)
  await queryFn(`DROP TABLE \`login_email_opt_in_types\`;`)
  await queryFn(`DROP TABLE \`login_groups\`;`)
  await queryFn(`DROP TABLE \`login_roles\`;`)
  await queryFn(`DROP TABLE \`login_user_roles\`;`)
  await queryFn(`DROP TABLE \`operators\`;`)
  await queryFn(`DROP TABLE \`operator_types\`;`)
  await queryFn(`DROP TABLE \`state_errors\`;`)
  await queryFn(`DROP TABLE \`transaction_types\`;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE \`address_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`address_types\` VALUES
      (1,'user main','user main address');
  `)

  await queryFn(`
    CREATE TABLE \`admin_errors\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(11) NOT NULL,
      \`controller\` varchar(255) NOT NULL,
      \`action\` varchar(255) NOT NULL,
      \`state\` varchar(255) NOT NULL,
      \`msg\` varchar(255) NOT NULL,
      \`details\` varchar(255) DEFAULT NULL,
      \`created\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4;
  `)
  // NOTE: This data is no longer generated
  await queryFn(`
    INSERT INTO \`admin_errors\` VALUES
      (54,272,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2020-11-04 17:57:07'),
      (55,272,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2020-11-04 17:57:16'),
      (56,193,'StateBalancesController','overview','error','server response status code isn\\'t 200','403','2020-11-24 12:44:31'),
      (57,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2020-12-31 19:17:52'),
      (58,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2020-12-31 19:18:04'),
      (59,44,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-12 20:58:45'),
      (60,44,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-12 21:02:02'),
      (61,44,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-12 21:02:04'),
      (62,44,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-12 21:02:19'),
      (63,20,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-13 22:32:59'),
      (64,20,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-14 23:54:19'),
      (65,161,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-27 10:29:09'),
      (66,161,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-27 10:29:11'),
      (67,161,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-01-27 10:29:23'),
      (68,20,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-02-03 00:27:36'),
      (69,685,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-02-06 11:48:09'),
      (70,685,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-02-06 11:53:14'),
      (71,685,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-02-06 11:53:20'),
      (72,502,'TransactionCreations','createMulti','error','json exception','System exception: cannot unlock mutex','2021-03-24 21:22:14'),
      (73,502,'TransactionCreations','createMulti','error','json exception','System exception: cannot unlock mutex','2021-03-24 21:23:38'),
      (74,259,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-02 15:07:07'),
      (75,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 20:31:50'),
      (76,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 20:31:57'),
      (77,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 20:32:23'),
      (78,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 20:32:57'),
      (79,199,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 21:43:13'),
      (80,199,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 21:43:47'),
      (81,199,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 21:44:45'),
      (82,272,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 22:57:10'),
      (83,272,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-14 22:57:18'),
      (84,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:50:53'),
      (85,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:51:27'),
      (86,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:51:32'),
      (87,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:51:54'),
      (88,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:52:29'),
      (89,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:53:33'),
      (90,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-21 12:53:37'),
      (91,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-23 12:27:57'),
      (92,1162,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-23 12:28:02'),
      (93,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 18:59:08'),
      (94,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 18:59:16'),
      (95,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 18:59:27'),
      (96,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 19:00:51'),
      (97,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 19:01:18'),
      (98,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 19:04:22'),
      (99,900,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 19:04:39'),
      (100,1087,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-27 19:43:18'),
      (101,240,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-28 22:00:05'),
      (102,240,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-28 22:00:35'),
      (103,240,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-28 22:00:37'),
      (104,240,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-28 22:00:44'),
      (105,90,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-29 14:05:59'),
      (106,90,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-29 14:06:07'),
      (107,90,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-29 14:06:15'),
      (108,90,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-04-29 14:07:13'),
      (109,79,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-01 10:18:03'),
      (110,20,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-08 00:25:20'),
      (111,84,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-08 22:34:27'),
      (112,84,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-08 22:35:47'),
      (113,776,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-12 10:24:55'),
      (114,776,'TransactionSendCoins','create','success','(Leere Message)','(Leere Details)','2021-05-13 13:47:07'),
      (115,1339,'StateBalancesController','overview','success','(Leere Message)','(Leere Details)','2021-07-13 08:54:30'),
      (116,1339,'StateBalancesController','overview','success','(Leere Message)','(Leere Details)','2021-07-13 08:54:30'),
      (117,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:46:40'),
      (118,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:05'),
      (119,943,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:05'),
      (120,751,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:20'),
      (121,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:21'),
      (122,943,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:21'),
      (123,751,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:22'),
      (124,751,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:22'),
      (125,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:36'),
      (126,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:43'),
      (127,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:43'),
      (128,11,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:43'),
      (129,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:46'),
      (130,943,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:47:46'),
      (131,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:48:47'),
      (132,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:48:52'),
      (133,11,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:48:52'),
      (134,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:49:24'),
      (135,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:49:26'),
      (136,943,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:49:26'),
      (137,751,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:49:58'),
      (138,751,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:50:00'),
      (139,751,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:50:00'),
      (140,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:50:57'),
      (141,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:51:01'),
      (142,943,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:51:02'),
      (143,11,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-08-12 14:51:10'),
      (144,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:51:10'),
      (145,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:52:39'),
      (146,943,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:52:44'),
      (147,82,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:54:25'),
      (148,284,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-08-12 14:54:35'),
      (149,1439,'StateBalancesController','overview','success','(Leere Message)','(Leere Details)','2021-09-16 15:44:16'),
      (150,1439,'StateBalancesController','overview','success','(Leere Message)','(Leere Details)','2021-09-16 15:44:27'),
      (151,11,'StateBalancesController','overview','error','server response status code isn\\'t 200','500','2021-09-22 11:03:10'),
      (152,11,'StateBalancesController','ajaxGdtOverview','error','server response status code isn\\'t 200','500','2021-09-22 11:16:33'),
      (153,82,'StateBalancesController','overview','error','server response status code isn\\'t 200','403','2021-11-23 16:03:57'),
      (154,82,'StateBalancesController','overview','error','server response status code isn\\'t 200','403','2021-11-23 16:04:10');
  `)

  await queryFn(`
    CREATE TABLE \`blockchain_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      \`symbol\` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`blockchain_types\` VALUES
      (1,'mysql','use mysql db as blockchain, work only with single community-server',NULL),
      (2,'hedera','use hedera for transactions','HBAR');
  `)

  await queryFn(`
    CREATE TABLE \`community_profiles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`profile_img\` longblob DEFAULT NULL,
      \`profile_desc\` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`state_user_id\` (\`state_user_id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: The data was removed due to large binary images in the database. If this data is needed please get it from the backup file.

  await queryFn(`
    CREATE TABLE \`login_email_opt_in_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`description\` varchar(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`login_email_opt_in_types\` VALUES
      (1,'register','Email Verification Code for register from new User.'),
      (2,'resetPassword','Email Verification Code for reset Password (only if passphrase is known)');
  `)

  await queryFn(`
    CREATE TABLE \`login_groups\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`alias\` varchar(190) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`url\` varchar(255) NOT NULL,
      \`host\` varchar(255) DEFAULT '/',
      \`home\` varchar(255) DEFAULT '/',
      \`description\` text DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`alias\` (\`alias\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`login_groups\` VALUES
      (1,'gdd1','gdd1','gdd1.gradido.com','','/','gdd1 group');
  `)

  await queryFn(`
    CREATE TABLE \`login_roles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`description\` varchar(255) NOT NULL,
      \`flags\` bigint(20) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`login_roles\` VALUES
      (1,'admin','darf einfach alles',0);
  `)

  await queryFn(`
    CREATE TABLE \`login_user_roles\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`user_id\` int(11) NOT NULL,
      \`role_id\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
  `)
  // NOTE: This data is not used - therefore we remove it.
  //       This data is aligned to the `server_users` table except the entry 4,
  //       this one is missing in the other table
  //       and after checking with administration, we figured out that
  //       this is a data fragement no longer needed.
  await queryFn(`
    INSERT INTO \`login_user_roles\` VALUES
      (1,28,1),
      (2,37,1),
      (3,50,1),
      (4,44,1),
      (5,872,1);
  `)

  await queryFn(`
    CREATE TABLE \`operators\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`user_pubkey\` binary(32) NOT NULL,
      \`data_base64\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`modified\` datetime NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: This data seems not to have any use
  await queryFn(`
    INSERT INTO \`operators\` VALUES
      (5,'einhornimmond',0x78DCFAA8341B3A39B3C5502B4D9ACDBC4B181A10CC0D94187498E0A0C74288E0,'i99a5/wWGmQN4AF8ilUXhHJVV/3At82f6CNNh3ewdVyTTAqugcdeG53DEMNUxCTFwk7KIg==','2019-09-17 13:08:22');
  `)

  await queryFn(`
    CREATE TABLE \`operator_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`operator_types\` VALUES
      (1,'hedera','Hedera Keys for sign and pay hedera transactions'),
      (2,'gradido-user','default gradido user keys'),
      (3,'gradido-group','default gradido group root keys, other address are derived');
  `)

  await queryFn(`
    CREATE TABLE \`state_errors\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`state_user_id\` int(10) unsigned NOT NULL,
      \`transaction_type_id\` int(10) unsigned NOT NULL,
      \`created\` datetime NOT NULL,
      \`message_json\` text COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: This data is no longer generated
  await queryFn(`
    INSERT INTO \`state_errors\` VALUES
      (9,11,1,'2020-08-07 10:40:03','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (17,528,2,'2021-02-10 08:04:32','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"sender 0 hasn\\'t enough GDD"}]}'),
      (115,82,1,'2021-09-01 11:14:25','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (119,82,1,'2021-09-06 18:55:55','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (138,502,1,'2021-10-31 00:00:32','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (139,502,1,'2021-11-02 19:50:36','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (140,502,1,'2021-11-07 13:32:11','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (141,502,1,'2021-11-16 22:04:59','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (142,502,1,'2021-11-21 23:47:14','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (143,502,1,'2021-11-22 00:14:40','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (144,502,1,'2021-11-25 21:40:15','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (145,502,1,'2021-11-25 22:45:06','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (146,502,1,'2021-11-29 12:52:12','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (147,502,1,'2021-12-04 01:56:10','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (148,502,1,'2021-12-06 13:12:08','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (149,502,1,'2021-12-06 13:18:20','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (150,502,1,'2021-12-16 21:06:34','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (151,502,1,'2021-12-20 23:11:44','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (152,502,1,'2022-01-04 13:19:31','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (153,502,1,'2022-01-04 13:54:33','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (154,502,1,'2022-01-04 13:55:32','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (155,502,1,'2022-01-04 14:02:35','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (156,502,1,'2022-01-04 14:50:49','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (157,502,1,'2022-01-04 14:51:41','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (158,502,1,'2022-01-19 00:32:46','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (159,502,1,'2022-01-19 00:52:42','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}'),
      (160,502,1,'2022-01-25 08:31:57','{"state":"error","msg":"error validate transaction","details":[{"TransactionCreation::validate":"Creation more than 1.000 GDD per Month for  in target_date not allowed"}]}');
  `)

  await queryFn(`
    CREATE TABLE \`transaction_types\` (
      \`id\` int(10) unsigned NOT NULL AUTO_INCREMENT,
      \`name\` varchar(90) COLLATE utf8mb4_unicode_ci NOT NULL,
      \`text\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  // NOTE: Static data might be needed as enum definitions
  await queryFn(`
    INSERT INTO \`transaction_types\` VALUES
      (1,'creation','create new gradidos for member and also for group (in development)'),
      (2,'transfer','send gradidos from one member to another, also cross group transfer'),
      (3,'group create','create a new group, trigger creation of new hedera topic and new blockchain on node server'),
      (4,'group add member','add user to a group or move if he was already in a group'),
      (5,'group remove member','remove user from group, maybe he was moved elsewhere'),
      (6,'hedera topic create','create new topic on hedera'),
      (7,'hedera topic send message','send consensus message over hedera topic'),
      (8,'hedera account create','create new account on hedera for holding some founds with unencrypted keys'),
      (9,'decay start','signalize the starting point for decay calculation, allowed only once per chain');
  `)
}
