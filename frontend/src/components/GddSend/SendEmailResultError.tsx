// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { isRecipientNotFoundError } from '@/utils/recipientNotFound'

/** A letter that did not go out: what the server said, in the wallet's words where it has them. */
export const SendEmailResultError = defineComponent({
  // ⚠️ The .vue file named itself `TransactionResultSendError`, the name of the component beside
  // it. It carries its own name now.
  name: 'SendEmailResultError',
  props: {
    error: { type: Boolean, default: false },
    errorResult: { type: String, default: '' },
  },
  emits: ['on-back'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const reason = () => {
      const errorResult = props.errorResult
      if (isRecipientNotFoundError(errorResult)) {
        return (
          <div class='test-receiver-not-found'>{t('form.sendemailerror.receiverNotFound')}</div>
        )
      }
      if (errorResult.includes('The recipient account was deleted')) {
        return <div class='test-receiver-not-found'>{t('form.sendemailerror.receiverDeleted')}</div>
      }
      if (errorResult.includes('The recipient community was not found')) {
        return (
          <div class='test-receiver-not-found'>
            {t('form.sendemailerror.receiverCommunityNotFound')}
          </div>
        )
      }
      if (errorResult.includes('The recipient community has no federated communities')) {
        return (
          <div class='test-receiver-not-found'>
            {t('form.sendemailerror.receiverCommunityNoFederatedCommunities')}
          </div>
        )
      }
      if (
        errorResult.includes('The federated community of the recipient community was not found')
      ) {
        return (
          <div class='test-receiver-not-found'>
            {t('form.sendemailerror.federatedCommunityOfReceiverCommunityNotFound')}
          </div>
        )
      }
      if (errorResult.includes('sendCommand failed with response error: ')) {
        return (
          <div class='test-receiver-not-found'>
            {t('form.sendemailerror.failedToSendCommandToFederatedCommunity')}{' '}
            {errorResult.split('sendCommand failed with response error: ')[1]}
          </div>
        )
      }
      if (errorResult.includes('You cannot send an email to yourself')) {
        return <div>{t('form.sendemailerror.youCannotSendEmailToYourself')}</div>
      }
      return (
        <div>
          {t('form.sendemailerror.unknownError')} {errorResult}
        </div>
      )
    }

    return () => (
      <div class='bg-white app-box-shadow gradido-border-radius p-4'>
        <div>
          <div class='gradido-font-15rem'>{t('form.sorry')}</div>
          <hr />

          <div class='test-send_transaction_error'>{t('form.send_email_error')}</div>

          <hr />
          {reason()}
        </div>
        <p class='text-center mt-5'>
          <BButton variant='secondary' onClick={() => emit('on-back')}>
            {t('form.close')}
          </BButton>
        </p>
      </div>
    )
  },
})
