CREATE TABLE `pending_transactions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `transactionID` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `h_server_id` int(11) NOT NULL,
  `timeout` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionID` (`transactionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
