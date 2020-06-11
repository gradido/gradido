CREATE TABLE `state_errors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state_user_id` int(11) NOT NULL,
  `transaction_type_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `message_json` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
