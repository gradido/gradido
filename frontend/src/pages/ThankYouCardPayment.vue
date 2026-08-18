<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="thank-you-card-payment">
    <div v-if="unusable" class="text-center">
      <div class="fs-3 mb-3">{{ $t(`thank-you-card.status.${statusKey}`) }}</div>
      <!--
        ⛔ By PATH, like every other link to the overview in this wallet. The route at
        `/overview` carries NO name — `name: 'Overview'` in `Overview.vue` is the component's
        name and has nothing to do with routing — so the named form here resolved to nothing
        and vue-router throws on it. This is the screen somebody reaches after scanning a
        blocked or unknown card, and its only way out was that button.
      -->
      <BButton variant="secondary" to="/overview">
        {{ $t('thank-you-card.back-to-account') }}
      </BButton>
    </div>

    <div v-else-if="step === 'amount'">
      <!-- ⚠️ No heading of its own. The wallet's own title bar already writes "Gradido
           empfangen" above this from the route's `pageTitle`, and the page repeated it
           word for word. -->
      <div class="fs-5 text-muted" :class="cardLabel ? 'mb-1' : 'mb-3'">
        {{ $t('thank-you-card.receive.subtitle') }}
      </div>
      <!--
        ★ The biggest thing on this screen, and deliberately so: it is what the merchant
        checks before typing an amount, on a till that may have scanned three cards today.
        Small grey text made that a squint. No "Card:" in front of it either -- the screen
        is about a card, so the word only pushes the answer to the right.

        It is printed on the card, so showing it gives nothing away. See
        ThankYouCardPaymentTarget.
      -->
      <div v-if="cardLabel" class="fs-2 mb-3" data-test="thank-you-card-label">
        {{ cardLabel }}
      </div>

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
      <!--
        Both lines carry an id so the field can point at them. What is being asked for and
        what it costs are already written here for whoever can see them; without the two
        references a screen reader announces a nameless password field and leaves the
        amount behind as a sentence somebody had to have heard on the way past.
      -->
      <div id="tyc-pin-title" class="fs-4 mb-1">
        {{ $t('thank-you-card.receive.pin-title') }}
      </div>
      <!-- ★ Big, because this is the number somebody is about to agree to pay on a device
           that is not theirs. It is also the screen-reader description of the PIN field, so
           what is said out loud and what is on screen stay the same sentence. -->
      <div id="tyc-pin-subtitle" class="fs-2 mb-1">
        {{ $t('thank-you-card.receive.amount', { amount: amount }) }}
      </div>
      <!-- Readable, but below the amount: this is the step where the card's OWNER is
           looking at the screen, and the label is how they recognise their own card. -->
      <div v-if="cardLabel" class="fs-5 text-muted mb-3" data-test="thank-you-card-label">
        {{ cardLabel }}
      </div>

      <!--
        ⛔ NO eye here, deliberately, and not for consistency's sake with the settings page —
        the opposite: there the field belongs to somebody alone at home who is SETTING a PIN
        and has to be able to check it. Here it belongs to somebody standing at a counter,
        typing a PIN they already know, on a stranger's device, with the till operator and
        the queue behind them in reach of the same screen. An eye at a counter is a control
        anybody present can press, and the first person to try it shows their PIN to the
        room. What cannot be revealed cannot be revealed by mistake.
        (Bernd, 17.08.2026, when the eye was added to the settings field.)
      -->
      <BFormInput
        v-model="pin"
        :type="pinType"
        inputmode="numeric"
        autocomplete="one-time-code"
        :maxlength="PIN_LENGTH"
        class="text-center fs-3 tyc-pin"
        :class="PIN_MASK_CLASS"
        aria-labelledby="tyc-pin-title"
        aria-describedby="tyc-pin-subtitle"
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
      <!--
        ★★ This screen is read by TWO people, and that is what shapes every line on it. The
        payer is still holding the phone when it appears; a moment later they hand it back
        and the merchant reads the same words. So nothing here may be addressed to "you" --
        "Du hast … empfangen" was true for whoever was holding it second and wrong for the
        person who had just paid. It names both sides instead, and then it fits both.

        ⚠️ The comment lives INSIDE the branch on purpose: a comment between `v-if` and
        `v-else-if` is a node the compiler has to step over, and this chain has four arms.
      -->
      <div class="fs-3 mb-2">{{ $t('thank-you-card.receive.thanks') }}</div>
      <div class="fs-2 mb-2" data-test="thank-you-card-paid-amount">
        {{ $t('thank-you-card.receive.amount', { amount: amount }) }}
      </div>
      <div class="mb-3" data-test="thank-you-card-paid-parties">
        {{ $t('thank-you-card.receive.sent-from-to', { from: payerName, to: recipientName }) }}
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
 * It never shows WHOSE card was scanned, until the payment went through. Before the PIN
 * nobody has proved anything, and a screen that named the owner would hand that out to
 * whoever picked the card up.
 *
 * The card's own label is the one exception, and it is not really one: it is printed on the
 * card, so it says nothing to somebody holding it that they cannot already read. It earns
 * its place because a till that scanned several cards in a row has no other way of showing
 * which one it is still holding.
 */
