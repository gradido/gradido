<!-- AI-GENERATED — not an architecture reference -->
<template>
  <button
    v-if="onMap"
    type="button"
    class="member-wallet-link"
    data-test="member-map-pin"
    :title="$t('goTo.memberMap', { name })"
    :aria-label="$t('goTo.memberMap', { name })"
    @click="openInWallet(mapPage(), $t('goTo.memberMapBlocked'))"
  >
    <IBiGeoAltFill aria-hidden="true" />
  </button>
  <button
    v-else-if="canBeSentTo"
    type="button"
    class="member-wallet-link"
    data-test="member-send-arrow"
    :title="$t('goTo.memberSend', { name })"
    :aria-label="$t('goTo.memberSend', { name })"
    @click="openInWallet(sendPage(), $t('goTo.memberMapBlocked'))"
  >
    <IBiSend aria-hidden="true" />
  </button>
</template>

<script setup>
import { computed, inject } from 'vue'
import { storeKey } from 'vuex'
import { useApolloClient } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { verifyLogin } from '@/graphql/verifyLogin'
import { MAP_WINDOW_NAME, dropMapWindowName } from '@/utils/mapWindow'

/**
 * What stands behind a member's name, for the moderator who wants to reach them: one press
 * opens the wallet on this member, in a browser window of its own next to the admin interface.
 *
 * A pin (Bernd, 12.10.2026) for a member who stands on the wallet's map -- they allow being
 * found and have a place pinned; the server says so (`findableOnMap`) and says nothing about
 * where. It shows them on that map. The server answers from its own rows and does not ask
 * the map: where the map holds nobody for a member with a pin, the window says that they are
 * not on it.
 *
 * The arrow of the wallet's "Senden" (Bernd, 13.10.2026) for every other member: it opens the
 * wallet's send form with them entered as the recipient. So every member can be reached, over
 * the map or over that form -- but for two, who get neither: a deleted member, to whom nothing
 * can be sent, and the moderator, who cannot send to themselves.
 *
 * The window is the wallet itself. It is handed this moderator's sign-in the way "Mein Konto"
 * hands it over (NavBar.vue, handleWallet), with the page to go on to: the map on the member
 * named by their pair, or the send form to them. What those pages then show is what they
 * show every member.
 *
 * ⛔ No sign-out here, unlike handleWallet. There the moderator LEAVES for the wallet; here
 * the admin interface stays the place of work and the window is a look at the map. Both run
 * side by side: the two keep their sign-ins under separate keys.
 *
 * One window, named, for every pin and every arrow: the next member opens in the same window
 * instead of a new one each time, and the browser is asked to bring it to the front, where it
 * may have slipped behind the admin interface.
 *
 * ⛔ Opened WITH its opener (no `noopener`): the wallet in that window tells by it that the
 * admin interface is still there behind it, and its menu entry "Admin" then closes the
 * window instead of turning it into a second admin interface
 * (frontend/src/utils/adminMapWindow.js).
 */
const props = defineProps({
  // The member as the row carries them: the pair that names them (gradidoID, communityUuid),
  // whether they stand on the map (findableOnMap), whether the account was deleted (deletedAt)
  // and their number -- `userId` on a row of the member search, `id` with a contribution.
  member: { type: Object, default: null },
  // How the row speaks of them, for the label of the pin or the arrow.
  name: { type: String, default: '' },
})

const WINDOW_NAME = MAP_WINDOW_NAME
// The id of the wallet's send form (frontend/src/components/GddSend/TransactionForm.vue). The
// two apps share no code, so the word is written down in both; where the wallet does not know
// it, the page opens at its top as it would without.
const SEND_FORM_ANCHOR = '#send-form'
// Just below the width at which the wallet sets its menu beside the page (1025 px): the map
// takes the whole window.
const WINDOW_FEATURES = 'popup,width=1000,height=760'

