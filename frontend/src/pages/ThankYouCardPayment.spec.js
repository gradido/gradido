// AI-GENERATED — not an architecture reference
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { BButton, BFormCheckbox, BFormInput } from 'bootstrap-vue-next'
import ThankYouCardPayment from './ThankYouCardPayment.vue'
import routes from '@/routes/routes'

/**
 * The page a scanned card lands on, and the only place in the wallet where somebody else's
 * money moves on this device.
 *
 * ⛔ Four of the fixes on this page were found by a reviewer rather than by a test, because
 * there was no test file at all. Three of them share a shape: they are things that must NOT
 * happen — a memo that must not survive, six letters that must not be sent, a field that
 * must not be nameless. That kind is exactly what stays green forever once it breaks, so
 * each of them is pinned here against the wrong behaviour, not only the right one.
 */

const mockToastError = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useAppToast: vi.fn(() => ({ toastError: mockToastError })),
}))

const mockReadRememberedMemo = vi.fn(() => '')
const mockWriteRememberedMemo = vi.fn()
vi.mock('@/composables/useThankYouCardMemo', () => ({
  useThankYouCardMemo: vi.fn(() => ({
    readRememberedMemo: mockReadRememberedMemo,
    writeRememberedMemo: mockWriteRememberedMemo,
  })),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { code: 'DK-abc123' } })),
}))

// The merchant, i.e. whoever is signed in on this device. The closing screen names them,
// so the store has to answer here the same way it does in the wallet.
const state = { firstName: 'Max', lastName: 'Mustermann' }
vi.mock('vuex', () => ({ useStore: () => ({ state }) }))

/**
 * ⚠️ `n` is a real Intl call, not a stub that hands back a string of our own: the whole point
 * of the amount field is that a number comes out in the language's own notation, and it has
 * to survive a round trip through the reader. The same call the wallet's `numberFormats`
 * makes -- German, two decimals.
 */
const germanDecimal = new Intl.NumberFormat('de', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key) => key, n: (value) => germanDecimal.format(value) })),
}))

const mockReadParked = vi.fn(() => null)
const mockClearParked = vi.fn()
vi.mock('@/composables/useParkedAmount', () => ({
  useParkedAmount: vi.fn(() => ({
    readParked: mockReadParked,
    clearParked: mockClearParked,
  })),
}))

// The query hands its answer over through onResult, so the test keeps the callback and
// plays the card's status back through it — the same way the server would.
let onTargetResult
let onTargetError
const mockCreate = vi.fn()
const mockConfirm = vi.fn()

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    onResult: (callback) => {
      onTargetResult = callback
    },
    onError: (callback) => {
      onTargetError = callback
    },
  })),
  useMutation: vi.fn((document) => ({
    mutate: (variables) => mutateFor(document)(variables),
  })),
}))

/**
 * One mutation mock per document, told apart by the operation name in the parsed query.
 *
 * ⛔ Matched in full and loud when it matches nothing. A substring rule with a fallback
 * would send a renamed operation to the WRONG mock, and the tests would keep passing while
 * asserting about a call the page never made.
 */
const mutateFor = (document) => {
  const name = document?.definitions?.[0]?.name?.value ?? ''
  if (name === 'createThankYouCardPayment') {
    return mockCreate
  }
  if (name === 'confirmThankYouCardPayment') {
    return mockConfirm
  }
  throw new Error(`this spec has no mutation mock for "${name}"`)
}

const PAYMENT_ID = 4711
const CARD_LABEL = 'Portemonnaie'

