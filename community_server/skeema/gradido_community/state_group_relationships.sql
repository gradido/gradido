CREATE TABLE `state_group_relationships` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `group1_id` int(10) unsigned NOT NULL,
  `group2_id` int(10) unsigned NOT NULL,
  `state_relationship_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
