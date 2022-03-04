-- phpMyAdmin SQL Dump
-- version 4.6.6deb5
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 12. Nov 2019 um 09:12
-- Server-Version: 10.1.41-MariaDB-0ubuntu0.18.04.1
-- PHP-Version: 7.2.24-0ubuntu0.18.04.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `cake_gradido_single_dev_node`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `operators`
--

CREATE TABLE `operators` (
  `id` int(11) NOT NULL,
  `username` varchar(50) COLLATE utf8_bin NOT NULL,
  `user_pubkey` binary(32) NOT NULL,
  `data_base64` varchar(255) COLLATE utf8_bin NOT NULL,
  `modified` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `operator_types`
--

CREATE TABLE `operator_types` (
  `id` int(11) NOT NULL,
  `name` varchar(25) COLLATE utf8_bin NOT NULL,
  `text` varchar(255) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Daten für Tabelle `operator_types`
--

INSERT INTO `operator_types` (`id`, `name`, `text`) VALUES
(1, 'hedera', 'Hedera Keys for sign and pay hedera transactions'),
(2, 'gradido-user', 'default gradido user keys'),
(3, 'gradido-group', 'default gradido group root keys, other address are derived');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `pending_transactions`
--

CREATE TABLE `pending_transactions` (
  `id` int(11) NOT NULL,
  `transactionID` varchar(25) COLLATE utf8_bin NOT NULL,
  `service` varchar(20) COLLATE utf8_bin NOT NULL,
  `method` varchar(20) COLLATE utf8_bin NOT NULL,
  `h_server_id` int(11) NOT NULL,
  `timeout` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `server_users`
--

CREATE TABLE `server_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) COLLATE utf8_bin NOT NULL,
  `password` varchar(255) COLLATE utf8_bin NOT NULL,
  `email` varchar(50) COLLATE utf8_bin NOT NULL,
  `role` varchar(20) COLLATE utf8_bin NOT NULL DEFAULT 'admin',
  `activated` tinyint(1) NOT NULL DEFAULT '0',
  `last_login` datetime DEFAULT NULL,
  `created` datetime NOT NULL,
  `modified` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_balances`
--

CREATE TABLE `state_balances` (
  `id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `modified` datetime NOT NULL,
  `amount` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_created`
--

CREATE TABLE `state_created` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `year` smallint(6) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `short_ident_hash` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_errors`
--

CREATE TABLE `state_errors` (
  `id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `transaction_type_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `message_json` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_group_addresses`
--

CREATE TABLE `state_group_addresses` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `public_key` binary(32) NOT NULL,
  `address_type_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_group_relationships`
--

CREATE TABLE `state_group_relationships` (
  `id` int(11) NOT NULL,
  `group1_id` int(11) NOT NULL,
  `group2_id` int(11) NOT NULL,
  `state_relationship_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_relationship_types`
--

CREATE TABLE `state_relationship_types` (
  `id` int(11) NOT NULL,
  `name` varchar(25) COLLATE utf8_bin NOT NULL,
  `text` varchar(255) COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `state_users`
--

CREATE TABLE `state_users` (
  `id` int(11) NOT NULL,
  `index_id` smallint(6) NOT NULL,
  `group_id` int(11) NOT NULL,
  `public_key` binary(32) NOT NULL,
  `email` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transactions`
--

CREATE TABLE `transactions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `transaction_type_id` int(11) NOT NULL,
  `tx_hash` binary(32) NOT NULL,
  `memo` varchar(255) COLLATE utf8_bin NOT NULL,
  `received` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_creations`
--

CREATE TABLE `transaction_creations` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `ident_hash` binary(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_group_addaddress`
--

CREATE TABLE `transaction_group_addaddress` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `address_type_id` int(11) NOT NULL,
  `public_key` binary(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_group_allowtrades`
--

CREATE TABLE `transaction_group_allowtrades` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `remote_group_id` varbinary(64) NOT NULL,
  `allow` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_group_creates`
--

CREATE TABLE `transaction_group_creates` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `group_public_key` binary(32) NOT NULL,
  `group_id` varchar(64) COLLATE utf8_bin NOT NULL,
  `name` varchar(64) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_send_coins`
--

CREATE TABLE `transaction_send_coins` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `state_user_id` int(11) NOT NULL,
  `receiver_public_key` binary(32) NOT NULL,
  `receiver_user_id` varbinary(64) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `sender_final_balance` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_signatures`
--

CREATE TABLE `transaction_signatures` (
  `id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `signature` binary(64) NOT NULL,
  `pubkey` binary(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `transaction_types`
--

CREATE TABLE `transaction_types` (
  `id` int(11) NOT NULL,
  `name` varchar(24) COLLATE utf8_bin NOT NULL,
  `text` varchar(255) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Daten für Tabelle `transaction_types`
--

INSERT INTO `transaction_types` (`id`, `name`, `text`) VALUES
(1, 'creation', 'Aktives oder Bedingsungsloses Grundeinkommen.'),
(2, 'transfer', 'Einfache Überweisung');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `operators`
--
ALTER TABLE `operators`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `operator_types`
--
ALTER TABLE `operator_types`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `pending_transactions`
--
ALTER TABLE `pending_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transactionID` (`transactionID`);

--
-- Indizes für die Tabelle `server_users`
--
ALTER TABLE `server_users`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_balances`
--
ALTER TABLE `state_balances`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_created`
--
ALTER TABLE `state_created`
  ADD PRIMARY KEY (`id`),
  ADD KEY `short_ident_hash` (`short_ident_hash`);

--
-- Indizes für die Tabelle `state_errors`
--
ALTER TABLE `state_errors`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_group_addresses`
--
ALTER TABLE `state_group_addresses`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_group_relationships`
--
ALTER TABLE `state_group_relationships`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_relationship_types`
--
ALTER TABLE `state_relationship_types`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `state_users`
--
ALTER TABLE `state_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `public_key` (`public_key`);

--
-- Indizes für die Tabelle `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_creations`
--
ALTER TABLE `transaction_creations`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_group_addaddress`
--
ALTER TABLE `transaction_group_addaddress`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_group_allowtrades`
--
ALTER TABLE `transaction_group_allowtrades`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_group_creates`
--
ALTER TABLE `transaction_group_creates`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_send_coins`
--
ALTER TABLE `transaction_send_coins`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_signatures`
--
ALTER TABLE `transaction_signatures`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `transaction_types`
--
ALTER TABLE `transaction_types`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `operators`
--
ALTER TABLE `operators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `operator_types`
--
ALTER TABLE `operator_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT für Tabelle `pending_transactions`
--
ALTER TABLE `pending_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `server_users`
--
ALTER TABLE `server_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT für Tabelle `state_balances`
--
ALTER TABLE `state_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT für Tabelle `state_created`
--
ALTER TABLE `state_created`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `state_errors`
--
ALTER TABLE `state_errors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `state_group_addresses`
--
ALTER TABLE `state_group_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `state_group_relationships`
--
ALTER TABLE `state_group_relationships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `state_relationship_types`
--
ALTER TABLE `state_relationship_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `state_users`
--
ALTER TABLE `state_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT für Tabelle `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT für Tabelle `transaction_creations`
--
ALTER TABLE `transaction_creations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
--
-- AUTO_INCREMENT für Tabelle `transaction_group_addaddress`
--
ALTER TABLE `transaction_group_addaddress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `transaction_group_allowtrades`
--
ALTER TABLE `transaction_group_allowtrades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `transaction_group_creates`
--
ALTER TABLE `transaction_group_creates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `transaction_send_coins`
--
ALTER TABLE `transaction_send_coins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT für Tabelle `transaction_signatures`
--
ALTER TABLE `transaction_signatures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT für Tabelle `transaction_types`
--
ALTER TABLE `transaction_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
