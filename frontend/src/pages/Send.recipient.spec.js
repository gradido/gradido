// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core'
import { nextTick } from 'vue'
import { Send } from './Send'
import { useMutation } from '@vue/apollo-composable'
import { reachableCommunities } from '@/graphql/communities.graphql'
import {
  addThankYouGreetingPicture,
  createTransactionLink,
  sendCoins,
} from '@/graphql/mutations.js'
import { user as userQuery } from '@/graphql/queries'
import { ChatImageError, encodeChatImage } from '@/utils/chatImage'
import { THANK_YOU_PICTURE_LARGE, THANK_YOU_PICTURE_SMALL } from '@/utils/thankYouPicture'
import { SEND_TYPES } from '@/utils/sendTypes'
import { walletStore } from '@test/walletStore'

/**
 * "Jetzt prüfen" asks after the recipient, and whoever has no account gets a door instead of a dead
 * end (ZE-037). The form and the check view are stand-ins that say what they are handed; the step
 * for a recipient nobody has is the real one, so that what a press leads to is what a member meets.
 */
vi.mock('@/components/GddSend/TransactionForm', () => ({
  TransactionForm: {
    name: 'TransactionForm',
    props: {
      checking: { type: Boolean, default: false },
      identifier: { type: String, default: '' },
    },
    template: '<div data-test="the-form"></div>',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationSend', () => ({
  TransactionConfirmationSend: {
    name: 'TransactionConfirmationSend',
    props: {
      identifier: { type: String, default: '' },
      userName: { type: String, default: '' },
    },
    template: '<div data-test="the-check"></div>',
  },
}))
vi.mock('@/components/GddSend/TransactionConfirmationLink', () => ({
  TransactionConfirmationLink: { template: '<div data-test="the-link-check"></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultSendError', () => ({
  TransactionResultSendError: { template: '<div data-test="the-error-page"></div>' },
}))
vi.mock('@/components/GddSend/TransactionResultLink', () => ({
  TransactionResultLink: { template: '<div></div>' },
}))
vi.mock('@/components/ThankYouGreeting/ThankYouGreetingDone.vue', () => ({
  default: {
    name: 'ThankYouGreetingDone',
    props: {
      created: { type: Object, required: true },
      emailAddress: { type: String, default: '' },
    },
    emits: ['another'],
    template: '<div data-test="the-done-page"></div>',
  },
}))

const t = (key) => key
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({ t }),
}))

const routing = vi.hoisted(() => ({
  params: {},
  query: {},
  path: '/send',
  hash: '',
  fullPath: '/send',
  replace: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => routing,
  useRouter: () => ({ push: vi.fn(), replace: routing.replace }),
}))

const apollo = vi.hoisted(() => ({ query: vi.fn(), readQuery: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: apollo }),
  useMutation: vi.fn(),
}))

const toastError = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useToast', () => ({ useAppToast: () => ({ toastError }) }))

const pictures = vi.hoisted(() => ({ remember: vi.fn() }))
vi.mock('@/composables/useGreetingPictures', () => ({
  rememberGreetingPicture: (...args) => pictures.remember(...args),
}))

vi.mock('@/utils/chatImage', async (original) => ({
  ...(await original()),
  encodeChatImage: vi.fn(),
}))

const HOME = { uuid: 'home-uuid', name: 'Gradido-Akademie', foreign: false }
const AWAY = { uuid: 'away-uuid', name: 'Gradido Wien', foreign: true }
const ADDRESS = 'sarah@kongress-beispiel.de'

const USER_NOT_FOUND = Object.assign(new Error('User not found'), {
  graphQLErrors: [{ message: 'User not found' }],
  networkError: null,
})
const NETWORK_DOWN = Object.assign(new Error('Failed to fetch'), {
  graphQLErrors: [],
  networkError: new Error('Failed to fetch'),
})
const VOTE_NO = new Error(
  'Error: voteForSendCoins failed for endpoint=https://w/api/, err=Error: voteForSendCoins with ' +
    'unknown recipientUserIdentifier in the community=Gradido Wien: {"response":{}}{}',
)

