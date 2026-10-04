// AI-GENERATED — not an architecture reference
import {
  dbSelectThankYouGreetingPictureImage,
  dbSelectThankYouGreetingPicturesByLinkCode,
} from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  hasFormOfLinkCode,
  pictureRenditionsForCodeHolder,
  pictureToServe,
} from '@/data/ThankYouGreetingPicture.logic'

/**
 * The picture of a thank-you greeting, served as a plain picture at GET
 * /api/thank-you-greeting-picture/<code> -- to whoever holds the code of an OPEN link, signed in
 * or not: the page such a link opens as is open to them already, and shows the picture with an
 * <img>. The large rendition, or the small one where no large one is filed.
 *
 * ⛔ Of an open link only (pictureRenditionsForCodeHolder): once the thank-you is accepted, run
 * out or deleted, its code shows no picture any more -- the two it is between get the small
 * rendition signed in, by TransactionLinkResolver.thankYouGreetingPicture.
 *
 * ⛔ One empty answer for everything else -- a text that is no code, an unknown code, a link
 * without a picture, a link that is not open, a link whose maker's account is deleted, a
 * database that does not answer --, with nothing that tells these apart. And for everything
 * BELOW the address: it is mounted with `app.use`, so a path with a file's ending, with a
 * further part or with an escape that cannot be decoded comes here as well and is a text that is
 * no code -- instead of falling through to whatever else answers under `/`.
 *
 * An address and not base64 in a query, because an <img> and the preview of a link in a
 * messenger need one. Outside GraphQL like /api/version, so the request log of the GraphQL
 * plugins never sees it; what is written here is the driver's code of a failed query, never its
 * message, and never the code of the link.
 */
export const THANK_YOU_GREETING_PICTURE_PATH = '/api/thank-you-greeting-picture'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.thankYouGreetingPicture`)

/**
 * The policy the picture is served with, in the place of the one helmet gives every answer of
 * this server. This is a member's picture, served from the wallet's own address to whoever holds
 * the code -- and the wallet keeps a member's session in that address's storage. What is filed
 * now was decoded and encoded again by this server (acceptLargeThankYouGreetingPicture in core);
 * a row from before that is the bytes a member sent, and the policy holds for both. Type and `nosniff` make a browser read them as a picture or not at all; should one
 * ever show them as a document all the same, that document may load nothing, run nothing, and
 * belongs to no origin (`sandbox`). The inline style is what a browser's own picture view uses.
 */
export const PICTURE_CONTENT_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox"

/**
 * The bytes of the picture whoever holds this code gets now, or null. The code is held against
 * its form before the database is asked anything.
 */
export async function thankYouGreetingPictureForCode(
  code: unknown,
  now: Date,
): Promise<Buffer | null> {
  if (!hasFormOfLinkCode(code)) {
    return null
  }
  const found = await dbSelectThankYouGreetingPicturesByLinkCode(code)
  if (!found) {
    return null
  }
  const picture = pictureToServe(
    found.pictures,
    pictureRenditionsForCodeHolder(found.link, found.makerDeletedAt, now),
  )
  if (!picture) {
    return null
  }
  const image = await dbSelectThankYouGreetingPictureImage(picture.id)
  return image.success ? image.value : null
}

/**
 * The code a request names: what stands after the address, as it was written -- for a GET (and
 * the HEAD that goes with it). Not decoded: a code is 24 hex characters and needs no escape, and
 * anything else is no code whatever it decodes to.
 */
const codeOf = (req: { method?: string; path?: string }): string | null =>
  req.method === 'GET' || req.method === 'HEAD' ? String(req.path ?? '').slice(1) : null

export async function apiThankYouGreetingPicture(req: any, res: any): Promise<void> {
  let image: Buffer | null = null
  try {
    image = await thankYouGreetingPictureForCode(codeOf(req), new Date())
  } catch (error) {
    const failed = error as { cause?: { code?: unknown }; code?: unknown } | null
    createLogger().error(
      `thank-you greeting picture not served (${String(failed?.cause?.code ?? failed?.code ?? 'unknown')})`,
    )
  }
  // ⛔ `no-store`, on the picture and on the empty answer alike: the browser keeps nothing, so
  // a picture cannot outlive the moment its thank-you is accepted or deleted in somebody's
  // cache, and an empty answer is not remembered for a link that is made a moment later.
  //
  // The headers are written out here and nothing of the request goes into them. The type is
  // fixed: what is stored is a JPEG this server encoded -- or, in a row from before it did, one
  // checked to begin and end as a JPEG --, and helmet's `X-Content-Type-Options: nosniff` keeps
  // a browser from reading it as anything else. Its
  // `Cross-Origin-Resource-Policy: same-origin` keeps other sites from showing it as theirs.
  if (!image) {
    res.writeHead(404, { 'Cache-Control': 'no-store', 'Content-Length': 0 })
    res.end()
    return
  }
  res.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': 'image/jpeg',
    'Content-Length': image.length,
    'Content-Security-Policy': PICTURE_CONTENT_POLICY,
  })
  res.end(image)
}
