// AI-GENERATED — not an architecture reference
import { computed, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWalletStore } from '@/store/useWalletStore'
import { memberAlias } from '@/utils/gradidoAddress'
import { takesPictureInClipboard, writePictureToClipboard } from '@/utils/nativeClipboard'
import { loadImage } from '@/utils/thankYouGreetingSheet'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'

/**
 * The address as it goes into a mailto link: readable, the @ stays. Only what would end the
 * address or the link early is written out.
 *
 * @param {string} address
 * @returns {string}
 */
export const mailtoAddress = (address) =>
  address.replace(/[%&?# ]/g, (sign) => encodeURIComponent(sign))

/**
 * ⛔ `encodeURIComponent` throws on half an emoji, a lone surrogate that a memo cut off in a field can
 * end on, and a link is written while its page is drawn: that would be a step without its page, after
 * the link has been made. With the `u` flag this class matches only a surrogate without its other half.
 */
const encoded = (text) => encodeURIComponent(text.replace(/[\uD800-\uDFFF]/gu, '\uFFFD'))

/**
 * Above about 2,000 characters Windows cuts a mailto link, or hands it to no mail program at all.
 * Percent-encoding makes six characters of a Cyrillic or a Greek letter, so a message of 200 letters
 * in such a language gets there, and in the text of a plain link the link stands behind the message.
 */
const MAILTO_MAX_LENGTH = 2000

/**
 * A mailto link (RFC 6068): the address where one is known, the subject and the text. Line breaks
 * as CRLF, as the norm wants them.
 *
 * @param {string} address may be empty
 * @param {string} subject
 * @param {string} text
 * @returns {string}
 */
export const mailtoHref = (address, subject, text) =>
  `mailto:${mailtoAddress(address)}?subject=${encoded(subject)}` +
  `&body=${encoded(text.replace(/\n/g, '\r\n'))}`

/** The picture as the mail gets it: the measure of the messenger's preview, 36 : 25. */
const pictureAsPng = async (source) => {
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = THANK_YOU_MOTIF_WIDTH * 3
  canvas.height = THANK_YOU_MOTIF_HEIGHT * 3
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('no picture'))),
      // ⛔ PNG and nothing else: no browser takes a JPEG into the clipboard.
      'image/png',
    )
  })
}

/**
 * "Per E-Mail": the member's own mail program, with the address where it is known, a subject, the
 * sentence and the link. The link cannot carry a picture (RFC 6068), so the picture of a greeting
 * goes into the clipboard with the same tap, to be pasted if the member likes.
 *
 * `href` belongs on a real link and `copyPicture` on its click. ⛔ Never `preventDefault`, and never
 * `window.location` after a wait: the browser itself opens the mail program from the tap.
 *
 * ⛔ The clipboard is written within the tap (Safari refuses anything later), its promise is not
 * waited for, and a refusal says nothing: the mail opens all the same, and the mail is whole
 * without the picture.
 *
 * @param {object} options
 * @param {string | import('vue').Ref<string>} options.text the text of the mail: `linkText`
 * @param {string | import('vue').Ref<string>} [options.shortText] the text where that would make the
 *   link too long for a mail program (MAILTO_MAX_LENGTH): `shortLinkText`
 * @param {object | null} [options.greeting] the link's greeting, for the subject
 * @param {string} [options.address] the recipient, where one is known
 * @param {string | null | (() => string | null)} [options.picture] an address the picture can be
 *   loaded from, or nothing where there is no picture at hand
 */
export const useSendByEmail = ({
  text,
  shortText = text,
  greeting = null,
  address = '',
  picture = null,
}) => {
  const { t } = useI18n()
  const store = useWalletStore()

  // Under the member's user name, never the real name (NU-021).
  const subject = computed(() => {
    const name = memberAlias(store.username, store.gradidoID)
    return greeting
      ? t('thank-you-greeting.share.email-subject', { name })
      : t('gdd_per_link.email-subject', { name })
  })

  const mailto = (body) => mailtoHref(toValue(address), subject.value, body)
  const tooLong = computed(() => mailto(toValue(text)).length > MAILTO_MAX_LENGTH)

  const href = computed(() => mailto(toValue(tooLong.value ? shortText : text)))

  const hint = computed(() =>
    [
      t('gdd_per_link.opens-mail-program'),
      // The page may quote the whole text as what goes out: here it is said where the words are.
      tooLong.value && toValue(shortText) !== toValue(text)
        ? t('gdd_per_link.memo-stays-on-page')
        : null,
      toValue(picture) && takesPictureInClipboard() ? t('gdd_per_link.picture-in-clipboard') : null,
    ]
      .filter(Boolean)
      .join(' '),
  )

  // The picture is made once, for the source it was made of. `blob` once it stands, `png` until
  // then: a tap before that hands the promise on, which the clipboard waits for itself.
  let made = null
  const madeOf = (source) => {
    if (made?.source !== source) {
      const making = { source, blob: null, png: pictureAsPng(source) }
      making.png.then(
        (blob) => {
          making.blob = blob
        },
        // A tap that hands this promise on finds the refusal in `write`. The next tap tries again:
        // a line that was gone for a moment must not leave this without a picture for good.
        () => {
          if (made === making) made = null
        },
      )
      made = making
    }
    return made
  }

  /** Makes the picture ahead of the tap, where it is plain that a tap may come. */
  const preparePicture = () => {
    const source = toValue(picture)
    if (source && takesPictureInClipboard()) madeOf(source)
  }

  const copyPicture = () => {
    const source = toValue(picture)
    if (!source || !takesPictureInClipboard()) return
    try {
      const { blob, png } = madeOf(source)
      writePictureToClipboard(blob ?? png).catch(() => {})
    } catch {
      // Silent, as the refusal above: the mail opens all the same.
    }
  }

  return { href, hint, copyPicture, preparePicture }
}
