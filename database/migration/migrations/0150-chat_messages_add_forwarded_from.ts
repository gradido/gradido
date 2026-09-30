// AI-GENERATED — not an architecture reference
// Who wrote a forwarded message first (Bernd, 30.09.2026, E-059): the copy a member forwards into
// another conversation carries the pair of its first writer -- community and gradido id --, and
// the thread says "Weitergeleitet von [Nutzername]" over it. Through several forwardings the first
// writer stays: a copy of a copy names who wrote the words, not who passed them on.
//
// Both NULL for every other message, and that is the sentence every existing row needs: nothing
// was forwarded before. Both set, or neither (storeChatMessage, storeChatGroupMessage).
//
// `IF NOT EXISTS`: DDL does not roll back, and start.sh has already stopped the services.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` ADD COLUMN IF NOT EXISTS `forwarded_from_community_uuid` char(36) NULL DEFAULT NULL AFTER `body`, ADD COLUMN IF NOT EXISTS `forwarded_from_gradido_id` char(36) NULL DEFAULT NULL AFTER `forwarded_from_community_uuid`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `chat_messages` DROP COLUMN IF EXISTS `forwarded_from_gradido_id`, DROP COLUMN IF EXISTS `forwarded_from_community_uuid`;',
  )
}
