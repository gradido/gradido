// AI-GENERATED — not an architecture reference
import {
  ThankYouGreetingPictureInfo,
  ThankYouGreetingPictureLink,
  ThankYouGreetingPictureRendition,
  ThankYouGreetingPicturesOfLink,
} from 'database'

/**
 * Who gets the picture of a thank-you greeting that carries a photo of the member's own, and
 * which rendition (ZE-019):
 *
 * | the link is …                            | the picture goes to …                    | rendition              |
 * | ---------------------------------------- | ---------------------------------------- | ---------------------- |
 * | open (not deleted, accepted or run out)  | whoever holds its code, signed in or not | large, else small      |
 * |                                          | the member who made it, signed in        | small                  |
 * |                                          | -- asking for the large one              | large, else small      |
 * | run out                                  | the member who made it, signed in        | small                  |
 * |                                          | -- asking for the large one              | large, else small      |
 * | accepted                                 | the member who made it and the member    | small                  |
 * |                                          | who accepted it, signed in               |                        |
 * | deleted                                  | nobody                                   | --                     |
 *
 * And where the account of the member who made the link is deleted, the code shows no picture
 * either -- the page of such a link opens no more (queryTransactionLink) --, and nobody is
 * handed the large rendition by asking for it.
 *
 * Two ways lead to a picture, and each row above belongs to one of them: the address a picture
 * is served under knows a code and nobody (pictureRenditionsForCodeHolder); the query of a
 * member who is signed in knows a member and the link's id (pictureRenditionsForMember, and
 * pictureRenditionsForMemberAskingLarge where the member asks for the large rendition).
 *
 * ⛔ Everything read here is a column of `transaction_links`, which this community writes
 * itself (ThankYouGreetingPictureLink says who writes which) -- nothing a client sends, and
 * nothing another server's request names. `redeemedBy` of a link accepted from another
 * community is the id of that member's mirror row here, under which nobody signs in: such a
 * link shows its picture to the member who made it alone.
 *
 * Plain functions without a database, so that every row has a test of its own.
 */

const SMALL: ThankYouGreetingPictureRendition = 'small'
const LARGE: ThankYouGreetingPictureRendition = 'large'

/** What the rules read of a link: its maker, and what became of it. */
export type PictureLinkState = Pick<
  ThankYouGreetingPictureLink,
  'userId' | 'validUntil' | 'redeemedAt' | 'redeemedBy' | 'deletedAt'
>

/**
 * Whether a link is open: not deleted, not accepted, not run out -- as linkVouches reads it
 * (VouchingLink.logic.ts). The last moment is the one redeemTransactionLink still takes.
 */
export const pictureLinkIsOpen = (link: PictureLinkState, now: Date): boolean =>
  link.deletedAt === null &&
  link.redeemedAt === null &&
  link.redeemedBy === null &&
  link.validUntil.getTime() >= now.getTime()

/**
 * Whether a thank-you was accepted or its link deleted: the two ends after which the large
 * rendition is of no use any more. A link that only ran out is neither -- its pictures lie
 * there until the member deletes the greeting.
 */
export const pictureLinkIsAcceptedOrDeleted = (link: PictureLinkState): boolean =>
  link.deletedAt !== null || link.redeemedAt !== null || link.redeemedBy !== null

/**
 * The renditions whoever holds the code of a link gets, the one wanted first: the large one,
 * and the small one where no large one is filed -- of an OPEN link. None for every other link:
 * once a thank-you is accepted, run out or deleted, its code shows no picture any more.
 *
 * ⛔ And none where the account of the member who made the link is deleted (`makerDeletedAt`):
 * the page of that link does not open any more, and a photo of somebody whose account is gone
 * is not handed to whoever still holds the code until the link runs out.
 */
export const pictureRenditionsForCodeHolder = (
  link: PictureLinkState,
  makerDeletedAt: Date | null,
  now: Date,
): readonly ThankYouGreetingPictureRendition[] =>
  makerDeletedAt === null && pictureLinkIsOpen(link, now) ? [LARGE, SMALL] : []

/**
 * The renditions a member who is signed in gets by the id of a link: the small one, for the
 * member who made the link -- open, run out or accepted -- and for the member who accepted it.
 * None for anybody else, and none of a deleted link for anybody.
 */
export const pictureRenditionsForMember = (
  link: PictureLinkState,
  memberId: number,
): readonly ThankYouGreetingPictureRendition[] => {
  if (link.deletedAt !== null) {
    return []
  }
  const madeIt = link.userId === memberId
  const acceptedIt = link.redeemedBy !== null && link.redeemedBy === memberId
  return madeIt || acceptedIt ? [SMALL] : []
}

