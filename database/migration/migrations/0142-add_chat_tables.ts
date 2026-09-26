// AI-GENERATED — not an architecture reference
// The chat keeps its messages (first step: storing only; nothing reads them yet).
//
// Every person-to-person message that goes out through "send e-mail" is also filed here, on
// the sending server and on the receiving one. Three tables:
//
// `chat_conversations` - one row per conversation. A direct one (two people) carries
// `direct_pair_key`: both members as `communityUuid/gradidoId`, lower-cased, sorted and joined
// with `|`. Its UNIQUE key is what keeps two first messages written at the same moment from
// opening two conversations for the same pair: the second insert finds the key taken and
// changes nothing. No lock, no transaction. A group (later) has no pair key and names the
// server it lives on in `home_community_uuid`.
//
// `chat_conversation_members` - who takes part, as the uuid PAIR (community + member), never
// `users.id`: a member of another community has no `users` row here, and the pair is what the
// favourites and the member avatars are keyed by as well. The read pointer lives here and not
// on the message (`last_read_message_id`): a message is ONE row per server, whoever it is for
// - in a local conversation both people share that row, and a group of a hundred on this
// server costs one row per message, not a hundred.
//
// `chat_messages` - one row per message and server. `id` is the order of arrival on THIS
// server, and the only order there is: nothing is ever sorted by a sender's clock.
// `message_uuid` is the same on both servers; its UNIQUE key turns a second delivery of the
// same message into the same row. `notify` is what the sender asked for ('email' | 'none'),
// `delivery_state` whether the own copy reached the other server ('delivered' | 'pending' |
// 'failed'). `delay_seconds` stays empty until deliveries are retried (a later step).
//
// No foreign keys, for the reason 0128 and 0137 give: users are soft-deleted, so a cascade
// would never fire - and a pair does not even need a `users` row.
//
// Empty tables and nothing else: no existing row is read or changed. Messages sent before
// this ran exist only in mailboxes.
//
// ⛔ `IF NOT EXISTS`, same reason as 0125..0128: DDL in MySQL and MariaDB does not roll back,
// and `start.sh` has already stopped the services by the time this runs.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      conversation_uuid char(36) NOT NULL,
      kind varchar(16) NOT NULL,
      home_community_uuid char(36) NULL DEFAULT NULL,
      direct_pair_key varchar(150) NULL DEFAULT NULL,
      title varchar(100) NULL DEFAULT NULL,
      created_by_community_uuid char(36) NOT NULL,
      created_by_gradido_id char(36) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY chat_conversations_conversation_uuid_unique (conversation_uuid),
      UNIQUE KEY chat_conversations_direct_pair_key_unique (direct_pair_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_conversation_members (
      conversation_id int(10) unsigned NOT NULL,
      community_uuid char(36) NOT NULL,
      gradido_id char(36) NOT NULL,
      role varchar(16) NOT NULL DEFAULT 'member',
      joined_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      last_read_message_id int(10) unsigned NULL DEFAULT NULL,
      muted_at datetime(3) NULL DEFAULT NULL,
      PRIMARY KEY (conversation_id, community_uuid, gradido_id),
      KEY chat_conversation_members_member_idx (community_uuid, gradido_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      message_uuid char(36) NOT NULL,
      conversation_id int(10) unsigned NOT NULL,
      sender_community_uuid char(36) NOT NULL,
      sender_gradido_id char(36) NOT NULL,
      subject text NULL DEFAULT NULL,
      body text NOT NULL,
      notify varchar(8) NOT NULL,
      delivery_state varchar(16) NOT NULL,
      last_attempt_at datetime(3) NULL DEFAULT NULL,
      delay_seconds int(10) unsigned NULL DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      deleted_at datetime(3) NULL DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY chat_messages_message_uuid_unique (message_uuid),
      KEY chat_messages_conversation_id_idx (conversation_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS chat_messages;')
  await queryFn('DROP TABLE IF EXISTS chat_conversation_members;')
  await queryFn('DROP TABLE IF EXISTS chat_conversations;')
}
