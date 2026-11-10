// AI-GENERATED — not an architecture reference
import { BButton, BFormCheckbox, BFormInput, BModal, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCalculator } from '@/composables/useCalculator'
import { useCalculatorBasket } from '@/composables/useCalculatorBasket'
import { useCalculatorPrefs } from '@/composables/useCalculatorPrefs'
import { useCalculatorSound } from '@/composables/useCalculatorSound'
import { useParkedAmount } from '@/composables/useParkedAmount'
import { useAppToast } from '@/composables/useToast'
import { backOrOverview } from '@/utils/backOrOverview'
import { decimalSeparatorFor } from '@/utils/numberFormat'
import IBiCopy from '~icons/bi/copy'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import IMdiSettings from '~icons/mdi/settings'
import classes from './Calculator.module.scss'

/** The daily rate is a rate, not money -- four places, and no currency grouping rules. */
const RATE_FORMAT = { minimumFractionDigits: 4, maximumFractionDigits: 4 }

/** The three middle rows: three digits and the operator that closes the row. */
const DIGIT_ROWS = [
  { name: 'divide', digits: [7, 8, 9], operator: '/', label: '÷' },
  { name: 'multiply', digits: [4, 5, 6], operator: '*', label: '×' },
  { name: 'minus', digits: [1, 2, 3], operator: '-', label: '−' },
]