/**
 * The renditions a member who is signed in gets by the id of a link where they ask for the
 * LARGE one, the one wanted first: the large one, and the small one where no large one is
 * filed -- for the member who MADE the link, while it is neither accepted nor deleted (open or
 * run out) and their own account stands (`makerDeletedAt`). It is what lets a duplicate of a
 * greeting carry the photo of the old one, without the member choosing it anew (ZE-030).
 *
 * ⛔ For everybody else and in every other state the answer is the one of
 * pictureRenditionsForMember, as if the large one had not been asked for: the member who
 * accepted a thank-you gets the small rendition and never the large one, a deleted link shows
 * nothing to anybody, and a member who is no party to the link gets none.
 */
export const pictureRenditionsForMemberAskingLarge = (
  link: PictureLinkState,
  makerDeletedAt: Date | null,
  memberId: number,
): readonly ThankYouGreetingPictureRendition[] =>
  link.userId === memberId && makerDeletedAt === null && !pictureLinkIsAcceptedOrDeleted(link)
    ? [LARGE, SMALL]
    : pictureRenditionsForMember(link, memberId)

/** The first of the renditions wanted that is filed, or null. */
export const pictureToServe = (
  pictures: readonly ThankYouGreetingPictureInfo[],
  wanted: readonly ThankYouGreetingPictureRendition[],
): ThankYouGreetingPictureInfo | null => {
  for (const rendition of wanted) {
    const filed = pictures.find((picture) => picture.rendition === rendition)
    if (filed) {
      return filed
    }
  }
  return null
}

/**
 * Whether a member may add the large rendition to a link: the link is theirs and open, its
 * greeting carries a picture -- the small rendition is filed --, and it has no large one yet.
 * `found` is null for a link without a picture, and for no link at all.
 */
export const mayAddLargePicture = (
  found: ThankYouGreetingPicturesOfLink | null,
  memberId: number,
  now: Date,
): boolean =>
  found !== null &&
  found.link.userId === memberId &&
  pictureLinkIsOpen(found.link, now) &&
  found.pictures.some((picture) => picture.rendition === SMALL) &&
  !found.pictures.some((picture) => picture.rendition === LARGE)

/**
 * Whether a text has the form of a transaction link's code, as createTransactionLink makes it:
 * 24 hex characters (transactionLinkCode). In either case of letters -- the column compares
 * without regard to it, and the page of a link finds its link either way. The address a picture
 * is served under asks this before it asks the database anything.
 */
export const hasFormOfLinkCode = (text: unknown): text is string =>
  typeof text === 'string' && /^[0-9a-f]{24}$/i.test(text)

/**
 * How many pictures one HTTP request is served by thankYouGreetingPicture, over every alias of
 * the field and every operation of a batch (RequestBudget): as many as a chat's pictures
 * (CHAT_IMAGES_MAX_PER_REQUEST). The wallet asks for one in a request, and for the two
 * renditions of one greeting where it duplicates it.
 */
export const THANK_YOU_GREETING_PICTURES_MAX_PER_REQUEST = 10

/**
 * How many pictures one HTTP request may bring, over createTransactionLink with a picture and
 * addThankYouGreetingPicture together, every alias and every operation of a batch
 * (RequestBudget): one, as the wallet sends -- the small rendition with the link, the large one
 * in a request of its own. Each picture taken in is decoded and encoded again, and a document
 * could otherwise name one picture in its variables and have it worked on hundreds of times.
 */
export const THANK_YOU_GREETING_PICTURES_ACCEPTED_MAX_PER_REQUEST = 1

/**
 * What a call that asks for the LARGE rendition counts in that budget: as three small ones --
 * up to 72 KB against up to 35 (THANK_YOU_PICTURE_LARGE_MAX_BYTES, CHAT_IMAGE_MAX_BYTES). Counted
 * for the asking, whichever rendition the answer then is.
 */
export const THANK_YOU_GREETING_LARGE_PICTURE_COUNTS = 3

/**
 * How many calls of one HTTP request may ask for the large rendition: one. With the three it
 * counts, a request is never served more than it was before there was a large one to ask for:
 * one large and seven small come to 317 KB, ten small to 350.
 */
export const THANK_YOU_GREETING_LARGE_PICTURES_MAX_PER_REQUEST = 1