// Not useStore(): it warns where no store is installed, and this stands in components that
// are mounted without one in their specs. A signed-in admin interface always has it.
const store = inject(storeKey, null)
const { toastWarning } = useAppToast()
// Not destructured, and resolved at the press: where a spec mocks the composable
// away it answers undefined, and taking that apart at setup would throw (CreaEvaluationModal
// has the same line for the same reason).
const apollo = useApolloClient()

/**
 * ⛔ A press is a step of work in the admin interface, and has to count as one. A sign-in
 * lasts ten minutes from the server's last ANSWER -- every answer carries a fresh token --,
 * and every other step here asks the server something. This one opens a window and asks
 * nothing. Without the question below a moderator who goes through a list pin by pin holds a
 * token that grows old: after ten minutes every further press hands one that ran out to the
 * window, which signs the wallet in it out, and the admin interface never notices (measured
 * in the built bundles, 12.10.2026).
 *
 * `verifyLogin`, because it asks exactly that and names nobody; nothing of the answer is
 * kept. Where the sign-in did run out, the answer says so and the admin interface signs out
 * as after any other step (plugins/apolloProvider.js). Any other failure is left alone: the
 * next step that asks the server shows it.
 */
const renewSignIn = () => {
  apollo
    .resolveClient()
    .query({ query: verifyLogin, fetchPolicy: 'no-cache' })
    .catch(() => undefined)
}

const onMap = computed(() => props.member?.findableOnMap === true)

// ⛔ `false`, said by the server -- not "anything but true". A document that does not ask for
// the field delivers `undefined`, and an arrow behind every name would then say of members who
// stand on the map that they do not.
const canBeSentTo = computed(() => {
  const { member } = props
  if (member?.findableOnMap !== false || member.deletedAt) return false
  if (!member.gradidoID || !member.communityUuid) return false
  const mine = store?.state.moderator?.id
  return mine === undefined || mine === null || (member.userId ?? member.id) !== mine
})

/** The wallet's map, on this member. */
const mapPage = () =>
  '/matching/karte' +
  `?with=${encodeURIComponent(props.member.gradidoID)}` +
  `&community=${encodeURIComponent(props.member.communityUuid)}`

/**
 * The wallet's send form, with this member as the recipient: its route names the two. And
 * scrolled to the form (SEND_FORM_ANCHOR) -- in a window of this height the page begins with
 * the moderator's own accounts, and the form with the member in it stood below the fold.
 */
const sendPage = () =>
  '/send' +
  `/${encodeURIComponent(props.member.communityUuid)}` +
  `/${encodeURIComponent(props.member.gradidoID)}` +
  SEND_FORM_ANCHOR

const openInWallet = (page, blockedText) => {
  const address =
    CONFIG.WALLET_AUTH_URL +
    encodeURIComponent(store.state.token) +
    '&redirect=' +
    encodeURIComponent(page)
  // ⛔ Never this window itself: see dropMapWindowName.
  dropMapWindowName()
  const opened = window.open(address, WINDOW_NAME, WINDOW_FEATURES)
  if (opened) {
    opened.focus()
  } else {
    // The browser kept the window from opening (its pop-up blocker).
    toastWarning(blockedText)
  }
  // After the window: it is handed the token held at the press, and has to be opened while
  // the press is still the browser's reason to allow it.
  renewSignIn()
}
</script>

<style scoped>
/* The pin or the arrow: a square of 24 px to press, standing in a line of text. The line counts it as 20 px high
   (the negative margins above and below): with all of its 24 px a line grew by 1.8 px, and
   a row with a pin was taller than one without. Its right edge gives 2 px back as well,
   because every pixel a cell of the member search gains is taken from the columns beside
   it, which wrap sooner for it. The space ahead of it is the one the template leaves behind
   the name; the ring of the keyboard stands in it without touching the last letter. */
.member-wallet-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: -0.125rem -0.125rem -0.125rem 0;
  padding: 0;
  border: 0;
  border-radius: 0.25rem;
  background: none;
  color: var(--bs-link-color);
  line-height: 1;
  vertical-align: middle;
}

.member-wallet-link:hover {
  color: var(--bs-link-hover-color);
}

.member-wallet-link:focus-visible {
  outline: 2px solid currentcolor;
}
</style>
