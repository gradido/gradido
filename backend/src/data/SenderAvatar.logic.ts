// AI-GENERATED — not an architecture reference
import { PictureLinkState, pictureLinkIsOpen } from './ThankYouGreetingPicture.logic'

/**
 * Who gets the face of the member who made a transaction link, on the page of that link
 * (queryTransactionLink, ZE-038):
 *
 * | the link is …                            | the face goes to …                               |
 * | ---------------------------------------- | ------------------------------------------------ |
 * | open (not deleted, accepted or run out)  | whoever holds its code, signed in or not, where  |
 * |                                          | the member shows their face to other members     |
 * | accepted, run out or deleted             | nobody                                           |
 *
 * And where the account of the member who made the link is deleted, nobody either. That case
 * does not reach this rule today: queryTransactionLink reads the member without the deleted
 * ones and answers with an error, so the page of such a link opens no more. `makerDeletedAt`
 * keeps the rule in the form of pictureRenditionsForCodeHolder, the rule of the photo of a
 * greeting, which reads the same link the same way.
 *
 * ⛔ The member's switch ("my picture for other members", avatarVisibleToMembers) is not read
 * here. It stands in the query that hands the picture out (mayBeShownToMembers in
 * dbFindMemberAvatarsSmall), together with "not deleted" and "not of another community": one
 * guard for every way a face of a member goes to somebody else. This rule reads the link alone.
 *
 * ⚠️ The switch speaks of other members; on the page of a link it also lets the face go to
 * the one the member handed the code to, a member or not yet one. That is a decision
 * (ZE-038), not a reading of the switch: the code is the member's own handing over, as the
 * printed cheque of the same link, which carries the same face.
 *
 * A plain function without a database, so that every row has a test of its own.
 */
export const showsSenderAvatar = (
  link: PictureLinkState,
  makerDeletedAt: Date | null,
  now: Date,
): boolean => makerDeletedAt === null && pictureLinkIsOpen(link, now)

/**
 * How many faces of members who made a link one HTTP request is handed by
 * queryTransactionLink, over every alias of the query (RequestBudget): as many as pictures of
 * thank-you greetings (THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST), each up to
 * AVATAR_SMALL_MAX_BYTES. The page of a link asks for one. Past the cap the link comes
 * without its face rather than with an error: the face is one part of the answer, the link
 * is the rest of it.
 */
export const SENDER_AVATARS_MAX_PER_REQUEST = 10
