// AI-GENERATED — not an architecture reference
import { defineComponent, type PropType } from 'vue'

/** The steps of the send page, one slot of `GddSend` each. */
export const TRANSACTION_STEPS = {
  transactionForm: 'transactionForm',
  transactionConfirmationSend: 'transactionConfirmationSend',
  transactionConfirmationLink: 'transactionConfirmationLink',
  transactionResultSendSuccess: 'transactionResultSendSuccess',
  transactionResultSendError: 'transactionResultSendError',
  transactionResultLink: 'transactionResultLink',
  sendEmailResultSuccess: 'sendEmailResultSuccess',
  sendEmailResultError: 'sendEmailResultError',
  recipientNotFound: 'recipientNotFound',
  sendByEmailReady: 'sendByEmailReady',
} as const

export type TransactionStep = keyof typeof TRANSACTION_STEPS

/** Shows the slot of the step the page stands on, and nothing of the others. */
export const GddSend = defineComponent({
  name: 'GddSend',
  props: {
    currentTransactionStep: {
      type: String as PropType<TransactionStep>,
      default: TRANSACTION_STEPS.transactionForm,
      validator: (transactionStep: string) =>
        TRANSACTION_STEPS[transactionStep as TransactionStep] !== undefined,
    },
  },
  setup(props, { slots }) {
    return () => <div class='gdd-send'>{slots[props.currentTransactionStep]?.()}</div>
  },
})
