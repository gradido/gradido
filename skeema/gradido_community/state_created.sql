CREATE TABLE `state_created` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int(10) unsigned NOT NULL,
  `month` tinyint(3) unsigned NOT NULL,
  `year` smallint(5) unsigned NOT NULL,
  `state_user_id` int(10) unsigned NOT NULL,
  `created` datetime NOT NULL,
  `short_ident_hash` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `short_ident_hash` (`short_ident_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
