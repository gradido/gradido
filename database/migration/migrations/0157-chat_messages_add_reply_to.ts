// AI-GENERATED — not an architecture reference
// The message a message answers (Bernd, 09.10.2026): a member may answer one particular message
// of a conversation, and the thread shows the answered one as a quotation over the answer -- a
// press on it goes to the message itself.
//
// One column: the answered message's uuid, which is the same on both servers of a message that
// crossed the border. The quotation is read from the answered message when the thread is shown,
// nothing of it is copied: a message changed later is quoted as it stands.
//
// NULL for every other message, and that is the sentence every existing row needs: nothing was
// answered before.
//
// No index: a message is never looked up by what it answers; the quoted ones are read by their
// own uuid, which has its unique key.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back, and start.sh has already stopped the
// services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` ADD COLUMN IF NOT EXISTS `reply_to_message_uuid` char(36) NULL DEFAULT NULL AFTER `forwarded_from_gradido_id`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `chat_messages` DROP COLUMN IF EXISTS `reply_to_message_uuid`;')
}
