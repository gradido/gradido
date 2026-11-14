// AI-GENERATED — not an architecture reference
// Support requests (SUA-001): a member asks the support of their community, in the wallet, and
// the moderators answer in the admin. A request has the shape of a contribution with its thread
// and tables of its own; `contributions` and `contribution_messages` stay as they are.
//
// `support_tickets`, one row for a request:
//
//   user_id            the member who asks.
//   creation_group_id  the creation group whose moderators read it; NULL for the community's
//                      support as a whole. One group per request: passing it on (K4) sets it anew.
//   text               the request, at most MESSAGE_MAX_CHARS (shared); a `text` holds it.
//   status             OPEN, IN_PROGRESS (a question back to the member), CLOSED or DELETED.
//   resubmission_at    the moderation's reminder (K4).
//   closed_at, closed_by    when and by whom it was closed: the member or a moderator.
//   deleted_at, deleted_by  the moderation's soft delete.
//
// `support_ticket_messages`, one row for a message of a request's thread, in the shape of
// `contribution_messages`: DIALOG between member and moderation, MODERATOR for the moderation's
// internal note; `ai_model` names the language model whose words a message carries (S2).
//
// Every column the later deliveries use is here already, so none of them needs a migration.
// No foreign key, as for user_remarks (0168): users are soft-deleted, and creation groups are
// never deleted.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      user_id int(10) unsigned NOT NULL,
      creation_group_id int(10) unsigned NULL DEFAULT NULL,
      text text NOT NULL,
      status varchar(12) NOT NULL DEFAULT 'OPEN',
      resubmission_at datetime(3) NULL DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      closed_at datetime(3) NULL DEFAULT NULL,
      closed_by int(10) unsigned NULL DEFAULT NULL,
      deleted_at datetime(3) NULL DEFAULT NULL,
      deleted_by int(10) unsigned NULL DEFAULT NULL,
      PRIMARY KEY (id),
      KEY support_tickets_user_id_idx (user_id, id),
      KEY support_tickets_status_idx (status, id),
      KEY support_tickets_creation_group_id_idx (creation_group_id, status, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id int(10) unsigned NOT NULL AUTO_INCREMENT,
      support_ticket_id int(10) unsigned NOT NULL,
      user_id int(10) unsigned NOT NULL,
      message text NOT NULL,
      type varchar(12) NOT NULL DEFAULT 'DIALOG',
      is_moderator tinyint(1) NOT NULL DEFAULT 0,
      ai_model varchar(64) NULL DEFAULT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY support_ticket_messages_support_ticket_id_idx (support_ticket_id, id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('DROP TABLE IF EXISTS support_ticket_messages;')
  await queryFn('DROP TABLE IF EXISTS support_tickets;')
}
