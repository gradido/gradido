// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
// The face of the handwriting: declared once for every place that sets a line in it.
import '@/assets/fonts/caveat/caveat.css'
import { I18nText } from '@/components/I18nText'
import { useAmountInText } from '@/composables/useAmountInText'
import { memberAlias } from '@/utils/gradidoAddress'
import { canWriteByHand } from '@/utils/handwriting'
import { greetingParts } from '@/utils/thankYouGreeting'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import classes from './RedeemThanksPaper.module.scss'

/** A member, as a link names them. */
export type RedeemLinkUser = {
  gradidoID?: string | null
  alias?: string | null
  firstName?: string | null
}

/** A community a link can be redeemed in. */
export type RedeemLinkCommunity = { uuid?: string; foreign?: boolean }

/**
 * A redeem link as the server answers it (queryTransactionLink), with what the page adds: what
 * the sheet and the views around it read of it.
 */
export type RedeemLinkData = {
  amount: string | number
  memo: string
  createdAt?: string | null
  validUntil?: string | null
  redeemedAt?: string | null
  deletedAt?: string | null
  senderUser?: RedeemLinkUser | null
  recipientUser?: RedeemLinkUser | null
  senderAvatar?: string | null
  senderCommunity?: RedeemLinkCommunity | null
  communities?: RedeemLinkCommunity[] | null
  // A link of another community brings its photo along.
  picture?: string | null
  greeting?: {
    motif?: string | null
    line?: string | null
    recipientName?: string | null
    hasPicture?: boolean | null
  } | null
}

/**
 * The sheet a thank-you arrives on: the words, a fine line, and who thanks with how much.
 *
 * The sender stands under their user name, never under their real name (NU-021): the redeem
 * page is the one place somebody who is not signed in sees a sender at all. `memberAlias` is
 * how the wallet names a member everywhere, the fallback for a member without a user name
 * included.
 *
 * The amount is written as the text that carried the link says it (`gdd_per_link.share-line1`):
 * the number with the decimal mark of the reader's language, then "Gradido". Both go through
 * `useAmountInText`, so whoever taps the link reads the same figure on the sheet as in the
 * message it came in.
 *
 * A thank-you greeting (`linkData.greeting`) is the same sheet with three things more: its
 * motif above the words, "FÜR {NAME}", and its first line in handwriting -- the memo without
 * that line under it. One sheet for the page a link opens as and for the last look before a
 * greeting is made, so the two cannot drift apart. Without a greeting it is the sheet it was.
 *
 * A greeting with a photo of the sender's own (`greeting.hasPicture`) has that photo where the
 * motif would stand, in the same room (`picture`).
 *
 * Beside the sentence stands the face of the sender, as their account shows it (ZE-038): the
 * small picture the link carries (`linkData.senderAvatar`) -- the server hands it out for an
 * open link of a member who shows their face to other members, and null everywhere else. Where
 * there is none, the first letter of the name, in a circle of the same size.
 */
