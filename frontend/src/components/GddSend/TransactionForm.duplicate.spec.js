// AI-GENERATED — not an architecture reference
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  BButton,
  BCard,
  BCol,
  BForm,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BFormTextarea,
  BRow,
} from 'bootstrap-vue-next'
import i18n from '@/i18n'
import { clearLinkDraft, useLinkDraft } from '@/composables/useLinkDraft'
import { amount as amountUpTo } from '@/validationSchemas'
import TransactionForm from './TransactionForm.vue'

/**
 * A plain link duplicated from the member's own list (ZE-030), as the send form opens with it:
 * on its link tab, the old link's amount and memo standing in the fields. With the wallet's own
 * texts and number formats and the house's real input -- what must hold is what stands in the
 * fields, and a stand-in for the field would agree to anything.
 */
const route = vi.hoisted(() => ({ params: {}, query: { art: 'link' }, fullPath: '/send?art=link' }))
const replace = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ replace }),
}))
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: ref(null), loading: ref(false), error: ref(null) }),
}))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError: vi.fn() }) }))

const EMMA = { state: { gradidoID: 'uuid-emma' } }
const OLD_LINK = { id: 4711, amount: 12.5, memo: 'Danke fürs Rasenmähen!', greeting: null }

// What the row of the list does: hand the link over, as the member whose list it is.
const handOver = (link, store = EMMA) => {
  mount(
    {
      setup() {
        useLinkDraft().put(link)
        return () => null
      },
    },
    { global: { provide: { store } } },
  )
}

let wrapper
const openForm = (props = {}, store = EMMA) => {
  wrapper = mount(TransactionForm, {
    global: {
      plugins: [i18n],
      provide: { store },
      components: {
        BButton,
        BCard,
        BCol,
        BForm,
        BFormGroup,
        BFormInput,
        BFormInvalidFeedback,
        BFormTextarea,
        BRow,
      },
      stubs: {
        'community-switch': true,
        'b-img': true,
        'i-mdi-link-variant': true,
        'i-mdi-email-fast-outline': true,
        TransactionPictureField: true,
      },
    },
    props: { balance: 100, ...props },
  })
  return wrapper
}

const amountField = () => wrapper.find('#amount-input-field')
const memoField = () => wrapper.find('#memo-input-field')