describe('ThankYouCardPayment', () => {
  let wrapper

  const createWrapper = () =>
    mount(ThankYouCardPayment, {
      global: {
        mocks: { $t: (key, values) => (values ? `${key}:${JSON.stringify(values)}` : key) },
        stubs: { BButton, BFormCheckbox, BFormInput },
      },
    })

  /** The card is usable, so the page shows the amount step. */
  const mountUsable = async (cardLabel = CARD_LABEL) => {
    wrapper = createWrapper()
    await nextTick()
    onTargetResult({ data: { thankYouCardPaymentTarget: { status: 'SUCCESS', cardLabel } } })
    await nextTick()
    return wrapper
  }

  const field = (name) => wrapper.find(`[data-test="thank-you-card-${name}"]`)

  /** Amount, memo, tick — then the button that creates the request. */
  const fillAndStart = async ({ amount = '12,50', memo = 'Pizzeria Napoli', remember = true }) => {
    await field('amount').setValue(amount)
    await field('memo').setValue(memo)
    await field('remember').setValue(remember)
    await field('next').trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    onTargetResult = undefined
    onTargetError = undefined
    mockReadRememberedMemo.mockReturnValue('')
    mockReadParked.mockReturnValue(null)
    mockCreate.mockResolvedValue({ data: { createThankYouCardPayment: { id: PAYMENT_ID } } })
    mockConfirm.mockResolvedValue({
      data: { confirmThankYouCardPayment: { status: 'SUCCESS', payerName: 'Bibi Bloxberg' } },
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('what the scanned card is good for', () => {
    it('asks for an amount once the card answers that it can pay', async () => {
      await mountUsable()

      expect(field('amount').exists()).toBe(true)
    })

    // The counterpart to the test above, and the one that matters: a blocked card must not
    // reach a screen that asks for money.
    it('shows the status and no amount field when the card cannot pay', async () => {
      wrapper = createWrapper()
      await nextTick()
      onTargetResult({
        data: { thankYouCardPaymentTarget: { status: 'CARD_BLOCKED', cardLabel: null } },
      })
      await nextTick()

      expect(wrapper.text()).toContain('thank-you-card.status.CARD_BLOCKED')
      expect(field('amount').exists()).toBe(false)
      // ⛔ The only way off this screen, and it was pointing at nothing: the route at
      // `/overview` carries no name, so the named form threw in vue-router. Held against
      // the REAL route table rather than against a string, so it fails if either end moves.
      const back = wrapper.findAll('a').concat(wrapper.findAll('button'))
      const target = back.map((node) => node.attributes('to') ?? node.attributes('href'))
      expect(target).toContain('/overview')
      expect(routes.some((route) => route.path === '/overview')).toBe(true)
      // ⚠️ Belt and braces, and worth saying which: this line cannot fail from deleting the
      // `v-if` guard — a blocked card never reaches that part of the template, which is why
      // the guard has its own test below. What it does catch is somebody putting the label
      // onto the dead-end screen, where a found card must stay anonymous. (coderabbit, #3760)
      expect(field('label').exists()).toBe(false)
    })

    /**
     * ★ The label is the only thing about the card this screen may name before the PIN, and
     * the reason it may is that it is PRINTED ON THE CARD — whoever is asking is holding it.
     * What it buys: a till that scanned three cards in a row shows which one is loaded.
     */
    it('names the card on the amount step, so the merchant sees which one was recognised', async () => {
      await mountUsable()

      expect(field('label').text()).toBe(CARD_LABEL)
    })

    it('names it again on the pin step, where the owner is the one looking', async () => {
      await mountUsable()
      await fillAndStart({})

      expect(field('pin').exists()).toBe(true)
      expect(field('label').text()).toBe(CARD_LABEL)
    })

    /**
     * ⛔ The other half, and it is the one that had to be a test rather than a glance: the
     * page must name nothing when the server sent no label.
     *
     * ⚠️ The obvious test — a BLOCKED card names nothing — measures nothing at all. A
     * blocked card never reaches this part of the template, so it would stay green with the
     * guard deleted. What the guard actually holds is THIS case: a status the page treats
     * as usable, arriving without a label. Deleting `v-if="cardLabel"` fails exactly this
     * one, which is what makes it worth having.
     *
     * That a blocked card carries no label in the first place is the server's promise, kept
     * in `thankYouCardPaymentTarget` — naming one would tell whoever found the card that
     * their code belongs to a real, known card.
     */
    it('names no card when the answer carried no label', async () => {
      await mountUsable(null)

      expect(field('amount').exists()).toBe(true)
      expect(field('label').exists()).toBe(false)
    })

    it('treats a query that fails as an unknown card rather than as a usable one', async () => {
      wrapper = createWrapper()
      await nextTick()
      onTargetError(new Error('network'))
      await nextTick()

      expect(wrapper.text()).toContain('thank-you-card.status.CARD_UNKNOWN')
      expect(field('amount').exists()).toBe(false)
    })
  })

  describe('the reference this till remembers', () => {
    it('starts with what the device remembered', async () => {
      mockReadRememberedMemo.mockReturnValue('Pizzeria Napoli')
      await mountUsable()

      expect(field('memo').element.value).toBe('Pizzeria Napoli')
    })

    it('remembers the reference while the tick is set', async () => {
      await mountUsable()
      await fillAndStart({ memo: 'Marktstand', remember: true })

      expect(mockWriteRememberedMemo).toHaveBeenCalledWith('Marktstand')
    })

    // ⛔ The regression this file was written for. Before the fix the branch simply did
    // nothing when the tick was off, so an earlier reference stayed in storage and came
    // back at the next payment — on a device that is standing on somebody's counter.
    it('forgets the reference when the tick is taken away', async () => {
      mockReadRememberedMemo.mockReturnValue('Pizzeria Napoli')
      await mountUsable()
      await fillAndStart({ memo: 'Pizzeria Napoli', remember: false })

      expect(mockWriteRememberedMemo).toHaveBeenCalledWith('')
    })

    it('sends a default reference when the field was left empty', async () => {
      await mountUsable()
      await fillAndStart({ memo: '' })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ memo: 'thank-you-card.receive.default-memo' }),
      )
    })

    // ⛔ A comma has to become a dot, AND the value has to leave as a STRING. The
    // GradidoUnit scalar refuses a number during variable coercion, which comes back as a
    // bare HTTP 400 — no GraphQL error, nothing in the response to read. Asserting the type
    // here is the only thing in this file that a mocked Apollo cannot paper over.
    it('passes the amount as a string, with a comma turned into a dot', async () => {
      await mountUsable()
      await fillAndStart({ amount: '12,50' })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: '12.5' }))
      expect(typeof mockCreate.mock.calls[0][0].amount).toBe('string')
    })
  })

  describe('the pin', () => {
    const reachPinStep = async () => {
      await mountUsable()
      await fillAndStart({})
    }

    it('carries a name and its amount for a screen reader', async () => {
      await reachPinStep()

      const pin = field('pin')
      expect(pin.attributes('aria-labelledby')).toBe('tyc-pin-title')
      expect(pin.attributes('aria-describedby')).toBe('tyc-pin-subtitle')
      expect(wrapper.find('#tyc-pin-title').exists()).toBe(true)
      expect(wrapper.find('#tyc-pin-subtitle').exists()).toBe(true)
    })

    // ⛔ NOT a password field where the browser can hide a text one. As a password field it
    // was filled with the saved site password cut to six characters, it asked to be saved
    // over and over, and accepting that once would have replaced somebody's Gradido password
    // with six digits.
    it('is a hidden text field, not a password field', async () => {
      vi.stubGlobal('CSS', { supports: () => true })
      await reachPinStep()

      const pin = field('pin')
      expect(pin.attributes('type')).toBe('text')
      expect(pin.classes()).toContain('pin-masked')
      vi.unstubAllGlobals()
    })

    // The one case where it still has to be one: no CSS masking, and a visible PIN at a
    // counter is worse than a password manager.
    it('falls back to a password field where nothing can hide a text one', async () => {
      vi.stubGlobal('CSS', { supports: () => false })
      await reachPinStep()

      expect(field('pin').attributes('type')).toBe('password')
      vi.unstubAllGlobals()
    })

    it('sends the pin as soon as six digits are in the field', async () => {
      await reachPinStep()
      await field('pin').setValue('407312')
      await flushPromises()

      expect(mockConfirm).toHaveBeenCalledWith({ paymentId: PAYMENT_ID, pin: '407312' })
    })

    // ⛔ The second regression. `inputmode` only picks a keyboard, so a paste can put six
    // letters here — and six letters that leave the device cost one of the three attempts
    // the card has, plus an argon2id on our server.
    it('does not send six characters that are not digits', async () => {
      await reachPinStep()
      await field('pin').setValue('abcdef')
      await flushPromises()

      expect(mockConfirm).not.toHaveBeenCalled()
      expect(field('pin').element.value).toBe('')
    })

    // ⛔ And the second half of the same fix: writing the cleaned value back makes the
    // field report a change again, so the handler runs twice. Before the guard this paste
    // sent the PIN TWICE — with a wrong PIN that is two of the three attempts for one
    // paste.
    it('sends a pasted pin with separators exactly once, cleaned', async () => {
      await reachPinStep()
      await field('pin').setValue('40-73-12')
      await flushPromises()

      expect(mockConfirm).toHaveBeenCalledTimes(1)
      expect(mockConfirm).toHaveBeenCalledWith({ paymentId: PAYMENT_ID, pin: '407312' })
    })
  })

  describe('what the server answers', () => {
    const payWith = async (answer) => {
      mockConfirm.mockResolvedValue({ data: { confirmThankYouCardPayment: answer } })
      await mountUsable()
      await fillAndStart({})
      await field('pin').setValue('407312')
      await flushPromises()
    }

    /**
     * ⛔ Two people read this screen, one after the other: the payer is still holding the
     * phone when it appears and hands it back a moment later. So it may not address either
     * of them as "you" — it names BOTH sides, and the test pins exactly that, because a
     * sentence that is merely true for whoever is holding the phone reads fine in review
     * and is wrong for the other half of every payment.
     */
    it('names payer and merchant, so the screen fits whoever is holding the phone', async () => {
      await payWith({ status: 'SUCCESS', payerName: 'Bibi Bloxberg' })

      expect(wrapper.text()).toContain('thank-you-card.receive.thanks')
      const parties = wrapper.find('[data-test="thank-you-card-paid-parties"]')
      expect(parties.text()).toContain('"from":"Bibi Bloxberg"')
      expect(parties.text()).toContain('"to":"Max Mustermann"')
    })

    it('shows what was paid on the closing screen, not only on the pin step', async () => {
      await payWith({ status: 'SUCCESS', payerName: 'Bibi Bloxberg' })

      const paid = wrapper.find('[data-test="thank-you-card-paid-amount"]')
      expect(paid.text()).toContain('thank-you-card.receive.amount')
      expect(paid.text()).toContain('"amount":"12,50"')
    })

    it('says how many attempts are left after a wrong pin, and stays on the pin step', async () => {
      await payWith({ status: 'WRONG_PIN', attemptsLeft: 2 })

      expect(wrapper.text()).toContain('thank-you-card.receive.attempts-left')
      expect(wrapper.text()).toContain('"n":2')
      expect(field('pin').exists()).toBe(true)
    })

    // A card that was blocked by this very attempt must not be payable a second time, so
    // the page leaves the payment flow rather than offering another try.
    it('leaves the payment flow when the card was blocked by this attempt', async () => {
      await payWith({ status: 'BLOCKED_NOW' })

      expect(wrapper.text()).toContain('thank-you-card.status.BLOCKED_NOW')
      expect(field('pin').exists()).toBe(false)
    })

    it('shows a limit refusal without ending the card', async () => {
      await payWith({ status: 'LIMIT_PER_DAY_EXCEEDED' })

      expect(wrapper.text()).toContain('thank-you-card.status.LIMIT_PER_DAY_EXCEEDED')
      expect(field('pin').exists()).toBe(true)
    })

    it('starts over for the next customer', async () => {
      await payWith({ status: 'SUCCESS', payerName: 'Bibi Bloxberg' })
      await field('again').trigger('click')
      await nextTick()

      expect(field('amount').element.value).toBe('')
    })
  })

  // Nothing at a counter may fail quietly. Each of these leaves the merchant on the step
  // they were on, with a toast that says what happened, rather than on a screen that looks
  // as if something had worked.
  describe('when the server cannot be reached', () => {
    it('says so and stays on the amount step when the request cannot be created', async () => {
      mockCreate.mockRejectedValue(new Error('network'))
      await mountUsable()
      await fillAndStart({})

      expect(mockToastError).toHaveBeenCalledWith('network')
      expect(field('amount').exists()).toBe(true)
    })

    it('says so when the answer carries no payment id', async () => {
      mockCreate.mockResolvedValue({ data: { createThankYouCardPayment: null } })
      await mountUsable()
      await fillAndStart({})

      expect(mockToastError).toHaveBeenCalledWith('no payment id')
      expect(field('amount').exists()).toBe(true)
    })

    it('says so and keeps the pin step when the confirmation cannot be sent', async () => {
      mockConfirm.mockRejectedValue(new Error('network'))
      await mountUsable()
      await fillAndStart({})
      await field('pin').setValue('407312')
      await flushPromises()

      expect(mockToastError).toHaveBeenCalledWith('network')
      expect(field('pin').exists()).toBe(true)
    })
  })

  /**
   * The seam to the calculator page.
   *
   * ⛔ Every case here is about an amount that must NOT appear or must NOT stay: a total from
   * this morning, one that was already charged, one that was misread. None of them would look
   * wrong on screen -- a stale amount looks exactly like a fresh one -- so nothing but a test
   * would ever catch them.
   */
  describe('an amount handed over by the calculator', () => {
    it('arrives in the field, drawn the way the calculator drew it', async () => {
      mockReadParked.mockReturnValue(6.3)
      await mountUsable()

      expect(field('amount').element.value).toBe('6,30')
      expect(field('from-calculator').exists()).toBe(true)
    })

    it('leaves the field empty when nothing is parked', async () => {
      await mountUsable()

      expect(field('amount').element.value).toBe('')
      expect(field('from-calculator').exists()).toBe(false)
    })

    /**
     * ⛔ Read, not consumed. Consuming on arrival would lose the amount to an accidental
     * reload, and whoever runs the till would add the whole basket up again with a customer
     * waiting.
     */
    it('does not consume it just by opening the page', async () => {
      mockReadParked.mockReturnValue(6.3)
      await mountUsable()

      expect(mockClearParked).not.toHaveBeenCalled()
    })

    it('lets it go once a payment has actually gone through', async () => {
      mockReadParked.mockReturnValue(6.3)
      await mountUsable()
      await fillAndStart({ amount: '6,30' })
      await field('pin').setValue('407312')
      await flushPromises()

      expect(field('paid-amount').exists()).toBe(true)
      expect(mockClearParked).toHaveBeenCalled()
    })

    it('keeps it when the PIN was wrong', async () => {
      mockReadParked.mockReturnValue(6.3)
      mockConfirm.mockResolvedValue({
        data: { confirmThankYouCardPayment: { status: 'WRONG_PIN', attemptsLeft: 2 } },
      })
      await mountUsable()
      await fillAndStart({ amount: '6,30' })
      await field('pin').setValue('111111')
      await flushPromises()

      expect(mockClearParked).not.toHaveBeenCalled()
    })

    /**
     * ⛔ But it lets go when the card says no for good. A wrong PIN with attempts left is a
     * customer about to try again; a blocked card or one over its limit is not going to pay
     * this basket at all -- they pay another way and the till moves on. Left standing, the
     * finished basket would prefill whichever card is scanned next inside the ten minutes,
     * under a line claiming the calculator worked it out for THAT sale. (Bernd, 19.08.2026)
     */
    it.each([['CARD_BLOCKED'], ['BLOCKED_NOW'], ['LIMIT_EXCEEDED'], ['NO_COVER']])(
      'lets it go when the card answers %s',
      async (status) => {
        mockReadParked.mockReturnValue(6.3)
        mockConfirm.mockResolvedValue({ data: { confirmThankYouCardPayment: { status } } })
        await mountUsable()
        await fillAndStart({ amount: '6,30' })
        await field('pin').setValue('111111')
        await flushPromises()

        expect(mockClearParked).toHaveBeenCalled()
      },
    )

    /** The field stays editable -- an amount that appeared on its own and cannot be corrected
     *  would be worse than one that was typed. */
    it('can be overwritten', async () => {
      mockReadParked.mockReturnValue(6.3)
      await mountUsable()
      await field('amount').setValue('9,00')
      await fillAndStart({ amount: '9,00' })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: '9' }))
    })

    /**
     * ⛔ And the line goes with it. A note that still claims the calculator worked this out,
     * about a figure somebody typed over by hand, is worse than no note at all.
     */
    it('stops claiming the calculator once the amount is typed over', async () => {
      mockReadParked.mockReturnValue(6.3)
      await mountUsable()
      expect(field('from-calculator').exists()).toBe(true)

      await field('amount').setValue('9,00')
      expect(field('from-calculator').exists()).toBe(false)
    })
  })

  /**
   * ⛔ The same rule the calculator's keypad enforces with the warning sound: GDD carries two
   * decimals, so a third is not a slightly different amount but a DIFFERENT one. `0,123` read
   * as a grouped number is 123 -- a thousand times the twelve cents that were meant, and the
   * field would have handed it to the card without a murmur.
   *
   * *(Bernd, 19.08.2026: only two digits may follow the separator; a third is refused.)*
   */
  describe('two decimals, as the currency has', () => {
    it.each([
      ['0,123', '0,12'],
      ['6,305', '6,30'],
      ['1.234,505', '1.234,50'],
    ])('refuses a third decimal: %s becomes %s', async (typed, expected) => {
      await mountUsable()
      await field('amount').setValue(typed)
      await flushPromises()

      expect(field('amount').element.value).toBe(expected)
    })

    /**
     * ⚠️ …and leaves alone what already has at most two. The calculator's own handover is
     * drawn with two decimals, so it passes through this untouched -- including its grouping.
     */
    it.each([['1.234,50'], ['6,3'], ['1234'], ['0,05']])('leaves %s as it was', async (typed) => {
      await mountUsable()
      await field('amount').setValue(typed)
      await flushPromises()

      expect(field('amount').element.value).toBe(typed)
    })
  })

  describe('reading what was typed into the amount field', () => {
    /**
     * ★ Writes back what was READ, so a misread entry becomes visible before the PIN step
     * rather than after the charge. At a desk keyboard there is no keypad, and somebody used
     * to a pocket calculator types a full stop.
     */
    it.each([
      ['6.30', '6,30'],
      ['6,30', '6,30'],
      ['1.234,50', '1.234,50'],
      ['1234.5', '1.234,50'],
    ])('shows %s back as %s when the field is left', async (typed, shown) => {
      await mountUsable()
      await field('amount').setValue(typed)
      await field('amount').trigger('blur')

      expect(field('amount').element.value).toBe(shown)
    })

    it('leaves an unusable entry alone rather than correcting it', async () => {
      await mountUsable()
      await field('amount').setValue('12abc')
      await field('amount').trigger('blur')

      expect(field('amount').element.value).toBe('12abc')
    })

    /**
     * ⛔ As a STRING in dot notation. The GradidoUnit scalar refuses a number during variable
     * coercion, which comes back as a bare HTTP 400 rather than a GraphQL error -- the fault
     * Bernd hit on 17.08.2026 the first time a card was used.
     */
    it('sends a comma-typed amount on as a dot-notation string', async () => {
      await mountUsable()
      await fillAndStart({ amount: '12,50' })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: '12.5' }))
      const sent = mockCreate.mock.calls[0][0]
      expect(typeof sent.amount).toBe('string')
    })
  })
})
