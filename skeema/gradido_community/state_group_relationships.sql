CREATE TABLE `state_group_relationships` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `group1_id` int UNSIGNED NOT NULL,
  `group2_id` int UNSIGNED NOT NULL,
  `state_relationship_id` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
