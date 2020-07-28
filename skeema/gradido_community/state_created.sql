CREATE TABLE `state_created` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` int UNSIGNED NOT NULL,
  `month` tinyint UNSIGNED NOT NULL,
  `year` smallint UNSIGNED NOT NULL,
  `state_user_id` int UNSIGNED NOT NULL,
  `created` datetime NOT NULL,
  `short_ident_hash` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `short_ident_hash` (`short_ident_hash`)
) ENGINE=InnoDB;
