// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { useSendByEmail } from '@/composables/useSendByEmail'
import { useThankYouGreetingSheet } from '@/composables/useThankYouGreetingSheet'
import { useWalletStore } from '@/store/useWalletStore'
import { focusStepHeading } from '@/utils/focusStepHeading'
import { memberAlias } from '@/utils/gradidoAddress'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import classes from './ThankYouGreetingDone.module.scss'

/** The greeting of a link as the server answers it; a plain link carries none. */
export type ThankYouGreetingOfLink = {
  motif?: string | null
  hasPicture?: boolean
  recipientName?: string | null
  [field: string]: unknown
}

/**
 * `createTransactionLink` as it answered: link, amount, memo, validUntil, greeting -- and
 * `picture`, the photo as the page made it, where the greeting carries one.
 */
export type ThankYouGreetingCreated = {
  id?: number | null
  link: string
  amount: string
  memo: string
  validUntil: string
  greeting?: ThankYouGreetingOfLink | null
  picture?: string | null
}

/**
 * A thank-you greeting is made: share it, copy its link -- or print it.
 *
 * Everything here is the server's answer to `createTransactionLink` -- the link, until when
 * it waits, whom it is for -- not what the form held. The one thing that is the page's own is
 * the photo of a greeting that carries one (`created.picture`): the server says THAT there is a
 * photo, and the page shows the one it made.
 *
 * The sentence that goes out with the link is in the first person and carries neither the
 * sender's words nor the amount (ZE-017, F3): those stand on the card, behind the link. It
 * stands here word for word, because it is what the other person reads first.
 *
 * On paper the greeting is a sheet that folds into a card, printed or saved as a picture
 * (useThankYouGreetingSheet). Its photo, where it carries one, is the same `created.picture`.
 *
 * "Noch einen für jemand anderen" makes nothing here: it asks the page for a new greeting
 * (`another`), and the page begins one with what this one carried.
 *
 * "Per E-Mail" opens the member's own mail program (useSendByEmail). The send form leads here too,
 * for a thank-you to somebody without an account (pages/Send.vue): with the address in
 * `emailAddress`, where the mail is all the card holds, and without a greeting where no picture was
 * chosen -- a plain link, whose text then carries the amount and the message.
 */
