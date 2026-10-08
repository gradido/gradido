<template>
  <div>
    <gdd-send :current-transaction-step="currentTransactionStep">
      <template #transactionForm>
        <transaction-form
          v-bind="transactionData"
          v-model:picture="picture"
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
          :picture="pictureToSend"
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
      <template #sendEmailResultSuccess>
        <success-message
          :message="$t('form.send_email_success')"
          @on-back="onBack"
        ></success-message>
      </template>
      <template #sendEmailResultError>
        <send-email-result-error
          :error="error"
          :error-result="errorResult"
          @on-back="onBack"
        ></send-email-result-error>
      </template>
    </gdd-send>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend'
import TransactionForm from '@/components/GddSend/TransactionForm'
import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend'
import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink'
import SuccessMessage from '@/components/SuccessMessage'
import SendEmailResultError from '@/components/GddSend/SendEmailResultError'
import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError'
import TransactionResultLink from '@/components/GddSend/TransactionResultLink'
import { sendCoins, createTransactionLink, sendEmail as sendEmailMut } from '@/graphql/mutations.js'
import { useAppToast } from '@/composables/useToast'
import { SEND_TYPES } from '@/utils/sendTypes'
import { chatImageProblemWords, encodeChatImage } from '@/utils/chatImage'
import { THANK_YOU_PICTURE_SMALL, thankYouPictureInput } from '@/utils/thankYouPicture'

const { t } = useI18n()
const EMPTY_TRANSACTION_DATA = {
  identifier: '',
  amount: 0,
  subject: '',
  memo: '',
}

defineProps({
  balance: { type: Number, default: 0 },
  GdtBalance: { type: Number, default: 0 },
})

const emit = defineEmits(['set-tunneled-email', 'update-transactions'])

const router = useRouter()
const { toastError, toastSuccess } = useAppToast()

const transactionData = reactive({ ...EMPTY_TRANSACTION_DATA })

/**
 * The picture to go with a transfer (ZE-016), or null: `{ motif }`, or `{ photo }` -- the
 * member's own as the picture choice hands it over, decoded and whole.
 *
 * ⛔ BESIDE `transactionData`, not in it: that one is `reactive` and bound as a whole onto the
 * form and the check view, and the form's fields are cast by the validation schema. A decoded
 * photo belongs into a shallowRef, as the page of the greeting keeps its own.
 * ⛔ In this page's memory only: never the store (mirrored into localStorage), never the
 * device's storage, never Apollo's cache.
 *
 * The form is taken down between the steps: "Zurück" finds the picture here. "Zurücksetzen"
 * empties it, and so does a transfer that was sent; one that failed leaves it.
 */
const picture = shallowRef(null)

/**
 * What of it goes with THIS transfer: nothing to a member of another community -- there the
 * form shows a sentence in the field's place, and a picture chosen before waits here untouched
 * -- and nothing with a link.
 */
const pictureToSend = computed(() =>
  transactionData.selected === SEND_TYPES.send && transactionData.targetCommunity?.foreign !== true
    ? picture.value
    : null,
)

/**
 * The picture as the mutation takes it: `{ motif }`, or `{ picture }` -- the photo in the
 * chat's measure (THANK_YOU_PICTURE_SMALL), encoded now, right before it is sent --, or nothing.
 * Rejects with a ChatImageError where the photo cannot be made small enough.
 */
const pictureArguments = async (chosen) => {
  if (chosen?.motif) return { motif: chosen.motif }
  if (chosen?.photo) {
    const small = await encodeChatImage(
      chosen.photo.source,
      chosen.photo.edit,
      THANK_YOU_PICTURE_SMALL,
    )
    return { picture: thankYouPictureInput(small) }
  }
  return {}
}

/** Everything the member entered is let go: after a transfer, a link or a letter went out. */
const forgetEntries = () => {
  Object.assign(transactionData, EMPTY_TRANSACTION_DATA)
  picture.value = null
}
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
  // console.log('Send.vue: setTransaction', data)
  Object.assign(transactionData, data)
  switch (data.selected) {
    case SEND_TYPES.send:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.send)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
    case SEND_TYPES.link:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.link)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationLink
      break
    case SEND_TYPES.email:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.email)
      // console.log('ERROR: setTransaction: mit SEND_TYPES=email darf eigentlich nicht vorkommen!!!')

      // currentTransactionStep.value = TRANSACTION_STEPS.sendEmail
      break
    default:
      // console.log('Send.vue setTransaction: data.selected=default')
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
  }
  // console.log('Send.vue setTransaction: currentTransactionStep', currentTransactionStep.value)
}

async function sendEmail(data) {
  // console.log('Send.vue sendEmail', data)
  Object.assign(transactionData, data)
  loading.value = true
  error.value = false

  try {
    if (data.selected === SEND_TYPES.email) {
      // console.log('Send.vue sendEmail: data.selected=' + data.selected)
      const result = await sendEmailMutation({
        recipientCommunityIdentifier: data.targetCommunity.uuid,
        recipientIdentifier: data.identifier,
        subject: data.subject,
        memo: data.memo,
      })
      if (result) {
        currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
        forgetEntries()
        // toastSuccess(t('email-sent-success'))
      } else {
        currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
        // toastError(t('email-sent-error'))
      }
      // console.log('Send.vue sendEmail: result', result)
    }
  } catch (err) {
    if (transactionData.selected === SEND_TYPES.email) {
      errorResult.value = err.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
    } else {
      toastError(err.message)
    }
  } finally {
    loading.value = false
    // await router.push({ path: '/send' })
  }
}

async function sendTransaction() {
  // console.log('Send.vue sendTransaction(): transactionData=', JSON.stringify(transactionData))
  // One transfer for one press: the photo is encoded before the mutation goes out, and a second
  // press in that time -- or Enter beside a tap -- must not send a second one.
  if (loading.value) return
  loading.value = true
  error.value = false

  try {
    if (transactionData.selected === SEND_TYPES.send) {
      let withPicture
      try {
        withPicture = await pictureArguments(pictureToSend.value)
      } catch (problem) {
        // The photo cannot be made ready: nothing is sent, the chat's sentence says why, and
        // what the member entered -- the picture too -- stands in the form again.
        toastError(chatImageProblemWords(problem?.problem, t))
        currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
        return
      }
      // Without a picture the mutation carries neither of the two arguments.
      await sendCoinsMutation({
        recipientCommunityIdentifier: transactionData.targetCommunity.uuid,
        recipientIdentifier: transactionData.identifier,
        amount: transactionData.amount.toString(),
        memo: transactionData.memo,
        ...withPicture,
      })

      error.value = false
      emit('set-tunneled-email', null)
      // A counterparty was involved, so the contact list may have gained somebody -- see
      // the layout's `updateTransactions`. Creating a LINK names nobody, which is why the
      // two calls below say different things.
      updateTransactions({ contactsChanged: true })
      // The photo as decoded is needed no more. Its bytes are not kept either: the wallet does
      // not learn the booking's id from this answer, and the conversation asks the server.
      forgetEntries()
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendSuccess
    } else if (transactionData.selected === SEND_TYPES.link) {
      const result = await createTransactionLinkMutation({
        amount: transactionData.amount.toString(),
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
      forgetEntries()
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultLink
      updateTransactions({})
    } else if (transactionData.selected === SEND_TYPES.email) {
      // console.log('Send.vue sendTransaction(): email transactionData=' + transactionData)
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
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
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
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
