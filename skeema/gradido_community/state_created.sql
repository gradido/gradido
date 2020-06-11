CREATE TABLE `state_created` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `year` smallint(6) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `short_ident_hash` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `short_ident_hash` (`short_ident_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