export const RedeemThanksPaper = defineComponent({
  name: 'RedeemThanksPaper',
  props: {
    linkData: { type: Object as PropType<RedeemLinkData>, required: true },
    // The photo of a greeting that carries one, as an address an <img> can show; null until it
    // has come, and where none comes.
    picture: { type: String as PropType<string | null>, default: null },
  },
  setup(props, { slots }) {
    const { t, locale } = useI18n()
    const amountInText = useAmountInText()

    const greeting = computed(() => props.linkData.greeting ?? null)

    // No picture for a motif this wallet does not know, and none where a greeting has no motif.
    const motif = computed(() => thankYouMotif(greeting.value?.motif, t))

    // In capitals, by the rules of the language the page is in: Turkish "için" is "İÇİN", and
    // Greek capitals carry no accent. `text-transform` would follow the `lang` of the document,
    // which is not the wallet's language.
    const forWhom = computed(() =>
      greeting.value?.recipientName
        ? t('thank-you-greeting.for', { name: greeting.value.recipientName }).toLocaleUpperCase(
            locale.value,
          )
        : '',
    )

    // The line and, apart from it, the words. Where the memo does not begin with the line, the
    // memo stands whole and no line above it (greetingParts).
    const parts = computed(() => greetingParts(props.linkData.memo, greeting.value?.line))

    // The LINE decides, not the language of the page: one letter the handwriting lacks -- it has
    // no Greek -- and the whole line is set in the page's font. Never mixed.
    const byHand = computed(() => canWriteByHand(parts.value.line))

    const senderName = computed<string>(() =>
      memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
    )

    // By code point, not by code unit: the first letter whole, whatever it is.
    const initial = computed(() => (Array.from(senderName.value)[0] ?? '').toUpperCase())

    // What the photo is, for whoever does not see it: whose it is, by the name the sheet shows.
    const photoAlt = computed(() => t('thank-you-greeting.photo-of', { name: senderName.value }))

    // A photo of the sender's own in the place of a motif (ZE-019). The page that shows the
    // sheet hands the picture in -- what it made itself, or what the address of an open
    // link served it; the sheet asks nobody. Until it has come, and where none comes, the
    // room stands in the colour of the card.
    const ownPicture = () => {
      if (greeting.value?.hasPicture) {
        return (
          <div class='redeem-thanks-paper-picture' data-test='redeem-thanks-paper-photo-room'>
            {props.picture ? (
              <img
                src={props.picture}
                alt={photoAlt.value}
                width={THANK_YOU_MOTIF_WIDTH}
                height={THANK_YOU_MOTIF_HEIGHT}
                data-test='redeem-thanks-paper-photo'
              />
            ) : null}
          </div>
        )
      }
      if (motif.value) {
        return (
          <div class='redeem-thanks-paper-picture'>
            <img
              src={motif.value.src}
              alt={motif.value.name}
              width={THANK_YOU_MOTIF_WIDTH}
              height={THANK_YOU_MOTIF_HEIGHT}
              data-test='redeem-thanks-paper-motif'
            />
          </div>
        )
      }
      return null
    }

    return () => (
      <div
        class={['redeem-thanks-paper', classes['redeem-thanks-paper']]}
        data-test='redeem-thanks-paper'
      >
        {/* The picture of a thank-you greeting stands here; a plain link has none, and then the
            sheet holds the words alone. The room is 36 : 25 and stands before the picture has
            come, so nothing under it moves when it does.
            ⛔ An <img>, never the SVG inlined: the motifs share the ids of their gradients. */}
        {slots.picture ? slots.picture() : ownPicture()}
        <div class={['redeem-thanks-paper-text', { 'is-greeting': greeting.value }]}>
          {/* A greeting names whom it is for, and sets its first line in handwriting. Both are
              what somebody else wrote: as text, never as markup. */}
          {forWhom.value ? (
            <div class='redeem-thanks-paper-for' data-test='redeem-thanks-paper-for'>
              {forWhom.value}
            </div>
          ) : null}
          {parts.value.line ? (
            <div
              class={['redeem-thanks-paper-line', { 'is-by-hand': byHand.value }]}
              data-test='redeem-thanks-paper-line'
            >
              {parts.value.line}
            </div>
          ) : null}
          {/* The words somebody else wrote: as text, never as markup. Under a line they are the
              memo without it; a greeting of a line alone has none, and no empty block. */}
          {parts.value.words ? (
            <div
              class={['redeem-thanks-paper-message', { 'is-under-line': parts.value.line }]}
              data-test='redeem-thanks-paper-message'
            >
              {parts.value.words}
            </div>
          ) : null}
          <div class='redeem-thanks-paper-rule'></div>
          <div class='redeem-thanks-paper-sender'>
            {/* The face of the member who made the link, where the link carries it, and the first
                letter of the name in a circle of the same size where it does not. Neither is read
                out: the sentence beside it names the sender. */}
            {props.linkData.senderAvatar ? (
              <img
                class='redeem-thanks-paper-face'
                src={`data:image/jpeg;base64,${props.linkData.senderAvatar}`}
                alt=''
                aria-hidden='true'
                width='64'
                height='64'
                data-test='redeem-thanks-paper-face'
              />
            ) : (
              <span class='redeem-thanks-paper-initial' aria-hidden='true'>
                {initial.value}
              </span>
            )}
            {/* One sentence with two bold parts, and the ten languages put them in different
                places: through <i18n-t> with slots, not by cutting the sentence around them. The
                amount takes its unit along, so both stand bold as one. */}
            <I18nText
              keypath='redeem-thanks.from'
              tag='span'
              scope='global'
              class='redeem-thanks-paper-from'
              data-test='redeem-thanks-paper-from'
            >
              {{
                name: () => <b>{senderName.value}</b>,
                amount: () => (
                  <b class='redeem-thanks-paper-amount'>
                    {amountInText(props.linkData.amount)} {t('GDD-long')}
                  </b>
                ),
              }}
            </I18nText>
          </div>
        </div>
      </div>
    )
  },
})
