// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { BButton } from 'bootstrap-vue-next'
import { Send } from './Send'
import { RecipientNotFound } from '@/components/GddSend/RecipientNotFound'
import { useMutation } from '@vue/apollo-composable'
import { createTransactionLink, sendCoins, sendEmail } from '@/graphql/mutations.js'
import { clearSendReturn, useSendReturn } from '@/composables/useSendReturn'
import { backOrOverviewUnless } from '@/utils/backOrOverview'
import { SEND_TYPES } from '@/utils/sendTypes'
import { walletStore } from '@test/walletStore'

/**
 * "Zurück" in the send form (E-043): from the form itself and after a transfer or a letter that went
 * out, back to where the member came from -- the place a window named (useSendReturn), or else the
 * browser's history (backOrOverviewUnless, held in its own spec and stood in for here).
 *
 * With a real router: the page takes the way back at every change of its address, and what counts
 * there is the path as the router has it. The page is mounted on its own, as the form beside /send
 * stands while a tap in the column patches it to another recipient. The steps are the real ones;
 * the form and the views around it are stand-ins that say what they would say.
 */
vi.mock('@/components/GddSend/TransactionForm', () => ({
  TransactionForm: {
    name: 'TransactionForm',
    emits: ['back'],
    template: '<div data-test="the-form" />',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationSend', () => ({
  TransactionConfirmationSend: {
    name: 'TransactionConfirmationSend',
    template: '<div data-test="the-check" />',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationLink', () => ({
  TransactionConfirmationLink: {
    name: 'TransactionConfirmationLink',
    template: '<div data-test="the-link-check" />',
  },
}))
vi.mock('@/components/GddSend/TransactionResultSendError', () => ({
  TransactionResultSendError: {
    name: 'TransactionResultSendError',
    emits: ['on-back'],
    template: '<div data-test="the-error-page" />',
  },
}))
vi.mock('@/components/GddSend/SendEmailResultError', () => ({
  SendEmailResultError: { name: 'SendEmailResultError', emits: ['on-back'], template: '<div />' },
}))
vi.mock('@/components/GddSend/TransactionResultLink', () => ({
  TransactionResultLink: {
    name: 'TransactionResultLink',
    emits: ['on-back'],
    template: '<div data-test="the-link-result" />',
  },
}))
vi.mock('@/components/ThankYouGreeting/ThankYouGreetingDone.vue', () => ({
  default: { name: 'ThankYouGreetingDone', template: '<div />' },
}))

const t = (key) => key
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({ t }),
}))

vi.mock('@/utils/backOrOverview', async (importOriginal) => ({
  ...(await importOriginal()),
  backOrOverviewUnless: vi.fn(),
}))

const apollo = vi.hoisted(() => ({ query: vi.fn(), readQuery: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: apollo }),
  useMutation: vi.fn(),
}))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError: vi.fn() }) }))

const HOME = { uuid: 'home-uuid', name: 'Gradido-Akademie', foreign: false }

// Sarah's conversation and the form with her named; Carla, a member of a group.
const TO_SARAH = '/send/home-uuid/sarah-id'
const BACK_TO_SARAH = { path: '/contacts', query: { with: 'sarah-id', community: 'home-uuid' } }
const TO_CARLA = '/send/home-uuid/carla-id'
const BACK_TO_GROUP = { path: '/contacts', query: { group: 'group-uuid' } }

const page = { render: () => null }
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/send/:communityIdentifier?/:userIdentifier?',
        name: 'Send',
        component: page,
        meta: { requiresAuth: true },
      },
      { path: '/contacts', component: page, meta: { requiresAuth: true } },
      { path: '/overview', component: page, meta: { requiresAuth: true } },
    ],
  })

