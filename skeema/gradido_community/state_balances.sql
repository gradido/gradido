CREATE TABLE `state_balances` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_user_id` int UNSIGNED NOT NULL,
  `modified` datetime NOT NULL,
  `amount` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
