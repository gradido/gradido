// AI-GENERATED — not an architecture reference
// Whether other members may see this member's picture next to a shared booking.
//
// Its own column rather than a reuse of gms_allowed or humhub_allowed: those say that a
// member lets their data travel to a foreign system. This one says nothing about a
// foreign system at all -- it names WHO gets to look, and that is a different question.
//
// DEFAULT 1, and that carries two decisions at once (Avatar-Sichtbarkeit AS-003/AS-007):
// new accounts start visible, and so do the accounts that already uploaded a picture.
// The latter is only defensible because the avatar has not been in production yet, so
// nobody is being exposed who was not asked -- there is nobody to expose. A later switch
// of this kind would need the opposite default.
//
// NOT NULL because there is no third state: a member either shows the picture or does
// not. A nullable column would invite "not decided yet" and every reader would have to
// invent what that means.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `avatar_visible_to_members` tinyint(1) NOT NULL DEFAULT 1 AFTER `about_me`;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `users` DROP COLUMN IF EXISTS `avatar_visible_to_members`;')
}
