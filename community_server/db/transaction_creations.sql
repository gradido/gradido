
CREATE TABLE `transaction_creations` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `ident_hash` binary(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

