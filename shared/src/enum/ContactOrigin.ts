// AI-GENERATED — not an architecture reference
/**
 * What made two people contacts, where it was not a booking.
 *
 * A contact arises from a shared event (KF-012), and a booking is only one of them. The
 * referral trace -- `users.referrer_id`, written at registration -- is the second: whoever
 * showed somebody Gradido and whoever came over them are contacts of each other from that
 * moment, without anybody adding anyone by hand.
 *
 * The two names are the two DIRECTIONS of the one trace, seen from whoever is asking:
 * `REFERRER` is the person who showed the asking member Gradido, `ARRIVAL` the person who
 * came over them. The words are the ones the tree already uses for the two ends
 * (`dbFindReferrerAlias`, `ShowFriendsArrival`).
 *
 * Absent means "we met over a booking", which is what the list was built on and needs no
 * name of its own.
 *
 * In `shared` because the value is produced in `database` (the contact query) and read in
 * `backend` (the Contact model and the GraphQL enum built from it), and `database` cannot
 * import `backend`. That is the same reason PasswordEncryptionType and OptInType live
 * here; `Order` is the one registered for GraphQL the same way.
 */
export enum ContactOrigin {
  /** This person showed the asking member Gradido: the asking member's `referrer_id`. */
  REFERRER = 'REFERRER',
  /** This person came over the asking member: their `referrer_id` names the asker. */
  ARRIVAL = 'ARRIVAL',
}
