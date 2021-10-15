CREATE TABLE `elopage_buys` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `elopage_user_id` int DEFAULT NULL,
  `affiliate_program_id` int NOT NULL,
  `publisher_id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_price` int NOT NULL,
  `payer_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `publisher_email` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `payed` tinyint NOT NULL,
  `success_date` datetime NOT NULL,
  `event` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
