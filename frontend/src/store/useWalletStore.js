// AI-GENERATED — not an architecture reference
import { defineStore } from 'pinia'
// import { localeChanged } from 'vee-validate'

import jwtDecode from 'jwt-decode'
import i18n from '../i18n'
import { clearEntryDraft } from '../composables/useEntryDraft'
import { clearLinkDraft } from '../composables/useLinkDraft'
import { clearPassOnDraft } from '../composables/usePassOnDraft'
import { closeAvatarZoom } from '../composables/useAvatarZoom'
import { forgetAllMemberAvatars } from '../composables/useMemberAvatars'
import { closeChatImageView, forgetAllChatImages } from '../composables/useChatImages'
import { forgetAllGreetingPictures } from '../composables/useGreetingPictures'
import { forgetAllTransactionPictures } from '../composables/useTransactionPictures'
import { forgetFavorites } from '../composables/useFavorites'
import { forgetUserNotes } from '../utils/userNoteSaves'
import { forgetContactsPanel } from '../composables/useContactsPanel'
import { stopChatUpdates } from '../composables/useChatUpdates'
import { forgetParkedAmount } from '../composables/useParkedAmount'
import { forgetEventLinkArrival } from '../composables/useEventMatchingArrival'
import { endFirstCreationHold, forgetFirstLoginWindows } from '../composables/useFirstLoginWindow'
import { forgetLegacyMapPrefs } from '../utils/matchingPrefs'
import { forgetChatDrafts, letOldChatDraftsGo } from '../utils/chatDraft'
import { forgetChatReturn } from '../utils/chatReturn'
import { clearApolloCache } from '../plugins/apolloCache'
import { keepAuthToken, readAuthToken } from '../utils/authToken'

// Dedicated localStorage key mirroring state.themeMode. The pre-paint script in
// index.html reads it with a single getItem, so it never has to parse the whole
// persisted-state blob on the blocking boot path. Kept in sync by applyTheme.
// It is also this device's own word on the mode: the admin interface writes it too, from
// the switch in its account menu, so the wallet takes what it holds (adoptThemeModeFromDevice)
// before applyTheme mirrors state.themeMode back into it -- at boot, on a change of the
// system's light or dark, and on a sign-out: the writes that are no choice of the member's.
export const THEME_MODE_STORAGE_KEY = 'gradido-theme-mode'

const THEME_MODES = ['system', 'light', 'dark']

/** Where the wallet keeps its own state in localStorage (store.js). */
export const STATE_KEY = 'gradido-frontend'

/**
 * When the session of `token` ends by THIS device's clock, in seconds: the token's own lifetime
 * (`exp - iat`, the server's setting) counted from `receivedAt`, when this device received it.
 * Not `exp` itself, which is the server's clock: a computer whose clock runs hours ahead -- a
 * wrong time zone, the time put right by hand -- would read every session as over, and the
 * sign-in guard (routes/guards.js) would send it back to the form on every page. A token without
 * `iat` keeps `exp`.
 */
export const sessionEndOf = (token, receivedAt) => {
  const { exp, iat } = jwtDecode(token)
  return iat ? Math.floor(receivedAt / 1000) + (exp - iat) : exp
}

/**
 * The state of the wallet: the signed-in member's profile and session, and the device's settings.
 *
 * Only the definition. What the wallet opens with, what it saves and how it follows other windows
 * hangs on the one instance in store.js -- a spec takes this with a Pinia of its own and gets
 * none of that.
 */
