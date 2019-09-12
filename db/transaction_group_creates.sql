
CREATE TABLE `transaction_group_creates` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `group_public_key` binary(32) NOT NULL,
  `state_group_id` int(11) COLLATE utf8_bin NOT NULL,
  `name` varchar(64) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
