<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="calculator" data-test="calculator">
    <!-- The gear gets a strip of its own, as in the PWA: it must not collide with the big
         result on a narrow screen, and it must stay a 44px target even though it looks small. -->
    <div class="calculator-head">
      <button
        type="button"
        class="calculator-gear"
        :aria-label="$t('calculator.settings.title')"
        data-test="calculator-settings-open"
        @click="press(openSettings)"
      >
        <IMdiSettings />
      </button>
    </div>

    <!-- ★ The biggest thing on the page, and deliberately so: at a counter this is read at
         arm's length, often by two people at once. It shrinks rather than wraps -- a total
         that breaks over two lines is unreadable at a glance. -->
    <div
      class="calculator-display"
      :class="{ 'calculator-display-long': display.length > 10 }"
      data-test="calculator-display"
    >
      {{ display }}
    </div>

    <button
      type="button"
      class="calculator-share"
      data-test="calculator-share"
      @click="press(openShare)"
    >
      <span>{{ $t('calculator.gradido-share') }}</span>
      <span>{{ percent }}</span>
    </button>

    <div class="calculator-sub" data-test="calculator-sub">
      <template v-if="subResult?.kind === 'payment'">
        <!-- The two sums the whole page exists for: what is paid in the local currency, and
             what is thanked in Gradido. -->
        <div data-test="calculator-sub-amounts">
          {{ currency }} {{ $n(subResult.fiat, 'decimal') }} &nbsp;|&nbsp; GDD
          {{ $n(subResult.gdd, 'decimal') }}
        </div>
        <div v-if="showDankBar">
          {{ $t('calculator.daily-rate') }}
          {{ $n(subResult.rate.gddToDankBar, RATE_FORMAT) }} &nbsp;|&nbsp; DankBar
          {{ $n(subResult.dankBar, 'decimal') }}
        </div>
        <div v-if="factor !== 1">
          {{ $t('calculator.purchasing-power', { factor, currency }) }}
        </div>
      </template>
      <template v-else-if="subResult?.kind === 'dankbar'">
        <div>
          {{ $t('calculator.daily-rate') }} {{ $n(subResult.rate.dankBarToGdd, RATE_FORMAT) }}
        </div>
        <div data-test="calculator-sub-dankbar">
          {{
            $t('calculator.dankbar-equals', {
              dankBar: $n(subResult.dankBar, 'decimal'),
              gdd: $n(subResult.gdd, 'decimal'),
            })
          }}
        </div>
      </template>
    </div>

    <div class="calculator-keys">
      <!--
        ⛔ Rendered from a list rather than written out. Twenty keys as twenty tags is where
        the wrong `data-test` or a missed colour creeps in, and it is also why every label
        would count as raw text: bound labels are values, and a value can be a translation.
      -->
      <template v-for="key in keys" :key="key.name">
        <div v-if="key.blank" class="key key-blank" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="key"
          :class="key.variant"
          :data-test="`calculator-${key.name}`"
          @click="press(key.action)"
        >
          {{ key.label }}
        </button>
      </template>
    </div>

    <!--
      ★ Parking is a visible act, not a side effect of pressing "=". Whoever runs the till has
      to be able to see WHICH amount is waiting before they pick up a card, and be able to take
      it back without clearing the calculation.
    -->
    <div class="calculator-card">
      <BButton
        v-if="parked === null"
        variant="gradido"
        class="w-100"
        :disabled="payableAmount === null"
        data-test="calculator-park"
        @click="parkAmount"
      >
        {{ $t('calculator.card.park') }}
      </BButton>
      <div v-else class="calculator-parked" data-test="calculator-parked">
        <div>{{ $t('calculator.card.parked', { amount: $n(parked, 'decimal') }) }}</div>
        <div class="small">{{ $t('calculator.card.scan-hint') }}</div>
        <BButton
          size="sm"
          variant="secondary"
          class="mt-2"
          data-test="calculator-park-undo"
          @click="undoPark"
        >
          {{ $t('calculator.card.undo') }}
        </BButton>
      </div>

      <!--
        ⛔ Storage can refuse to remember -- private browsing, a full quota. Saying nothing
        would be the worst of it: whoever runs the till scans the card and finds an empty
        field with a customer waiting.

        ⚠️ Its own `v-if`, and OUTSIDE the pair above. Put between a `v-if` and its `v-else`
        it does not sit beside them, it breaks them apart -- the `v-else` then answers this
        condition instead of the one it was written for.
      -->
      <div v-if="parkFailed" class="small text-danger mt-2" data-test="calculator-park-failed">
        {{ $t('calculator.card.park-failed') }}
      </div>
    </div>

    <BModal
      v-model="settingsOpen"
      :title="$t('calculator.settings.title')"
      :ok-title="$t('form.ok')"
      ok-only
      data-test="calculator-settings"
      @ok="closeSettings"
      @hidden="closeSettings"
    >
      <label class="small" for="calc-factor">
        {{ $t('calculator.settings.purchasing-power') }}
      </label>
      <BFormInput
        id="calc-factor"
        v-model="factorField"
        type="text"
        inputmode="decimal"
        data-test="calculator-settings-factor"
      />

      <label class="small mt-3" for="calc-currency">{{ $t('calculator.settings.currency') }}</label>
      <BFormInput
        id="calc-currency"
        v-model="currencyField"
        type="text"
        maxlength="6"
        data-test="calculator-settings-currency"
      />

      <BFormCheckbox v-model="showDankBar" class="mt-3" data-test="calculator-settings-dankbar">
        {{ $t('calculator.settings.show-dankbar') }}
      </BFormCheckbox>
      <BFormCheckbox v-model="sound" data-test="calculator-settings-sound">
        {{ $t('calculator.settings.sound') }}
      </BFormCheckbox>
    </BModal>

    <BModal
      v-model="shareOpen"
      :title="$t('calculator.gradido-share')"
      :ok-title="$t('form.ok')"
      ok-only
      data-test="calculator-share-modal"
      @ok="closeShare"
      @hidden="closeShare"
    >
      <label class="small" for="calc-share">{{ $t('calculator.share.label') }}</label>
      <BFormInput
        id="calc-share"
        v-model="shareField"
        type="text"
        inputmode="numeric"
        data-test="calculator-share-input"
      />
    </BModal>
  </div>
