// AI-GENERATED — not an architecture reference
import { ThankYouGreetingPictureInfo, TransactionLinkForPreview } from 'database'
import {
  OG_LOCALE,
  PREVIEW_LANGUAGES,
  previewLanguageOf,
  redeemPreviewOf,
} from './RedeemPreview.logic'
import { THANK_YOU_MOTIFS } from './ThankYouGreeting.logic'
import { pictureRenditionsForCodeHolder, pictureToServe } from './ThankYouGreetingPicture.logic'

const NOW = new Date('2026-10-05T14:30:00.000Z')
const CODE = 'a1f9c2d41b7e19981fa0d001'
// An identifier with letters in it, as a member's is: what must never stand in a preview.
const GRADIDO_ID = '3f2a9c1e-7b4d-4a5f-8e6c-0d1b2a3c4e5f'

const OPEN_LINK: TransactionLinkForPreview['link'] = {
  code: CODE,
  userId: 4711,
  validUntil: new Date('2026-10-19T12:00:00.000Z'),
  redeemedAt: null,
  redeemedBy: null,
  deletedAt: null,
}
const EMMA: TransactionLinkForPreview['maker'] = {
  alias: 'Oma-Emma',
  gradidoId: GRADIDO_ID,
  language: 'de',
  deletedAt: null,
}
const SMALL: ThankYouGreetingPictureInfo = { id: 11, rendition: 'small', width: 831, height: 577 }
const LARGE: ThankYouGreetingPictureInfo = { id: 12, rendition: 'large', width: 1080, height: 750 }
const WITH_PHOTO = { motif: null }
const BEFORE = new Date('2026-10-05T14:00:00.000Z')

const found = ({
  link = {},
  maker = {},
  greeting = null,
  pictures = [],
}: {
  link?: Partial<TransactionLinkForPreview['link']>
  maker?: Partial<TransactionLinkForPreview['maker']>
  greeting?: TransactionLinkForPreview['greeting']
  pictures?: ThankYouGreetingPictureInfo[]
} = {}): TransactionLinkForPreview => ({
  link: { ...OPEN_LINK, ...link },
  maker: { ...EMMA, ...maker },
  greeting,
  pictures,
})

