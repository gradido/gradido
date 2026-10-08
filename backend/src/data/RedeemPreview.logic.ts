// AI-GENERATED — not an architecture reference
import { TransactionLinkForPreview } from 'database'
import { isThankYouMotif, publicAlias, ThankYouMotif } from 'shared'
import {
  hasFormOfLinkCode,
  pictureLinkIsOpen,
  pictureRenditionsForCodeHolder,
  pictureToServe,
} from './ThankYouGreetingPicture.logic'

/**
 * What a messenger is told about a redeem link, to draw the preview where somebody pastes the
 * link (ZE-019): who sent the thank-you, and a picture.
 *
 * | the link is …                                                | title                           | picture             |
 * | ------------------------------------------------------------ | ------------------------------- | ------------------- |
 * | open, a greeting with a photo of the member's own            | … sent you a thank-you greeting | the photo           |
 * | open, a greeting with a motif                                | the same                        | the motif's file    |
 * | open, a greeting without a photo, and without a motif        | the same                        | the general picture |
 * | known here                                                   |                                 |                     |
 * | open, a plain link                                           | … sent you a thank-you          | the general picture |
 * | accepted, run out or deleted · of a member whose account is  | no preview of its own           | --                  |
 * | deleted · not found (dbFindTransactionLinkForPreview) · held |                                 |                     |
 * | under a code that has not the form of one                    |                                 |                     |
 *
 * The preview never shows more of a link than the page it opens as shows the same visitor, and
 * of that only the picture and from whom the thank-you comes: not the amount, not the words,
 * not the first line, not whom the greeting is for. One thing it shows that the page does not:
 * the language the sender keeps their wallet in -- the title is written in it.
 *
 * ⛔ "Open" is what it is for the picture of a greeting (pictureLinkIsOpen, and the maker's
 * account standing), and a photo is named only where the address of that picture would serve
 * one at this moment (pictureRenditionsForCodeHolder, pictureToServe) -- the same functions,
 * not a second rule beside them. What is read is the answer of ONE statement
 * (dbFindTransactionLinkForPreview): state, maker, greeting and pictures are of one moment.
 *
 * Plain functions without a database, so that every row has a test of its own.
 */

/**
 * The languages a preview is written in -- the ten of the wallet and of the server's own
 * texts --, each with what Open Graph calls it (`og:locale`).
 */
export const OG_LOCALE = {
  de: 'de_DE',
  el: 'el_GR',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  it: 'it_IT',
  nl: 'nl_NL',
  pt: 'pt_PT',
  ru: 'ru_RU',
  tr: 'tr_TR',
} as const

export type PreviewLanguage = keyof typeof OG_LOCALE

export const PREVIEW_LANGUAGES = Object.keys(OG_LOCALE) as PreviewLanguage[]

/** The language of a member as one of the ten, and English for any other. */
export const previewLanguageOf = (language: string): PreviewLanguage =>
  PREVIEW_LANGUAGES.find((known) => known === language) ?? 'en'

export type RedeemPreviewPicture =
  /** The greeting's own photo, in the measure of the rendition its address serves. */
  | { kind: 'photo'; width: number; height: number }
  | { kind: 'motif'; motif: ThankYouMotif }
  | { kind: 'general' }

export type RedeemPreview = {
  /** The code of the link as its row holds it -- not as a request wrote it. */
  code: string
  kind: 'greeting' | 'link'
  /** The sender's username, or null where they have none to be called by. */
  name: string | null
  language: PreviewLanguage
  picture: RedeemPreviewPicture
}

const GENERAL: RedeemPreviewPicture = { kind: 'general' }

/**
 * What the sender is called in the title: their username. publicAlias hands out the member's
 * identifier where there is no usable one -- then the title names nobody.
 *
 * ⛔ Never the identifier, never a real name.
 */
const senderName = ({ alias, gradidoId }: TransactionLinkForPreview['maker']): string | null => {
  const name = publicAlias(alias, gradidoId)
  return name === gradidoId ? null : name
}

/**
 * The picture of an OPEN link. A photo only for a greeting without a motif -- as the page of
 * the link reads it (ThankYouGreeting.hasPicture) --, and only the one its address serves now.
 * A plain link and a greeting with a motif name no photo, whatever is filed under their code.
 */
const pictureOf = (found: TransactionLinkForPreview, now: Date): RedeemPreviewPicture => {
  if (!found.greeting) {
    return GENERAL
  }
  const { motif } = found.greeting
  if (motif !== null) {
    return isThankYouMotif(motif) ? { kind: 'motif', motif } : GENERAL
  }
  const photo = pictureToServe(
    found.pictures,
    pictureRenditionsForCodeHolder(found.link, found.maker.deletedAt, now),
  )
  return photo ? { kind: 'photo', width: photo.width, height: photo.height } : GENERAL
}

/**
 * The preview of the link the query found, or null for a link that has none of its own: the
 * last row of the table above. Null says nothing about which of its cases it is.
 */
export const redeemPreviewOf = (
  found: TransactionLinkForPreview | null,
  now: Date,
): RedeemPreview | null => {
  if (!found || found.maker.deletedAt !== null || !pictureLinkIsOpen(found.link, now)) {
    return null
  }
  // The column finds a link by its collation, not by its exact text -- whatever the case of
  // the letters, for one. The code goes into the addresses of the preview as the row holds
  // it, and the address of a greeting's picture knows no code but one of this form: a row
  // that holds anything else has no preview.
  if (!hasFormOfLinkCode(found.link.code)) {
    return null
  }
  return {
    code: found.link.code,
    kind: found.greeting ? 'greeting' : 'link',
    name: senderName(found.maker),
    language: previewLanguageOf(found.maker.language),
    picture: pictureOf(found, now),
  }
}
