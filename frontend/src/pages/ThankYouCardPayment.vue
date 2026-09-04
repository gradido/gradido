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

        Two ways out, by where the person came from: with an amount parked, they are in the
        middle of a till cycle (their OWN card scanned by mistake, say) and the way back is
        the calculator — which still holds the amount and offers the camera at once. Without
        one, the account. Three taps via overview, calculator and "undo" used to stand
        between the wrong card and the right one. (Bernd, 21.08.2026)
      -->
      <BButton
        v-if="fromCalculator"
        variant="secondary"
        to="/calculator"
        data-test="thank-you-card-back-calculator"
      >
        {{ $t('thank-you-card.back-to-calculator') }}
      </BButton>
      <BButton v-else variant="secondary" to="/overview" data-test="thank-you-card-back-account">
        {{ $t('navigation.back-to-account') }}
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
        @update:model-value="onAmountTyped"
        @blur="normaliseAmount"
      />
      <!--
        ⚠️ Says where the number came from, and nothing more. The field stays editable: an
        amount that appeared on its own and cannot be corrected is worse than one that was
        typed.

        ⛔ And it goes the moment the amount is touched. A line that still claims an origin
        the number no longer has is worse than no line: it says the calculator worked this
        out, about a figure somebody typed over by hand. (coderabbit, PR #3771)
      -->
      <div
        v-if="fromCalculator"
        class="small text-muted"
        data-test="thank-you-card-from-calculator"
      >
        {{ $t('calculator.card.from-calculator') }}
      </div>

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

      <!--
        ⛔ What is still owed in the local currency, and the last place it can be read. The
        customer saw it on the calculator before the card was scanned; by the time this
        screen appears that display is two navigations away, and nobody wrote the number
        down. Without this line the only ways left are remembering it or paying the local
        currency FIRST -- which is the order the till was built to get rid of.
        (Bernd, 22.08.2026)

        ★ It also survives an edited Gradido amount, which is the common case at a counter --
        somebody offering more than the calculator worked out. The reasoning is on
        `onAmountTyped`. (Bernd, 04.09.2026)

        Shown only when there IS a remainder: a sale settled fully in Gradido has none, and
        a line reading "0,00 € to be settled separately" would invent a debt.
      -->
      <template v-if="rest">
        <div class="fs-4 mb-1" data-test="thank-you-card-paid-rest">{{ restLine }}</div>
        <div class="mb-3 text-muted" data-test="thank-you-card-paid-rest-note">
          {{ $t('thank-you-card.receive.rest-note') }}
        </div>
      </template>

      <BButton variant="gradido" data-test="thank-you-card-again" @click="nextCustomer">
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
import { useRoute, useRouter } from 'vue-router'
import {
  confirmThankYouCardPayment,
  createThankYouCardPayment,
  thankYouCardPaymentTarget,
} from '@/graphql/thankYouCard.graphql'
import { useAppToast } from '@/composables/useToast'
import { useThankYouCardMemo } from '@/composables/useThankYouCardMemo'
import { useParkedAmount } from '@/composables/useParkedAmount'
import { parseAmount, withAtMostTwoDecimals } from '@/filters/amount'
import { memberAlias } from '@/utils/gradidoAddress'
import { PIN_MASK_CLASS, pinInputType } from '@/utils/pinMasking'

const PIN_LENGTH = 6

// ⛔ A text field that CSS hides, not a password field. Read once: the answer cannot change
// while somebody stands at the counter, and asking per keystroke would be work for nothing.
const pinType = pinInputType()

const route = useRoute()
const { t, n } = useI18n()
const store = useStore()
const { toastError } = useAppToast()
const { readRememberedMemo, writeRememberedMemo } = useThankYouCardMemo()
const { readParked, readParkedRest, clearParked } = useParkedAmount()

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
const fromCalculator = ref(false)
/** What is still owed in the local currency, if the sale was a split one. */
const rest = ref(null)

/**
 * ⚠️ Amount first, sign after -- as Bernd wrote the receipt, and as German writes money.
 * The calculator puts the sign in FRONT of its own figure; that one is read by the person
 * running the till, this one by the customer.
 *
 * Formatted here rather than in the template so the shape is stated once, and with the `n`
 * this page already holds: the currency is a free sign from the calculator's settings
 * ("€", "CHF", …), so there is no locale currency format to hand it to.
 */
const restLine = computed(() =>
  rest.value ? `${n(rest.value.fiat, 'decimal')} ${rest.value.currency}` : '',
)
const router = useRouter()

/**
 * Whoever is signed in on this device, which on this page is always the RECIPIENT -- the
 * merchant. Read from the store rather than asked of the server: the wallet has known it
 * since the login, and the closing screen has to name both sides (see the comment on the
 * done step) without a round trip at the moment the phone changes hands.
 *
 * The alias, not the real name (NU-021/KLAR-09): the payer reads this screen too.
 */
const recipientName = computed(() => memberAlias(store.state.username, store.state.gradidoID))

const unusable = computed(() => targetStatus.value !== null && targetStatus.value !== 'SUCCESS')
const statusKey = computed(() => targetStatus.value ?? 'CARD_UNKNOWN')

/**
 * ⚠️ Through the same reader the calculator page uses, so a number typed here and a number
 * calculated there mean the same thing. It is deliberately NOT locale-aware -- see the note
 * on `parseAmount`; what is written follows the language, what is read must not.
 */
const parsedAmount = computed(() => parseAmount(amount.value))
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

  /**
   * ★ The amount the calculator parked before the card was scanned. Scanning leaves the
   * wallet -- the phone's camera opens this page afresh -- so this is the only thing that
   * survives the jump.
   *
   * ⚠️ Read, not consumed. Consuming here would lose the amount to an accidental reload, and
   * whoever runs the till would have to add the whole basket up again with a customer
   * waiting. It is cleared once a payment actually goes through.
   */
  const parked = readParked()
  if (parked !== null) {
    amount.value = n(parked, 'decimal')
    fromCalculator.value = true
  }
  /**
   * ⛔ Read HERE, at mount, and held in a ref -- not read again when the receipt is drawn.
   * A successful payment calls `clearParked()`, so by the time the thanks screen exists the
   * entry is gone; asking for it then would always answer "nothing owed".
   */
  rest.value = readParkedRest()
})