describe('redeemPreviewOf', () => {
  describe('an open link', () => {
    it('names the photo of a greeting, in the measure of the large rendition', () => {
      expect(
        redeemPreviewOf(found({ greeting: WITH_PHOTO, pictures: [SMALL, LARGE] }), NOW),
      ).toEqual({
        code: CODE,
        kind: 'greeting',
        name: 'Oma-Emma',
        language: 'de',
        picture: { kind: 'photo', width: 1080, height: 750 },
      })
    })

    it('names the small rendition where no large one is filed', () => {
      expect(
        redeemPreviewOf(found({ greeting: WITH_PHOTO, pictures: [SMALL] }), NOW)?.picture,
      ).toEqual({ kind: 'photo', width: 831, height: 577 })
    })

    it.each(THANK_YOU_MOTIFS)('names the motif of a greeting with the motif %s', (motif) => {
      expect(redeemPreviewOf(found({ greeting: { motif } }), NOW)).toEqual({
        code: CODE,
        kind: 'greeting',
        name: 'Oma-Emma',
        language: 'de',
        picture: { kind: 'motif', motif },
      })
    })

    // A row a newer server wrote before it was rolled back, or one written past the server:
    // createTransactionLink files no motif this server does not know.
    it('shows the general picture for a greeting whose motif is not known here', () => {
      const preview = redeemPreviewOf(found({ greeting: { motif: 'sunflower' } }), NOW)

      expect(preview?.kind).toBe('greeting')
      expect(preview?.picture).toEqual({ kind: 'general' })
    })

    it('shows the general picture for a greeting without a motif and without a picture', () => {
      const preview = redeemPreviewOf(found({ greeting: WITH_PHOTO }), NOW)

      expect(preview?.kind).toBe('greeting')
      expect(preview?.picture).toEqual({ kind: 'general' })
    })

    it('reads a plain link as a link, with the general picture', () => {
      expect(redeemPreviewOf(found(), NOW)).toEqual({
        code: CODE,
        kind: 'link',
        name: 'Oma-Emma',
        language: 'de',
        picture: { kind: 'general' },
      })
    })

    // The page of such a link shows no photo either (ThankYouGreeting.hasPicture).
    it('names no photo for a plain link or a greeting with a motif, whatever is filed under the code', () => {
      const pictures = [SMALL, LARGE]

      expect(redeemPreviewOf(found({ pictures }), NOW)?.picture).toEqual({ kind: 'general' })
      expect(
        redeemPreviewOf(found({ greeting: { motif: 'bouquet' }, pictures }), NOW)?.picture,
      ).toEqual({ kind: 'motif', motif: 'bouquet' })
      expect(
        redeemPreviewOf(found({ greeting: { motif: 'sunflower' }, pictures }), NOW)?.picture,
      ).toEqual({ kind: 'general' })
    })

    it('answers with the code as the row of the link holds it', () => {
      const asStored = 'A1F9C2D41B7E19981FA0D001'

      expect(redeemPreviewOf(found({ link: { code: asStored } }), NOW)?.code).toBe(asStored)
    })
  })

  describe('a link without a preview of its own', () => {
    it('is the one the query did not find', () => {
      expect(redeemPreviewOf(null, NOW)).toBeNull()
    })

    it.each([
      ['accepted', { redeemedAt: BEFORE, redeemedBy: 815 }],
      // storeLinkAsRedeemed and executeTransaction write the two together; either alone
      // closes the link all the same, as it does for the picture.
      ['accepted, by what `redeemedBy` alone says', { redeemedBy: 815 }],
      ['accepted, by what `redeemedAt` alone says', { redeemedAt: BEFORE }],
      ['run out', { validUntil: new Date(NOW.getTime() - 1) }],
      ['deleted', { deletedAt: BEFORE }],
    ])('is a link that is %s', (_state, link) => {
      // A greeting with a photo: the link with the most to show.
      const closed = found({ link, greeting: WITH_PHOTO, pictures: [SMALL, LARGE] })

      expect(redeemPreviewOf(closed, NOW)).toBeNull()
    })

    it('is an open link of a member whose account is deleted', () => {
      const orphaned = found({
        maker: { deletedAt: BEFORE },
        greeting: WITH_PHOTO,
        pictures: [SMALL, LARGE],
      })

      expect(redeemPreviewOf(orphaned, NOW)).toBeNull()
    })

    /**
     * The column compares by its collation, so the row found may hold another text than the
     * one asked for. A code of another form would go into the addresses of the preview, and
     * the address of a greeting's picture would not know it.
     */
    it.each([
      ['a letter with an accent', `á${CODE.slice(1)}`],
      ['a character no code has', `${CODE.slice(0, 23)}/`],
      ['fewer characters than a code', CODE.slice(1)],
    ])('is a link whose row holds a code with %s', (_what, code) => {
      const odd = found({ link: { code }, greeting: WITH_PHOTO, pictures: [SMALL, LARGE] })

      expect(redeemPreviewOf(odd, NOW)).toBeNull()
    })

    it('begins the moment after the link ran out: its last moment still has the preview', () => {
      const lastMoment = found({ link: { validUntil: NOW } })

      expect(redeemPreviewOf(lastMoment, NOW)).not.toBeNull()
      expect(redeemPreviewOf(lastMoment, new Date(NOW.getTime() + 1))).toBeNull()
    })
  })

  describe('the name of the sender', () => {
    it('is the username', () => {
      expect(redeemPreviewOf(found({ maker: { alias: 'Bibi_42' } }), NOW)?.name).toBe('Bibi_42')
    })

    // publicAlias hands out the identifier for each of these; the preview names nobody then.
    it.each([
      ['no username', null],
      ['a username of two characters', 'ab'],
      ['a username of spaces', '    '],
      ['an empty username', ''],
    ])('is nobody for a member with %s -- and never the identifier', (_what, alias) => {
      const preview = redeemPreviewOf(found({ maker: { alias } }), NOW)

      expect(preview).not.toBeNull()
      expect(preview?.name).toBeNull()
      expect(JSON.stringify(preview)).not.toContain(GRADIDO_ID)
    })

    it('never carries the identifier beside a username either', () => {
      for (const greeting of [null, WITH_PHOTO, { motif: 'bouquet' }]) {
        const preview = redeemPreviewOf(found({ greeting, pictures: [SMALL] }), NOW)

        expect(JSON.stringify(preview)).not.toContain(GRADIDO_ID)
      }
    })
  })

  describe('the language', () => {
    it.each(PREVIEW_LANGUAGES)('is the sender’s where it is %s', (language) => {
      expect(redeemPreviewOf(found({ maker: { language } }), NOW)?.language).toBe(language)
    })

    it.each(['pl', '', 'DE', 'de-DE', 'constructor', 'toString'])(
      'is English for a sender whose language is "%s"',
      (language) => {
        expect(redeemPreviewOf(found({ maker: { language } }), NOW)?.language).toBe('en')
        expect(previewLanguageOf(language)).toBe('en')
      },
    )
  })

  /**
   * ⛔ The preview names a photo exactly where the address of the picture would serve one at
   * the same moment -- asked of the same functions, over every state of a link and everything
   * that can be filed for a greeting with a photo.
   */
  it('names a photo exactly where the address of the picture serves one', () => {
    const states: Partial<TransactionLinkForPreview['link']>[] = [
      {},
      { validUntil: NOW },
      { validUntil: new Date(NOW.getTime() - 1) },
      { redeemedAt: BEFORE, redeemedBy: 815 },
      { redeemedBy: 815 },
      { redeemedAt: BEFORE },
      { deletedAt: BEFORE },
    ]
    const filed = [[], [SMALL], [LARGE], [SMALL, LARGE]]
    const named: boolean[] = []

    for (const link of states) {
      for (const makerDeletedAt of [null, BEFORE]) {
        for (const pictures of filed) {
          const asked = found({
            link,
            maker: { deletedAt: makerDeletedAt },
            greeting: WITH_PHOTO,
            pictures,
          })
          const served = pictureToServe(
            pictures,
            pictureRenditionsForCodeHolder(asked.link, makerDeletedAt, NOW),
          )
          const picture = redeemPreviewOf(asked, NOW)?.picture

          expect(picture?.kind === 'photo').toBe(served !== null)
          if (picture?.kind === 'photo') {
            expect(picture).toEqual({ kind: 'photo', width: served?.width, height: served?.height })
          }
          named.push(picture?.kind === 'photo')
        }
      }
    }
    // Both answers occur: the comparison above is not of two things that are always the same.
    expect(named.filter(Boolean)).toHaveLength(6)
    expect(named).toHaveLength(56)
  })
})

describe('OG_LOCALE', () => {
  // The fixed list: a locale is a language AND a country, and no test can derive the country.
  it('names each of the ten languages by its locale', () => {
    expect(OG_LOCALE).toEqual({
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
    })
    expect(PREVIEW_LANGUAGES).toEqual(Object.keys(OG_LOCALE))
    expect(PREVIEW_LANGUAGES).toHaveLength(10)
  })
})
