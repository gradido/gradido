<!-- AI-GENERATED — not an architecture reference -->
<template>
  <button
    v-if="member?.findableOnMap === true"
    type="button"
    class="member-map-pin"
    data-test="member-map-pin"
    :title="$t('goTo.memberMap', { name })"
    :aria-label="$t('goTo.memberMap', { name })"
    @click="showOnMap($t('goTo.memberMapBlocked'))"
  >
    <IBiGeoAltFill aria-hidden="true" />
  </button>
</template>

<script setup>
import { inject } from 'vue'
import { storeKey } from 'vuex'
import { useApolloClient } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { verifyLogin } from '@/graphql/verifyLogin'

/**
 * A pin behind a member's name: one press shows the member on the wallet's map, in a browser
 * window of its own next to the admin interface (Bernd, 12.10.2026). Only for a member who
 * stands on that map -- they allow being found and have a place pinned; the server says so
 * (`findableOnMap`) and says nothing about where. For everybody else there is nothing here at
 * all. The server answers from its own rows and does not ask the map: where the map holds
 * nobody for a member with a pin, the window says that they are not on it.
 *
 * The window is the wallet itself. It is handed this moderator's sign-in the way "Mein Konto"
 * hands it over (NavBar.vue, handleWallet), with the page to go on to: the map, on the member
 * named by their pair. What the map then shows is what it shows every member.
 *
 * ⛔ No sign-out here, unlike handleWallet. There the moderator LEAVES for the wallet; here
 * the admin interface stays the place of work and the window is a look at the map. Both run
 * side by side: the two keep their sign-ins under separate keys.
 *
 * One window, named, for every pin: the next member opens in the same window instead of a
 * new one each time, and the browser is asked to bring it to the front, where it may have
 * slipped behind the admin interface.
 */
const props = defineProps({
  // The member as the row carries them: the pair that names them (gradidoID, communityUuid)
  // and whether they stand on the map (findableOnMap).
  member: { type: Object, default: null },
  // How the row speaks of them, for the label of the pin.
  name: { type: String, default: '' },
})

const WINDOW_NAME = 'gradido-wallet-map'
// Just below the width at which the wallet sets its menu beside the page (1025 px): the map
// takes the whole window.
const WINDOW_FEATURES = 'popup,width=1000,height=760'

// Read when the pin is pressed and not asked for before: useStore() would do the same and
// warns where no store is installed, and this pin also stands in components that are mounted
// without one in their specs. A signed-in admin interface always has it.
const store = inject(storeKey, null)
const { toastWarning } = useAppToast()
// Not destructured, and resolved when the pin is pressed: where a spec mocks the composable
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

const showOnMap = (blockedText) => {
  const { member } = props
  const map =
    '/matching/karte' +
    `?with=${encodeURIComponent(member.gradidoID)}` +
    `&community=${encodeURIComponent(member.communityUuid)}`
  const address =
    CONFIG.WALLET_AUTH_URL +
    encodeURIComponent(store.state.token) +
    '&redirect=' +
    encodeURIComponent(map)
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
/* A square of 24 px to press, standing in a line of text. The line counts it as 20 px high
   (the negative margins above and below): with all of its 24 px a line grew by 1.8 px, and
   a row with a pin was taller than one without. Its right edge gives 2 px back as well,
   because every pixel a cell of the member search gains is taken from the columns beside
   it, which wrap sooner for it. The space ahead of it is the one the template leaves behind
   the name; the ring of the keyboard stands in it without touching the last letter. */
.member-map-pin {
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

.member-map-pin:hover {
  color: var(--bs-link-hover-color);
}

.member-map-pin:focus-visible {
  outline: 2px solid currentcolor;
}
</style>