/**
 * ⛔ At most two digits behind the decimal separator -- the rule the calculator's own keypad
 * enforces with the warning sound, because GDD carries two decimals. A third digit here is
 * not a slightly different amount, it is a DIFFERENT one: `0,123` read as a grouped number
 * comes out as 123, and the field would hand that to the card without a murmur.
 *
 * ⚠️ A grouped number is left alone: in `1.234` the separator is not a decimal separator, so
 * there is no third decimal to refuse. The check goes through `withAtMostTwoDecimals`, the
 * same rule `parseAmount` reads by -- a field that fights entries the reader would have read
 * correctly is worse than no field at all.
 *
 * The set-then-correct across a tick is the same dance `onPinTyped` does below: without it
 * the input keeps the refused character on screen, because the model value it is told about
 * has not changed.
 */
const onAmountTyped = async (value) => {
  // The note above the field goes -- this figure is no longer the calculator's.
  fromCalculator.value = false
  /*
   * ⛔ The remainder STAYS, and that is the whole difference between the two lines. It used
   * to be cleared here as well, on the reading that they are one claim -- "this figure came
   * from a calculation, which also left 4,20 € to pay" (coderabbit, PR #3782). That reading
   * makes the two halves one sum. They are not: this screen holds two figures beside each
   * other and has no way of turning one into the other -- the split was worked out in the
   * calculator (Gradido share, purchasing-power factor), and neither the share nor the factor
   * travels with the parked amount. There is no price of Gradido here to re-derive one from.
   *
   * What the edit usually IS at the counter: a customer offering MORE Gradido than the
   * calculator worked out. The cash half of that sale does not move, and the merchant still
   * has to collect it -- dropping the line would take away the last place it can be read.
   * The rarer edit downwards (a card that cannot cover the amount) is settled between the
   * two people standing there, so there is nothing here to recalculate either way.
   * (Bernd, 04.09.2026)
   */
  const typed = String(value)
  const allowed = withAtMostTwoDecimals(typed)
  if (allowed !== typed) {
    amount.value = typed
    await nextTick()
    amount.value = allowed
  }
}

/**
 * Writes back what was READ, in the language's own notation -- so the field shows the same
 * number shape as the calculator, and a misread entry becomes visible before the PIN step
 * rather than after the charge.
 *
 * An unusable entry is left alone: correcting somebody's half-typed number for them is how a
 * field becomes impossible to type in.
 */
const normaliseAmount = () => {
  const value = parsedAmount.value
  if (Number.isFinite(value) && value > 0) {
    amount.value = n(value, 'decimal')
  }
}

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
      // Now, and not before: the parked amount has done its job, and leaving it would greet
      // the next card with the last customer's total.
      clearParked()
      return
    }
    if (answer?.status === 'WRONG_PIN') {
      attemptsLeft.value = answer.attemptsLeft
      return
    }
    /**
     * Everything else ends this attempt: blocked, over a limit, no cover, request gone.
     *
     * ⛔ And it ends the parked amount with it. A wrong PIN with attempts left returns above
     * and keeps it, because the customer is going to try again -- but a card that is blocked
     * or over its limit is not going to pay this basket at all. The customer pays another
     * way and the till moves on; leaving the amount would hand the last basket to whichever
     * card is scanned next inside the ten minutes, under a line claiming the calculator
     * worked it out for THAT sale. (Bernd, 19.08.2026)
     */
    failure.value = answer?.status ?? 'REQUEST_GONE'
    clearParked()
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

/**
 * "Next payment" is the next CUSTOMER. Since the wallet has its own scanner, a card
 * payment is one turn of the till's cycle, and the next turn begins in the calculator —
 * which starts clean on its own: the payment consumed the parked amount, and that is
 * exactly the case in which the calculator throws its saved basket away. Before this the
 * button re-armed THIS card for another payment, which was the only next step the
 * phone-camera world had. (Bernd, 21.08.2026: "sofort wieder der leere Rechner")
 */
const nextCustomer = () => {
  router.push('/calculator')
}
</script>

<style scoped>
.tyc-pin {
  letter-spacing: 0.6em;
}
</style>
