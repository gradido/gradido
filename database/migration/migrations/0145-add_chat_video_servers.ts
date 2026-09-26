// AI-GENERATED — not an architecture reference
// `chat_video_servers`: the Jitsi servers the chat's video calls take a room from (V3, E-035),
// kept by an administrator on the admin page "Chat".
//
// Until now the list came from the server's configuration (CHAT_VIDEO_SERVERS) or, where that is
// empty, from the default list in the backend's code. From here on the table is the list. The
// backend fills it once at its start while it is empty -- from CHAT_VIDEO_SERVERS, else from the
// default list -- and after that reads only the table. No rows here: what goes in is decided by
// the configuration of the server the backend starts on, which this migration cannot see.
//
// `base_url` is the base address as the backend builds it (https, ending in '/'), UNIQUE so that
// one server cannot be entered twice. `operator` is who runs it, as its imprint names them;
// `room_prefix` what every room name there starts with (letters and digits; NULL for none);
// `note` the administrator's remark. `active` is the tick "in the random choice": every row is
// checked, only the active ones are handed out -- so an administrator sees whether a server they
// switched off answers again.
//
// What the checks find (answers or not, why, when, how fast, how many invitations) is not kept
// here: it is the view of the running process and starts afresh with it.
//
// No foreign keys: the table names nothing but itself.
//
// `IF NOT EXISTS`, same reason as 0142: DDL does not roll back, and start.sh has already stopped
// the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_video_servers (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      base_url varchar(255) NOT NULL,
      operator varchar(120) NULL DEFAULT NULL,
      room_prefix varchar(40) NULL DEFAULT NULL,
      note varchar(255) NULL DEFAULT NULL,
      active tinyint(1) NOT NULL DEFAULT 1,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY chat_video_servers_base_url_unique (base_url)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS chat_video_servers;')
}
