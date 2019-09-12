CREATE TABLE `state_balances` (
  `id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `modified` datetime NOT NULL,
  `amount` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;