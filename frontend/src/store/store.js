import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
// import { localeChanged } from 'vee-validate'

import jwtDecode from 'jwt-decode'
import i18n from '../i18n'
import { clearEntryDraft } from '../composables/useEntryDraft'
import { closeAvatarZoom } from '../composables/useAvatarZoom'
import { forgetAllMemberAvatars } from '../composables/useMemberAvatars'
import { forgetFavorites } from '../composables/useFavorites'
import { forgetContactsPanel } from '../composables/useContactsPanel'
import { forgetParkedAmount } from '../composables/useParkedAmount'
import { forgetFirstLoginWindows } from '../composables/useFirstLoginWindow'
import { forgetLegacyMapPrefs } from '../utils/matchingPrefs'
import { clearApolloCache } from '../plugins/apolloCache'

// Dedicated localStorage key mirroring state.themeMode. The pre-paint script in
// index.html reads it with a single getItem, so it never has to parse the whole
// persisted-state blob on the blocking boot path. Kept in sync by applyTheme.
export const THEME_MODE_STORAGE_KEY = 'gradido-theme-mode'

export const mutations = {
  language: (state, language) => {
    i18n.global.locale.value = language
    // localeChanged(language)
    state.language = language
  },
  setPreLoginLanguage: (state, preLoginLanguage) => {
    state.preLoginLanguage = preLoginLanguage
  },
  gradidoID: (state, gradidoID) => {
    state.gradidoID = gradidoID
  },
  // ⛔ The other half of the pair that names a member. `users` is unique on (gradido_id,
  // community_uuid), and every query that asks about a member asks about both -- a missing
  // uuid is read as IS NULL and matches nobody who registered normally. Kept here because
  // the member's OWN picture is asked for the same way anybody else's is.
  communityUuid: (state, communityUuid) => {
    state.communityUuid = communityUuid
  },
  username: (state, username) => {
    state.username = username
  },
  firstName: (state, firstName) => {
    state.firstName = firstName
  },
  lastName: (state, lastName) => {
    state.lastName = lastName
  },
  token: (state, token) => {
    state.token = token
    if (token) {
      state.tokenTime = jwtDecode(token).exp
    } else {
      state.tokenTime = null
    }
  },
  newsletterState: (state, newsletterState) => {
    state.newsletterState = newsletterState
  },
  gmsAllowed: (state, gmsAllowed) => {
    state.gmsAllowed = gmsAllowed
  },
  avatarVisibleToMembers: (state, avatarVisibleToMembers) => {
    state.avatarVisibleToMembers = avatarVisibleToMembers
  },
  // ES-021: true = a person who creates, false = a project account, null = not known yet
  // (a store persisted before the field existed, or a login answer that does not carry it).
  creationAllowed: (state, creationAllowed) => {
    state.creationAllowed = creationAllowed
  },
  humhubAllowed: (state, humhubAllowed) => {
    state.humhubAllowed = humhubAllowed
  },
  gmsPublishLocation: (state, gmsPublishLocation) => {
    state.gmsPublishLocation = gmsPublishLocation
  },
  project: (state, project) => {
    state.project = project
  },
  publisherId: (state, publisherId) => {
    let pubId = parseInt(publisherId)
    if (isNaN(pubId)) pubId = null
    state.publisherId = pubId
  },
  role(state, role) {
    state.role = role
  },
  hasElopage: (state, hasElopage) => {
    state.hasElopage = hasElopage
  },
  hideAmountGDD: (state, hideAmountGDD) => {
    state.hideAmountGDD = !!hideAmountGDD
  },
  hideAmountGDT: (state, hideAmountGDT) => {
    state.hideAmountGDT = !!hideAmountGDT
  },
  emailChecked: (state, emailChecked) => {
    state.emailChecked = emailChecked
  },
  accountCreatedAt: (state, accountCreatedAt) => {
    state.accountCreatedAt = accountCreatedAt
  },
  email: (state, email) => {
    state.email = email || ''
  },
  setDarkMode: (state, darkMode) => {
    state.darkMode = !!darkMode
  },
  setThemeMode: (state, themeMode) => {
    state.themeMode = ['system', 'light', 'dark'].includes(themeMode) ? themeMode : 'system'
  },
  userLocation: (state, userLocation) => {
    state.userLocation = userLocation
  },
  // The member's own profile picture as base64, or null. Persisted with the rest of the
  // state, so it is there on the first paint after a reload instead of the avatar
  // jumping from initials to picture.
  avatar: (state, avatar) => {
    state.avatar = avatar
  },
  redirectPath: (state, redirectPath) => {
    state.redirectPath = redirectPath || '/overview'
  },
  setTransactionToHighlightId: (state, id) => {
    state.transactionToHighlightId = id
  },
}

