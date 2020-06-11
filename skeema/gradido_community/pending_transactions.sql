CREATE TABLE `pending_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transactionID` varchar(25) COLLATE utf8_bin NOT NULL,
  `service` varchar(20) COLLATE utf8_bin NOT NULL,
  `method` varchar(20) COLLATE utf8_bin NOT NULL,
  `h_server_id` int(11) NOT NULL,
  `timeout` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionID` (`transactionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