const FOUND = { data: { user: { alias: 'Sarah-K', gradidoID: 'uuid-sarah' } } }

const transfer = (rest = {}) => ({
  selected: SEND_TYPES.send,
  targetCommunity: HOME,
  identifier: ADDRESS,
  amount: 12.5,
  memo: 'Danke für den Kongress!\nEs war wunderbar.',
  userName: '',
  ...rest,
})

const SOURCE = { image: { secret: 'THE-DECODED-PHOTO' }, width: 4000, height: 3000 }
const EDIT = { frame: 1.44 }
const PHOTO = { source: SOURCE, edit: EDIT, preview: 'data:image/jpeg;base64,UFJFVklFVw==' }
const SMALL = { data: 'U01BTEw=', width: 831, height: 577, bytes: 30000 }
const LARGE = { data: 'TEFSR0U=', width: 1080, height: 750, bytes: 60000 }
const SMALL_INPUT = { data: SMALL.data, width: SMALL.width, height: SMALL.height }
const LARGE_INPUT = { data: LARGE.data, width: LARGE.width, height: LARGE.height }

const LINK = {
  id: 77,
  link: 'https://x.example/redeem/abc',
  amount: '12.5',
  memo: 'Danke für den Kongress!\nEs war wunderbar.',
  validUntil: '2026-11-15T12:00:00.000Z',
  greeting: { motif: 'bouquet', line: 'Danke für den Kongress!', recipientName: null },
}