describe('TransactionForm, a duplicated link', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'de'
    replace.mockClear()
    clearLinkDraft()
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  it('opens on the link tab with the old link’s amount and memo in the fields', () => {
    handOver(OLD_LINK)
    openForm()

    expect(wrapper.vm.radioSelected).toBe('link')
    expect(wrapper.text()).toContain('Link, Scheck und QR-Code erzeugen')
    expect(amountField().element.value).toBe('12,5')
    expect(memoField().element.value).toBe('Danke fürs Rasenmähen!')
  })

  it('writes the amount as the wallet’s language writes it', () => {
    i18n.global.locale.value = 'en'
    handOver(OLD_LINK)
    openForm()

    expect(amountField().element.value).toBe('12.5')
  })

  // A whole amount without decimals, and no grouping: "1000", as it would be typed.
  it.each([
    [10, '10'],
    [1000, '1000'],
    [1234.56, '1234,56'],
    [0.5, '0,5'],
  ])('writes %s as "%s"', (amount, written) => {
    handOver({ ...OLD_LINK, amount })
    openForm({ balance: 100000 })

    expect(amountField().element.value).toBe(written)
  })

  it('stands ready to be checked: what is there is valid, and the check carries it on', async () => {
    handOver(OLD_LINK)
    openForm()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    await wrapper.findComponent(BForm).trigger('submit')

    const [sent] = wrapper.emitted('set-transaction')[0]
    expect(sent).toMatchObject({ amount: 12.5, memo: 'Danke fürs Rasenmähen!', selected: 'link' })
    // Of the old link itself nothing goes on: the new one is a link like any other.
    expect(JSON.stringify(sent)).not.toContain('4711')
  })

  it('lets everything be changed before the check', async () => {
    handOver(OLD_LINK)
    openForm()

    await amountField().setValue('7')
    await memoField().setValue('Danke für alles!')
    await wrapper.findComponent(BForm).trigger('submit')

    expect(wrapper.emitted('set-transaction')[0][0]).toMatchObject({
      amount: 7,
      memo: 'Danke für alles!',
    })
  })

  /**
   * ⛔ "Zurücksetzen" goes back to what the page handed in as the fields' first values. The old
   * link's amount and memo are not among those: after a reset nothing of it stands here.
   */
  it('"Zurücksetzen" leaves nothing of the old link in the fields', async () => {
    const afterReset = async () => {
      await wrapper.find('button[type="reset"]').trigger('click')
      await flushPromises()
      return [amountField().element.value, memoField().element.value]
    }
    // What a reset leaves of an amount and a memo that were typed ...
    openForm()
    await amountField().setValue('5')
    await memoField().setValue('Getippt, nicht übernommen')
    const typed = await afterReset()
    wrapper.unmount()

    // ... it leaves of the ones that were handed over.
    handOver(OLD_LINK)
    openForm()
    const handedOver = await afterReset()

    expect(handedOver).toEqual(typed)
    expect(handedOver[0]).not.toContain('12')
    expect(handedOver[1]).toBe('')
    expect(wrapper.vm.form.amount).toBe(0)
    expect(wrapper.vm.form.memo).toBe('')
  })

  // The form is taken down between the steps, and a reload builds it anew: neither finds the
  // old link again.
  it('is handed the old link once: a form built after it starts with what the page holds', () => {
    handOver(OLD_LINK)
    openForm()
    wrapper.unmount()

    openForm()

    expect(amountField().element.value).toBe('')
    expect(memoField().element.value).toBe('')
  })

  it('opens empty where nothing was handed over', () => {
    openForm()

    expect(amountField().element.value).toBe('')
    expect(memoField().element.value).toBe('')
  })

  // A greeting's memo is its first line, a line break and the words: it has its own page.
  it('does not take what a thank-you greeting handed over', () => {
    handOver({
      id: 5,
      amount: 20,
      memo: 'Einfach so\nLiebe Sarah',
      greeting: { motif: 'bouquet', line: 'Einfach so', recipientName: 'Sarah', hasPicture: false },
    })
    openForm()

    expect(amountField().element.value).toBe('')
    expect(memoField().element.value).toBe('')
  })

  it('does not take what another member handed over', () => {
    handOver(OLD_LINK, { state: { gradidoID: 'uuid-dave' } })
    openForm()

    expect(amountField().element.value).toBe('')
    expect(memoField().element.value).toBe('')
  })

  /**
   * ⛔ What is written into the field is read back by the field's own rule when the member
   * goes on. Every amount a link can carry must come back as the number it was -- in each of
   * the ten languages, whose decimal marks differ.
   */
  describe('the amount, written and read back', () => {
    const AMOUNTS = [0.01, 0.1, 0.5, 1, 9.99, 10, 12.5, 12.25, 100, 999.99, 1000, 1234.56, 99999.99]

    it.each(i18n.global.availableLocales.map((lang) => [lang]))(
      'comes back as the same number in %s',
      (lang) => {
        i18n.global.locale.value = lang
        const rule = amountUpTo(1000000)

        for (const amount of AMOUNTS) {
          handOver({ ...OLD_LINK, amount })
          openForm({ balance: 1000000 })
          const written = amountField().element.value
          wrapper.unmount()

          expect(rule.isValidSync(written), `${lang}: "${written}" for ${amount}`).toBe(true)
          expect(rule.cast(written), `${lang}: "${written}" for ${amount}`).toBe(amount)
        }
      },
    )

    it('is asked of all ten languages', () => {
      expect([...i18n.global.availableLocales].sort()).toEqual(
        ['de', 'el', 'en', 'es', 'fr', 'it', 'nl', 'pt', 'ru', 'tr'].sort(),
      )
    })
  })
})