import { BButton, BFormCheckbox, BFormInput } from 'bootstrap-vue-next'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { useRoute } from 'vue-router'
import {
  confirmThankYouCardPayment,
  createThankYouCardPayment,
  thankYouCardPaymentTarget,
} from '@/graphql/thankYouCard.graphql'
import { useAppToast } from '@/composables/useToast'
import { useThankYouCardMemo } from '@/composables/useThankYouCardMemo'
import { PIN_MASK_CLASS, pinInputType } from '@/utils/pinMasking'

const PIN_LENGTH = 6

// ⛔ A text field that CSS hides, not a password field. Read once: the answer cannot change
// while somebody stands at the counter, and asking per keystroke would be work for nothing.
const pinType = pinInputType()

const route = useRoute()
const { t } = useI18n()
const store = useStore()
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
const cardLabel = ref('')

/**
 * Whoever is signed in on this device, which on this page is always the RECIPIENT -- the
 * merchant. Read from the store rather than asked of the server: the wallet has known it
 * since the login, and the closing screen has to name both sides (see the comment on the
 * done step) without a round trip at the moment the phone changes hands.
 */
const recipientName = computed(() =>
  `${store.state.firstName ?? ''} ${store.state.lastName ?? ''}`.trim(),
)

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
  const target = data?.thankYouCardPaymentTarget
  targetStatus.value = target?.status ?? 'CARD_UNKNOWN'
  // Empty unless the card can pay -- the server sends the label on SUCCESS only, and the
  // template hangs on the value rather than on the status, so there is one place to be
  // wrong instead of two.
  cardLabel.value = target?.cardLabel ?? ''
})
onTargetError(() => {
  targetStatus.value = 'CARD_UNKNOWN'
  cardLabel.value = ''
})

const { mutate: create } = useMutation(createThankYouCardPayment)
const { mutate: confirm } = useMutation(confirmThankYouCardPayment)

onMounted(() => {
  memo.value = readRememberedMemo()
})

/**
 * ⛔ There is deliberately NO autofocus on the PIN field, and this note is here so the next
 * reader does not put one back.
 *
 * It was built on 18.08.2026 and did nothing on an iPhone. WebKit opens the keyboard only
 * when `focus()` sits in the call stack of the touch itself, and two things break that here:
 * the mutation that creates the payment, and the tick Vue needs before the field exists at
 * all. Chrome on Android measures the same permission by TIME rather than by stack, which is
 * worse rather than better — it would work on a fast connection and fail on a slow one.
 *
 * ⚠️ And no test can tell you this. The one that was here asserted `document.activeElement`
 * and passed, because jsdom has no such rule; the injection that removed the focus call
 * failed it cleanly. Green, and wrong on the only device this page is ever opened on.
 *
 * What it would have bought is one tap, which the payer makes anyway while taking the phone
 * in hand. (Bernd decided against pursuing it further on 18.08.2026.)
 */
const startPayment = async () => {
  busy.value = true
  try {
    const result = await create({
      code,
      // ⛔ As a STRING. The GradidoUnit scalar refuses a number during variable coercion,
      // which comes back as a bare HTTP 400 rather than as a GraphQL error.
      amount: parsedAmount.value.toString(),
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
 *
 * ⛔ Counted in DIGITS, not in characters. `inputmode` only picks a keyboard; a paste or a
 * physical keyboard can put six letters in here, and six letters that leave the device are
 * a wrong PIN — one of the three the card has, plus an argon2id on our server. Anything
 * that is not a digit is dropped as it arrives, so the field can only ever fill up with
 * something worth sending.
 *
 * ⚠️ The two awkward parts are both about dropping characters from a field somebody is
 * typing in, and both were found by the spec rather than by reading:
 *
 *   1. **The detour through the raw value.** `v-model` has already put the typed text into
 *      `pin` by the time this runs, but that has not been RENDERED yet. Assigning the
 *      filtered text straight away is therefore not a change as far as Vue can see, and the
 *      field keeps showing what was typed while the model holds something else — a full
 *      field that sends nothing and cannot be corrected. Letting the raw text render first
 *      makes the correction a real change.
 *   2. **The `busy` guard.** Writing to `pin` makes the field report a change again, so this
 *      runs a second time with the cleaned value — and a paste of `40-73-12` sent the PIN
 *      TWICE. Harmless money-wise (the request can only be consumed once), but a wrong PIN
 *      would have cost two of the three attempts for one paste.
 */
const onPinTyped = async (value) => {
  attemptsLeft.value = null
  failure.value = null
  const typed = String(value)
  const digits = typed.replace(/\D/g, '').slice(0, PIN_LENGTH)

  if (digits !== typed) {
    pin.value = typed
    await nextTick()
    pin.value = digits
  }
  if (digits.length === PIN_LENGTH && !busy.value) {
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
