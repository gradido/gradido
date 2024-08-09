<template>
  <div>
    <gdd-send :current-transaction-step="currentTransactionStep">
      <template #transactionForm>
        <transaction-form
          v-bind="transactionData"
          :balance="balance"
          @set-transaction="setTransaction"
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
        <transaction-result-send-success @on-back="onBack"></transaction-result-send-success>
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
    </gdd-send>
  </div>
</template>
<!--<script>-->
<!--import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend'-->
<!--import TransactionForm from '@/components/GddSend/TransactionForm'-->
<!--import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend'-->
<!--import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink'-->
<!--import TransactionResultSendSuccess from '@/components/GddSend/TransactionResultSendSuccess'-->
<!--import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError'-->
<!--import TransactionResultLink from '@/components/GddSend/TransactionResultLink'-->
<!--import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'-->

<!--const EMPTY_TRANSACTION_DATA = {-->
<!--  identifier: '',-->
<!--  amount: 0,-->
<!--  memo: '',-->
<!--}-->

<!--export const SEND_TYPES = {-->
<!--  send: 'send',-->
<!--  link: 'link',-->
<!--}-->

<!--export default {-->
<!--  name: 'Send',-->
<!--  components: {-->
<!--    GddSend,-->
<!--    TransactionForm,-->
<!--    TransactionConfirmationSend,-->
<!--    TransactionConfirmationLink,-->
<!--    TransactionResultSendSuccess,-->
<!--    TransactionResultSendError,-->
<!--    TransactionResultLink,-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      transactionData: { ...EMPTY_TRANSACTION_DATA },-->
<!--      error: false,-->
<!--      errorResult: '',-->
<!--      currentTransactionStep: TRANSACTION_STEPS.transactionForm,-->
<!--      loading: false,-->
<!--      link: null,-->
<!--    }-->
<!--  },-->
<!--  props: {-->
<!--    balance: { type: Number, default: 0 },-->
<!--    GdtBalance: { type: Number, default: 0 },-->
<!--    transactions: {-->
<!--      default: () => [],-->
<!--    },-->
<!--    pending: {-->
<!--      type: Boolean,-->
<!--      default: true,-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    setTransaction(data) {-->
<!--      this.transactionData = { ...data }-->
<!--      switch (data.selected) {-->
<!--        case SEND_TYPES.send:-->
<!--          this.currentTransactionStep = TRANSACTION_STEPS.transactionConfirmationSend-->
<!--          break-->
<!--        case SEND_TYPES.link:-->
<!--          this.currentTransactionStep = TRANSACTION_STEPS.transactionConfirmationLink-->
<!--          break-->
<!--      }-->
<!--    },-->
<!--    async sendTransaction() {-->
<!--      this.loading = true-->
<!--      this.error = false-->
<!--      switch (this.transactionData.selected) {-->
<!--        case SEND_TYPES.send:-->
<!--          this.$apollo-->
<!--            .mutate({-->
<!--              mutation: sendCoins,-->
<!--              variables: {-->
<!--                // from target community we need only the uuid-->
<!--                recipientCommunityIdentifier: this.transactionData.targetCommunity.uuid,-->
<!--                recipientIdentifier: this.transactionData.identifier,-->
<!--                amount: this.transactionData.amount,-->
<!--                memo: this.transactionData.memo,-->
<!--              },-->
<!--            })-->
<!--            .then(() => {-->
<!--              this.error = false-->
<!--              this.$emit('set-tunneled-email', null)-->
<!--              this.updateTransactions({})-->
<!--              this.transactionData = { ...EMPTY_TRANSACTION_DATA }-->
<!--              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultSendSuccess-->
<!--            })-->
<!--            .catch((error) => {-->
<!--              this.errorResult = error.message-->
<!--              this.error = true-->
<!--              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultSendError-->
<!--            })-->
<!--          break-->
<!--        case SEND_TYPES.link:-->
<!--          this.$apollo-->
<!--            .mutate({-->
<!--              mutation: createTransactionLink,-->
<!--              variables: { amount: this.transactionData.amount, memo: this.transactionData.memo },-->
<!--            })-->
<!--            .then((result) => {-->
<!--              this.$emit('set-tunneled-email', null)-->
<!--              const {-->
<!--                data: {-->
<!--                  createTransactionLink: { link, amount, memo, validUntil },-->
<!--                },-->
<!--              } = result-->
<!--              this.link = link-->
<!--              this.amount = amount-->
<!--              this.memo = memo-->
<!--              this.validUntil = validUntil-->
<!--              this.transactionData = { ...EMPTY_TRANSACTION_DATA }-->
<!--              this.currentTransactionStep = TRANSACTION_STEPS.transactionResultLink-->
<!--              this.updateTransactions({})-->
<!--            })-->
<!--            .catch((error) => {-->
<!--              this.toastError(error.message)-->
<!--            })-->
<!--          break-->
<!--        default:-->
<!--          throw new Error(`undefined transactionData.selected : ${this.transactionData.selected}`)-->
<!--      }-->
<!--      this.loading = false-->
<!--      this.$router.push({ path: '/send' })-->
<!--    },-->
<!--    onBack() {-->
<!--      this.currentTransactionStep = TRANSACTION_STEPS.transactionForm-->
<!--      this.$mount()-->
<!--    },-->
<!--    updateTransactions(pagination) {-->
<!--      this.$emit('update-transactions', pagination)-->
<!--    },-->
<!--  },-->
<!--  created() {-->
<!--    this.updateTransactions({})-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend'
import TransactionForm from '@/components/GddSend/TransactionForm'
import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend'
import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink'
import TransactionResultSendSuccess from '@/components/GddSend/TransactionResultSendSuccess'
import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError'
import TransactionResultLink from '@/components/GddSend/TransactionResultLink'
import { sendCoins, createTransactionLink } from '@/graphql/mutations.js'
import { useAppToast } from '@/composables/useToast'
import { SEND_TYPES } from '@/utils/sendTypes'

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
const { toastError } = useAppToast()

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

function setTransaction(data) {
  Object.assign(transactionData, data)
  currentTransactionStep.value =
    data.selected === SEND_TYPES.send
      ? TRANSACTION_STEPS.transactionConfirmationSend
      : TRANSACTION_STEPS.transactionConfirmationLink
}

async function sendTransaction() {
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
    } else {
      throw new Error(`undefined transactionData.selected : ${transactionData.selected}`)
    }
  } catch (error) {
    if (transactionData.selected === SEND_TYPES.send) {
      errorResult.value = error.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendError
    } else {
      toastError(error.message)
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

// Equivalent to created hook
updateTransactions({})

// Expose necessary methods and reactive variables
// defineExpose({
//   setTransaction,
//   sendTransaction,
//   onBack,
//   updateTransactions,
//   transactionData,
//   error,
//   errorResult,
//   currentTransactionStep,
//   loading,
//   link,
//   amount,
//   memo,
//   validUntil,
// })
</script>