</template>

<script setup>
/**
 * The Gradido calculator, as a page of the wallet.
 *
 * ## What it is for
 *
 * A stall or a cafe adds up what somebody bought and reads off two sums: what is paid in the
 * local currency, and what is thanked in Gradido. The euros are settled the usual way; the
 * Gradido go over a thank-you card -- and this page hands that amount over so nobody has to
 * type it a second time at the counter.
 *
 * ## Why the arithmetic is not in here
 *
 * `useCalculator` holds it, and it is a straight carry-over of the accepted PWA. Keeping it
 * out of the component is what lets every branch be tested without mounting anything -- and
 * this is arithmetic that decides what somebody gets charged.
 *
 * Each entry point returns which sound it earned; `press` plays it. That is why a refused
 * key sounds refused: the branch that refused it says so.
 */
import { BButton, BFormCheckbox, BFormInput, BModal } from 'bootstrap-vue-next'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCalculator } from '@/composables/useCalculator'
import { useCalculatorPrefs } from '@/composables/useCalculatorPrefs'
import { useCalculatorSound } from '@/composables/useCalculatorSound'
import { useParkedAmount } from '@/composables/useParkedAmount'
import { decimalSeparatorFor } from '@/utils/numberFormat'

/** The daily rate is a rate, not money -- four places, and no currency grouping rules. */
const RATE_FORMAT = { minimumFractionDigits: 4, maximumFractionDigits: 4 }

/** The three middle rows: three digits and the operator that closes the row. */
const DIGIT_ROWS = [
  { name: 'divide', digits: [7, 8, 9], operator: '/', label: '÷' },
  { name: 'multiply', digits: [4, 5, 6], operator: '*', label: '×' },
  { name: 'minus', digits: [1, 2, 3], operator: '-', label: '−' },
]

const { t, locale } = useI18n()
const { percent, factor, currency, showDankBar, sound } = useCalculatorPrefs()
const { play, stop } = useCalculatorSound(sound)
const { park, readParked, clearParked, hasParkedEntry, parkedKey } = useParkedAmount()

const {
  display,
  subResult,
  payableGdd,
  appendDigit,
  appendSeparator,
  appendOperator,
  deleteLast,
  allClear,
  calculate,
  dankBarToGdd,
} = useCalculator({ percent, factor, locale })

const decimalSeparator = computed(() => decimalSeparatorFor(locale.value))

/**
 * Reads a number out of one of the two settings fields.
 *
 * ⛔ Deliberately NOT `parseAmount`. That one reads MONEY, and its grouping rule rests on
 * GDD carrying two decimals, so it reads `1.075` as one thousand and seventy-five. Neither
 * of these fields holds money -- the factor is a rate, the share is a percentage -- and a
 * separator in a rate is always a decimal separator. `1,075` here means one and a bit.
 */
const readSetting = (typed) => {
  const text = String(typed).trim().replace(',', '.')
  // ⛔ NaN and not 0 for an empty field. `Number('')` is 0, and 0 is a legal Gradido share,
  // so an emptied share field would be taken as a real answer: the sub-result disappears
  // and the card button never arms again. "Nothing typed" and "zero" are different answers.
  return text === '' ? NaN : Number(text)
}

