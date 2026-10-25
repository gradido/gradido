<!-- AI-GENERATED — not an architecture reference -->
<template>
  <button
    v-if="back"
    type="button"
    class="admin-way-back"
    data-test="admin-way-back"
    @click="goBack"
  >
    <i-bi-arrow-left aria-hidden="true" />
    <span>{{ $t('adminWayBack') }}</span>
  </button>
</template>

<script setup>
// "Zurück zum Admin", over every page a moderator reached from the admin interface: its pin,
// bubble or arrow open the wallet on the map, the conversation or the send form and name the
// admin page they were pressed on (utils/adminWayBack.js). In an installed app on a phone that
// can be the app's only window, where nothing else led back but the menu entry "Admin", and that
// to the start of the admin interface (Bernd, 25.10.2026). The bar stays while the moderator
// moves on in the wallet; it goes with the step back.
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import { adminPath, goBackToAdmin, rememberWayBack, wayBackFor } from '@/utils/adminWayBack'

const route = useRoute()
const router = useRouter()
const store = useWalletStore()

// The page of the admin interface this member came from, read again whenever what decides it
// may have changed: session storage itself tells nobody.
const back = ref(null)
const readBack = () => {
  back.value = store.token ? wayBackFor(store.gradidoID) : null
}

// The admin page comes with the first page of the visit; the conversation drops it from its
// address once the window is open, so it is kept as soon as it is seen -- for the member signed
// in, or for the one the visit's sign-in brings where they arrive after the page. Not for
// another member who comes later on the same address: they never were in that admin page.
//
// Once kept for this member, it goes from the address, as the conversation takes the member it
// was opened on out of its own (Contacts.vue): a reload, or a step back to this address later,
// would offer the way back again -- to a member signed in since as well (coderabbit, #4200).
// Through the router, so that a page replacing its address after this one does not write it in
// again; not before it is kept, or a member whose sign-in comes after the page would lose it.
watch(
  () => [route.query.admin, store.gradidoID],
  ([page, member], [pageBefore, memberBefore] = []) => {
    const pageSeen = page !== pageBefore
    const firstMember = !memberBefore && Boolean(member)
    if (pageSeen || firstMember) rememberWayBack(page, member)
    if (page !== undefined && member && wayBackFor(member) === adminPath(page)) {
      const { admin: _kept, ...rest } = route.query
      router.replace({ query: rest, hash: route.hash })
    }
    readBack()
  },
  { immediate: true },
)
watch(() => store.token, readBack)

// The bar stands over the page at the top, above an open window as well; the page and the
// windows move down by its height (has-admin-way-back, below).
watch(
  back,
  (shown) => document.documentElement.classList.toggle('has-admin-way-back', Boolean(shown)),
  { immediate: true },
)
onBeforeUnmount(() => document.documentElement.classList.remove('has-admin-way-back'))

const goBack = () => {
  goBackToAdmin({
    adminAuthUrl: CONFIG.ADMIN_AUTH_URL,
    token: store.token,
    back: back.value,
    signOut: () => store.logout(),
  })
  readBack()
}
</script>

<style>
/**
 * Not scoped: the class on <html> moves the page and Bootstrap's windows, which this component
 * does not render. The bar takes the page's own ground and words in both modes (the house
 * tokens of _design-tokens.scss and gradido-template-dark.scss), with a line below it.
 *
 * ⛔ Fixed, not in the flow like the bar for a new version (AppOutdatedBar): measured over the
 * real wallet on 25.10.2026, a bar in the flow lay under the conversation's window, which
 * covers the page, and rolled out of sight on the send form, which opens scrolled down to it.
 */
.admin-way-back {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1060;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 1rem;
  border: 0;
  border-bottom: 1px solid var(--text-muted);
  background-color: var(--bg);
  color: var(--text);
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
}

.admin-way-back:focus-visible {
  outline: 2px solid currentcolor;
  outline-offset: -4px;
}

html.has-admin-way-back body {
  padding-top: 44px;
}

html.has-admin-way-back .modal {
  top: 44px;
  height: calc(100% - 44px);
}
</style>