export const useWalletStore = defineStore('wallet', {
  state: () => ({
    language: null,
    preLoginLanguage: null,
    gradidoID: null,
    communityUuid: null,
    firstName: '',
    lastName: '',
    username: '',
    token: null,
    tokenTime: null,
    role: null,
    newsletterState: null,
    gmsAllowed: null,
    avatarVisibleToMembers: null,
    creationAllowed: null,
    transfersInChat: null,
    humhubAllowed: null,
    gmsPublishLocation: null,
    hasElopage: false,
    project: null,
    publisherId: null,
    eventMatchingEntry: null,
    hideAmountGDD: null,
    hideAmountGDT: null,
    // EM-013: whether the member's address is confirmed, and when the account was
    // created — the confirm-reminder modal derives its deadline from the two.
    emailChecked: null,
    accountCreatedAt: null,
    email: '',
    darkMode: false,
    themeMode: 'system',
    userLocation: null,
    avatar: null,
    redirectPath: '/overview',
    transactionToHighlightId: '',
  }),
  actions: {
    setLanguage(language) {
      i18n.global.locale.value = language
      // localeChanged(language)
      this.language = language
    },
    setPreLoginLanguage(preLoginLanguage) {
      this.preLoginLanguage = preLoginLanguage
    },
    setGradidoID(gradidoID) {
      this.gradidoID = gradidoID
    },
    // ⛔ The other half of the pair that names a member. `users` is unique on (gradido_id,
    // community_uuid), and every query that asks about a member asks about both -- a missing
    // uuid is read as IS NULL and matches nobody who registered normally. Kept here because
    // the member's OWN picture is asked for the same way anybody else's is.
    setCommunityUuid(communityUuid) {
      this.communityUuid = communityUuid
    },
    setUsername(username) {
      this.username = username
    },
    setFirstName(firstName) {
      this.firstName = firstName
    },
    setLastName(lastName) {
      this.lastName = lastName
    },
    setToken(token) {
      this.token = token
      if (token) {
        // Counted from when this device received the token: now, for one fresh from an answer
        // (apolloProvider.js); for the one kept already -- another app or window of this origin
        // received it -- from then (utils/authToken.js).
        const kept = readAuthToken()
        this.tokenTime = sessionEndOf(token, kept?.token === token ? kept.at : Date.now())
      } else {
        this.tokenTime = null
      }
      keepAuthToken(token)
    },
    setNewsletterState(newsletterState) {
      this.newsletterState = newsletterState
    },
    setGmsAllowed(gmsAllowed) {
      this.gmsAllowed = gmsAllowed
    },
    setAvatarVisibleToMembers(avatarVisibleToMembers) {
      this.avatarVisibleToMembers = avatarVisibleToMembers
    },
    // ES-021: true = a person who creates, false = a project account, null = not known yet
    // (a store persisted before the field existed, or a login answer that does not carry it).
    setCreationAllowed(creationAllowed) {
      this.creationAllowed = creationAllowed
    },
    // Whether the transfers stand in the conversations and a mail goes out about one received
    // (Einstellungen › Nachrichten). null = not known yet, and read as on, the column's default:
    // a store persisted before the field existed must not hide anybody's transfers.
    setTransfersInChat(transfersInChat) {
      this.transfersInChat = transfersInChat
    },
    setHumhubAllowed(humhubAllowed) {
      this.humhubAllowed = humhubAllowed
    },
    setGmsPublishLocation(gmsPublishLocation) {
      this.gmsPublishLocation = gmsPublishLocation
    },
    setProject(project) {
      this.project = project
    },
    setPublisherId(publisherId) {
      let pubId = parseInt(publisherId)
      if (isNaN(pubId)) pubId = null
      this.publisherId = pubId
    },
    // What an event link offered somebody who was not signed in (`/event?interest=…`,
    // utils/eventMatchingLink): the entry "I love ‹summary›", as `{ summary, details, remote,
    // keptAt }`, or null. Written where the wallet is entered (routes/guards.js), for the sign-in
    // that follows: the sign-in page takes it out and opens the form for a new entry with it
    // (Login.vue). It lies in the device's storage with the rest of this store, so a page
    // loaded anew on the way -- a mail's link to set a new password -- still finds it.
    //
    // ⛔ Nobody is signed in when it is written, so it is nobody's: it counts for an hour
    // (keptEventMatchingEntry), the next sign-in on the sign-in page takes it whether it uses it
    // or not, and a sign-out lets it go.
    //
    // The text is the link's, not the member's -- whoever built the link wrote it.
    setEventMatchingEntry(eventMatchingEntry) {
      this.eventMatchingEntry = eventMatchingEntry ?? null
    },
    setRole(role) {
      this.role = role
    },
    setHasElopage(hasElopage) {
      this.hasElopage = hasElopage
    },
    setHideAmountGDD(hideAmountGDD) {
      this.hideAmountGDD = !!hideAmountGDD
    },
    setHideAmountGDT(hideAmountGDT) {
      this.hideAmountGDT = !!hideAmountGDT
    },
    setEmailChecked(emailChecked) {
      this.emailChecked = emailChecked
    },
    setAccountCreatedAt(accountCreatedAt) {
      this.accountCreatedAt = accountCreatedAt
    },
    setEmail(email) {
      this.email = email || ''
    },
    setDarkMode(darkMode) {
      this.darkMode = !!darkMode
    },
    setThemeMode(themeMode) {
      this.themeMode = THEME_MODES.includes(themeMode) ? themeMode : 'system'
    },
    setUserLocation(userLocation) {
      this.userLocation = userLocation
    },
    // The member's own profile picture as base64, or null. Persisted with the rest of the
    // state, so it is there on the first paint after a reload instead of the avatar
    // jumping from initials to picture.
    setAvatar(avatar) {
      this.avatar = avatar
    },
    setRedirectPath(redirectPath) {
      this.redirectPath = redirectPath || '/overview'
    },
    setTransactionToHighlightId(id) {
      this.transactionToHighlightId = id
    },
    login(data) {
      this.setGradidoID(data.gradidoID)
      // ?? null, like the fields below: a caller that does not select it must write null
      // rather than undefined, or the persisted store keeps the PREVIOUS member's uuid.
      this.setCommunityUuid(data.communityUuid ?? null)
      // A language deliberately chosen on the login page wins over the account
      // language, then is cleared once consumed. Browser auto-detection does not set
      // preLoginLanguage, so it never overrides the account language here.
      this.setLanguage(this.preLoginLanguage || data.language)
      this.setPreLoginLanguage(null)
      this.setUsername(data.alias)
      this.setFirstName(data.firstName)
      this.setLastName(data.lastName)
      this.setNewsletterState(data.klickTipp.newsletterState)
      this.setGmsAllowed(data.gmsAllowed)
      // Own-view only -- a field resolver hands it to nobody but its owner -- and read off
      // the payload now that BOTH callers carry it: guards.js hands this action a
      // verifyLogin answer, Login.vue a login answer, and since the login puts the member
      // it has just authenticated on the context before it answers, its own guard matches
      // too. `?? null` because null means "not known" and undefined would leave the
      // PREVIOUS member's setting in the persisted store -- a session expires after ten
      // minutes without anyone logging out, so the next member routinely arrives on a store
      // that still holds the last one's.
      this.setAvatarVisibleToMembers(data.avatarVisibleToMembers ?? null)
      this.setCreationAllowed(data.creationAllowed ?? null)
      this.setTransfersInChat(data.transfersInChat ?? null)
      this.setHumhubAllowed(data.humhubAllowed)
      this.setGmsPublishLocation(data.gmsPublishLocation)
      this.setHasElopage(data.hasElopage)
      this.setPublisherId(data.publisherId)
      this.setRole(data.role ?? null)
      this.setHideAmountGDD(data.hideAmountGDD)
      this.setHideAmountGDT(data.hideAmountGDT)
      // ?? null keeps a caller that does not select the two fields from writing undefined
      this.setEmailChecked(data.emailChecked ?? null)
      this.setAccountCreatedAt(data.createdAt ?? null)
      this.setUserLocation(data.userLocation)
      // The member's own picture, from the same answer -- the login joins it onto the user
      // row it reads, so the wallet shows a face from the first screen instead of jumping
      // from initials to picture. `?? null` clears the previous member's, for the reason
      // above: not read is not the same as nobody there.
      this.setAvatar(data.avatar ?? null)
      // What members wrote in a conversation and did not send lies on this device, each under their
      // own key (utils/chatDraft), and is let go after fourteen days. Here as well as at the
      // sign-out: a wallet closed with its tab runs no sign-out, and whoever uses this browser next
      // comes through here.
      letOldChatDraftsGo()
      // A sign-in is a new start (KA-015: the first creation comes "beim nächsten Neustart"): the
      // first creation no longer waits for an invitation onto the map of the session before, and
      // an event link opened in that session is not this one's. Neither the sign-in nor the
      // handover from the admin area reloads the page, and `/login` opens over a running session.
      endFirstCreationHold()
      forgetEventLinkArrival()
    },
    /**
     * @param how `{ byOwnWord: true, member }` where the member said "Abmelden" themselves -- an
     *   entry of a menu, or the button of the question before a session ends --, and who it was
     *   (DashboardLayout). Every other sign-out goes without that word: a session that ran out, a
     *   token the server refused, the way into the admin area. It decides one thing only -- see
     *   the chat's drafts below.
     */
    async logout(how) {
      // ⛔ Held before the setters below, not read after them: the parked amount is keyed by
      // this ID, and `this.setGradidoID(null)` is two lines down. Reading it later would
      // give null, there would be no key, and a stranger's amount would stay on the device.
      const signedOutMember = this.gradidoID
      this.setToken(null)
      this.setUsername('')
      this.setGradidoID(null)
      this.setCommunityUuid(null)
      this.setFirstName('')
      this.setLastName('')
      this.setNewsletterState(null)
      this.setGmsAllowed(null)
      this.setAvatarVisibleToMembers(null)
      this.setCreationAllowed(null)
      this.setTransfersInChat(null)
      this.setHumhubAllowed(null)
      this.setGmsPublishLocation(null)
      this.setHasElopage(false)
      this.setProject(null)
      this.setPublisherId(null)
      this.setEventMatchingEntry(null)
      this.setRole(null)
      this.setHideAmountGDD(false)
      this.setHideAmountGDT(true)
      this.setEmailChecked(null)
      this.setAccountCreatedAt(null)
      this.setEmail('')
      this.setUserLocation(null)
      this.setAvatar(null)
      this.setRedirectPath('/overview')
      // Held outside the store, in a module that survives this action because logging
      // out does not reload the page.
      clearEntryDraft()
      // And what a link of the member's own handed over to be made once more (useLinkDraft): an
      // amount, a memo and the name of whom it was for. The guard signs a run-out session out on
      // its way to the sign-in page -- with this, the next member to sign in here finds that way
      // empty.
      clearLinkDraft()
      // And which thank-you received a transfer about to be made passes on (usePassOnDraft): the
      // next member to sign in here makes no transfer that passes it on.
      clearPassOnDraft()
      // What this device keeps, not what this store held since it started: an open wallet would
      // write its older mode over a choice made in the admin interface meanwhile.
      this.adoptThemeModeFromDevice()
      const themeMode = this.themeMode
      // Remove only this app's own persisted state. The token is not in this blob -- the
      // `setToken` above has removed it from where both apps keep it, and with it the
      // admin interface's session (utils/authToken.js). The wallet and admin share one origin,
      // so localStorage.clear() would also wipe the other app's state and the shared dark-mode
      // theme key. Set the theme again
      // so the recreated blob keeps the device-local choice for the next session.
      // Other members' pictures live under their own key, outside that blob and outside this
      // store, so removing the blob does not touch them. They have to go for the same reason
      // the blob does: the next member to sign in on this browser must not be handed the
      // faces the previous one was allowed to see.
      //
      // ⚠️ Before the line below, not after. Storage can refuse -- quota, private mode -- and
      // the throw would take every following line of this action with it. Of the two, the
      // faces are the ones that must not survive a logout.
      forgetAllMemberAvatars()
      // And the pictures of the chat's messages, for the same reason: they are kept in memory for
      // the session (useChatImages), and the next member to sign in on this browser must not be
      // handed the pictures of the conversations of the one before.
      forgetAllChatImages()
      // And the photos of thank-you greetings (useGreetingPictures), kept the same way.
      forgetAllGreetingPictures()
      // And the photos sent with transfers (useTransactionPictures), kept the same way.
      forgetAllTransactionPictures()
      // Same reason, same moment: the hearts are one member's, not the device's.
      forgetFavorites()
      // And the notes being saved (utils/userNoteSaves): a member's own note on a person or a group
      // is theirs alone, and a save still on its way must not go out with the next session.
      forgetUserNotes()
      // And the contacts the right-hand column holds, which name the people this member has
      // exchanged Gradido with -- the next member on this browser must not be handed them.
      forgetContactsPanel()
      // And the chat's beat, which holds where this member's chat stood and how many of their
      // conversations wait. It lives outside this store and stops with the layout as well; here,
      // because the way into the admin area signs out without leaving the layout first. An answer
      // still on its way is dropped when it lands.
      stopChatUpdates()
      // ⚠️ A picture that is OPEN at this moment lives somewhere else again: the zoom keeps
      // the one face being looked at in its own module, outside the store and outside the
      // avatar cache above. The idle-timeout logout is the realistic path -- it fires
      // precisely when somebody is sitting still and looking at a face -- and without this
      // line that face and its owner's id stayed in memory for the life of the tab, through
      // the next member's sign-in, which is the one thing the paragraph above forbids.
      closeAvatarZoom()
      // And the chat's picture open large, for the same reason: the view keeps it in its own
      // module (useChatImages), and a logout while somebody looks at a picture -- the idle timeout
      // -- would leave it there, and its sender's name, for the next member.
      closeChatImageView()
      // Which first-login window had the screen, for the same reason: that module outlives
      // this action, and the next member on this browser must meet their own windows rather
      // than find all three silenced by a question the last member left unanswered.
      forgetFirstLoginWindows()
      // And whether the member came in by an event link in this session: the invitation onto the
      // map is theirs, not the next member's (useEventMatchingArrival).
      forgetEventLinkArrival()
      forgetParkedAmount(signedOutMember)
      // The conversation to come back to after a restart (utils/chatReturn): whoever signs out is
      // not taken back into it, even where the idle timeout signs out a wallet left in a thread.
      forgetChatReturn(signedOutMember)
      // And what the member wrote in a conversation and did not send (utils/chatDraft). What waits
      // in memory -- a picture chosen, the box -- goes with every sign-out: it is not for the next
      // member on this browser. The words lie on the device, under this member's key, and go from
      // it only where the member signed out by their own word: a session that ran out leaves them
      // for the member to come back to (Bernd's choice, 11.10.2026).
      //
      // ⚠️ Whose words: the member the word names, where it names one. The layout takes them with
      // the press and asks the server before it comes here; a sign-out that got ahead -- the
      // session's clock -- has cleared the state by then, and nobody is signed in to read here.
      forgetChatDrafts(how?.member ?? signedOutMember, { fromDevice: how?.byOwnWord === true })
      // ⛔ Only what the FLAT prefix left behind, and only the nameless keys -- the ones the
      // map wrote for the whole device before 10.09.2026, when it had nobody in the key. The
      // member's own settings are keyed by their gradidoID and stay: a radius and a look are
      // what the map IS for them, the same line useParkedAmount draws for the till beside it.
      //
      // Here rather than on the map page, where it stood until now: an account without a
      // position never reaches that page -- the gate sends it to the position tab first -- so
      // on those devices the old keys stayed lying about. Every account passes through here.
      forgetLegacyMapPrefs()
      localStorage.removeItem(STATE_KEY)
      this.setThemeMode(themeMode)
      this.applyTheme()
      // Last, and for the same reason as `clearEntryDraft` above: nothing here reloads the
      // page, so every answer the previous member's queries returned is still lying in the
      // Apollo cache. `aliasStatus` takes no variables at all, so it sits under a single
      // key - the next member to sign in was shown their predecessor's remaining name
      // changes, and never saw the window at first login because the cached answer said
      // the question had been settled.
      //
      // Kept at the end on purpose: everything above is local clean-up and stays
      // synchronous, so a caller that does not await still gets all of it.
      await clearApolloCache()
    },
    // Before every apply that is no choice of the member's -- at boot (main.js), on a change of
    // the system's light or dark (App.vue), on a sign-out: the mode this device keeps under
    // THEME_MODE_STORAGE_KEY wins over the one this store holds. The admin interface writes that
    // key as well; without this, applyTheme would mirror an older mode over a choice made there.
    // Not inside applyTheme itself: the settings page calls it right after setThemeMode, and it
    // would put the old key back over the fresh choice. A key that is missing or unknown leaves
    // the store's mode.
    adoptThemeModeFromDevice() {
      let stored = null
      try {
        if (typeof localStorage !== 'undefined') {
          stored = localStorage.getItem(THEME_MODE_STORAGE_KEY)
        }
      } catch (e) {
        // storage can be unavailable (private mode); the blob's mode stays
      }
      if (THEME_MODES.includes(stored) && stored !== this.themeMode) {
        this.setThemeMode(stored)
      }
    },
    // Compute the effective dark mode from the device-local themeMode
    // (system | light | dark) plus the OS preference, then set the darkMode flag
    // that App.vue and the dark stylesheet consume.
    // It also mirrors themeMode into THEME_MODE_STORAGE_KEY. applyTheme runs on boot,
    // on every theme change and on OS changes, so the key that the pre-paint script
    // in index.html reads stays in sync without that script parsing the whole blob.
    applyTheme() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_MODE_STORAGE_KEY, this.themeMode)
        }
      } catch (e) {
        // storage can be unavailable (private mode); the theme still applies below
      }
      const systemDark =
        typeof window !== 'undefined' && window.matchMedia
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false
      const effective = this.themeMode === 'dark' || (this.themeMode === 'system' && systemDark)
      this.setDarkMode(effective)
    },
    changeTransactionToHighlightId(id) {
      this.setTransactionToHighlightId(id)
    },
  },
})