/** A key of the pad: what it shows, what it does and which sound its path earns -- or a blank. */
type Key =
  | { name: string; label: string; variant?: string; action: () => string; blank?: undefined }
  | { name: string; blank: true }

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
export const Calculator = defineComponent({
  name: 'Calculator',
  setup() {
    const router = useRouter()
    const { t, n, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()
    const { percent, factor, currency, showDankBar, sound } = useCalculatorPrefs()
    const { play, stop } = useCalculatorSound(sound)
    const { park, readParked, clearParked, hasParkedEntry, parkedKey } = useParkedAmount()
    const { saveBasket, takeBasket } = useCalculatorBasket()

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
      snapshot,
      restore,
    } = useCalculator({ percent, factor, locale })

    /**
     * The way back from the scanner: parking navigated away and unmounted this page, so the
     * basket comes back from what parkAmount wrote down — the WHOLE basket, display and
     * fiat sum included (Bernd, 21.08.2026), not just the parked GDD amount.
     *
     * ⛔ Only while the parked entry still EXISTS. An entry that is GONE was consumed — the
     * payment went through over there, the sale is over, and the standing rule for that is
     * a clean start (Bernd, 19.08.2026), not yesterday's basket over a new customer. This
     * is the same three-way reading syncParked applies at runtime, applied once on arrival.
     */
    const savedBasket = takeBasket()
    if (savedBasket && hasParkedEntry()) {
      restore(savedBasket)
    }

    const decimalSeparator = computed(() => decimalSeparatorFor(locale.value))

    /**
     * Reads a number out of one of the two settings fields.
     *
     * ⛔ Deliberately NOT `parseAmount`. That one reads MONEY, and its grouping rule rests on
     * GDD carrying two decimals, so it reads `1.075` as one thousand and seventy-five. Neither
     * of these fields holds money -- the factor is a rate, the share is a percentage -- and a
     * separator in a rate is always a decimal separator. `1,075` here means one and a bit.
     */
    const readSetting = (typed: string) => {
      const text = String(typed).trim().replace(',', '.')
      // ⛔ NaN and not 0 for an empty field. `Number('')` is 0, and 0 is a legal Gradido share,
      // so an emptied share field would be taken as a real answer: the sub-result disappears
      // and the card button never arms again. "Nothing typed" and "zero" are different answers.
      return text === '' ? Number.NaN : Number(text)
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

    const digitKey = (digit: number): Key => ({
      name: `digit-${digit}`,
      label: String(digit),
      action: () => appendDigit(digit),
    })

    const operatorKey = (row: (typeof DIGIT_ROWS)[number]): Key => ({
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
    const keys = computed<Key[]>(() => [
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

    /**
     * Back to wherever the calculator was opened from -- it is reachable from every page, so a
     * fixed target would be wrong for all but one of them.
     *
     * ⚠️ A deep link has no wallet history: `state.back` is null then, and a bare history step
     * would walk OUT of the wallet. The overview is the safe landing -- also where the step
     * back would lead to the sign-in form (utils/backOrOverview).
     */
    const goBack = () => backOrOverview(router)

    /**
     * Puts one of the two sums into the clipboard, to be typed in somewhere else.
     *
     * ⛔ UNGROUPED on purpose -- `1234,50`, never `1.234,50`. Three of the wallet's amount
     * fields still read with the plain comma-to-dot rule, and a grouped thousand would turn to
     * nonsense there; ungrouped with the language's own decimal separator is read correctly by
     * every field of the wallet, and reads naturally outside it too. The format is
     * `ungroupedDecimal` from i18n.js -- defined for every language and waiting, unused, since
     * it was added.
     */
    const copyAmount = (value: number) => {
      const copied = () => {
        play('function')
        toastSuccess(t('calculator.copy.copied'))
      }
      const refused = () => {
        play('warn')
        toastError(t('calculator.copy.not-copied'))
      }
      /**
       * ⚠️ The polyfill in main.js makes `navigator.clipboard` exist everywhere the wallet
       * runs; the try is for the exotic rest -- an embedded view without the polyfill, or an
       * implementation that throws instead of rejecting. It carries BOTH cases: reaching for a
       * missing clipboard throws just like a synchronous writeText does, and each must end in
       * the same audible refusal. A click that dies silently looks exactly like a missed tap.
       */
      try {
        navigator.clipboard.writeText(n(value, 'ungroupedDecimal')).then(copied, refused)
      } catch {
        refused()
      }
    }

    /** Runs a calculator action and plays whatever sound its path earned. */
    const press = (action: () => string) => {
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

    function openShare() {
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

    /**
     * "With thank-you card" is ONE act: park the amount AND open the wallet's own scanner
     * (Bernd, 2026-08-21). Parking stays a real write first — it is the net under the act:
     * if the camera says no, if the scan is interrupted, if the page reloads, the parked
     * amount still waits, and this page still shows it on the way back.
     *
     * ⚠️ A refused park does NOT navigate: the message below the button is the one moment
     * to learn the amount must be typed after scanning — on the scanner page it would
     * already be gone.
     */
    const parkAmount = () => {
      const amount = payableAmount.value
      if (amount === null) {
        return
      }
      // The remainder travels with it: after the Gradido go through, the receipt is the only
      // place left that can tell the customer what is still to pay -- the display that showed
      // it is on the other side of a navigation by then. (Bernd, 22.08.2026)
      // Only a payment arms the button (payableAmount), so the sub-result is one.
      const fiat = subResult.value?.kind === 'payment' ? subResult.value.fiat : undefined
      if (park(amount, { fiat, currency: currency.value })) {
        // Written BEFORE the navigation that will unmount this page: the basket is what
        // the way back restores. A refused save costs only that restore, never the act.
        saveBasket(snapshot())
        parked.value = amount
        parkFailed.value = false
        play('equals')
        router.push('/scan')
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
     * Back to the camera with the amount still parked -- after a wrong card (the own one
     * scanned by mistake, a refused one), without undo and re-park. The basket is saved again
     * because the arrival read consumed the previous snapshot: this is a new round trip.
     */
    const scanAgain = () => {
      saveBasket(snapshot())
      play('function')
      router.push('/scan')
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
     * ⛔ On the OLD way the card scan leaves the wallet: the phone's own camera opens
     * `/dk/CODE`, on a phone usually in a NEW tab. This page stays behind with the finished
     * basket on it, and nothing that happens over there reaches it by itself. The wallet's own
     * scanner made that the fallback road, not a gone one — so this net stays.
     *
     * `storage` is how the browser tells one document that another changed the shared store --
     * it fires everywhere EXCEPT in the document that wrote, which is exactly right here: our
     * own `undoPark` must not trigger it. `visibilitychange` catches up when the tab comes back
     * from a state in which it heard nothing.
     */
    const onStorageChanged = (event: StorageEvent) => {
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

    const copyButton = (label: string, test: string, value: number) => (
      <button
        type='button'
        class='calculator-copy'
        aria-label={label}
        data-test={test}
        onClick={() => copyAmount(value)}
      >
        <IBiCopy />
      </button>
    )

    return () => (
      <div class={['calculator', classes.calculator]} data-test='calculator'>
        {/* The head is the page's own chrome: the route is bareChrome on a phone, so there
            nothing of the wallet remains and these two are the only way out and the only way
            in to the settings. Both look small and stay 44px targets -- pressed at a counter,
            one-handed. On the desk the wallet's menu is beside the page, so the arrow goes
            and the gear keeps its corner (style module). */}
        <div class='calculator-head'>
          <button
            type='button'
            class='calculator-head-key calculator-head-back'
            aria-label={t('calculator.back')}
            data-test='calculator-back'
            onClick={goBack}
          >
            <IMdiArrowLeft />
          </button>
          <button
            type='button'
            class='calculator-head-key'
            aria-label={t('calculator.settings.title')}
            data-test='calculator-settings-open'
            onClick={() => press(openSettings)}
          >
            <IMdiSettings />
          </button>
        </div>

        {/* ★ The biggest thing on the page, and deliberately so: at a counter this is read at
            arm's length, often by two people at once. It shrinks rather than wraps -- a total
            that breaks over two lines is unreadable at a glance. */}
        <div
          class={['calculator-display', { 'calculator-display-long': display.value.length > 10 }]}
          data-test='calculator-display'
        >
          {display.value}
        </div>

        {/* Label and value together on the right, under the total they belong to. They used
            to sit on opposite edges of the row, which read as two unrelated things. */}
        <button
          type='button'
          class='calculator-share'
          data-test='calculator-share'
          onClick={() => press(openShare)}
        >
          {`${t('calculator.gradido-share')} ${percent.value}`}
        </button>

        <div class='calculator-sub' data-test='calculator-sub'>
          {subResult.value?.kind === 'payment' ? (
            <>
              {/* ★ The two sums the whole page exists for, one line each and readable at arm's
                  length -- they used to share one small line while the total above kept a huge
                  field mostly empty. GDD is the larger of the two: it is the number that goes
                  over the card. The DankBar line comes last and stays small; it is losing its
                  importance. (Bernd, 20.08.2026)

                  Copy buttons on the two sums that get typed in somewhere else: GDD into the
                  wallet's own amount fields, the local currency into an official till app. The
                  DankBar line gets none -- it is on its way out -- and neither does the total:
                  what is entered elsewhere is always one of the two shares, never their sum. */}
              <div class='calculator-sub-fiat' data-test='calculator-sub-fiat'>
                {`${currency.value} ${n(subResult.value.fiat, 'decimal')} `}
                {copyButton(
                  t('calculator.copy.fiat', { currency: currency.value }),
                  'calculator-copy-fiat',
                  subResult.value.fiat,
                )}
              </div>
              <div class='calculator-sub-gdd' data-test='calculator-sub-gdd'>
                {/* The leading space is the template's: its text began on a line of its own. */}
                {` GDD ${n(subResult.value.gdd, 'decimal')} `}
                {copyButton(t('calculator.copy.gdd'), 'calculator-copy-gdd', subResult.value.gdd)}
              </div>
              {factor.value !== 1 ? (
                <div class='calculator-sub-note'>
                  {t('calculator.purchasing-power', {
                    factor: factor.value,
                    currency: currency.value,
                  })}
                </div>
              ) : null}
              {showDankBar.value ? (
                <div class='calculator-sub-note'>
                  {`${t('calculator.daily-rate')} ${n(subResult.value.rate.gddToDankBar, RATE_FORMAT)}  |  DankBar ${n(subResult.value.dankBar, 'decimal')}`}
                </div>
              ) : null}
            </>
          ) : subResult.value?.kind === 'dankbar' ? (
            <>
              <div>
                {`${t('calculator.daily-rate')} ${n(subResult.value.rate.dankBarToGdd, RATE_FORMAT)}`}
              </div>
              <div data-test='calculator-sub-dankbar'>
                {`${t('calculator.dankbar-equals', {
                  dankBar: n(subResult.value.dankBar, 'decimal'),
                  gdd: n(subResult.value.gdd, 'decimal'),
                })} `}
                {copyButton(t('calculator.copy.gdd'), 'calculator-copy-gdd', subResult.value.gdd)}
              </div>
            </>
          ) : null}
        </div>

        <div class='calculator-keys'>
          {/* ⛔ Rendered from a list rather than written out. Twenty keys as twenty tags is where
              the wrong `data-test` or a missed colour creeps in, and it is also why every label
              would count as raw text: bound labels are values, and a value can be a translation. */}
          {keys.value.map((key) =>
            key.blank ? (
              <div key={key.name} class='key key-blank' aria-hidden='true' />
            ) : (
              <button
                key={key.name}
                type='button'
                class={['key', key.variant]}
                data-test={`calculator-${key.name}`}
                onClick={() => press(key.action)}
              >
                {key.label}
              </button>
            ),
          )}
        </div>

        {/* ★ Parking is a visible act, not a side effect of pressing "=". Whoever runs the till has
            to be able to see WHICH amount is waiting before they pick up a card, and be able to take
            it back without clearing the calculation. */}
        <div class='calculator-card'>
          {parked.value === null ? (
            <BButton
              variant={'gradido' as ButtonVariant}
              class='w-100'
              disabled={payableAmount.value === null}
              data-test='calculator-park'
              onClick={parkAmount}
            >
              {t('calculator.card.park')}
            </BButton>
          ) : (
            <div class='calculator-parked' data-test='calculator-parked'>
              <div>{t('calculator.card.parked', { amount: n(parked.value, 'decimal') })}</div>
              {/* A button, not the sentence "now scan the card" it replaced: that sentence
                  described an action nobody could tap (it meant the phone's camera app). Back
                  from a wrong card, the way to the right one is this one press -- not undo,
                  re-park, scan. (Bernd, 21.08.2026) */}
              <BButton
                variant={'gradido' as ButtonVariant}
                class='w-100 mt-2'
                data-test='calculator-scan'
                onClick={scanAgain}
              >
                {t('calculator.card.scan')}
              </BButton>
              <BButton
                size='sm'
                variant='secondary'
                class='mt-2'
                data-test='calculator-park-undo'
                onClick={undoPark}
              >
                {t('calculator.card.undo')}
              </BButton>
            </div>
          )}

          {/* ⛔ Storage can refuse to remember -- private browsing, a full quota. Saying nothing
              would be the worst of it: whoever runs the till scans the card and finds an empty
              field with a customer waiting. Its own condition, OUTSIDE the pair above. */}
          {parkFailed.value ? (
            <div class='small text-danger mt-2' data-test='calculator-park-failed'>
              {t('calculator.card.park-failed')}
            </div>
          ) : null}
        </div>

        <BModal
          modelValue={settingsOpen.value}
          title={t('calculator.settings.title')}
          okTitle={t('form.ok')}
          okOnly
          data-test='calculator-settings'
          onUpdate:modelValue={(open: boolean) => {
            settingsOpen.value = open
          }}
          onOk={closeSettings}
          onHidden={closeSettings}
        >
          <label class='small' for='calc-factor'>
            {t('calculator.settings.purchasing-power')}
          </label>
          <BFormInput
            id='calc-factor'
            modelValue={factorField.value}
            type='text'
            inputmode='decimal'
            data-test='calculator-settings-factor'
            onUpdate:modelValue={(typed) => {
              factorField.value = String(typed ?? '')
            }}
          />

          <label class='small mt-3' for='calc-currency'>
            {t('calculator.settings.currency')}
          </label>
          <BFormInput
            id='calc-currency'
            modelValue={currencyField.value}
            type='text'
            maxlength='6'
            data-test='calculator-settings-currency'
            onUpdate:modelValue={(typed) => {
              currencyField.value = String(typed ?? '')
            }}
          />

          <BFormCheckbox
            modelValue={showDankBar.value}
            class='mt-3'
            data-test='calculator-settings-dankbar'
            onUpdate:modelValue={(checked) => {
              showDankBar.value = Boolean(checked)
            }}
          >
            {t('calculator.settings.show-dankbar')}
          </BFormCheckbox>
          <BFormCheckbox
            modelValue={sound.value}
            data-test='calculator-settings-sound'
            onUpdate:modelValue={(checked) => {
              sound.value = Boolean(checked)
            }}
          >
            {t('calculator.settings.sound')}
          </BFormCheckbox>
        </BModal>

        <BModal
          modelValue={shareOpen.value}
          title={t('calculator.gradido-share')}
          okTitle={t('form.ok')}
          okOnly
          data-test='calculator-share-modal'
          onUpdate:modelValue={(open: boolean) => {
            shareOpen.value = open
          }}
          onOk={closeShare}
          onHidden={closeShare}
        >
          <label class='small' for='calc-share'>
            {t('calculator.share.label')}
          </label>
          <BFormInput
            id='calc-share'
            modelValue={shareField.value}
            type='text'
            inputmode='numeric'
            data-test='calculator-share-input'
            onUpdate:modelValue={(typed) => {
              shareField.value = String(typed ?? '')
            }}
          />
        </BModal>
      </div>
    )
  },
})
