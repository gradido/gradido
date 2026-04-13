<template>
  <div>
    <gdd-send :current-transaction-step="currentTransactionStep">
      <template #transactionForm>
        <transaction-form
          v-bind="transactionData"
          :balance="balance"
          @send-email="sendEmail"
          @set-transaction="setTransaction"
          @set-send-type="handleSendTypeChange"
        ></transaction-form>
      </template>
      <template #transactionConfirmationSend>
        <transaction-confirmation-send
          :balance="balance"
          v-bind="transactionData"
          @send-transaction="sendTransaction"
          @on-back="onBack"
        ></transaction-confirmation-send>
      </template>
      <template #transactionConfirmationLink>
        <transaction-confirmation-link
          :balance="balance"
          :email="transactionData.identifier"
          :amount="transactionData.amount"
          :memo="transactionData.memo"
          :loading="loading"
          @send-transaction="sendTransaction"
          @on-back="onBack"
        ></transaction-confirmation-link>
      </template>
      <template #transactionResultSendSuccess>
        <success-message
          :message="$t('form.send_transaction_success')"
          @on-back="onBack"
        ></success-message>
      </template>
      <template #transactionResultSendError>
        <transaction-result-send-error
          :error="error"
          :error-result="errorResult"
          @on-back="onBack"
        ></transaction-result-send-error>
      </template>
      <template #transactionResultLink>
        <transaction-result-link
          :link="link"
          :amount="amount"
          :memo="memo"
          :valid-until="validUntil"
          @on-back="onBack"
        ></transaction-result-link>
      </template>
      <template #sendEmailForm>
        <email-send-form
          :balance="balance"
          v-bind="transactionData"
          @send-transaction="sendEmail"
          @on-back="onBack"
        ></email-send-form>
      </template>
    </gdd-send>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend'
import TransactionForm from '@/components/GddSend/TransactionForm'
import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend'
import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink'
import SuccessMessage from '@/components/SuccessMessage'
import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError'
import TransactionResultLink from '@/components/GddSend/TransactionResultLink'
import { sendCoins, createTransactionLink, sendEmail as sendEmailMut } from '@/graphql/mutations.js'
import { useAppToast } from '@/composables/useToast'
import { SEND_TYPES } from '@/utils/sendTypes'
import EmailSendForm from '@/components/GddSend/EmailSendForm'

const { t } = useI18n()
const EMPTY_TRANSACTION_DATA = {
  identifier: '',
  amount: 0,
  memo: '',
}

const props = defineProps({
  balance: { type: Number, default: 0 },
  GdtBalance: { type: Number, default: 0 },
  transactions: {
    type: Array,
    default: () => [],
  },
  pending: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['set-tunneled-email', 'update-transactions'])

const router = useRouter()
const { toastError, toastSuccess } = useAppToast()

const transactionData = reactive({ ...EMPTY_TRANSACTION_DATA })
const error = ref(false)
const errorResult = ref('')
const currentTransactionStep = ref(TRANSACTION_STEPS.transactionForm)
const loading = ref(false)
const link = ref(null)
const amount = ref(0)
const memo = ref('')
const validUntil = ref(null)

const { mutate: sendCoinsMutation } = useMutation(sendCoins)
const { mutate: createTransactionLinkMutation } = useMutation(createTransactionLink)
const { mutate: sendEmailMutation } = useMutation(sendEmailMut)

const handleSendTypeChange = (sendType) => {
  // console.log('handleSendTypeChange', sendType)
  // Update the radioSelected in transactionData
  transactionData.selected = sendType
  // Optionally, you could also update the currentTransactionStep
  // if you want different initial states for each send type
  if (sendType === SEND_TYPES.email) {
    currentTransactionStep.value = TRANSACTION_STEPS.sendEmailForm
  } else {
    currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
  }
  // console.log('currentTransactionStep', currentTransactionStep.value)
}

function setTransaction(data) {
  // console.log('setTransaction', data)
  Object.assign(transactionData, data)
  switch (data.selected) {
    case SEND_TYPES.send:
      // console.log('data.selected=' + SEND_TYPES.send)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
    case SEND_TYPES.link:
      // console.log('data.selected=' + SEND_TYPES.link)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationLink
      break
    case SEND_TYPES.email:
      // console.log('data.selected=' + SEND_TYPES.email)
      // currentTransactionStep.value = TRANSACTION_STEPS.sendEmail
      break
    default:
      // console.log('data.selected=default')
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
  }
  // console.log('currentTransactionStep', currentTransactionStep.value)
}

async function sendEmail(data) {
  // console.log('sendEmail', data)
  // Object.assign(transactionData, data)
  if (data.selected === SEND_TYPES.email) {
    // console.log('data.selected=' + data.selected)
    // TODO: Implement email sending logic
    const result = await sendEmailMutation({
      recipientCommunityIdentifier: data.targetCommunity.uuid,
      recipientIdentifier: data.identifier,
      subject: data.subject,
      memo: data.memo,
    })
    if (result) {
      toastSuccess(t('email-sent-success'))
    } else {
      toastError(t('email-sent-error'))
    }
    // console.log('sendEmail result', result)
  }
}

async function sendTransaction() {
  // console.log('sendTransaction() transactionData=', JSON.stringify(transactionData))
  loading.value = true
  error.value = false

  try {
    if (transactionData.selected === SEND_TYPES.send) {
      await sendCoinsMutation({
        recipientCommunityIdentifier: transactionData.targetCommunity.uuid,
        recipientIdentifier: transactionData.identifier,
        amount: transactionData.amount,
        memo: transactionData.memo,
      })

      error.value = false
      emit('set-tunneled-email', null)
      updateTransactions({})
      Object.assign(transactionData, EMPTY_TRANSACTION_DATA)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendSuccess
    } else if (transactionData.selected === SEND_TYPES.link) {
      const result = await createTransactionLinkMutation({
        amount: transactionData.amount,
        memo: transactionData.memo,
      })

      emit('set-tunneled-email', null)
      const {
        link: newLink,
        amount: newAmount,
        memo: newMemo,
        validUntil: newValidUntil,
      } = result.data.createTransactionLink
      link.value = newLink
      amount.value = newAmount
      memo.value = newMemo
      validUntil.value = newValidUntil
      Object.assign(transactionData, EMPTY_TRANSACTION_DATA)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultLink
      updateTransactions({})
    } else if (transactionData.selected === SEND_TYPES.email) {
      // console.log('sendTransaction()=email transactionData=' + transactionData)
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailForm
      // throw new Error('Email transaction sending not implemented yet')
    } else {
      throw new Error(`undefined transactionData.selected : ${transactionData.selected}`)
    }
  } catch (err) {
    if (transactionData.selected === SEND_TYPES.send) {
      errorResult.value = err.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendError
    } else if (transactionData.selected === SEND_TYPES.email) {
      errorResult.value = err.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendError
    } else {
      toastError(err.message)
    }
  } finally {
    loading.value = false
    await router.push({ path: '/send' })
  }
}

function onBack() {
  currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
}

function updateTransactions(pagination) {
  emit('update-transactions', pagination)
}
</script>