/**
 * What would actually be handed over: two decimals, because that is the amount the payment
 * screen shows and charges. A longer number here would be a different amount from the one
 * on the display.
 *
 * ⛔ Rounded FIRST and then checked against zero, not the other way round. A Gradido share
 * of 0.004 is greater than zero and would arm the button, but it rounds to 0.00 -- and zero
 * cannot be parked, so the button would sit there doing nothing at all.
 */
const payableAmount = computed(() => {
  if (payableGdd.value === null) {
    return null
  }
  const rounded = Number(payableGdd.value.toFixed(2))
  return rounded > 0 ? rounded : null
})

const digitKey = (digit) => ({
  name: `digit-${digit}`,
  label: String(digit),
  action: () => appendDigit(digit),
})

const operatorKey = (row) => ({
  name: `operator-${row.name}`,
  label: row.label,
  variant: 'key-operator',
  action: () => appendOperator(row.operator),
})

/**
 * The keypad, in reading order. Four columns, five rows -- the layout of the PWA, which is
 * the layout somebody who has used this at a counter for weeks reaches for without looking.
 *
 * ⛔ With the DankBar switched off its place becomes a BLANK in the digits' own colour, not
 * a gap: if the grid reflowed, every key below would move under a practised finger.
 */
const keys = computed(() => [
  { name: 'ac', label: 'AC', variant: 'key-delete', action: allClear },
  showDankBar.value
    ? {
        name: 'dankbar',
        label: t('calculator.dankbar-to-gdd'),
        variant: 'key-result key-dankbar',
        action: dankBarToGdd,
      }
    : { name: 'blank', blank: true },
  { name: 'percent', label: '%', variant: 'key-result', action: openShare },
  { name: 'del', label: 'DEL', variant: 'key-delete', action: deleteLast },
  ...DIGIT_ROWS.flatMap((row) => [...row.digits.map(digitKey), operatorKey(row)]),
  digitKey(0),
  // The separator carries the character of the interface language -- a comma in German, a
  // full stop in English. There is no second separator key, so a grouping separator cannot
  // be typed at all, and every entry here is therefore unambiguous.
  { name: 'separator', label: decimalSeparator.value, action: appendSeparator },
  { name: 'equals', label: '=', variant: 'key-result', action: calculate },
  {
    name: 'operator-plus',
    label: '+',
    variant: 'key-operator',
    action: () => appendOperator('+'),
  },
])

const settingsOpen = ref(false)
const shareOpen = ref(false)
const factorField = ref('')
const currencyField = ref('')
const shareField = ref('')
const parked = ref(readParked())
const parkFailed = ref(false)

/** Runs a calculator action and plays whatever sound its path earned. */
const press = (action) => {
  parkFailed.value = false
  play(action())
}

const openSettings = () => {
  factorField.value = String(factor.value)
  currencyField.value = currency.value
  settingsOpen.value = true
  return 'function'
}

/**
 * ⚠️ Reached from the OK button and from every other way the modal closes, so a value typed
 * and then dismissed with the backdrop is not silently lost. Writing the same values twice
 * is harmless; losing them is not.
 */
const closeSettings = () => {
  const typed = readSetting(factorField.value)
  factor.value = Number.isFinite(typed) && typed > 0 ? typed : 1
  currency.value = currencyField.value.trim() === '' ? '€' : currencyField.value.trim()
  settingsOpen.value = false
}

const openShare = () => {
  shareField.value = String(percent.value)
  shareOpen.value = true
  return 'function'
}

const closeShare = () => {
  const typed = readSetting(shareField.value)
  if (Number.isFinite(typed)) {
    percent.value = Math.min(100, Math.max(0, typed))
  }
  shareOpen.value = false
}

const parkAmount = () => {
  const amount = payableAmount.value
  if (amount === null) {
    return
  }
  if (park(amount)) {
    parked.value = amount
    parkFailed.value = false
    play('equals')
    return
  }
  parkFailed.value = true
  play('warn')
}

const undoPark = () => {
  clearParked()
  parked.value = null
  parkFailed.value = false
  play('function')
}

/**
 * ★ Brings the panel back in step with what is actually in storage, and the three answers
 * are three different situations:
 *
 * - **a fresh amount** -- it is still waiting; show it.
 * - **a stale entry** -- the ten minutes ran out. The panel goes so it stops claiming an
 *   amount the payment screen would already refuse, but the basket on the display is still
 *   this customer's and must not be touched.
 * - **nothing at all** -- somebody consumed it, which can only mean the payment went
 *   through. The sale is over, so the calculator starts clean, as if AC had been pressed.
 *   *(Bernd, 19.08.2026: once the payment has gone through, the calculator has to be
 *   cleared.)*
 *
 * ⚠️ `allClear` is called directly and not through `press`: nobody pressed anything, and a
 * sound from a page that may be in the background behind the camera is noise.
 */
