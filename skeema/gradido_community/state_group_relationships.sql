CREATE TABLE `state_group_relationships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group1_id` int(11) NOT NULL,
  `group2_id` int(11) NOT NULL,
  `state_relationship_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
