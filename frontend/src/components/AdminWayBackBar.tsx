// AI-GENERATED — not an architecture reference
import { defineComponent, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import { adminPath, goBackToAdmin, rememberWayBack, wayBackFor } from '@/utils/adminWayBack'
import IBiArrowLeft from '~icons/bi/arrow-left'
import './AdminWayBackBar.css'

// "Zurück zum Admin", over every page a moderator reached from the admin interface: its pin,
// bubble or arrow open the wallet on the map, the conversation or the send form and name the
// admin page they were pressed on (utils/adminWayBack.js). In an installed app on a phone that
// can be the app's only window, where nothing else led back but the menu entry "Admin", and that
// to the start of the admin interface (Bernd, 25.10.2026). The bar stays while the moderator
// moves on in the wallet; it goes with the step back.
export const AdminWayBackBar = defineComponent({
  name: 'AdminWayBackBar',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const store = useWalletStore()

    // The page of the admin interface this member came from, read again whenever what decides it
    // may have changed: session storage itself tells nobody.
    const back = ref<string | null>(null)
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
      (now, before) => {
        const [page, member] = now
        // No value before the first, immediate run.
        const [pageBefore, memberBefore] = before ?? []
        const pageSeen = page !== pageBefore
        const firstMember = !memberBefore && Boolean(member)
        if (pageSeen || firstMember) {
          rememberWayBack(page, member)
        }
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
    // windows move down by its height (has-admin-way-back, in the stylesheet).
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
        // adminWayBack.js is untyped, and its default `back = null` reads as "null only".
        back: back.value as null,
        // The store's `logout(how)` is untyped as well: no word on how, as before.
        signOut: () => store.logout(undefined),
      })
      readBack()
    }

    return () =>
      back.value ? (
        <button type='button' class='admin-way-back' data-test='admin-way-back' onClick={goBack}>
          <IBiArrowLeft aria-hidden='true' />
          <span>{t('adminWayBack')}</span>
        </button>
      ) : null
  },
})