describe('Send, the recipient nobody has', () => {
  let page
  let sendCoinsMock
  let createLinkMock
  let addPictureMock
  let order

  const data = (name) => page.find(`[data-test="${name}"]`)
  const door = (name) => data(`recipient-not-found-${name}`)
  const form = () => page.findComponent({ name: 'TransactionForm' })
  const check = () => page.findComponent({ name: 'TransactionConfirmationSend' })
  const donePage = () => page.findComponent({ name: 'ThankYouGreetingDone' })
  const press = async (rest) => {
    await page.vm.setTransaction(transfer(rest))
    await nextTick()
  }
  const toTheDoor = async (rest) => {
    apollo.query.mockRejectedValue(USER_NOT_FOUND)
    await press(rest)
  }
  const sendByEmail = async () => {
    await door('send-by-email').trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    routing.params = {}
    routing.query = {}
    routing.fullPath = '/send'
    routing.replace.mockReset().mockResolvedValue(undefined)
    order = []
    apollo.query.mockReset().mockResolvedValue(FOUND)
    apollo.readQuery.mockReset().mockReturnValue({ reachableCommunities: [HOME, AWAY] })
    sendCoinsMock = vi.fn().mockResolvedValue({ data: { sendCoins: true } })
    createLinkMock = vi.fn(async () => {
      order.push('createLink')
      return { data: { createTransactionLink: LINK } }
    })
    addPictureMock = vi.fn(async () => {
      order.push('addPicture')
      return { data: { addThankYouGreetingPicture: true } }
    })
    pictures.remember.mockImplementation(() => order.push('remember'))
    vi.mocked(encodeChatImage).mockImplementation(async (_source, _edit, measure) =>
      measure === THANK_YOU_PICTURE_SMALL ? SMALL : LARGE,
    )
    vi.mocked(useMutation).mockImplementation((mutation) => {
      if (mutation === sendCoins) return { mutate: sendCoinsMock }
      if (mutation === createTransactionLink) return { mutate: createLinkMock }
      if (mutation === addThankYouGreetingPicture) return { mutate: addPictureMock }
      return { mutate: vi.fn() }
    })
    page = mount(Send, {
      props: { balance: 1000, GdtBalance: 500 },
      attachTo: document.body,
      global: { plugins: [walletStore({ gradidoID: 'uuid-emma' })], mocks: { $t: t } },
    })
  })

  afterEach(() => {
    page.unmount()
  })

  describe('"Jetzt prüfen"', () => {
    it('asks once, anew and without keeping the answer, in the community that was chosen', async () => {
      await press()

      expect(apollo.query).toHaveBeenCalledTimes(1)
      expect(apollo.query).toHaveBeenCalledWith({
        query: userQuery,
        variables: { identifier: ADDRESS, communityIdentifier: 'home-uuid' },
        fetchPolicy: 'no-cache',
        context: { queryDeduplication: false },
      })
    })

    it('found: the check view names them by their user name, and what was typed goes on', async () => {
      await press()

      expect(page.vm.currentTransactionStep).toBe('transactionConfirmationSend')
      expect(check().props('userName')).toBe('Sarah-K')
      expect(check().props('identifier')).toBe(ADDRESS)
      await page.vm.sendTransaction()
      expect(sendCoinsMock.mock.calls[0][0].recipientIdentifier).toBe(ADDRESS)
    })

    it('found without a user name: the Gradido ID stands in', async () => {
      apollo.query.mockResolvedValue({ data: { user: { alias: null, gradidoID: 'uuid-sarah' } } })
      await press()

      expect(check().props('userName')).toBe('uuid-sarah')
    })

    it('holds no earlier name at a new recipient, whatever the answer', async () => {
      await press()
      page.vm.onBack()
      apollo.query.mockRejectedValue(USER_NOT_FOUND)
      await press({ userName: 'Sarah-K', identifier: 'somebody@else.example' })

      expect(page.vm.transactionData.userName).toBe('')
    })

    it('makes nothing: no link, no transfer', async () => {
      await toTheDoor()

      expect(createLinkMock).not.toHaveBeenCalled()
      expect(sendCoinsMock).not.toHaveBeenCalled()
    })

    describe('not found', () => {
      it('an address: the step with both doors', async () => {
        await toTheDoor()

        expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
        expect(data('recipient-not-found-identifier').text()).toBe(ADDRESS)
        expect(door('choose-community').exists()).toBe(true)
        expect(door('send-by-email').exists()).toBe(true)
        expect(apollo.readQuery).toHaveBeenCalledWith({ query: reachableCommunities })
      })

      it('a user name: the step without the door to a mail', async () => {
        await toTheDoor({ identifier: 'Sarah-K' })

        expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
        expect(door('send-by-email').exists()).toBe(false)
        expect(door('choose-community').exists()).toBe(true)
      })

      it('a Gradido ID: the step without the door to a mail', async () => {
        await toTheDoor({ identifier: '6f1c2b1e-58d1-4d2c-9e4a-0a4b6d8e3f11' })

        expect(door('send-by-email').exists()).toBe(false)
      })

      it('with one community to reach: no door to another', async () => {
        apollo.readQuery.mockReturnValue({ reachableCommunities: [HOME] })
        await toTheDoor()

        expect(door('choose-community').exists()).toBe(false)
        expect(door('send-by-email').exists()).toBe(true)
      })

      it('with no list in the cache: no door to another, and nothing breaks', async () => {
        apollo.readQuery.mockReturnValue(null)
        await toTheDoor()

        expect(door('choose-community').exists()).toBe(false)
      })

      // `?art` opened the form, and the member has chosen another tab since. Built anew, the form
      // would obey it again, and lead to a tab without an address field.
      describe('after a tab was chosen by hand', () => {
        beforeEach(() => {
          routing.query = { art: SEND_TYPES.link, other: 'stays' }
          routing.path = '/send/c/alice'
          routing.hash = '#send-form'
        })

        afterEach(() => {
          routing.path = '/send'
          routing.hash = ''
        })

        it.each(['choose-community', 'change'])(
          '"%s" takes the command out of the address first, and leaves the rest',
          async (name) => {
            let replaced
            routing.replace.mockReturnValue(new Promise((resolve) => (replaced = resolve)))
            await toTheDoor()

            await door(name).trigger('click')

            expect(routing.replace).toHaveBeenCalledWith({
              path: '/send/c/alice',
              query: { other: 'stays' },
              hash: '#send-form',
            })
            expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
            replaced()
            await flushPromises()
            expect(page.vm.currentTransactionStep).toBe('transactionForm')
          },
        )

        it('"Noch einen für jemand anderen" as well', async () => {
          await toTheDoor()
          await sendByEmail()

          donePage().vm.$emit('another')
          await flushPromises()

          expect(routing.replace).toHaveBeenCalledTimes(1)
          expect(page.vm.currentTransactionStep).toBe('transactionForm')
        })
      })

      it('leaves an address alone whose command was the tab the member stands on', async () => {
        routing.query = { art: SEND_TYPES.send }
        await toTheDoor()

        await door('change').trigger('click')

        expect(routing.replace).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionForm')
      })

      it.each(['choose-community', 'change'])(
        '"%s" leads back into the form, with everything still there',
        async (name) => {
          await toTheDoor()
          page.vm.picture = { motif: 'bouquet' }
          await nextTick()

          await door(name).trigger('click')

          expect(page.vm.currentTransactionStep).toBe('transactionForm')
          expect(form().props('identifier')).toBe(ADDRESS)
          expect(page.vm.picture).toEqual({ motif: 'bouquet' })
        },
      )
    })

    // ⛔ Never "no account" because the network was gone.
    it.each([
      ['the network is gone', NETWORK_DOWN],
      [
        'the server fails otherwise',
        Object.assign(new Error('Something went wrong'), {
          graphQLErrors: [{ message: 'Something went wrong' }],
        }),
      ],
    ])('%s: says so, and the form stays', async (_case, failure) => {
      apollo.query.mockRejectedValue(failure)
      await press()

      expect(toastError).toHaveBeenCalledWith(failure.message)
      expect(page.vm.currentTransactionStep).toBe('transactionForm')
      expect(form().props('checking')).toBe(false)
    })

    // The form stays, and the page holds nothing of a press that did not go through.
    it('hands the form nothing of what was pressed, where the form stays', async () => {
      apollo.query.mockRejectedValue(NETWORK_DOWN)
      await press()

      expect(form().props('identifier')).toBe('')
      expect(page.vm.transactionData.memo).toBe('')
    })

    it('takes one press while the answer is on its way, and tells the form so', async () => {
      let answer
      apollo.query.mockReturnValue(new Promise((resolve) => (answer = resolve)))

      const first = page.vm.setTransaction(transfer())
      await nextTick()
      expect(form().props('checking')).toBe(true)
      await page.vm.setTransaction(transfer({ identifier: 'second@press.example' }))
      expect(apollo.query).toHaveBeenCalledTimes(1)

      answer(FOUND)
      await first
      expect(page.vm.transactionData.identifier).toBe(ADDRESS)
      expect(page.vm.currentTransactionStep).toBe('transactionConfirmationSend')
      expect(page.vm.checkingRecipient).toBe(false)
    })

    // A contact tapped in the meantime (ContactWindow), or the page left: the answer is about the
    // recipient that was let go, and must not take the form away from the one named now.
    describe('where the address has changed before the answer came', () => {
      it.each([
        ['found', (answer) => answer.resolve(FOUND)],
        ['not found', (answer) => answer.reject(USER_NOT_FOUND)],
        ['the line failed', (answer) => answer.reject(NETWORK_DOWN)],
      ])('%s: says nothing and changes nothing', async (_case, answers) => {
        const answer = {}
        apollo.query.mockReturnValue(
          new Promise((resolve, reject) => Object.assign(answer, { resolve, reject })),
        )
        const pressed = page.vm.setTransaction(transfer())

        routing.fullPath = '/send/home-uuid/other?art=send'
        answers(answer)
        await pressed

        expect(toastError).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionForm')
        expect(page.vm.transactionData.identifier).toBe('')
        expect(page.vm.checkingRecipient).toBe(false)
      })
    })

    // The form is the whole of the member's work, and on a bad line this answer may never come.
    describe('where no answer comes', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('gives the form back after a while, and says so', async () => {
        apollo.query.mockReturnValue(new Promise(() => {}))
        const pressed = page.vm.setTransaction(transfer())

        await vi.advanceTimersByTimeAsync(14999)
        expect(page.vm.checkingRecipient).toBe(true)
        await vi.advanceTimersByTimeAsync(1)
        await pressed

        expect(toastError).toHaveBeenCalledWith('form.recipient-not-found.no-answer')
        expect(page.vm.checkingRecipient).toBe(false)
        expect(page.vm.currentTransactionStep).toBe('transactionForm')
      })

      it('takes no answer that comes after that', async () => {
        let answer
        apollo.query.mockReturnValue(new Promise((resolve) => (answer = resolve)))
        const pressed = page.vm.setTransaction(transfer())
        await vi.advanceTimersByTimeAsync(15000)
        await pressed

        answer(FOUND)
        await vi.advanceTimersByTimeAsync(0)

        expect(page.vm.currentTransactionStep).toBe('transactionForm')
      })

      // The toast says to try again. Apollo would hang that press on the request still open, and that
      // one gives no answer: a client of its own, as the wallet's is, counts the requests that leave.
      it('asks anew at the press after that', async () => {
        const requests = vi.fn()
        const real = new ApolloClient({
          cache: new InMemoryCache(),
          link: new ApolloLink(
            () =>
              new Observable(() => {
                requests()
              }),
          ),
        })
        apollo.query.mockImplementation((options) => real.query(options))

        for (const _press of [1, 2]) {
          const pressed = page.vm.setTransaction(transfer())
          await vi.advanceTimersByTimeAsync(15000)
          await pressed
        }

        expect(requests).toHaveBeenCalledTimes(2)
      })

      it('leaves no alarm behind where the answer came in time', async () => {
        await press()

        expect(vi.getTimerCount()).toBe(0)
      })
    })

    describe('does not ask', () => {
      it('for another community: there the question stays with "Jetzt senden"', async () => {
        await press({ targetCommunity: AWAY })

        expect(apollo.query).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionConfirmationSend')
        expect(check().props('userName')).toBe('')
      })

      it('on /send/<community>/<user>: there the form has asked already', async () => {
        routing.params = { communityIdentifier: 'home-uuid', userIdentifier: 'Sarah-K' }
        await press({ userName: 'Sarah-K', identifier: 'Sarah-K' })

        expect(apollo.query).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionConfirmationSend')
        expect(check().props('userName')).toBe('Sarah-K')
      })

      it('for a link', async () => {
        await press({ selected: SEND_TYPES.link })

        expect(apollo.query).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionConfirmationLink')
      })
    })
  })

  describe('"Jetzt senden"', () => {
    const sendFails = async (failure, rest) => {
      sendCoinsMock.mockRejectedValue(failure)
      await press(rest)
      await page.vm.sendTransaction()
      await nextTick()
    }

    it('another community does not know them: the same step, not the dead end', async () => {
      await sendFails(VOTE_NO, { targetCommunity: AWAY })

      expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
      expect(data('recipient-not-found-title').text()).toBe('form.recipient-not-found.title-email')
      expect(door('send-by-email').exists()).toBe(true)
      expect(data('the-error-page').exists()).toBe(false)
      // The server's sentence names the address, and nothing is left to show it on.
      expect(page.vm.errorResult).toBe('')
    })

    it('here the account went between the check and the transfer: the same step', async () => {
      await sendFails(new Error(`The recipient user was not found: ${ADDRESS}`))

      expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
    })

    it('on /send/<community>/<user> without a recipient to show: the error page', async () => {
      routing.params = { communityIdentifier: 'home-uuid', userIdentifier: 'Sarah-K' }
      await sendFails(new Error('The recipient user was not found: '), { identifier: '' })

      expect(page.vm.currentTransactionStep).toBe('transactionResultSendError')
    })

    it('every other failure: the error page, as before', async () => {
      await sendFails(new Error('Sender and Recipient are the same'))

      expect(page.vm.currentTransactionStep).toBe('transactionResultSendError')
      expect(page.vm.errorResult).toBe('Sender and Recipient are the same')
    })

    it('a mail from there makes a plain link in this community: no picture goes along', async () => {
      page.vm.picture = { motif: 'bouquet' }
      await sendFails(VOTE_NO, { targetCommunity: AWAY })

      await sendByEmail()

      expect(createLinkMock).toHaveBeenCalledWith({
        amount: '12.5',
        memo: LINK.memo,
      })
      expect(page.vm.currentTransactionStep).toBe('sendByEmailReady')
    })
  })

  describe('"Dank per E-Mail schicken"', () => {
    describe('makes the link out of the form', () => {
      it('with a motif: a greeting, its line the first line of the message', async () => {
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()

        await sendByEmail()

        expect(createLinkMock).toHaveBeenCalledTimes(1)
        // A string: GradidoUnit takes nothing else (a number stops at the variable coercion).
        expect(createLinkMock).toHaveBeenCalledWith({
          amount: '12.5',
          memo: LINK.memo,
          greeting: { motif: 'bouquet', line: 'Danke für den Kongress!', recipientName: null },
        })
        expect(addPictureMock).not.toHaveBeenCalled()
        expect(encodeChatImage).not.toHaveBeenCalled()
      })

      it('with no line where the message does not begin with one, and the message unchanged', async () => {
        const memo = 'Danke! \nmit einem Leerzeichen zu viel.'
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor({ memo })

        await sendByEmail()

        expect(createLinkMock.mock.calls[0][0].memo).toBe(memo)
        expect(createLinkMock.mock.calls[0][0].greeting.line).toBeNull()
      })

      it('with a photo: both renditions, the link with the small one, then the large one', async () => {
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(createLinkMock).toHaveBeenCalledWith({
          amount: '12.5',
          memo: LINK.memo,
          greeting: {
            picture: SMALL_INPUT,
            line: 'Danke für den Kongress!',
            recipientName: null,
          },
        })
        expect(pictures.remember).toHaveBeenCalledWith(77, SMALL.data)
        expect(addPictureMock).toHaveBeenCalledWith({ linkId: 77, picture: LARGE_INPUT })
        expect(order).toEqual(['createLink', 'remember', 'addPicture'])
      })

      it('with a photo that has no large rendition: the small one is all', async () => {
        vi.mocked(encodeChatImage).mockImplementation(async (_source, _edit, measure) => {
          if (measure === THANK_YOU_PICTURE_LARGE) throw new ChatImageError('NOT_SMALL_ENOUGH')
          return SMALL
        })
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(addPictureMock).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('sendByEmailReady')
      })

      it('where the large rendition fails on its way: the greeting stands without it', async () => {
        addPictureMock.mockRejectedValue(new Error('the line'))
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(toastError).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('sendByEmailReady')
        expect(pictures.remember).toHaveBeenCalledWith(77, SMALL.data)
      })

      it('without a picture: a plain link, and no word of a greeting', async () => {
        await toTheDoor()

        await sendByEmail()

        expect(createLinkMock).toHaveBeenCalledWith({ amount: '12.5', memo: LINK.memo })
      })
    })

    describe('leads to "Fertig"', () => {
      it('with the server’s answer, and the address for the mail', async () => {
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()

        await sendByEmail()

        expect(page.vm.currentTransactionStep).toBe('sendByEmailReady')
        expect(donePage().props('created')).toEqual({ ...LINK, picture: null })
        expect(donePage().props('emailAddress')).toBe(ADDRESS)
      })

      it('with the photo as the page holds it', async () => {
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(donePage().props('created').picture).toBe(PHOTO.preview)
      })

      it('and lets go of what was entered, and says the balance has changed', async () => {
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()

        await sendByEmail()

        expect(page.vm.picture).toBeNull()
        expect(page.vm.transactionData).toMatchObject({ identifier: '', amount: 0, memo: '' })
        expect(page.emitted('update-transactions')).toEqual([[{}]])
      })

      it('"Noch einen für jemand anderen" leads back into the empty form, the address gone', async () => {
        await toTheDoor()
        await sendByEmail()

        donePage().vm.$emit('another')
        await nextTick()

        expect(page.vm.currentTransactionStep).toBe('transactionForm')
        expect(form().props('identifier')).toBe('')
        expect(page.vm.emailAddress).toBe('')
        expect(page.vm.madeForEmail).toBeNull()
      })
    })

    // ⛔ F5 of the note: in the memory of this page, and nowhere else.
    describe('the address', () => {
      it('stands beside what is bound onto the form, and not in the device', async () => {
        await toTheDoor()
        await sendByEmail()

        expect(JSON.stringify(page.vm.transactionData)).not.toContain(ADDRESS)
        expect(JSON.stringify({ ...localStorage })).not.toContain(ADDRESS)
        expect(JSON.stringify({ ...sessionStorage })).not.toContain(ADDRESS)
      })

      it('goes to the server in no mutation', async () => {
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()
        await sendByEmail()

        expect(JSON.stringify(createLinkMock.mock.calls)).not.toContain(ADDRESS)
      })
    })

    describe('one press, one link', () => {
      let release

      beforeEach(() => {
        createLinkMock.mockImplementation(
          () =>
            new Promise((resolve) => {
              release = () => resolve({ data: { createTransactionLink: LINK } })
            }),
        )
      })

      it('makes one of two presses', async () => {
        await toTheDoor()

        const first = page.vm.sendByEmail()
        const second = page.vm.sendByEmail()
        release()
        await Promise.all([first, second])

        expect(createLinkMock).toHaveBeenCalledTimes(1)
      })

      // Whoever walks back into the form while the link is made would have it emptied under their
      // hands by the answer.
      it('shuts all three doors while it is under way', async () => {
        await toTheDoor()

        const pressed = page.vm.sendByEmail()
        await nextTick()
        for (const name of ['send-by-email', 'choose-community', 'change']) {
          expect(door(name).attributes('disabled')).toBeDefined()
        }
        release()
        await pressed
      })

      it('sends what stood at the press', async () => {
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()

        const pressed = page.vm.sendByEmail()
        page.vm.transactionData.identifier = 'somebody@else.example'
        release()
        await pressed

        expect(page.vm.emailAddress).toBe(ADDRESS)
      })
    })

    describe('where it fails', () => {
      it('the link is refused: says so, and everything entered stays', async () => {
        createLinkMock.mockRejectedValue(new Error('the line'))
        page.vm.picture = { motif: 'bouquet' }
        await toTheDoor()

        await sendByEmail()

        expect(toastError).toHaveBeenCalledWith('the line')
        expect(page.vm.currentTransactionStep).toBe('recipientNotFound')
        expect(page.vm.transactionData.identifier).toBe(ADDRESS)
        expect(page.vm.picture).toEqual({ motif: 'bouquet' })
        expect(page.vm.emailAddress).toBe('')
        expect(page.vm.loading).toBe(false)
      })

      it('the server does not take the photo: in the chat’s words', async () => {
        createLinkMock.mockRejectedValue(new Error('CHAT_IMAGE_NOT_ACCEPTED: NOT_JPEG'))
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(toastError).toHaveBeenCalledWith('chatThread.imageNotAccepted')
      })

      it('the photo cannot be made small enough: nothing is made, and back into the form', async () => {
        vi.mocked(encodeChatImage).mockRejectedValue(new ChatImageError('NOT_SMALL_ENOUGH'))
        page.vm.picture = { photo: PHOTO }
        await toTheDoor()

        await sendByEmail()

        expect(toastError).toHaveBeenCalledWith('chatThread.imageTooBig')
        expect(createLinkMock).not.toHaveBeenCalled()
        expect(page.vm.currentTransactionStep).toBe('transactionForm')
        expect(page.vm.picture).toEqual({ photo: PHOTO })
      })

      // A link holds a little more than its amount, so the whole balance does not go into one. The
      // server would refuse it in English; the amount is changed in the form.
      it('more than a link can hold: says so in the form’s words, and back into the form', async () => {
        await page.setProps({ balance: 100 })
        await toTheDoor({ amount: 100 })

        await sendByEmail()

        expect(createLinkMock).not.toHaveBeenCalled()
        expect(toastError).toHaveBeenCalledWith('form.validation.amount.max')
        expect(page.vm.currentTransactionStep).toBe('transactionForm')
        expect(page.vm.transactionData.amount).toBe(100)
      })
    })
  })
})