export const actions = {
  login: ({ commit, state }, data) => {
    commit('gradidoID', data.gradidoID)
    // ?? null, like the fields below: a caller that does not select it must write null
    // rather than undefined, or the persisted store keeps the PREVIOUS member's uuid.
    commit('communityUuid', data.communityUuid ?? null)
    // A language deliberately chosen on the login page wins over the account
    // language, then is cleared once consumed. Browser auto-detection does not set
    // preLoginLanguage, so it never overrides the account language here.
    commit('language', state.preLoginLanguage || data.language)
    commit('setPreLoginLanguage', null)
    commit('username', data.alias)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('newsletterState', data.klickTipp.newsletterState)
    commit('gmsAllowed', data.gmsAllowed)
    // Own-view only -- a field resolver hands it to nobody but its owner -- and read off
    // the payload now that BOTH callers carry it: guards.js hands this action a
    // verifyLogin answer, Login.vue a login answer, and since the login puts the member
    // it has just authenticated on the context before it answers, its own guard matches
    // too. `?? null` because null means "not known" and undefined would leave the
    // PREVIOUS member's setting in the persisted store -- a session expires after ten
    // minutes without anyone logging out, so the next member routinely arrives on a store
    // that still holds the last one's.
    commit('avatarVisibleToMembers', data.avatarVisibleToMembers ?? null)
    commit('creationAllowed', data.creationAllowed ?? null)
    commit('humhubAllowed', data.humhubAllowed)
    commit('gmsPublishLocation', data.gmsPublishLocation)
    commit('hasElopage', data.hasElopage)
    commit('publisherId', data.publisherId)
    commit('role', data.role ?? null)
    commit('hideAmountGDD', data.hideAmountGDD)
    commit('hideAmountGDT', data.hideAmountGDT)
    // ?? null keeps a caller that does not select the two fields from writing undefined
    commit('emailChecked', data.emailChecked ?? null)
    commit('accountCreatedAt', data.createdAt ?? null)
    commit('userLocation', data.userLocation)
    // The member's own picture, from the same answer -- the login joins it onto the user
    // row it reads, so the wallet shows a face from the first screen instead of jumping
    // from initials to picture. `?? null` clears the previous member's, for the reason
    // above: not read is not the same as nobody there.
    commit('avatar', data.avatar ?? null)
  },
  logout: async ({ commit, state, dispatch }) => {
    // ⛔ Held before the commits below, not read after them: the parked amount is keyed by
    // this ID, and `commit('gradidoID', null)` is two lines down. Reading it later would
    // give null, there would be no key, and a stranger's amount would stay on the device.
    const signedOutMember = state.gradidoID
    commit('token', null)
    commit('username', '')
    commit('gradidoID', null)
    commit('communityUuid', null)
    commit('firstName', '')
    commit('lastName', '')
    commit('newsletterState', null)
    commit('gmsAllowed', null)
    commit('avatarVisibleToMembers', null)
    commit('creationAllowed', null)
    commit('humhubAllowed', null)
    commit('gmsPublishLocation', null)
    commit('hasElopage', false)
    commit('project', null)
    commit('publisherId', null)
    commit('role', null)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
    commit('emailChecked', null)
    commit('accountCreatedAt', null)
    commit('email', '')
    commit('userLocation', null)
    commit('avatar', null)
    commit('redirectPath', '/overview')
    // Held outside the store, in a module that survives this action because logging
    // out does not reload the page.
    clearEntryDraft()
    const themeMode = state.themeMode
    // Remove only this app's own persisted state (session + token live in this blob).
    // The wallet and admin share one origin, so localStorage.clear() would also wipe
    // the other app's session and the shared dark-mode theme key. Re-commit the theme
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
    // Same reason, same moment: the hearts are one member's, not the device's.
    forgetFavorites()
    // And the contacts the right-hand column holds, which name the people this member has
    // exchanged Gradido with -- the next member on this browser must not be handed them.
    forgetContactsPanel()
    // ⚠️ A picture that is OPEN at this moment lives somewhere else again: the zoom keeps
    // the one face being looked at in its own module, outside the store and outside the
    // avatar cache above. The idle-timeout logout is the realistic path -- it fires
    // precisely when somebody is sitting still and looking at a face -- and without this
    // line that face and its owner's id stayed in memory for the life of the tab, through
    // the next member's sign-in, which is the one thing the paragraph above forbids.
    closeAvatarZoom()
    // Which first-login window had the screen, for the same reason: that module outlives
    // this action, and the next member on this browser must meet their own windows rather
    // than find all three silenced by a question the last member left unanswered.
    forgetFirstLoginWindows()
    forgetParkedAmount(signedOutMember)
    // ⛔ Only what the FLAT prefix left behind, and only the nameless keys -- the ones the
    // map wrote for the whole device before 10.09.2026, when it had nobody in the key. The
    // member's own settings are keyed by their gradidoID and stay: a radius and a look are
    // what the map IS for them, the same line useParkedAmount draws for the till beside it.
    //
    // Here rather than on the map page, where it stood until now: an account without a
    // position never reaches that page -- the gate sends it to the position tab first -- so
    // on those devices the old keys stayed lying about. Every account passes through here.
    forgetLegacyMapPrefs()
    localStorage.removeItem('gradido-frontend')
    commit('setThemeMode', themeMode)
    dispatch('applyTheme')
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
  // Compute the effective dark mode from the device-local themeMode
  // (system | light | dark) plus the OS preference, then set the darkMode flag
  // that App.vue and the dark stylesheet consume.
  // It also mirrors themeMode into THEME_MODE_STORAGE_KEY. applyTheme runs on boot,
  // on every theme change and on OS changes, so the key that the pre-paint script
  // in index.html reads stays in sync without that script parsing the whole blob.
  applyTheme: ({ state, commit }) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, state.themeMode)
      }
    } catch (e) {
      // storage can be unavailable (private mode); the theme still applies below
    }
    const systemDark =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
    const effective = state.themeMode === 'dark' || (state.themeMode === 'system' && systemDark)
    commit('setDarkMode', effective)
  },
  changeTransactionToHighlightId({ commit }, id) {
    commit('setTransactionToHighlightId', id)
  },
}

let store

try {
  store = createStore({
    plugins: [
      createPersistedState({
        key: 'gradido-frontend',
        storage: window.localStorage,
      }),
    ],
    state: {
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
      humhubAllowed: null,
      gmsPublishLocation: null,
      hasElopage: false,
      project: null,
      publisherId: null,
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
    },
    getters: {},
    // Synchronous mutation of the state
    mutations,
    actions,
  })
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error)
}

export { store }
