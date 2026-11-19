// AI-GENERATED — not an architecture reference
import { BButton, BForm, type ButtonVariant } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, type PropType, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { AccountFields } from '@/components/Auth/AccountFields'
import { memberAlias } from '@/utils/gradidoAddress'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import classes from './RedeemThanksAccount.module.scss'
import type { RedeemLinkData } from './RedeemThanksPaper'

/** What the form hands to the page with `submit`. */
export type RedeemThanksAccountValues = {
  firstName: string
  lastName: string
  email: string
  password: string
}

/**
 * "Konto anlegen", on the page a thank-you arrived on (ZE-017 F5): whoever accepts it and has
 * no account opens one right here -- name, address, password -- and the page signs them in and
 * books the thank-you in one go (pages/TransactionLink.tsx).
 *
 * This view only asks. It hands what was typed to the page with `submit` and keeps none of it:
 * ⛔ the password stands in the form alone -- not in the address, not in the store (which is
 * mirrored to localStorage), not in a message.
 *
 * "Vorname" starts empty, whomever the greeting names: the sender writes there what they call
 * the person -- a nickname as readily as a name -- and an account is opened under one's own.
 */
export const RedeemThanksAccount = defineComponent({
  name: 'RedeemThanksAccount',
  props: {
    linkData: { type: Object as PropType<RedeemLinkData>, required: true },
    // The page is opening the account, signing in or booking: the button waits.
    accepting: { type: Boolean, default: false },
    // The photo of a greeting that carries one, as the page holds it; null where none has come.
    picture: { type: String as PropType<string | null>, default: null },
  },
  emits: ['submit'],
  setup(props, { emit, slots }) {
    const { t } = useI18n()

    // As on the sheet: under their user name, never under their real name (NU-021).
    const senderName = computed<string>(() =>
      memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
    )

    const motif = computed(() => thankYouMotif(props.linkData.greeting?.motif, t))
    const hasPhoto = computed(() => props.linkData.greeting?.hasPicture === true)

    // The fields register themselves with this form (AccountFields).
    const { meta: formMeta, handleSubmit } = useForm()

    const onSubmit = handleSubmit((values) => {
      if (props.accepting) {
        return
      }
      emit('submit', {
        firstName: values.firstname,
        lastName: values.lastname,
        email: values.email,
        password: values.newPassword,
      })
    })

    // A photo of the sender's own, the one the sheet showed a moment ago: the page hands
    // it on. Its room stands where it has not come.
    const stripPicture = () => {
      if (hasPhoto.value && props.picture) {
        return (
          <img
            class='redeem-thanks-strip-picture is-photo'
            src={props.picture}
            alt={t('thank-you-greeting.photo-of', { name: senderName.value })}
            width={THANK_YOU_MOTIF_WIDTH}
            height={THANK_YOU_MOTIF_HEIGHT}
            data-test='redeem-thanks-strip-photo'
          />
        )
      }
      if (hasPhoto.value) {
        return (
          <span
            class='redeem-thanks-strip-picture is-photo'
            aria-hidden='true'
            data-test='redeem-thanks-strip-photo-room'
          />
        )
      }
      if (motif.value) {
        return (
          <img
            class='redeem-thanks-strip-picture'
            src={motif.value.src}
            alt=''
            width={THANK_YOU_MOTIF_WIDTH}
            height={THANK_YOU_MOTIF_HEIGHT}
            data-test='redeem-thanks-strip-motif'
          />
        )
      }
      if (props.linkData.senderAvatar) {
        // Not read out: the sentence beside it names the sender.
        return (
          <img
            class='redeem-thanks-strip-face'
            src={`data:image/jpeg;base64,${props.linkData.senderAvatar}`}
            alt=''
            aria-hidden='true'
            width='48'
            height='48'
            data-test='redeem-thanks-strip-face'
          />
        )
      }
      return null
    }

    return () => (
      <div class={['redeem-thanks-open-account', classes['redeem-thanks-open-account']]}>
        {/* The house's strip, as above the registration form ("… hat Dir Gradido gezeigt"): who
            sent the thank-you, with the greeting's picture small. Where the link has no picture of
            its own, the face of the sender stands there, as the sheet showed it. */}
        <p class='alert gradido-border-radius redeem-thanks-strip' data-test='redeem-thanks-strip'>
          {stripPicture()}
          <span>{t('redeem-thanks.account-strip', { name: senderName.value })}</span>
        </p>
        <h2 class='h4 redeem-thanks-title' data-test='redeem-thanks-title'>
          {t('redeem-thanks.account-title')}
        </h2>
        <p class='redeem-thanks-account-text' data-test='redeem-thanks-account-text'>
          {t('redeem-thanks.account-text')}
        </p>
        <BForm
          class='redeem-thanks-form'
          role='form'
          onSubmit={withModifiers(onSubmit, ['prevent'])}
        >
          {/* The fields of the registration form, with its checks and its words (AccountFields).
              The sentence under the passwords names who sees that the confirmation is missing
              until it is there (E-020). */}
          <AccountFields withPassword guarantorName={senderName.value} />
          <div class='redeem-thanks-actions'>
            {/* The word of the card (F4: nothing small under it). Locked while the page opens the
                account, signs in and books: a second tap asks nothing. */}
            <BButton
              type='submit'
              class='redeem-thanks-accept'
              disabled={!formMeta.value.valid || props.accepting}
              variant={(!formMeta.value.valid ? 'gradido-disable' : 'gradido') as ButtonVariant}
              data-test='redeem-thanks-open-account'
            >
              {t('redeem-thanks.accept')}
            </BButton>
          </div>
        </BForm>
        {/* The way in for somebody who has an account, as under the thank-you. */}
        {slots.default?.()}
      </div>
    )
  },
})
