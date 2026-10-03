// AI-GENERATED — not an architecture reference
import { and, eq } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import {
  DBDuplicateEntryError,
  DBInsertFailed,
  DBNotFoundError,
  isDuplicateEntry,
} from '../errorTypes'
import {
  ThankYouGreetingPictureInsert,
  ThankYouGreetingPictureRendition,
  TransactionLinksSelect,
  thankYouGreetingPicturesTable,
  transactionLinksTable,
  usersTable,
} from '../schemas/drizzle.schema'

/**
 * What is known about a picture without the picture: all that is read before the rule has said
 * whether whoever asks gets it, and which rendition.
 */
export interface ThankYouGreetingPictureInfo {
  id: number
  rendition: ThankYouGreetingPictureRendition
  width: number
  height: number
}

/**
 * What of a link decides who gets the picture of its greeting. Only columns this community
 * writes itself: the member who made the link (createTransactionLink), until when it waits, who
 * accepted it and when (executeTransaction; for a link accepted from another community
 * storeLinkAsRedeemed writes the id of that member's mirror row here), and when it was deleted.
 */
export type ThankYouGreetingPictureLink = Pick<
  TransactionLinksSelect,
  'id' | 'code' | 'userId' | 'validUntil' | 'redeemedAt' | 'redeemedBy' | 'deletedAt'
>

/**
 * The pictures filed for a link's greeting -- one or two renditions --, that link, and when the
 * account of the member who made it was deleted (null while it stands): the page of such a
 * member's link opens no more, and neither does the picture of its greeting. A column of this
 * community's own row of the member, written where a moderator deletes an account or brings it
 * back.
 */
export interface ThankYouGreetingPicturesOfLink {
  link: ThankYouGreetingPictureLink
  makerDeletedAt: Date | null
  pictures: ThankYouGreetingPictureInfo[]
}

/** A picture's row without the picture: what an error about the row carries. */
export type ThankYouGreetingPictureInsertWithoutImage = Omit<ThankYouGreetingPictureInsert, 'image'>

// An error is what ends up in a log, and a photo a member chose must not: the row goes into the
// error without its bytes.
const ThankYouGreetingPictureInsertFailed = ({
  image: _image,
  ...row
}: ThankYouGreetingPictureInsert) =>
  new DBInsertFailed<ThankYouGreetingPictureInsertWithoutImage>('thank_you_greeting_pictures', row)
const ThankYouGreetingPictureDuplicate = (row: ThankYouGreetingPictureInsert) =>
  new DBDuplicateEntryError(
    'thank_you_greeting_pictures',
    'transaction_link_code with rendition',
    `${row.transactionLinkCode} ${row.rendition}`,
  )

/**
 * Files one rendition of a greeting's picture. A link that has this rendition already comes back
 * as DBDuplicateEntryError: the unique key refuses the second row -- which is what makes the
 * large rendition something that is added once.
 *
 * ⛔ The small rendition is written BEFORE the link it belongs to (createTransactionLink), with
 * the greeting: where the link cannot be saved, both are taken back out. In between nobody
 * reaches it -- every reader below starts from a link.
 */
export async function dbInsertThankYouGreetingPicture(
  row: ThankYouGreetingPictureInsert,
): Promise<
  VoidResult<DBDuplicateEntryError | DBInsertFailed<ThankYouGreetingPictureInsertWithoutImage>>
> {
  try {
    const result = await drizzleDb().insert(thankYouGreetingPicturesTable).values(row)
    if (result[0]?.affectedRows === 1) {
      return { success: true }
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return { success: false, error: ThankYouGreetingPictureDuplicate(row) }
    }
    throw error
  }
  return { success: false, error: ThankYouGreetingPictureInsertFailed(row) }
}

// What both readers below ask for: the pictures' columns beside the picture, and the link's
// columns the rule reads. ⛔ `image` is not among them.
const picturesWithLinkQuery = () =>
  drizzleDb()
    .select({
      id: thankYouGreetingPicturesTable.id,
      rendition: thankYouGreetingPicturesTable.rendition,
      width: thankYouGreetingPicturesTable.width,
      height: thankYouGreetingPicturesTable.height,
      linkId: transactionLinksTable.id,
      linkCode: transactionLinksTable.code,
      linkUserId: transactionLinksTable.userId,
      linkValidUntil: transactionLinksTable.validUntil,
      linkRedeemedAt: transactionLinksTable.redeemedAt,
      linkRedeemedBy: transactionLinksTable.redeemedBy,
      linkDeletedAt: transactionLinksTable.deletedAt,
      makerId: usersTable.id,
      makerDeletedAt: usersTable.deletedAt,
    })
    .from(thankYouGreetingPicturesTable)
    .innerJoin(
      transactionLinksTable,
      eq(transactionLinksTable.code, thankYouGreetingPicturesTable.transactionLinkCode),
    )
    // The member who made the link, by the primary key.
    //
    // ⛔ A LEFT join, and on purpose: it makes the server find the link first and its maker
    // afterwards. As an inner join the planner turned the order round for the reader by code --
    // every member, then all the links of each: 62 and 86 ms on 30,000 links of 500 members,
    // where this order takes 13 and 23 (measured in the fork's MariaDB, 03.10.2026). A link whose
    // maker has no row is no link to show a picture for: picturesOfOneLink leaves it out by
    // `makerId`.
    .leftJoin(usersTable, eq(usersTable.id, transactionLinksTable.userId))

