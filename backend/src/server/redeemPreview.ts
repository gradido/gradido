// AI-GENERATED — not an architecture reference

import { translateForLocale } from 'core'
import { dbFindTransactionLinkForPreview, driverCodeOfFailedQuery } from 'database'
import { Elysia } from 'elysia'
import { getLogger } from 'log4js'
import { GENERAL_PREVIEW_FILE, thankYouMotifPreviewFile, WalletPicture } from 'shared'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { OG_LOCALE, RedeemPreview, redeemPreviewOf } from '@/data/RedeemPreview.logic'
import { hasFormOfLinkCode } from '@/data/ThankYouGreetingPicture.logic'
import { THANK_YOU_GREETING_PICTURE_PATH } from './thankYouGreetingPicture'

/**
 * What a messenger is shown of a redeem link, as a small HTML document at GET
 * /api/redeem-preview/<code>: who sent the thank-you, as the title, and the picture of its
 * greeting. A messenger that draws the preview of a pasted link reads the `og:` lines of the
 * page behind it and runs no JavaScript -- and the wallet's page is the same file for every
 * address, so it can say nothing about one link.
 *
 * For an OPEN link of a member whose account stands, and for nothing else
 * (data/RedeemPreview.logic.ts has the rule): everything else is sent on to the wallet's own
 * address, where the general preview is.
 *
 * ⛔ That is ONE answer -- a text that is no code, a code no link has, a link that is
 * accepted, run out or deleted, a link whose maker's account is deleted, two links of one
 * code, a database that does not answer --, with nothing in it that tells these apart.
 *
 * The route is GET and HEAD of `/<code>` and nothing else: any other method, and a path with
 * a further part, is no route of this server and gets its 404 -- whatever the code, so that
 * answer says nothing about a link either. Like an OPTIONS, which cors answers, and a
 * request createServer refuses for its size.
 *
 * ⛔ Nothing of the request goes into what is answered here: every address in it is made of
 * this server's configuration, and the code of the link is the one its row holds.
 *
 * Outside GraphQL like /api/version, so the request log of the GraphQL plugins never sees it;
 * what is written here is the driver's code of a failed query -- of any other failure what
 * kind of error it is --, never the error or its message: Drizzle writes the parameters of a
 * statement into both. And so neither the code of a link nor a name.
 */
export const REDEEM_PREVIEW_PATH = '/api/redeem-preview'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.redeemPreview`)

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character])

/**
 * A line of the document. ⛔ Every value put into it is escaped here, for a text and for a
 * quoted attribute alike -- a username and a translated phrase as much as an address:
 * translateForLocale escapes nothing, and a French phrase carries an apostrophe.
 */
const html = (pieces: TemplateStringsArray, ...values: (string | number)[]): string =>
  pieces.reduce((written, piece, index) => written + escapeHtml(String(values[index - 1])) + piece)

const titleOf = ({ kind, name, language }: RedeemPreview): string =>
  translateForLocale(
    language,
    kind === 'greeting' ? 'redeemPreview.greetingTitle' : 'redeemPreview.linkTitle',
    { name },
  )

function pictureOf({ code, picture }: RedeemPreview): WalletPicture {
  switch (picture.kind) {
    case 'photo':
      // ⛔ Nothing after the code, no file's ending either: the address of the picture reads
      // whatever follows the code as a text that is no code.
      return {
        path: `${THANK_YOU_GREETING_PICTURE_PATH}/${code}`,
        width: picture.width,
        height: picture.height,
      }
    case 'motif':
      return thankYouMotifPreviewFile(picture.motif)
    case 'general':
      return GENERAL_PREVIEW_FILE
  }
}

/**
 * The document: exactly one set of `og:` and `twitter:` lines -- the wallet's own page names
 * some of them twice --, `og:locale` and the document's language, and a line in the body for a
 * person who lands here, which leads to the page of the link.
 */
function documentOf(preview: RedeemPreview): string {
  const title = titleOf(preview)
  const description = translateForLocale(preview.language, 'redeemPreview.description')
  const page = CONFIG.COMMUNITY_REDEEM_URL + preview.code
  const picture = pictureOf(preview)
  const image = CONFIG.COMMUNITY_URL + picture.path
  return [
    '<!doctype html>',
    html`<html lang="${preview.language}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    html`<title>${title}</title>`,
    '<meta name="robots" content="noindex">',
    html`<link rel="canonical" href="${page}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Gradido">',
    html`<meta property="og:locale" content="${OG_LOCALE[preview.language]}">`,
    html`<meta property="og:url" content="${page}">`,
    html`<meta property="og:title" content="${title}">`,
    html`<meta property="og:description" content="${description}">`,
    html`<meta property="og:image" content="${image}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    html`<meta property="og:image:width" content="${picture.width}">`,
    html`<meta property="og:image:height" content="${picture.height}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    html`<meta name="twitter:title" content="${title}">`,
    html`<meta name="twitter:description" content="${description}">`,
    html`<meta name="twitter:image" content="${image}">`,
    '</head>',
    '<body>',
    html`<p><a href="${page}">${title}</a></p>`,
    '</body>',
    '</html>',
    '',
  ].join('\n')
}

export const redeemPreviewRoutes = new Elysia({ prefix: REDEEM_PREVIEW_PATH }).get(
  '/:code',
  async ({ params: { code } }) => {
    let document: string | null = null
    try {
      // The code is held against its form before the database is asked anything.
      const preview = hasFormOfLinkCode(code)
        ? redeemPreviewOf(await dbFindTransactionLinkForPreview(code), new Date())
        : null
      document = preview && documentOf(preview)
    } catch (error) {
      // ⛔ One text, and the error is no part of it: handed to the logger, it would be written
      // out with its message and its parameters.
      const failure =
        driverCodeOfFailedQuery(error) ?? (error instanceof Error ? error.name : 'unknown')
      createLogger().error(`redeem preview not answered (${failure})`)
    }
    // `no-store` on both answers: what a link shows changes the moment its thank-you is accepted
    // or deleted, and no cache in between should answer for it.
    if (document === null) {
      return new Response(null, {
        status: 302,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Length': '0',
          Location: `${CONFIG.COMMUNITY_URL}/`,
        },
      })
    }
    // A HEAD is answered with the headers of the document and without it: Elysia answers it
    // from the GET route and leaves the document out.
    return new Response(document, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': String(Buffer.byteLength(document)),
      },
    })
  },
)
