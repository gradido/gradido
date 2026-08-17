<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="thank-you-card-payment">
    <div v-if="unusable" class="text-center">
      <div class="fs-3 mb-3">{{ $t(`thank-you-card.status.${statusKey}`) }}</div>
      <BButton variant="secondary" :to="{ name: 'Overview' }">
        {{ $t('thank-you-card.back-to-account') }}
      </BButton>
    </div>

    <div v-else-if="step === 'amount'">
      <div class="fs-4 mb-1">{{ $t('thank-you-card.receive.title') }}</div>
      <div class="small text-muted mb-3">{{ $t('thank-you-card.receive.subtitle') }}</div>

      <label class="small" for="tyc-amount">{{ $t('form.amount') }}</label>
      <BFormInput
        id="tyc-amount"
        v-model="amount"
        type="text"
        inputmode="decimal"
        data-test="thank-you-card-amount"
      />

      <label class="small mt-3" for="tyc-memo">{{ $t('form.message') }}</label>
      <BFormInput id="tyc-memo" v-model="memo" type="text" data-test="thank-you-card-memo" />

      <!-- Learned here rather than set in the settings: whoever takes card payments does it
           at the same till every day, and this is the only place the wording is ever needed.
           That saved an entire settings section, and it is what "learned where it is used"
           means literally -- the device learns it, not the account. -->
      <BFormCheckbox v-model="rememberMemo" class="mt-2" data-test="thank-you-card-remember">
        {{ $t('thank-you-card.receive.remember-memo') }}
      </BFormCheckbox>

      <BButton
        class="mt-4 w-100"
        variant="gradido"
        :disabled="!amountIsUsable || busy"
        data-test="thank-you-card-next"
        @click="startPayment"
      >
        {{ $t('thank-you-card.receive.next') }}
      </BButton>
    </div>

    <div v-else-if="step === 'pin'" class="text-center">
      <div class="fs-4 mb-1">{{ $t('thank-you-card.receive.pin-title') }}</div>
      <div class="small text-muted mb-3">
        {{ $t('thank-you-card.receive.pin-subtitle', { amount: amount }) }}
      </div>

      <BFormInput
        v-model="pin"
        type="password"
        inputmode="numeric"
        autocomplete="one-time-code"
        :maxlength="PIN_LENGTH"
        class="text-center fs-3 tyc-pin"
        data-test="thank-you-card-pin"
        @update:model-value="onPinTyped"
      />

      <div v-if="attemptsLeft !== null" class="small text-danger mt-2">
        {{ $t('thank-you-card.status.WRONG_PIN') }} —
        {{ $t('thank-you-card.receive.attempts-left', { n: attemptsLeft }) }}
      </div>
      <div v-else-if="failure" class="small text-danger mt-2">
        {{ $t(`thank-you-card.status.${failure}`) }}
      </div>

      <BButton class="mt-4" variant="secondary" :disabled="busy" @click="cancel">
        {{ $t('form.cancel') }}
      </BButton>
    </div>

    <div v-else-if="step === 'done'" class="text-center">
      <div class="fs-3 mb-2">{{ $t('thank-you-card.receive.thanks') }}</div>
      <div class="mb-3">
        {{ $t('thank-you-card.receive.received', { amount: amount, name: payerName }) }}
      </div>
      <BButton variant="gradido" data-test="thank-you-card-again" @click="reset">
        {{ $t('thank-you-card.receive.next-payment') }}
      </BButton>
    </div>
  </div>
</template>

<script setup>
/**
 * Taking a payment from a printed thank you card.
 *
 * ## Who is who here
 *
 * The person holding this screen is the RECIPIENT and is signed in; the payer holds only
 * paper and types a PIN on somebody else's phone. That is the whole reason the page exists
 * on this side of the counter, and the reason `requiresAuth` on the route is enough login
 * handling: the router guard sends an unsigned merchant through the login and back.
 *
 * ## What it does not do
 *
 * It never shows whose card was scanned, until the payment went through. Before the PIN
 * nobody has proved anything, and a screen that named the owner would hand that out to
 * whoever picked the card up.
 */