const syncParked = () => {
  const fresh = readParked()
  if (fresh !== null) {
    parked.value = fresh
    return
  }
  const wasParked = parked.value !== null
  parked.value = null
  if (wasParked && !hasParkedEntry()) {
    allClear()
  }
}

/**
 * ⛔ Scanning the card leaves the wallet: the phone's own camera opens `/dk/CODE`, and on a
 * phone that is usually a NEW tab. This page stays behind with the finished basket on it,
 * and nothing that happens over there reaches it by itself.
 *
 * `storage` is how the browser tells one document that another changed the shared store --
 * it fires everywhere EXCEPT in the document that wrote, which is exactly right here: our
 * own `undoPark` must not trigger it. `visibilitychange` catches up when the tab comes back
 * from a state in which it heard nothing.
 */
const onStorageChanged = (event) => {
  if (event.key !== null && event.key !== parkedKey()) {
    return
  }
  syncParked()
}

const onVisibilityChanged = () => {
  if (document.visibilityState === 'visible') {
    syncParked()
  }
}

window.addEventListener('storage', onStorageChanged)
document.addEventListener('visibilitychange', onVisibilityChanged)

onUnmounted(() => {
  window.removeEventListener('storage', onStorageChanged)
  document.removeEventListener('visibilitychange', onVisibilityChanged)
  stop()
})
</script>

<style lang="scss" scoped>
/*
  The calculator keeps the PWA's own colours rather than the wallet's white card. They are
  what makes it recognisable as the same tool -- and dark keys under a bright counter light
  are easier to hit than pale ones.

  ⛔ Custom properties on the element, NOT scss variables at the top of the block: the style
  block is parsed by lightningcss when it is bundled, and a declaration outside any selector
  fails there with "Invalid empty selector" -- which neither lint nor the tests catch, only
  `bun run build`.
*/
.calculator {
  --calc-surface: rgb(40 40 40);
  --calc-ink: rgb(255 253 253);
  --calc-digit: rgb(20 22 18);

  max-width: 480px;
  margin: 0 auto;
  color: var(--calc-ink);
  background-color: var(--calc-surface);
  border-radius: 12px;
  overflow: hidden;
}

.calculator-head {
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px;
}

/* 44px stays the target even though the icon reads small -- this is pressed at a counter,
   often one-handed while the other hand holds something. */
.calculator-gear {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: rgb(150 150 150);
  background: transparent;
  border: none;
  cursor: pointer;
}

.calculator-gear:hover {
  color: rgb(210 210 210);
}

.calculator-display {
  min-height: 84px;
  padding: 0 20px 8px;
  font-size: 56px;
  line-height: 1.1;
  text-align: right;
  overflow-wrap: anywhere;
}

.calculator-display-long {
  font-size: 30px;
}

.calculator-share {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 2px 20px 6px;
  font-size: 16px;
  color: rgb(132 174 116);
  background: transparent;
  border: none;
  cursor: pointer;
}

.calculator-sub {
  min-height: 66px;
  padding: 0 20px 10px;
  font-size: 17px;
  line-height: 1.3;
  text-align: right;
  white-space: nowrap;
}

.calculator-keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background-color: rgb(60 60 60);
}

.key {
  min-height: 62px;
  font-size: 30px;
  color: rgb(198 190 190);
  background-color: var(--calc-digit);
  border: none;
  cursor: pointer;
}

.key:hover {
  color: var(--calc-ink);
  background-color: rgb(30 30 30);
}

.key-result {
  background-color: rgb(9 5 64);
}

.key-result:hover {
  background-color: rgb(10 5 76);
}

.key-operator {
  background-color: rgb(27 80 7);
}

.key-operator:hover {
  background-color: rgb(33 98 10);
}

.key-delete {
  background-color: rgb(12 1 2);
}

.key-delete:hover {
  background-color: rgb(30 4 8);
}

.key-dankbar {
  font-size: 18px;
  line-height: 1.15;
}

/* Not a button: the space the DankBar key leaves, in the digits' colour, unreachable. */
.key-blank {
  min-height: 62px;
  background-color: var(--calc-digit);
  pointer-events: none;
}

.calculator-card {
  padding: 14px 20px 18px;
}

.calculator-parked {
  font-size: 17px;
  text-align: center;
}
</style>