type PictureWithLinkRow = Awaited<ReturnType<typeof picturesWithLinkQuery>>[number]

// ⛔ Null where the rows name more than one link. `transaction_links.code` carries no unique
// key; two links of one code would share their pictures, and the rule would be asked about
// whichever of the two came first -- an accepted link read as an open one. Such a pair shows no
// picture at all.
const picturesOfOneLink = (rows: PictureWithLinkRow[]): ThankYouGreetingPicturesOfLink | null => {
  const first = rows.at(0)
  if (!first || first.makerId === null || rows.some((row) => row.linkId !== first.linkId)) {
    return null
  }
  return {
    link: {
      id: first.linkId,
      code: first.linkCode,
      userId: first.linkUserId,
      validUntil: first.linkValidUntil,
      redeemedAt: first.linkRedeemedAt,
      redeemedBy: first.linkRedeemedBy,
      deletedAt: first.linkDeletedAt,
    },
    makerDeletedAt: first.makerDeletedAt,
    pictures: rows.map(({ id, rendition, width, height }) => ({ id, rendition, width, height })),
  }
}

/**
 * What is known about the pictures of the greeting of the link with this code, and the link:
 * for the address a picture is served under to whoever holds the code. Null for a code no
 * picture is filed under, and for pictures whose link was never saved.
 *
 * No condition on the link's state, a deleted link included: the rule that reads the columns
 * stands in the backend (data/ThankYouGreetingPicture.logic.ts), where every row of it has a
 * test without a database.
 *
 * ⛔ Never the picture itself -- that comes by its id, once the rule has said yes
 * (dbSelectThankYouGreetingPictureImage).
 *
 * Starts from the pictures, which have an index on the code: a code without a picture ends
 * there, and `transaction_links` -- which has none on its code -- is not read at all. For a code
 * WITH pictures that table is read whole, once: measured on 30,000 links, 13 and 23 ms (the
 * fork's MariaDB, 03.10.2026) -- the order of what the page of a link pays already, which finds
 * its link by the same column (2 to 9 ms there, as it stops at the first).
 */
export async function dbSelectThankYouGreetingPicturesByLinkCode(
  transactionLinkCode: string,
): Promise<ThankYouGreetingPicturesOfLink | null> {
  return picturesOfOneLink(
    await picturesWithLinkQuery().where(
      eq(thankYouGreetingPicturesTable.transactionLinkCode, transactionLinkCode),
    ),
  )
}

/**
 * The same for the link with this id: for a member who is signed in -- the list of their own
 * links and the booking of an accepted greeting both carry the link's id, not its code. Null
 * for an id without such a link, and for a link without a picture.
 */
export async function dbSelectThankYouGreetingPicturesByLinkId(
  transactionLinkId: number,
): Promise<ThankYouGreetingPicturesOfLink | null> {
  return picturesOfOneLink(
    await picturesWithLinkQuery().where(eq(transactionLinksTable.id, transactionLinkId)),
  )
}

/**
 * The bytes of one picture, by the id its row has.
 *
 * ⛔ The one query that reads `image`, and it asks nobody who they are: the caller has asked
 * the rule first, with what the two readers above found, and comes here with the id of the
 * rendition it allows. Not found is an expected answer -- the large rendition goes when the
 * thank-you is accepted, and that may happen between the two reads.
 */
export async function dbSelectThankYouGreetingPictureImage(
  id: number,
): Promise<Result<Buffer, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({ image: thankYouGreetingPicturesTable.image })
    .from(thankYouGreetingPicturesTable)
    .where(eq(thankYouGreetingPicturesTable.id, id))
    .limit(1)
  const found = rows.at(0)
  return found
    ? { success: true, value: found.image }
    : { success: false, error: new DBNotFoundError('thank_you_greeting_pictures', `id = ${id}`) }
}

/**
 * Takes the pictures of a link's greeting out and says how many there were: both renditions,
 * or the one named. None is an answer, not a failure -- a greeting with a motif has no picture,
 * and a plain link has no greeting.
 */
export async function dbDeleteThankYouGreetingPicturesByLinkCode(
  transactionLinkCode: string,
  rendition?: ThankYouGreetingPictureRendition,
): Promise<number> {
  const ofTheLink = eq(thankYouGreetingPicturesTable.transactionLinkCode, transactionLinkCode)
  const result = await drizzleDb()
    .delete(thankYouGreetingPicturesTable)
    .where(
      rendition
        ? and(ofTheLink, eq(thankYouGreetingPicturesTable.rendition, rendition))
        : ofTheLink,
    )
  return result[0]?.affectedRows ?? 0
}
