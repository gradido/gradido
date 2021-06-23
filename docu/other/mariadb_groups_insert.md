# Das Locale Schöpfen

### MariaDB Insert Groups 

wenn local geschöpft werden möchte kommt ein fehler das der user keiner gruppe zugeordnet ist. 

folgende schritte musst du machen um eine gruppe anzulegen 

hier findest du den Mysql befehl: configs/login_server/setup_db_tables/setup_docker_group.sql
in der Datei findest du folgenden Befehl 

      INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `host`, `home`, `description`) VALUES
      (1, 'docker', 'docker gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2 with blockchain db');

# Ablauf 

1. logge dich bei phpmyadmin ein http://localhost:8074/  (mariadb / root)
2. gehe auf tabelle "gradido_login"
3. gib folgenden Befehl in die console ein 
    
      INSERT INTO `groups` (`id`, `alias`, `name`, `url`, `host`, `home`, `description`) VALUES
      (1, 'docker', 'docker gradido group', 'localhost', 'nginx', '/', 'gradido test group for docker and stage2 with blockchain db');

> es wird eine Gruppe mit id 1 angelgt. alle angelegten user sollten dieser gruppe zugeordnet sein. 

das schöpfen sollte nun local funktionieren. :) 



#ACHTUNG ! nach dem login  kann noch zu fehlern kommen in der URL "localhostnginx/..." zu "localhost/..." ändern