describe('Send, "Zurück"', () => {
  let router
  let pinia
  let wrapper
  let sendCoinsMock
  let sendEmailMock

  /** What a window does before it opens the form: names its place (ContactWindow `toSend`). */
  const handOver = (to, back) => {
    mount(
      {
        setup() {
          useSendReturn().put({ to, back })
          return () => null
        },
      },
      { global: { plugins: [pinia, router] } },
    )
  }
  /** What is held for that path, as the page would take it (and so let go). */
  const takeFor = (path) => {
    let taken
    mount(
      {
        setup() {
          taken = useSendReturn().take(path)
          return () => null
        },
      },
      { global: { plugins: [pinia, router] } },
    )
    return taken
  }
  /** A window: hand over, then open the form for its person. */
  const openFrom = async (to, back) => {
    handOver(to, back)
    await router.push({ path: to, query: { art: SEND_TYPES.send } })
  }
  const mountPage = () => {
    wrapper = mount(Send, {
      props: { balance: 1000, GdtBalance: 0 },
      global: { plugins: [pinia, router], mocks: { $t: t }, components: { BButton } },
    })
    vi.spyOn(router, 'push')
  }
  const form = () => wrapper.findComponent({ name: 'TransactionForm' })
  const pressBack = async () => {
    await form().vm.$emit('back')
    await flushPromises()
  }
  const successButton = () => wrapper.find('[data-test="success-message-button"]')
  /** "Jetzt prüfen" for Sarah, from the form her conversation opened: the check view. */
  const checkSarah = () =>
    wrapper.vm.setTransaction({
      selected: SEND_TYPES.send,
      targetCommunity: HOME,
      identifier: 'sarah-id',
      amount: 10,
      memo: 'Danke für die Marmelade!',
    })
  const sendToSarah = async () => {
    await checkSarah()
    await wrapper.vm.sendTransaction()
    await flushPromises()
  }
  const step = () => wrapper.vm.currentTransactionStep

  beforeEach(async () => {
    vi.clearAllMocks()
    // What is held lives at module level, so one test must not hand anything to the next.
    clearSendReturn()
    pinia = walletStore({ gradidoID: 'uuid-emma' })
    router = makeRouter()
    await router.push('/overview')
    await router.isReady()
    sendCoinsMock = vi.fn().mockResolvedValue({ data: { sendCoins: true } })
    sendEmailMock = vi.fn().mockResolvedValue({ data: { sendEmail: true } })
    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === sendCoins) return { mutate: sendCoinsMock }
      if (mutation === sendEmail) return { mutate: sendEmailMock }
      if (mutation === createTransactionLink)
        return {
          mutate: vi.fn().mockResolvedValue({
            data: {
              createTransactionLink: {
                link: 'https://x.example/redeem/abc',
                amount: '5',
                memo: 'Für Dich',
                validUntil: '2026-11-19T08:00:00.000Z',
              },
            },
          }),
        }
      return { mutate: vi.fn() }
    })
  })

  describe('from the form', () => {
    it('leads back to the conversation the contact window opened it from', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()

      await pressBack()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_SARAH)
      expect(router.currentRoute.value.fullPath).toBe('/contacts?with=sarah-id&community=home-uuid')
      expect(backOrOverviewUnless).not.toHaveBeenCalled()
    })

    // ⛔ Never through the form for the recipient before: that is the rule's to know.
    it('goes by the browser’s history where no window named a place', async () => {
      await router.push({ path: TO_SARAH, query: { art: SEND_TYPES.send } })
      mountPage()

      await pressBack()

      expect(backOrOverviewUnless).toHaveBeenCalledWith(router, 'Send')
      expect(router.push).not.toHaveBeenCalled()
    })

    it('takes no way back handed over for another recipient', async () => {
      handOver(TO_CARLA, BACK_TO_GROUP)
      await router.push({ path: TO_SARAH, query: { art: SEND_TYPES.send } })
      mountPage()

      await pressBack()

      expect(backOrOverviewUnless).toHaveBeenCalledWith(router, 'Send')
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('after a transfer that went out', () => {
    it('says "Zurück", and leads back to where the member came from', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendSuccess')
      expect(successButton().text()).toBe('back')
      await successButton().trigger('click')
      await flushPromises()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_SARAH)
    })

    // ⛔ The `push('/send')` that stood after the transfer threw the recipient out of the address,
    // and laid an entry of the form into the history behind the page of the success.
    it('leaves the address as it was', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()

      expect(router.push).not.toHaveBeenCalled()
      expect(router.currentRoute.value.fullPath).toBe('/send/home-uuid/sarah-id?art=send')
    })

    it('leaves the address as it was where the transfer failed', async () => {
      sendCoinsMock.mockRejectedValue(new Error('Send failed'))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionResultSendError')
      expect(router.push).not.toHaveBeenCalled()
      expect(router.currentRoute.value.fullPath).toBe('/send/home-uuid/sarah-id?art=send')
    })
  })

  describe('after a letter that went out', () => {
    it('says "Zurück", and leads back to where the member came from', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()

      await wrapper.vm.sendEmail({
        selected: SEND_TYPES.email,
        targetCommunity: HOME,
        identifier: 'sarah-id',
        subject: 'Marmelade',
        memo: 'Hast Du noch ein Glas?',
      })
      await flushPromises()

      expect(wrapper.vm.currentTransactionStep).toBe('sendEmailResultSuccess')
      expect(successButton().text()).toBe('back')
      await successButton().trigger('click')
      await flushPromises()
      expect(router.push).toHaveBeenCalledWith(BACK_TO_SARAH)
    })
  })

  // The link and the errors behave otherwise (E-043, W3): their "Schließen" leads into the form.
  describe('where the way back stays the way into the form', () => {
    it('after a link was made', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await wrapper.vm.setTransaction({ selected: SEND_TYPES.link, amount: 5, memo: 'Für Dich' })
      await wrapper.vm.sendTransaction()
      await flushPromises()
      expect(wrapper.vm.currentTransactionStep).toBe('transactionResultLink')

      await wrapper.findComponent({ name: 'TransactionResultLink' }).vm.$emit('on-back')
      await flushPromises()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
      expect(router.push).not.toHaveBeenCalledWith(BACK_TO_SARAH)
      expect(backOrOverviewUnless).not.toHaveBeenCalled()
    })

    it('after a transfer that failed', async () => {
      sendCoinsMock.mockRejectedValue(new Error('Send failed'))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()

      await wrapper.findComponent({ name: 'TransactionResultSendError' }).vm.$emit('on-back')
      await flushPromises()

      expect(wrapper.vm.currentTransactionStep).toBe('transactionForm')
      expect(router.push).not.toHaveBeenCalled()
      expect(backOrOverviewUnless).not.toHaveBeenCalled()
    })
  })

  /**
   * ⛔ The form beside /send is patched, not rebuilt, when a contact is tapped in the column: setup
   * does not run again, so the page takes the way back at every change of its address.
   */
  describe('as the address changes', () => {
    it('takes the way back a window hands over to the form standing beside it', async () => {
      await router.push('/send')
      mountPage()

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()
      await pressBack()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_GROUP)
    })

    // What it took for the new recipient is that recipient's, through a change of the query too.
    it('keeps what it took at a new path where then only the query changes', async () => {
      await router.push('/send')
      mountPage()
      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()
      wrapper.vm.transactionData.selected = SEND_TYPES.email

      await wrapper.vm.onBack()
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe(TO_CARLA)
      vi.mocked(router.push).mockClear()
      await pressBack()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_GROUP)
    })

    // Another recipient, and no window named a place for them.
    it('lets it go where the path changes without one', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()

      await router.push({ path: TO_CARLA, query: { art: SEND_TYPES.send } })
      await flushPromises()
      vi.mocked(router.push).mockClear()
      await pressBack()

      expect(backOrOverviewUnless).toHaveBeenCalledWith(router, 'Send')
      expect(router.push).not.toHaveBeenCalled()
    })

    it('lets it go at the menu’s "Senden"', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()

      await router.push('/send')
      await flushPromises()
      vi.mocked(router.push).mockClear()
      await pressBack()

      expect(backOrOverviewUnless).toHaveBeenCalledWith(router, 'Send')
      expect(router.push).not.toHaveBeenCalled()
    })

    // `onBack` takes `?art` out of the address where another tab was chosen: the same form.
    it('keeps it where only the query changes', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      wrapper.vm.transactionData.selected = SEND_TYPES.email

      await wrapper.vm.onBack()
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe(TO_SARAH)
      vi.mocked(router.push).mockClear()
      await pressBack()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_SARAH)
      expect(backOrOverviewUnless).not.toHaveBeenCalled()
    })

    // The same person tapped again from another window, with the mode back in the address.
    it('takes a new way back for the path it stands on in place of the one held', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      wrapper.vm.transactionData.selected = SEND_TYPES.email
      await wrapper.vm.onBack()
      await flushPromises()

      await openFrom(TO_SARAH, BACK_TO_GROUP)
      await flushPromises()
      vi.mocked(router.push).mockClear()
      await pressBack()

      expect(router.push).toHaveBeenCalledWith(BACK_TO_GROUP)
    })
  })

  /**
   * ⛔ A new path brings the form back, whatever step the page stood on: the address names another
   * recipient now, or the empty form. Before, the success of a transfer to Sarah stood under Carla's
   * address, and its "Zurück" led into Carla's conversation without her form ever shown.
   */
  describe('the form, as the address names another recipient', () => {
    it('after a transfer: Carla’s form, and its "Zurück" into her group', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()
      expect(step()).toBe('transactionResultSendSuccess')

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()

      expect(step()).toBe('transactionForm')
      vi.mocked(router.push).mockClear()
      await pressBack()
      expect(router.push).toHaveBeenCalledWith(BACK_TO_GROUP)
    })

    // The form takes Carla from the address. Until that answer has come, its field must not hold
    // Sarah, whom "Jetzt prüfen" would carry on to the check view under Carla's name.
    it('from the check view: without the one before, with what was typed', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await checkSarah()
      expect(step()).toBe('transactionConfirmationSend')

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()

      expect(step()).toBe('transactionForm')
      expect(form().vm.$attrs.identifier).toBe('')
      expect(form().vm.$attrs.amount).toBe(10)
      expect(form().vm.$attrs.memo).toBe('Danke für die Marmelade!')
    })

    it('after a transfer, at the menu’s "Senden": the empty form', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()

      await router.push('/send')
      await flushPromises()

      expect(step()).toBe('transactionForm')
      expect(form().vm.$attrs.identifier).toBe('')
      expect(form().vm.$attrs.amount).toBe(0)
    })

    // Out of the address, the field is the member's: what stood in it stays.
    it('from the check view, at the menu’s "Senden": with the recipient as it was', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await checkSarah()

      await router.push('/send')
      await flushPromises()

      expect(step()).toBe('transactionForm')
      expect(form().vm.$attrs.identifier).toBe('sarah-id')
    })

    it('after an error', async () => {
      sendCoinsMock.mockRejectedValue(new Error('Send failed'))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()
      expect(step()).toBe('transactionResultSendError')

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()

      expect(step()).toBe('transactionForm')
    })

    // ⛔ The address a mail was made for lives in this view only (ZE-037): it goes with the view.
    it('after "Dank per E-Mail schicken": without the address the mail was for', async () => {
      sendCoinsMock.mockRejectedValue(new Error('The recipient user was not found: sarah-id'))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()
      await wrapper.vm.sendByEmail()
      await flushPromises()
      expect(step()).toBe('sendByEmailReady')
      expect(wrapper.vm.emailAddress).toBe('sarah-id')

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()

      expect(step()).toBe('transactionForm')
      expect(wrapper.vm.emailAddress).toBe('')
      expect(wrapper.vm.madeForEmail).toBeNull()
    })

    // `onBack` takes `?art` out where another tab was chosen: the same recipient, the same step.
    it('not where only the query changes', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await checkSarah()

      await router.replace({ path: TO_SARAH })
      await flushPromises()

      expect(step()).toBe('transactionConfirmationSend')
      expect(wrapper.vm.transactionData.identifier).toBe('sarah-id')
    })

    // A transfer on its way: its answer says what became of it, and that step is the member's.
    it('not while a transfer is on its way', async () => {
      let answer
      sendCoinsMock.mockReturnValue(new Promise((resolve) => (answer = resolve)))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await checkSarah()
      const sending = wrapper.vm.sendTransaction()
      await flushPromises()

      await openFrom(TO_CARLA, BACK_TO_GROUP)
      await flushPromises()
      expect(step()).toBe('transactionConfirmationSend')

      answer({ data: { sendCoins: true } })
      await sending
      await flushPromises()
      expect(step()).toBe('transactionResultSendSuccess')
    })

    // On the way out the route names the next page already. What is held for another form is
    // none of this page’s business.
    it('not on the way out of the page', async () => {
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()
      handOver(TO_CARLA, BACK_TO_GROUP)

      await router.push('/overview')
      await flushPromises()

      expect(step()).toBe('transactionResultSendSuccess')
      expect(takeFor(TO_CARLA)).toEqual(BACK_TO_GROUP)
    })
  })

  /**
   * Nobody has that account any more -- gone between the opening of the form and "Jetzt senden".
   * On /send/<community>/<user> the form keeps a recipient named in the address fixed: so
   * "Gemeinschaft wählen" and "Eingabe ändern" take the recipient out of the address, as the page
   * did after every transfer before, and the fields keep what was sent.
   */
  describe('where nobody has that account', () => {
    const notFound = () => wrapper.findComponent(RecipientNotFound)
    const toTheDoors = async () => {
      sendCoinsMock.mockRejectedValue(new Error('The recipient user was not found: sarah-id'))
      await openFrom(TO_SARAH, BACK_TO_SARAH)
      mountPage()
      await sendToSarah()
      expect(step()).toBe('recipientNotFound')
    }

    it.each(['choose-community', 'change-recipient'])(
      '"%s" takes the recipient out of the address, into the form',
      async (door) => {
        await toTheDoors()

        await notFound().vm.$emit(door)
        await flushPromises()

        expect(router.currentRoute.value.fullPath).toBe('/send?art=send')
        expect(step()).toBe('transactionForm')
        expect(form().vm.$attrs.identifier).toBe('sarah-id')
        expect(form().vm.$attrs.memo).toBe('Danke für die Marmelade!')
      },
    )

    // The way back goes with the address: from the free form the browser's history decides.
    it('and from there "Zurück" goes by the browser’s history', async () => {
      await toTheDoors()
      await notFound().vm.$emit('change-recipient')
      await flushPromises()
      vi.mocked(router.push).mockClear()

      await pressBack()

      expect(backOrOverviewUnless).toHaveBeenCalledWith(router, 'Send')
      expect(router.push).not.toHaveBeenCalled()
    })

    // "Jetzt prüfen" on /send found nobody: there is no recipient in the address to take out.
    it('leaves an address without a recipient as it is', async () => {
      apollo.query.mockRejectedValue({ graphQLErrors: [{ message: 'User not found' }] })
      await router.push({ path: '/send', query: { art: SEND_TYPES.send } })
      mountPage()
      vi.spyOn(router, 'replace')
      await wrapper.vm.setTransaction({
        selected: SEND_TYPES.send,
        targetCommunity: HOME,
        identifier: 'sarah',
        amount: 10,
        memo: 'Danke!',
      })
      await flushPromises()
      expect(step()).toBe('recipientNotFound')

      await notFound().vm.$emit('change-recipient')
      await flushPromises()

      expect(router.replace).not.toHaveBeenCalled()
      expect(router.currentRoute.value.fullPath).toBe('/send?art=send')
      expect(step()).toBe('transactionForm')
      expect(form().vm.$attrs.identifier).toBe('sarah')
    })
  })
})
