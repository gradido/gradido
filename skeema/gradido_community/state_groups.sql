CREATE TABLE `state_groups` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `index_id` varbinary(64) NOT NULL,
  `name` varchar(50) NOT NULL,
  `root_public_key` binary(32) NOT NULL,
  `user_count` smallint UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