import { BButton, BFormCheckbox, BFormInput } from 'bootstrap-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import {
  confirmThankYouCardPayment,
  createThankYouCardPayment,
  thankYouCardPaymentTarget,
} from '@/graphql/thankYouCard.graphql'
import { useAppToast } from '@/composables/useToast'
import { useThankYouCardMemo } from '@/composables/useThankYouCardMemo'

const PIN_LENGTH = 6

const route = useRoute()
const { t } = useI18n()
const { toastError } = useAppToast()
const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()

const code = route.params.code
const step = ref('amount')
const amount = ref('')
const memo = ref('')
const rememberMemo = ref(true)
const pin = ref('')
const paymentId = ref(null)
const attemptsLeft = ref(null)
const failure = ref(null)
const payerName = ref('')
const busy = ref(false)
const targetStatus = ref(null)

const unusable = computed(() => targetStatus.value !== null && targetStatus.value !== 'SUCCESS')
const statusKey = computed(() => targetStatus.value ?? 'CARD_UNKNOWN')

// A comma is what a German keyboard offers first, so both separators have to be accepted.
const parsedAmount = computed(() => Number(String(amount.value).replace(',', '.')))
const amountIsUsable = computed(() => Number.isFinite(parsedAmount.value) && parsedAmount.value > 0)

const { onResult: onTarget, onError: onTargetError } = useQuery(
  thankYouCardPaymentTarget,
  { code },
  { fetchPolicy: 'network-only' },
)
onTarget(({ data }) => {
  targetStatus.value = data?.thankYouCardPaymentTarget ?? 'CARD_UNKNOWN'
})
onTargetError(() => {
  targetStatus.value = 'CARD_UNKNOWN'
})

const { mutate: create } = useMutation(createThankYouCardPayment)
const { mutate: confirm } = useMutation(confirmThankYouCardPayment)

onMounted(() => {
  memo.value = readRememberedMemo()
})

const startPayment = async () => {
  busy.value = true
  try {
    const result = await create({
      code,
      amount: parsedAmount.value,
      memo: memo.value || t('thank-you-card.receive.default-memo'),
    })
    paymentId.value = result?.data?.createThankYouCardPayment?.id ?? null
    if (paymentId.value === null) {
      throw new Error('no payment id')
    }
    // ⚠️ Written on both sides of the tick, not only when it is set. Taking the tick away
    // is an instruction to forget, and leaving the old wording in storage would answer it
    // with the opposite: it comes back at the next payment on this device.
    writeRememberedMemo(rememberMemo.value ? memo.value : '')
    step.value = 'pin'
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}

/**
 * Six digits and the field is full, so there is nothing left to press.
 *
 * ⚠️ The length is fixed rather than a minimum for exactly this reason: an extra confirm
 * button at a counter is one more thing to explain to somebody who is holding a coffee.
 */
const onPinTyped = (value) => {
  attemptsLeft.value = null
  failure.value = null
  if (String(value).length === PIN_LENGTH) {
    submitPin()
  }
}

const submitPin = async () => {
  busy.value = true
  try {
    const result = await confirm({ paymentId: paymentId.value, pin: pin.value })
    const answer = result?.data?.confirmThankYouCardPayment
    pin.value = ''

    if (answer?.status === 'SUCCESS') {
      payerName.value = answer.payerName
      step.value = 'done'
      return
    }
    if (answer?.status === 'WRONG_PIN') {
      attemptsLeft.value = answer.attemptsLeft
      return
    }
    // Everything else ends this attempt: blocked, over a limit, no cover, request gone.
    failure.value = answer?.status ?? 'REQUEST_GONE'
    if (answer?.status === 'BLOCKED_NOW' || answer?.status === 'CARD_BLOCKED') {
      targetStatus.value = answer.status
    }
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}

const cancel = () => {
  pin.value = ''
  attemptsLeft.value = null
  failure.value = null
  step.value = 'amount'
}

const reset = () => {
  cancel()
  amount.value = ''
  paymentId.value = null
  payerName.value = ''
}
</script>

<style scoped>
.tyc-pin {
  letter-spacing: 0.6em;
}
</style>
