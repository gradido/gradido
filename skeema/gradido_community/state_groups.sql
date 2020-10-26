CREATE TABLE `state_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `index_id` varbinary(64) NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `root_public_key` binary(32) NOT NULL,
  `user_count` smallint(5) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