export const ThankYouGreetingDone = defineComponent({
  name: 'ThankYouGreetingDone',
  props: {
    // `createTransactionLink` as it answered: link, amount, memo, validUntil, greeting -- and
    // `picture`, the photo as the page made it, where the greeting carries one.
    created: { type: Object as PropType<ThankYouGreetingCreated>, required: true },
    // Whom the mail is for, where the member named somebody: only in the memory of the page.
    emailAddress: { type: String, default: '' },
  },
  emits: ['another'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const store = useWalletStore()

    const isGreeting = computed(() => Boolean(props.created.greeting))
    const motif = computed(() => thankYouMotif(props.created.greeting?.motif, t))
    const hasPhoto = computed(() => props.created.greeting?.hasPicture === true)
    // Whose photo it is, by the name the card shows: the member's own user name (NU-021).
    const photoAlt = computed(() =>
      t('thank-you-greeting.photo-of', {
        name: memberAlias(store.username, store.gradidoID),
      }),
    )
    const recipientName = computed(() => props.created.greeting?.recipientName ?? '')
    const title = computed(() => {
      if (props.emailAddress) {
        return t('thank-you-greeting.done.title-for-address', { address: props.emailAddress })
      }
      if (!isGreeting.value) {
        return t('thank-you-greeting.done.title-plain')
      }
      return recipientName.value
        ? t('thank-you-greeting.done.title-for', { name: recipientName.value })
        : t('thank-you-greeting.done.title')
    })
    const validUntilDate = computed(() => new Date(props.created.validUntil))

    // A greeting that is made does not change: the composable takes it as it is now.
    // ⚠️ `null` for a plain link, not an empty object: that is true, and would give it the greeting's
    // sentence, without the amount and without the words.
    const { canCopyLink, copyLink, linkText, shortLinkText, share } = useCopyLinks({
      link: props.created.link,
      amount: props.created.amount,
      memo: props.created.memo,
      validUntil: props.created.validUntil,
      greeting: props.created.greeting ?? null,
    })

    // The picture for the clipboard: the one this page shows. Made as soon as the view stands, because
    // the tap has to write it at once.
    const {
      href: emailHref,
      hint: emailHint,
      copyPicture,
      preparePicture,
    } = useSendByEmail({
      text: linkText,
      shortText: shortLinkText,
      greeting: props.created.greeting ?? null,
      address: () => props.emailAddress,
      picture: () => (hasPhoto.value ? props.created.picture : null) ?? motif.value?.src ?? null,
    })
    // From the send form this is a step of that page, without a change of address to bring it into view
    // and with the button that led here gone: the title takes the focus (the way of a greeting has its
    // own page for this).
    const titleElement = ref<HTMLHeadingElement | null>(null)
    onMounted(() => {
      preparePicture()
      if (props.emailAddress && titleElement.value) {
        focusStepHeading(titleElement.value)
      }
    })

    // The same greeting on paper. This page can offer a second tap where the share sheet wants one.
    const { saveWaits, printGreetingSheet, saveGreetingSheet } = useThankYouGreetingSheet(
      {
        id: props.created.id,
        link: props.created.link,
        amount: props.created.amount,
        memo: props.created.memo,
        validUntil: props.created.validUntil,
        greeting: props.created.greeting ?? {},
        picture: props.created.picture ?? null,
      },
      { secondTap: true },
    )

    return () => (
      <div
        class={['thank-you-greeting-done', classes['thank-you-greeting-done']]}
        data-test='thank-you-greeting-done'
      >
        <div class='tyg-done-head page-text'>
          {/* A photo of the member's own: the picture the page made of it a moment ago, not one
              fetched from the server. */}
          {hasPhoto.value && props.created.picture ? (
            <img
              class='tyg-done-motif'
              src={props.created.picture}
              alt={photoAlt.value}
              width={THANK_YOU_MOTIF_WIDTH}
              height={THANK_YOU_MOTIF_HEIGHT}
              data-test='thank-you-greeting-done-photo'
            />
          ) : motif.value ? (
            // ⛔ An <img>, never the SVG inlined: the motifs share the ids of their gradients.
            <img
              class='tyg-done-motif'
              src={motif.value.src}
              alt={motif.value.name}
              width={THANK_YOU_MOTIF_WIDTH}
              height={THANK_YOU_MOTIF_HEIGHT}
              data-test='thank-you-greeting-done-motif'
            />
          ) : null}
          <div class='tyg-done-head-text'>
            <h2
              ref={titleElement}
              class='h4 mb-1 tyg-done-title'
              tabindex='-1'
              data-test='thank-you-greeting-done-title'
            >
              {title.value}
            </h2>
            <div class='tyg-done-muted small' data-test='thank-you-greeting-done-waits'>
              {t('thank-you-greeting.done.waits-until', { date: d(validUntilDate.value, 'short') })}
            </div>
          </div>
        </div>

        <div class='tyg-done-card bg-white app-box-shadow gradido-border-radius'>
          {/* Where an address is known the card holds the mail to it and nothing else (Bernd,
              02.11.2026): the member came for that, and the other buttons stood in the way. Sharing,
              copying and paper stay in the menu of the link in the list, as the page says below. */}
          {/* The device's share sheet where it has one; elsewhere this copies the sentence. */}
          {!props.emailAddress ? (
            <BButton
              // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
              variant={'gradido' as ButtonVariant}
              class='tyg-done-button'
              data-test='thank-you-greeting-share'
              onClick={share}
            >
              {t('gdd_per_link.share')}
            </BButton>
          ) : null}
          {/* A real link: the browser itself opens the mail program from the tap, and the tap puts
              the picture into the clipboard (useSendByEmail). */}
          <BButton
            variant={props.emailAddress ? ('gradido' as ButtonVariant) : 'outline-secondary'}
            class='tyg-done-button'
            href={emailHref.value}
            role='link'
            aria-describedby='tyg-done-email-hint'
            data-test='thank-you-greeting-email'
            onClick={copyPicture}
          >
            {props.emailAddress
              ? t('gdd_per_link.by-email-to', { address: props.emailAddress })
              : t('gdd_per_link.by-email')}
          </BButton>
          <p
            id='tyg-done-email-hint'
            class='tyg-done-email-hint tyg-done-muted mb-0'
            data-test='thank-you-greeting-email-hint'
          >
            {emailHint.value}
          </p>
          {!props.emailAddress ? (
            <BButton
              variant='outline-secondary'
              class='tyg-done-button'
              disabled={!canCopyLink.value}
              data-test='thank-you-greeting-copy'
              onClick={copyLink}
            >
              {t('gdd_per_link.copy-link')}
            </BButton>
          ) : null}
          {/* On paper (ZE-017, F8): the same greeting as an A4 sheet that folds into a card. A group
              of its own under the two ways the link travels, with the sentence that says what
              becomes of the sheet. Neither button is taken away while a sheet is being made -- a
              disabled button loses the keyboard's place; the composable makes one sheet of two taps.
              ⛔ Only a greeting goes onto paper: a plain link has its cheque, elsewhere. */}
          {isGreeting.value && !props.emailAddress ? (
            <div class='tyg-done-paper' role='group' aria-labelledby='tyg-done-paper-title'>
              <div
                id='tyg-done-paper-title'
                class='tyg-done-paper-title'
                data-test='thank-you-greeting-paper-title'
              >
                {t('thank-you-greeting.paper.title')}
              </div>
              <BButton
                variant='outline-secondary'
                class='tyg-done-button'
                data-test='thank-you-greeting-print'
                onClick={printGreetingSheet}
              >
                {t('thank-you-greeting.paper.print')}
              </BButton>
              {/* The quiet way, a line of text: the same sheet as a picture. Where the device's share
                  sheet asked for a tap of its own, this is that tap -- in the chat's words. */}
              <BButton
                variant='link'
                class='tyg-done-save'
                data-test='thank-you-greeting-save'
                onClick={saveGreetingSheet}
              >
                {saveWaits.value
                  ? t('chatThread.imageSaveAgain')
                  : t('thank-you-greeting.paper.save')}
              </BButton>
              <p
                class='tyg-done-paper-hint tyg-done-muted mb-0'
                data-test='thank-you-greeting-paper-hint'
              >
                {t('thank-you-greeting.paper.hint')}
              </p>
            </div>
          ) : null}
        </div>

        <div class='tyg-done-sentence page-text'>
          <div class='tyg-done-label'>
            {isGreeting.value
              ? t('thank-you-greeting.done.sentence-lead')
              : t('thank-you-greeting.done.sentence-lead-plain')}
          </div>
          {/* Exactly what goes out, so what the member reads here is what arrives. */}
          <blockquote class='tyg-done-quote' data-test='thank-you-greeting-share-text'>
            {linkText.value}
          </blockquote>
          {/* With an address the text goes into the member's own mail program, where it can be
              adjusted and added to (E-045) -- with a greeting and without one. Shared, it is the
              sentence the share sheet sends. */}
          <p class='tyg-done-muted small mb-0' data-test='thank-you-greeting-edit-hint'>
            {props.emailAddress
              ? t('thank-you-greeting.done.edit-hint-email')
              : isGreeting.value
                ? t('thank-you-greeting.done.edit-hint')
                : t('thank-you-greeting.done.edit-hint-plain')}
          </p>
        </div>

        <div class='tyg-done-foot tyg-done-muted small page-text'>
          {/* With a photo the sentence names it: whoever has the link sees the photo. */}
          <p data-test='thank-you-greeting-link-hint'>
            {hasPhoto.value
              ? t('thank-you-greeting.done.link-hint-photo')
              : t('thank-you-greeting.done.link-hint')}
          </p>
          <p class='mb-0' data-test='thank-you-greeting-find-again'>
            {t('thank-you-greeting.done.find-again', {
              transactions: t('navigation.transactions'),
              links: t('gdd_per_link.links_sum'),
            })}
          </p>
        </div>

        {/* One more of the same for the next person (ZE-030), under everything: the page begins a
            new greeting with all this one carried, and asks only whom it is for. Outlined, as
            "Karte drucken" is, and as wide as its words. */}
        <div class='tyg-done-another'>
          <BButton
            variant='outline-secondary'
            data-test='thank-you-greeting-another'
            onClick={() => emit('another')}
          >
            {t('thank-you-greeting.done.another')}
          </BButton>
        </div>
      </div>
    )
  },
})
