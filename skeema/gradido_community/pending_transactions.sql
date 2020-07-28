CREATE TABLE `pending_transactions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `transactionID` varchar(25) NOT NULL,
  `service` varchar(20) NOT NULL,
  `method` varchar(20) NOT NULL,
  `h_server_id` int NOT NULL,
  `timeout` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionID` (`transactionID`)
) ENGINE=InnoDB;
