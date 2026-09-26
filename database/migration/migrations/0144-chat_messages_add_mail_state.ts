// AI-GENERATED — not an architecture reference
// `chat_messages.mail_state`: what became of the mail about a message, as far as its sender may
// know it (E-034) -- 'mailed' (a mail went out) or 'muted' (a mail was asked for, and the
// recipient has muted the conversation, E-024).
//
// NULL means no mail was asked for, or it is not known: every row from before this migration,
// and every message to a server from before it, which answers without saying. Nothing is filled
// in afterwards -- what became of an earlier mail cannot be found out now.
//
// Written on the row the sender reads -- in a conversation within one community the row both
// members read -- and handed out to the sender alone (ChatMessage.mailState). A server that
// receives a message from another community leaves it empty on its own copy.
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` ADD COLUMN IF NOT EXISTS `mail_state` varchar(8) NULL DEFAULT NULL AFTER `notify`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `chat_messages` DROP COLUMN IF EXISTS `mail_state`;')
}
