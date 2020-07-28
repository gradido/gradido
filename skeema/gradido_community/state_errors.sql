CREATE TABLE `state_errors` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_user_id` int UNSIGNED NOT NULL,
  `transaction_type_id` int UNSIGNED NOT NULL,
  `created` datetime NOT NULL,
  `message_json` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
