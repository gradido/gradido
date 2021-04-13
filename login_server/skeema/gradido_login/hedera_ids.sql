CREATE TABLE `hedera_ids` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shardNum` bigint NOT NULL DEFAULT '0',
  `realmNum` bigint NOT NULL DEFAULT '0',
  `num` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 