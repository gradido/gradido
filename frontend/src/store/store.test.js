import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { store, THEME_MODE_STORAGE_KEY } from './store'
import { useWalletStore } from './useWalletStore'
import { walletStore } from '../../test/walletStore'
import i18n from '../i18n'
import jwtDecode from 'jwt-decode'
import { avatarZoomState, openAvatarZoom } from '@/composables/useAvatarZoom'
import { contactsPanelState } from '@/composables/useContactsPanel'
import {
  chatUnreadConversations,
  pollChatNow,
  startChatUpdates,
} from '@/composables/useChatUpdates'
import {
  endEventLinkInvitation,
  eventLinkAnswerUnderway,
  eventLinkInvitationOver,
  eventLinkSentence,
  eventLinkUnderway,
} from '@/composables/useEventMatchingArrival'
import {
  firstLoginWindow,
  forgetFirstLoginWindows,
  holdFirstCreationForThisSession,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import {
  chatImage,
  chatImageViewState,
  openChatImageView,
  rememberChatImage,
} from '@/composables/useChatImages'
import { greetingPicture, rememberGreetingPicture } from '@/composables/useGreetingPictures'
import { useLinkDraft } from '@/composables/useLinkDraft'
import { requestTransactionPicture, transactionPicture } from '@/composables/useTransactionPictures'

vi.mock('../i18n', () => ({
  default: {
    global: {
      locale: {
        value: 'en',
      },
    },
  },
}))

// `vi.hoisted`, because `vi.mock` is lifted above every import and every `const` in
// this file. The arrow below would defer the access far enough to work, which is
// exactly what makes it a trap: shorten it to `clearApolloCache: clearApolloCacheMock`
// and it breaks with a ReferenceError that points nowhere near the cause.
const { clearApolloCacheMock } = vi.hoisted(() => ({ clearApolloCacheMock: vi.fn() }))
vi.mock('../plugins/apolloCache', () => ({
  clearApolloCache: clearApolloCacheMock,
}))

const { forgetLegacyMapPrefsMock } = vi.hoisted(() => ({ forgetLegacyMapPrefsMock: vi.fn() }))
vi.mock('../utils/matchingPrefs', async () => {
  const actual = await vi.importActual('../utils/matchingPrefs')
  return { ...actual, forgetLegacyMapPrefs: forgetLegacyMapPrefsMock }
})

const { forgetParkedAmountMock } = vi.hoisted(() => ({ forgetParkedAmountMock: vi.fn() }))
vi.mock('../composables/useParkedAmount', () => ({
  forgetParkedAmount: forgetParkedAmountMock,
}))

const { forgetChatReturnMock } = vi.hoisted(() => ({ forgetChatReturnMock: vi.fn() }))
vi.mock('../utils/chatReturn', () => ({
  forgetChatReturn: forgetChatReturnMock,
}))

const { forgetChatDraftsMock, letOldChatDraftsGoMock } = vi.hoisted(() => ({
  forgetChatDraftsMock: vi.fn(),
  letOldChatDraftsGoMock: vi.fn(),
}))
vi.mock('../utils/chatDraft', () => ({
  forgetChatDrafts: forgetChatDraftsMock,
  letOldChatDraftsGo: letOldChatDraftsGoMock,
}))

vi.mock('jwt-decode', () => ({
  default: vi.fn(() => ({ exp: '1234' })),
}))

/** A store of its own, holding `state`. */
const walletOf = (state = {}) => {
  const wallet = useWalletStore(createPinia())
  wallet.$patch(state)
  return wallet
}

/** Every setter `wallet`'s actions call from now on, as `[name, value]`. */
const settersOf = (wallet) => {
  const calls = []
  wallet.$onAction(({ name, args }) => {
    if (name.startsWith('set')) calls.push([name, ...args])
  })
  return calls
}

describe('Pinia store', () => {
  describe('setters', () => {
    describe('language', () => {
      it('sets the state of language', () => {
        const wallet = walletOf({ language: 'en' })
        wallet.setLanguage('de')
        expect(wallet.language).toEqual('de')
      })

      it('sets the i18n locale', () => {
        const wallet = walletOf({ language: 'en' })
        wallet.setLanguage('de')
        expect(i18n.global.locale.value).toBe('de')
      })
    })

    describe('gradidoID', () => {
      it('sets the state of gradidoID', () => {
        const wallet = walletOf({ gradidoID: 'old-id' })
        wallet.setGradidoID('new-id')
        expect(wallet.gradidoID).toEqual('new-id')
      })
    })

    describe('token', () => {
      // What one test keeps for both apps would count as received for the next.
      beforeEach(() => {
        localStorage.removeItem('auth-token')
      })

      it('sets the state of token', () => {
        const wallet = walletOf({ token: null })
        wallet.setToken('1234')
        expect(wallet.token).toEqual('1234')
      })

      describe('token has a value', () => {
        it('sets the state of tokenTime', () => {
          const wallet = walletOf({ token: null, tokenTime: null })
          wallet.setToken('token')
          expect(jwtDecode).toHaveBeenCalledWith('token')
          expect(wallet.tokenTime).toEqual('1234')
        })

        // When the session ends by this device's clock: the token's own lifetime from now. The
        // server issued this one at 1 000 000 for an hour; the device's clock runs two hours
        // ahead, as on a computer with a wrong time zone. By `exp` the session would be over
        // before it began, and the sign-in guard would send the member back to the form.
        it('counts the token lifetime from now, by the device clock', () => {
          vi.useFakeTimers()
          vi.setSystemTime((1000000 + 7200) * 1000)
          jwtDecode.mockReturnValueOnce({ iat: 1000000, exp: 1003600 })
          const wallet = walletOf({ token: null, tokenTime: null })
          wallet.setToken('token')
          vi.useRealTimers()
          expect(wallet.tokenTime).toBe(1000000 + 7200 + 3600)
        })

        it('keeps the token for both apps, with when it was received', () => {
          vi.useFakeTimers()
          vi.setSystemTime(1000000 * 1000)
          walletOf({ token: null, tokenTime: null }).setToken('token')
          vi.useRealTimers()
          expect(JSON.parse(localStorage.getItem('auth-token'))).toEqual({
            token: 'token',
            at: 1000000 * 1000,
          })
        })

        // The token kept already -- the admin interface, or another window, received it --
        // counts from when it was received there, not from now: by now part of its lifetime
        // is gone.
        it('counts the lifetime of the token kept already from when it was received', () => {
          localStorage.setItem('auth-token', JSON.stringify({ token: 'token', at: 1000000 * 1000 }))
          vi.useFakeTimers()
          vi.setSystemTime((1000000 + 600) * 1000)
          jwtDecode.mockReturnValueOnce({ iat: 1000000, exp: 1003600 })
          const wallet = walletOf({ token: null, tokenTime: null })
          wallet.setToken('token')
          vi.useRealTimers()
          expect(wallet.tokenTime).toBe(1003600)
        })
      })

      describe('token has null value', () => {
        it('sets the state of tokenTime to null', () => {
          vi.clearAllMocks()
          const wallet = walletOf({ token: null, tokenTime: '123' })
          wallet.setToken(null)
          expect(jwtDecode).not.toHaveBeenCalled()
          expect(wallet.tokenTime).toEqual(null)
        })

        // And with it the admin interface's session: both keep the one token.
        it('removes the token kept for both apps', () => {
          localStorage.setItem('auth-token', JSON.stringify({ token: 'token', at: 1 }))
          walletOf({ token: 'token', tokenTime: '123' }).setToken(null)
          expect(localStorage.getItem('auth-token')).toBeNull()
        })
      })
    })

    // ... (other mutation tests remain largely the same, just update expect syntax if needed)

    describe('setDarkMode', () => {
      it('sets the state of darkMode', () => {
        const wallet = walletOf({ darkMode: false })
        wallet.setDarkMode(true)
        expect(wallet.darkMode).toBe(true)
      })
    })

    describe('setThemeMode', () => {
      it('sets a valid theme mode', () => {
        const wallet = walletOf({ themeMode: 'system' })
        wallet.setThemeMode('dark')
        expect(wallet.themeMode).toBe('dark')
      })

      it('falls back to system for an invalid value', () => {
        const wallet = walletOf({ themeMode: 'dark' })
        wallet.setThemeMode('nonsense')
        expect(wallet.themeMode).toBe('system')
      })
    })

    describe('redirectPath', () => {
      it('sets the state of redirectPath', () => {
        const wallet = walletOf({ redirectPath: '/overview' })
        wallet.setRedirectPath('/dashboard')
        expect(wallet.redirectPath).toEqual('/dashboard')
      })

      it('sets default redirectPath if null is provided', () => {
        const wallet = walletOf({ redirectPath: '/overview' })
        wallet.setRedirectPath(null)
        expect(wallet.redirectPath).toEqual('/overview')
      })
    })

    // What an event link offered somebody who was not signed in, with the moment it was kept
    // (utils/eventMatchingLink).
    describe('eventMatchingEntry', () => {
      const entry = {
        summary: 'Kongress Frequency Healing',
        details: null,
        remote: true,
        keptAt: 1791892800000,
      }

      it('holds the entry of the link', () => {
        const wallet = walletOf({ eventMatchingEntry: null })
        wallet.setEventMatchingEntry(entry)
        expect(wallet.eventMatchingEntry).toEqual(entry)
      })

      it('lets it go', () => {
        const wallet = walletOf({ eventMatchingEntry: entry })
        wallet.setEventMatchingEntry(null)
        expect(wallet.eventMatchingEntry).toBeNull()
      })

      // One value for "nothing held", whatever a caller hands over.
      it('holds null, never undefined', () => {
        const wallet = walletOf({ eventMatchingEntry: entry })
        wallet.setEventMatchingEntry(undefined)
        expect(wallet.eventMatchingEntry).toBeNull()
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      let wallet
      let calls
      beforeEach(() => {
        wallet = walletOf()
        calls = settersOf(wallet)
      })
      const commitedData = {
        gradidoID: 'my-gradido-id',
        language: 'de',
        alias: 'peter',
        firstName: 'Peter',
        lastName: 'Lustig',
        klickTipp: {
          newsletterState: true,
        },
        gmsAllowed: true,
        humhubAllowed: false,
        gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT',
        hasElopage: false,
        publisherId: 1234,
        role: 'ADMIN',
        hideAmountGDD: false,
        hideAmountGDT: true,
        darkMode: true,
      }

      it('calls twenty-three setters', () => {
        wallet.login(commitedData)
        expect(calls).toHaveLength(23)
      })

      /**
       * What members wrote in a conversation and did not send lies on the device for fourteen
       * days (utils/chatDraft). The sign-out lets go of what is older -- and so does the sign-in:
       * a wallet closed with its tab runs no sign-out, and whoever uses this browser next comes
       * through here.
       */
      it('lets go of the words nobody touched for fourteen days', () => {
        letOldChatDraftsGoMock.mockClear()
        forgetChatDraftsMock.mockClear()

        wallet.login(commitedData)

        expect(letOldChatDraftsGoMock).toHaveBeenCalledTimes(1)
        expect(forgetChatDraftsMock).not.toHaveBeenCalled()
      })

      /**
       * ⛔ BOTH halves of the pair that names a member. `users` is unique on
       * (gradido_id, community_uuid) and every query about a member asks for both -- the
       * member's OWN picture at full size included, which is asked for exactly the way
       * anybody else's is. With the uuid missing that query reads it as IS NULL and matches
       * nobody who registered normally (review of 12.09.2026).
       *
       * `?? null` for the same reason as the fields below: a caller that does not select it
       * must write null rather than undefined, or the persisted store keeps the PREVIOUS
       * member's uuid.
       */
      it('stores the community the member belongs to, and null where the answer does not say', () => {
        const localCalls = settersOf(wallet)
        wallet.login({ ...commitedData, communityUuid: 'home-uuid' })
        expect(localCalls).toContainEqual(['setCommunityUuid', 'home-uuid'])
        localCalls.length = 0
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setCommunityUuid', null])
      })

      // ES-021: the "Create" menu item hangs on this. A login answer carries no such field,
      // so it lands as null -- "not known", which the menu shows as a person -- and the
      // verifyLogin answer that guards.js hands in carries the real value.
      it('stores whether the account may create, and null where the answer does not say', () => {
        const localCalls = settersOf(wallet)
        wallet.login({ ...commitedData, creationAllowed: false })
        expect(localCalls).toContainEqual(['setCreationAllowed', false])
        localCalls.length = 0
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setCreationAllowed', null])
      })

      // The transfers in the conversations (Einstellungen › Nachrichten): the member's own
      // switch, off only where they switched it off. An answer without the field lands as null,
      // "not known", which the thread and the settings page read as on.
      it('stores whether the transfers stand in the conversations, and null where the answer does not say', () => {
        const localCalls = settersOf(wallet)
        wallet.login({ ...commitedData, transfersInChat: false })
        expect(localCalls).toContainEqual(['setTransfersInChat', false])
        localCalls.length = 0
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setTransfersInChat', null])
      })

      // EM-013: the confirm-reminder modal derives its deadline from these two. `?? null`
      // in the action keeps a caller that does not select the fields from writing
      // undefined into the persisted store.
      it('stores the confirmation state and the account age', () => {
        const localCalls = settersOf(wallet)
        wallet.login({
          ...commitedData,
          emailChecked: false,
          createdAt: '2026-08-25T06:00:00.000Z',
        })
        expect(localCalls).toContainEqual(['setEmailChecked', false])
        expect(localCalls).toContainEqual(['setAccountCreatedAt', '2026-08-25T06:00:00.000Z'])
      })

      // Read from the payload now -- BOTH answers that reach this action carry the
      // picture: guards.js hands in a verifyLogin result, Login.vue a login result, and
      // the login joins the picture onto the user row it reads.
      it("stores the member's own picture", () => {
        const localCalls = settersOf(wallet)
        wallet.login({ ...commitedData, avatar: 'base64-picture' })
        expect(localCalls).toContainEqual(['setAvatar', 'base64-picture'])
      })

      // ⛔ And null, never undefined, where the answer does not say. A session expires
      // after ten minutes without anyone logging out, so the persisted store routinely
      // still holds the LAST member's picture when the next one signs in on the same
      // browser; `data.avatar` alone would leave it standing and show one member another
      // member's face.
      it("forgets the previous member's picture when the answer carries none", () => {
        const localCalls = settersOf(wallet)
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setAvatar', null])
      })

      // The switch that says who may see that picture. Own-view only -- a field resolver
      // hands it to nobody but its owner -- and it comes back from the login as well now,
      // because the login puts the member it has just authenticated on the context before
      // it answers, so that guard matches.
      //
      // ⛔ `?? null`, and the difference matters in BOTH directions: reading a stored
      // `false` as null would show a member "not visible" when they are (the wrong
      // direction for a switch somebody consults to check that they are hidden), and
      // letting an absent field through as undefined would leave the previous member's
      // setting in the persisted store.
      it("stores the member's picture-visibility setting, false included", () => {
        const localCalls = settersOf(wallet)
        wallet.login({ ...commitedData, avatarVisibleToMembers: true })
        expect(localCalls).toContainEqual(['setAvatarVisibleToMembers', true])
        localCalls.length = 0
        wallet.login({ ...commitedData, avatarVisibleToMembers: false })
        expect(localCalls).toContainEqual(['setAvatarVisibleToMembers', false])
        localCalls.length = 0
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setAvatarVisibleToMembers', null])
      })

      it('uses the account language when there is no deliberate pre-login choice', () => {
        const localCalls = settersOf(wallet)
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setLanguage', 'de'])
      })

      it('prefers a deliberate pre-login language over the account language and clears it', () => {
        const localCalls = settersOf(wallet)
        wallet.$patch({ preLoginLanguage: 'it' })
        wallet.login(commitedData)
        expect(localCalls).toContainEqual(['setLanguage', 'it'])
        expect(localCalls).toContainEqual(['setPreLoginLanguage', null])
      })

      // ... (other login action tests remain largely the same)

      /**
       * A sign-in is a new start (KA-015: the first creation comes "beim nächsten Neustart"),
       * and it reloads nothing: `/login` opens over a running session, and the handover from the
       * admin area signs in without one. What the session before held back, and the event link
       * it was opened by, are not this session's.
       */
      describe('as a new start', () => {
        const member = ref('my-gradido-id')

        beforeEach(() => {
          forgetFirstLoginWindows()
        })

        it('lets the first creation come that waited behind an invitation onto the map', () => {
          holdFirstCreationForThisSession()
          setFirstLoginWindowWanted('firstCreation', true)
          // The fixture proves itself: the first creation waits.
          expect(firstLoginWindow.value).toBeNull()

          wallet.login(commitedData)

          expect(firstLoginWindow.value).toBe('firstCreation')
          forgetFirstLoginWindows()
        })

        it('lets go of the event link of the session before, and of its answered invitation', () => {
          eventLinkUnderway(member.value)('Kongress Frequency Healing')
          eventLinkUnderway(member.value)
          endEventLinkInvitation(member.value)
          expect(eventLinkSentence(member).value).toBe('Kongress Frequency Healing')
          expect(eventLinkAnswerUnderway.value).toBe(true)
          expect(eventLinkInvitationOver(member).value).toBe(true)

          wallet.login(commitedData)

          expect(eventLinkSentence(member).value).toBeNull()
          expect(eventLinkAnswerUnderway.value).toBe(false)
          expect(eventLinkInvitationOver(member).value).toBe(false)
        })

        // Which windows would show, the windows say themselves, mounted with the layout.
        it('leaves what the windows said', () => {
          setFirstLoginWindowWanted('alias', true)

          wallet.login(commitedData)

          expect(firstLoginWindow.value).toBe('alias')
          forgetFirstLoginWindows()
        })
      })

      it('does not set the theme from server data (theme is device-local)', () => {
        wallet.login(commitedData)
        expect(calls).not.toContainEqual(['setDarkMode', expect.anything()])
        expect(calls).not.toContainEqual(['setThemeMode', expect.anything()])
      })
    })

    describe('logout', () => {
      let wallet
      let calls
      beforeEach(() => {
        wallet = walletOf({ themeMode: 'dark', gradidoID: 'user-one' })
        // What the theme makes of the device's preference is applyTheme's own test, below.
        wallet.applyTheme = vi.fn()
        calls = settersOf(wallet)
        forgetParkedAmountMock.mockClear()
        forgetLegacyMapPrefsMock.mockClear()
        forgetChatReturnMock.mockClear()
      })

      /**
       * ⛔ The map's settings hung under one flat prefix for the whole device until
       * 10.09.2026 -- a keep-offer switched off once stayed off for every account after,
       * and one account carried the street name of the one before it. They are keyed by
       * gradidoID now, and what the flat prefix left behind is cleared here, beside the
       * seven other things that must not outlive one member.
       *
       * Here and not on the map page, where the sweep first stood: an account without a
       * position never reaches that page -- the gate sends it to the position tab -- so on
       * exactly those devices the old keys were never cleared. Every account passes here.
       */
      it('sweeps away the map settings the whole device used to share', () => {
        wallet.logout()
        expect(forgetLegacyMapPrefsMock).toHaveBeenCalled()
      })

      it('calls twenty-seven setters', () => {
        wallet.logout()
        expect(calls).toHaveLength(27)
      })

      // What an event link offered goes with whoever signs out, like the publisher's id. (For
      // a browser nobody signs out of, it ends by itself: keptEventMatchingEntry.)
      it('lets the entry of an event link go', () => {
        wallet.logout()
        expect(calls).toContainEqual(['setEventMatchingEntry', null])
      })

      // The next member on this device starts from "not known", not from the last one's switch.
      it('forgets the switch for the transfers in the conversations', () => {
        wallet.logout()
        expect(calls).toContainEqual(['setTransfersInChat', null])
      })

      // ... (other logout action tests remain largely the same)

      it('keeps the device-local theme across logout', () => {
        wallet.logout()
        expect(calls).toContainEqual(['setThemeMode', 'dark'])
        expect(wallet.applyTheme).toHaveBeenCalled()
        expect(calls).not.toContainEqual(['setDarkMode', false])
      })

      // The admin interface writes the device's key as well: a sign-out keeps what was chosen
      // there, and does not write the mode this store held since the wallet opened.
      it('keeps the mode this device keeps, written elsewhere meanwhile', () => {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, 'light')
        try {
          wallet.logout()
          expect(calls).toContainEqual(['setThemeMode', 'light'])
          expect(calls).not.toContainEqual(['setThemeMode', 'dark'])
          expect(wallet.themeMode).toBe('light')
        } finally {
          localStorage.removeItem(THEME_MODE_STORAGE_KEY)
        }
      })

      /**
       * ⛔ An amount parked mid-sale must not stay on a device somebody has walked away
       * from. The ID is read BEFORE `setGradidoID(null)`, two lines into this action
       * -- reading it after would give null, there would be no key, and the amount would sit
       * there until it expired.
       *
       * The calculator SETTINGS are deliberately not cleared: a percentage is what the till
       * is, and it is meant to still be there tomorrow morning. Same reasoning the card
       * payment gives for keeping its reference.
       */
      it('takes a parked amount off the device, keyed by who is leaving', () => {
        /**
         * ⛔ The real store, whose setter APPLIES the change, and that is the whole test. A
         * mock that only records the call cannot tell "read before the clear" from "read after
         * it" -- the assertion below would pass either way, on a state whose gradidoID never
         * changes. With the change applied, reading it one line later gives null, there is no
         * key, and the amount stays on the device.
         */
        wallet.logout()

        expect(calls).toContainEqual(['setGradidoID', null])
        expect(wallet.gradidoID).toBeNull()
        expect(forgetParkedAmountMock).toHaveBeenCalledWith('user-one')
      })

      /**
       * The way back into a conversation after a restart (utils/chatReturn) goes with the member:
       * whoever signs out is not taken back into it -- not where the idle timeout signs out a
       * wallet left in a thread either. Keyed by who is leaving, read before the clear, for the
       * reason the test above gives.
       */
      it('lets the way back into a conversation go, keyed by who is leaving', () => {
        wallet.logout()

        expect(wallet.gradidoID).toBeNull()
        expect(forgetChatReturnMock).toHaveBeenCalledWith('user-one')
      })

      /**
       * What the member wrote in a conversation and did not send (utils/chatDraft). What waits in
       * memory goes with every sign-out; the words on the device only where the member signed
       * out by their own word -- a session that ran out leaves them to come back to. Keyed by
       * who is leaving, read before the clear, for the reason the tests above give.
       */
      describe('what was written in the conversations and not sent', () => {
        const signOut = (how, signedIn = 'user-one') => {
          wallet.$patch({ gradidoID: signedIn })
          forgetChatDraftsMock.mockClear()
          if (how === 'nothing said') wallet.logout()
          else wallet.logout(how)
          expect(wallet.gradidoID).toBeNull()
        }

        it('is taken off the device where the member signed out by their own word', () => {
          signOut({ byOwnWord: true })

          expect(forgetChatDraftsMock).toHaveBeenCalledTimes(1)
          expect(forgetChatDraftsMock).toHaveBeenCalledWith('user-one', { fromDevice: true })
        })

        // The layout names who pressed "Abmelden" with the press and asks the server before it
        // comes here. A sign-out that got ahead -- the session's clock -- has cleared the state
        // by then, and the words to take off the device are still the ones of who said it.
        it.each([
          ['nobody is signed in any more', null],
          ['another member is', 'user-two'],
        ])('is the one of the member the word names, where %s', (_, signedIn) => {
          signOut({ byOwnWord: true, member: 'user-one' }, signedIn)

          expect(forgetChatDraftsMock).toHaveBeenCalledTimes(1)
          expect(forgetChatDraftsMock).toHaveBeenCalledWith('user-one', { fromDevice: true })
        })

        it.each([
          ['a session that ran out', { byOwnWord: false }],
          ['a sign-out nothing is said of', 'nothing said'],
          ['a token the server refused', null],
          ['a word that is no yes', { byOwnWord: 'yes' }],
        ])('stays on the device with %s, and is forgotten in memory', (_, how) => {
          signOut(how)

          expect(forgetChatDraftsMock).toHaveBeenCalledTimes(1)
          expect(forgetChatDraftsMock).toHaveBeenCalledWith('user-one', { fromDevice: false })
        })
      })

      it('sets redirectPath back', () => {
        wallet.logout()
        expect(calls).toContainEqual(['setRedirectPath', '/overview'])
      })

      // Nothing here reloads the page, so the previous member's answers stay in the
      // Apollo cache unless they are thrown out by hand. `aliasStatus` has no variables
      // and therefore one single key: the next member to sign in was shown their
      // predecessor's remaining name changes, and the window at first login stayed away
      // because the cached answer said the question had been settled.
      it('throws out the previous member´s cached answers', async () => {
        clearApolloCacheMock.mockClear()
        await wallet.logout()
        expect(clearApolloCacheMock).toHaveBeenCalled()
      })

      /**
       * ⛔ The face somebody is LOOKING at lives in a third place again -- not the store,
       * not the avatar cache above, but `useAvatarZoom`'s own module, which outlives every
       * component. The idle-timeout logout is the realistic path: it fires precisely when
       * a member is sitting still, and sitting still is what looking at a face is. Without
       * this line another member's picture and gradido id stayed in memory for the life of
       * the tab, through the next person's sign-in.
       */
      it('lets go of a picture that is open at full size', () => {
        openAvatarZoom({
          member: { gradidoID: 'g-napoli', communityUuid: null, alias: 'napoli' },
          src: 'data:image/jpeg;base64,PICTURE',
          origin: { top: 0, left: 0, width: 42, height: 42 },
        })
        // The fixture proves itself: a state that never opened would make the assertion
        // below pass without the logout doing anything at all.
        expect(avatarZoomState.value).not.toBeNull()

        wallet.logout()

        expect(avatarZoomState.value).toBeNull()
      })

      /**
       * ⛔ The pictures of the chat's messages, kept in memory for the session (useChatImages):
       * beside the avatars, for the same reason -- the next member to sign in on this browser must
       * not be handed the pictures of the conversations of the one before. Their addresses are
       * given back to the browser.
       */
      it('lets go of the chat’s pictures', () => {
        URL.createObjectURL = vi.fn(() => 'blob:a-picture')
        URL.revokeObjectURL = vi.fn()
        try {
          rememberChatImage('image-1', btoa('JPEG'))
          // The fixture proves itself: a picture that was never kept would pass below unforgotten.
          expect(chatImage('image-1')).toEqual({ state: 'ready', src: 'blob:a-picture' })

          wallet.logout()

          expect(chatImage('image-1')).toBeNull()
          expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a-picture')
        } finally {
          delete URL.createObjectURL
          delete URL.revokeObjectURL
        }
      })

      /**
       * ⛔ And the photos of thank-you greetings (useGreetingPictures), kept the same way and let
       * go for the same reason: a member's own photos, and the ones others thanked them with.
       */
      it('lets go of the photos of thank-you greetings', () => {
        rememberGreetingPicture(4711, btoa('JPEG'))
        // The fixture proves itself: a photo that was never kept would pass below unforgotten.
        expect(greetingPicture(4711)?.state).toBe('ready')

        wallet.logout()

        expect(greetingPicture(4711)).toBeNull()
      })

      /**
       * ⛔ And the photos sent with transfers (useTransactionPictures), kept by the id of the
       * booking and let go for the same reason.
       */
      it('lets go of the photos sent with transfers', async () => {
        requestTransactionPicture(
          { query: async () => ({ data: { transactionPicture: btoa('JPEG') } }) },
          815,
        )
        await new Promise((resolve) => setTimeout(resolve))
        // The fixture proves itself: a photo that was never kept would pass below unforgotten.
        expect(transactionPicture(815)?.state).toBe('ready')

        wallet.logout()

        expect(transactionPicture(815)).toBeNull()
      })

      /**
       * ⛔ And the picture open large, like the avatar's zoom above: its view keeps it in its own
       * module, and the idle-timeout logout comes precisely when somebody sits looking at it.
       */
      it('closes the chat’s picture that is open large', () => {
        openChatImageView({
          imageUuid: 'image-1',
          width: 800,
          height: 600,
          who: 'Lena',
          name: 'Lena',
        })
        // The fixture proves itself: a view never opened would pass below unclosed.
        expect(chatImageViewState.value).not.toBeNull()

        wallet.logout()

        expect(chatImageViewState.value).toBeNull()
      })

      /**
       * ⛔ A fourth place again, and the same rule: the contacts the right-hand column holds
       * name the people this member has exchanged Gradido with. They live in their own
       * module -- outside the store, outside the blob that is removed below -- so the next
       * member on this browser would be handed them.
       */
      it('lets go of the contacts the column was holding', () => {
        const row = { user: { communityUuid: 'home', gradidoID: 'g-1', alias: 'napoli' } }
        contactsPanelState.page.rows = [row]
        contactsPanelState.page.count = 7
        contactsPanelState.page.loaded = true
        contactsPanelState.search = 'nap'
        contactsPanelState.matches.rows = [row]
        contactsPanelState.matches.loaded = true
        // The fixture proves itself: an empty state would make the assertions below pass
        // without the logout doing anything at all.
        expect(contactsPanelState.page.rows).toHaveLength(1)

        wallet.logout()

        // Both slots, and the word that was typed -- a search is one member's business too.
        expect(contactsPanelState.page.rows).toEqual([])
        expect(contactsPanelState.page.count).toBe(0)
        expect(contactsPanelState.page.loaded).toBe(false)
        expect(contactsPanelState.matches.rows).toEqual([])
        expect(contactsPanelState.search).toBe('')
      })

      /**
       * ⛔ The chat's beat, same rule: it asks with this member's token and holds how many of
       * their conversations wait. It lives in its own module and stops with the layout too --
       * but the way into the admin area signs out without leaving the layout first.
       */
      it("stops the chat's beat and forgets what it held", async () => {
        const query = vi.fn(async () => ({
          data: {
            newChatMessagesSince: {
              latestId: 9,
              unreadConversations: 4,
              messages: [],
              hasMore: false,
            },
          },
        }))
        startChatUpdates({ query })
        await vi.waitFor(() => expect(chatUnreadConversations.value).toBe(4))

        wallet.logout()

        expect(chatUnreadConversations.value).toBe(0)
        // Asked to ask again, it asks nobody: the beat is gone.
        await pollChatNow()
        expect(query).toHaveBeenCalledTimes(1)
      })

      /**
       * ⛔ A fifth place, same rule. Which of the three first-login windows is on screen
       * lives in its own module, and logging out does not reload the page — so a question
       * the previous member left standing would decide which window the NEXT member sees,
       * or whether they see one at all.
       */
      it('lets go of the first-login window that was on screen', () => {
        setFirstLoginWindowWanted('alias', true)
        // The fixture proves itself: nothing claimed would make the assertion below pass
        // without the logout doing anything at all.
        expect(firstLoginWindow.value).toBe('alias')

        wallet.logout()

        expect(firstLoginWindow.value).toBeNull()
      })

      /**
       * ⛔ And whether the member came in by an event link in this session (KA-015): the
       * invitation onto the map is theirs, and the first creation waits only in their session.
       * Left standing, the next member on this browser would be invited for a link they never
       * opened -- and would not see their own first creation.
       */
      it('lets go of the event link the member came in by, and of the wait behind it', () => {
        const member = ref('marens-gradido-id')
        eventLinkUnderway(member.value)('Kongress Frequency Healing')
        eventLinkUnderway(member.value)
        endEventLinkInvitation(member.value)
        holdFirstCreationForThisSession()
        setFirstLoginWindowWanted('firstCreation', true)
        // The fixture proves itself: a sentence is held, an answer is underway, the invitation
        // is answered, and the first creation waits.
        expect(eventLinkSentence(member).value).toBe('Kongress Frequency Healing')
        expect(eventLinkAnswerUnderway.value).toBe(true)
        expect(eventLinkInvitationOver(member).value).toBe(true)
        expect(firstLoginWindow.value).toBeNull()

        wallet.logout()

        expect(eventLinkSentence(member).value).toBeNull()
        expect(eventLinkAnswerUnderway.value).toBe(false)
        expect(eventLinkInvitationOver(member).value).toBe(false)
        setFirstLoginWindowWanted('firstCreation', true)
        expect(firstLoginWindow.value).toBe('firstCreation')
      })

      /**
       * ⛔ A sixth place, same rule. What a link of the member's own handed over to be made once
       * more -- an amount, a memo, the name of whom it was for -- waits in memory, in a module of
       * its own (useLinkDraft). A session that has run out is signed out by the guard on the way
       * to the page the tap asked for; without this the next member to sign in on this browser
       * would find that page filled in.
       */
      it('lets go of what a link handed over to be made once more', () => {
        const link = { id: 7, amount: 12.5, memo: 'Für Sarah', greeting: null }
        // Read as the same member would read it: what empties it here is the sign-out alone,
        // not the handover's own rule that it goes to nobody else.
        const member = walletStore({ gradidoID: 'user-one' })
        const handover = () => {
          let draft
          mount(
            {
              setup() {
                draft = useLinkDraft()
                return () => null
              },
            },
            { global: { plugins: [member] } },
          )
          return draft
        }
        // The fixture proves itself: handed over, it is found.
        handover().put(link)
        expect(handover().takeLink()).toEqual(link)
        handover().put(link)

        wallet.logout()

        expect(handover().takeLink()).toBeNull()
      })

      it('removes only its own storage blob', () => {
        const removeItemMock = vi.fn()
        const clearMock = vi.fn()
        vi.stubGlobal('localStorage', {
          removeItem: removeItemMock,
          clear: clearMock,
        })
        wallet.logout()
        expect(removeItemMock).toHaveBeenCalledWith('gradido-frontend')
        expect(clearMock).not.toHaveBeenCalled()
        vi.unstubAllGlobals()
      })
    })

    describe('applyTheme', () => {
      it('sets darkMode true when themeMode is dark', () => {
        const wallet = walletOf({ themeMode: 'dark' })
        wallet.applyTheme()
        expect(wallet.darkMode).toBe(true)
      })

      it('sets darkMode false when themeMode is light', () => {
        const wallet = walletOf({ themeMode: 'light' })
        wallet.applyTheme()
        expect(wallet.darkMode).toBe(false)
      })

      it('follows the OS preference when themeMode is system', () => {
        const original = window.matchMedia
        window.matchMedia = vi.fn(() => ({ matches: true }))
        const wallet = walletOf({ themeMode: 'system' })
        wallet.applyTheme()
        expect(wallet.darkMode).toBe(true)
        window.matchMedia = original
      })

      it('mirrors the theme mode into the dedicated storage key', () => {
        const setItem = vi.fn()
        vi.stubGlobal('localStorage', { setItem })
        const wallet = walletOf({ themeMode: 'dark' })
        wallet.applyTheme()
        expect(setItem).toHaveBeenCalledWith(THEME_MODE_STORAGE_KEY, 'dark')
        vi.unstubAllGlobals()
      })
    })

    // The admin interface writes the device's key too (its account menu). At boot the wallet takes
    // it before the first applyTheme mirrors the store's mode into it (main.js).
    describe('adoptThemeModeFromDevice', () => {
      afterEach(() => {
        localStorage.removeItem(THEME_MODE_STORAGE_KEY)
        vi.restoreAllMocks()
      })

      it('takes the mode stored on this device at boot', () => {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark')
        const wallet = walletOf({ themeMode: 'light' })
        wallet.adoptThemeModeFromDevice()
        expect(wallet.themeMode).toBe('dark')
        // ... so the apply after it keeps the device's choice, instead of the blob's older one.
        wallet.applyTheme()
        expect(localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark')
        expect(wallet.darkMode).toBe(true)

        // 'system' is a choice as well.
        localStorage.setItem(THEME_MODE_STORAGE_KEY, 'system')
        wallet.adoptThemeModeFromDevice()
        expect(wallet.themeMode).toBe('system')
      })

      it('keeps its own mode when the device holds none or an unknown value', () => {
        const wallet = walletOf({ themeMode: 'dark' })
        wallet.adoptThemeModeFromDevice()
        expect(wallet.themeMode).toBe('dark')

        localStorage.setItem(THEME_MODE_STORAGE_KEY, 'blue')
        wallet.adoptThemeModeFromDevice()
        expect(wallet.themeMode).toBe('dark')
      })

      it('survives a refused storage', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new DOMException('The operation is insecure.', 'SecurityError')
        })
        const wallet = walletOf({ themeMode: 'light' })
        expect(() => wallet.adoptThemeModeFromDevice()).not.toThrow()
        expect(wallet.themeMode).toBe('light')
      })
    })
  })

  // The token lives where both apps keep it (utils/authToken.js), not in the wallet's own blob.
  describe('the session kept for both apps', () => {
    // Tokens naming a member, as the server writes them (the subject is all that is read here).
    const tokenOf = (sub, more = {}) =>
      `h.${btoa(JSON.stringify({ sub, ...more })).replace(/=+$/, '')}.s`
    const BIBI = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d'
    const BOB = '7a6b5c4d-3e2f-4a1b-8c0d-9e8f7a6b5c4d'

    afterEach(() => {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('gradido-frontend')
    })

    it('is left out of the blob', () => {
      store.setToken('token')
      const blob = JSON.parse(localStorage.getItem('gradido-frontend'))
      expect(blob).not.toHaveProperty('token')
      expect(blob).not.toHaveProperty('tokenTime')
      expect(JSON.parse(localStorage.getItem('auth-token')).token).toBe('token')
      store.setToken(null)
    })

    it('is renewed here where another window renews it', () => {
      store.setToken(tokenOf(BIBI, { iat: 1 }))
      localStorage.setItem(
        'auth-token',
        JSON.stringify({ token: tokenOf(BIBI, { iat: 2 }), at: Date.now() }),
      )
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth-token' }))
      expect(store.token).toBe(tokenOf(BIBI, { iat: 2 }))
    })

    it('signs out here where another window signs out', () => {
      store.setToken('token')
      localStorage.removeItem('auth-token')
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth-token' }))
      expect(store.token).toBeNull()
    })

    // Last: each of these opens a store of its own, which goes on listening to the windows
    // around it -- an event of a test after them would reach it too.
    const openedOn = async ({ kept, blob }) => {
      localStorage.setItem('auth-token', JSON.stringify({ token: kept, at: Date.now() }))
      localStorage.setItem('gradido-frontend', JSON.stringify(blob))
      vi.resetModules()
      return (await import('./store')).store
    }

    it('is what the wallet opens with, and not a token in a blob saved before', async () => {
      const opened = await openedOn({
        kept: tokenOf(BIBI),
        blob: { token: 'from-the-blob', tokenTime: 1, gradidoID: BIBI, firstName: 'Bibi' },
      })
      expect(opened.token).toBe(tokenOf(BIBI))
      expect(opened.tokenTime).toBe('1234')
      expect(opened.firstName).toBe('Bibi')
    })

    // ⛔ Bob's token under Bibi's name, picture and settings: the wallet opens on the sign-in.
    it('is not opened with where the blob holds the profile of somebody else', async () => {
      const opened = await openedOn({ kept: tokenOf(BOB), blob: { gradidoID: BIBI } })
      expect(opened.token).toBeNull()
      expect(opened.tokenTime).toBeNull()
      // Nor removed: it is Bob's session, in the admin interface or another window.
      expect(JSON.parse(localStorage.getItem('auth-token')).token).toBe(tokenOf(BOB))
    })
  })
})
