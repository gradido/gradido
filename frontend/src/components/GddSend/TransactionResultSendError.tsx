// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { isRecipientNotFoundError } from '@/utils/recipientNotFound'

/** A transfer that failed: the server's sentence, or the wallet's where nobody was found. */
export const TransactionResultSendError = defineComponent({
  name: 'TransactionResultSendError',
  props: {
    error: { type: Boolean, default: false },
    errorResult: { type: String, default: '' },
  },
  emits: ['on-back'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => (
      <div class='bg-white app-box-shadow gradido-border-radius p-4'>
        <div>
          <div class='gradido-font-15rem'>{t('form.sorry')}</div>
          <hr />

          <div class='test-send_transaction_error'>{t('form.send_transaction_error')}</div>

          <hr />
          {isRecipientNotFoundError(props.errorResult) ? (
            <div class='test-receiver-not-found'>{t('transaction.receiverNotFound')}</div>
          ) : (
            <div>{props.errorResult}</div>
          )}
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
