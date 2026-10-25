// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { computed, defineComponent, onBeforeUnmount, onMounted, type PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  askModeratorContacts,
  MODERATOR_CONTACTS_RETURN_MS,
  moderatorContact,
} from '@/composables/useModeratorContacts'
import { useAppToast } from '@/composables/useToast'
import { CONFIG } from '@/config'
import { ROUTER_BASE } from '@/constants'
import { verifyLogin } from '@/graphql/verifyLogin'
import { useAdminStore } from '@/store/useAdminStore'
import { handOverAddress } from '@/utils/authToken'
import { dropMapWindowName, MAP_WINDOW_NAME } from '@/utils/mapWindow'
import { isTheModerator, moderatorKey } from '@/utils/theModerator'
import IBiGeoAltFill from '~icons/bi/geo-alt-fill'
import IBiSend from '~icons/bi/send'
import IMdiChatOutline from '~icons/mdi/chat-outline'
import classes from './MemberWalletLink.module.css'

/**
 * What stands behind a member's name, for the moderator who wants to reach them: one press
 * opens the wallet on this member, in a browser window of its own next to the admin interface.
 *
 * Two things, each a button of its own (Bernd, 16.10.2026: "Jemanden auf der Karte zu finden,
 * sofern er sich auf der Karte eingetragen hat" -- "Jemanden zu kontaktieren bzw.
 * anzuschreiben"):
 *
 * A pin (Bernd, 12.10.2026) for a member who stands on the wallet's map -- they allow being
 * found and have a place pinned; the server says so (`findableOnMap`) and says nothing about
 * where. It shows them on that map. The server answers from its own rows and does not ask
 * the map: where the map holds nobody for a member with a pin, the window says that they are
 * not on it.
 *
 * And behind it -- in its place where there is none -- the way to write to them: the bubble of
 * the wallet's chat where the moderator is in contact with the member already (Bernd,
 * 13.10.2026), which leads straight into the conversation with them; the arrow of the wallet's
 * "Senden" for everybody else (Bernd, 13.10.2026), which opens the wallet's send form with
 * them entered as the recipient -- on its tab "E-Mail senden" (Bernd, 16.10.2026: writing to
 * them is what the arrow is for; Gradido sent from here "dürfte eher der seltene Fall sein",
 * and it is a tab away). Until 16.10.2026 a member on the map had the pin alone, and the
 * conversation with a contact there took the way over the map. So every member can be written
 * to -- but for two, who get neither: a deleted member, to whom nothing can be sent, and the
 * moderator, who cannot write to themselves. Whom the moderator is in contact with is asked once
 * for all the names on the screen (composables/useModeratorContacts), and anew when the
 * moderator comes back to this window; the wallet opens a conversation from an address for a
 * contact only, and both go by the same list of the server.
 *
 * The window is the wallet itself. It is handed this moderator's sign-in the way "Mein Konto"
 * hands it over (NavBar.tsx, handleWallet), with the page to go on to: the map on the member
 * named by their pair, the conversation with them, or the send form to them. What those pages
 * then show is what they show every member.
 *
 * ⛔ No sign-out here, unlike handleWallet. There the moderator LEAVES for the wallet; here
 * the admin interface stays the place of work and the window is a look at the map. Both run
 * side by side: the two keep their sign-ins under separate keys.
 *
 * One window, named, for every pin, bubble and arrow: the next member opens in the same window
 * instead of a new one each time, and the browser is asked to bring it to the front, where it
 * may have slipped behind the admin interface.
 *
 * ⛔ Opened WITH its opener (no `noopener`): the wallet in that window tells by it that the
 * admin interface is still there behind it, and its menu entry "Admin" then closes the
 * window instead of turning it into a second admin interface
 * (frontend/src/utils/adminMapWindow.js).
 */
// The member as a row carries them; see the prop below.
type Member = {
  gradidoID?: string
  communityUuid?: string
  findableOnMap?: boolean | null
  deletedAt?: string | Date | null
  userId?: number
  id?: number
}

type Face = { test: string; label: () => string; page: () => string }

const WINDOW_NAME = MAP_WINDOW_NAME
// The id of the wallet's send form (frontend/src/components/GddSend/TransactionForm.vue). The
// two apps share no code, so the word is written down in both; where the wallet does not know
// it, the page opens at its top as it would without.
const SEND_FORM_ANCHOR = '#send-form'
// The wallet's word for the tab "E-Mail senden" of that form (`sendTypeFromQuery` there): the
// matching profile and the contact window open it so as well. A wallet that does not know it
// opens the tab "GDD senden", as it did before.
const SEND_FORM_EMAIL = '?art=email'
// Just below the width at which the wallet sets its menu beside the page (1025 px): the map
// takes the whole window.
const WINDOW_FEATURES = 'popup,width=1000,height=760'

export const MemberWalletLink = defineComponent({
  name: 'MemberWalletLink',
  props: {
    // The member as the row carries them: the pair that names them (gradidoID, communityUuid),
    // whether they stand on the map (findableOnMap), whether the account was deleted (deletedAt)
    // and their number -- `userId` on a row of the member search, `id` with a contribution.
    member: { type: Object as PropType<Member | null>, default: null },
    // How the row speaks of them, for the label of the pin, the bubble or the arrow.
    name: { type: String, default: '' },
  },
  setup(props) {
    const store = useAdminStore()
    const { t } = useI18n()
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
     * as after any other step (plugins/apolloProvider.ts). Any other failure is left alone: the
     * next step that asks the server shows it.
     */
    const renewSignIn = () => {
      apollo
        .resolveClient()
        .query({ query: verifyLogin, fetchPolicy: 'no-cache' })
        .catch(() => undefined)
    }

    const onMap = computed(() => props.member?.findableOnMap === true)

    /**
     * Whether the member can be written to: the row names them by their pair, the account was not
     * deleted, and they are not the moderator.
     *
     * Whether they stand on the map has no part in it. Until 16.10.2026 it had: the arrow stood for
     * members who are not on the map, and only the server's `false` could say that.
     */
    const canBeWrittenTo = computed(() => {
      const { member } = props
      if (!member || member.deletedAt) {
        return false
      }
      if (!member.gradidoID || !member.communityUuid) {
        return false
      }
      return !isTheModerator(store.moderator, member)
    })

    /**
     * How the member is written to: 'chat' where the moderator is in contact with them, 'send'
     * where not -- and 'wait' while the server is asked which it is. null: not at all.
     *
     * ⛔ The arrow where nothing can be known -- the question failed, took too long, or cannot be
     * asked. The send form takes every member; the conversation opens for a contact only. Where
     * the answer comes after all, the arrow of a contact becomes the bubble.
     */
    const reach = computed(() => {
      if (!canBeWrittenTo.value) {
        return null
      }
      // canBeWrittenTo above is false without a member
      const contact = moderatorContact(moderatorKey(store.moderator), props.member!)
      if (contact === 'yes') {
        return 'chat'
      }
      return contact === 'asking' ? 'wait' : 'send'
    })

    // Asked where a name needs the answer -- once for all of them (askModeratorContacts sees to
    // that), and again by the names of a page that is opened later. Asked as the name is set up,
    // ahead of its first drawing: it then draws the room at once, and not the arrow first that
    // the answer turns into the bubble a moment later. And where the row comes to show somebody
    // else, or somebody who can be written to now.
    const askWhomTheModeratorKnows = (freshFor?: number) => {
      if (!canBeWrittenTo.value) {
        return
      }
      let client = null
      try {
        client = apollo?.resolveClient?.() ?? null
      } catch {
        // No client where a spec mounts this without one.
      }
      askModeratorContacts(client, moderatorKey(store.moderator), freshFor)
    }
    askWhomTheModeratorKnows()
    watch([canBeWrittenTo, () => props.member?.gradidoID, () => props.member?.communityUuid], () =>
      askWhomTheModeratorKnows(),
    )

    /**
     * Back in this window, the question is asked anew. A first booking or a first message makes a
     * contact of a member, and both happen in the wallet's window that the arrow opens: a moderator
     * who comes back from there finds the bubble in the arrow's place, without loading the page
     * again. What the names show stays as it is until the answer is there.
     *
     * Both events, because a browser that opens the wallet as a tab tells the way back by the
     * second and not always by the first; they come together, and the question is asked once.
     */
    const askAgainOnReturn = () => {
      if (document.visibilityState === 'hidden') {
        return
      }
      askWhomTheModeratorKnows(MODERATOR_CONTACTS_RETURN_MS)
    }
    onMounted(() => {
      window.addEventListener('focus', askAgainOnReturn)
      document.addEventListener('visibilitychange', askAgainOnReturn)
    })
    onBeforeUnmount(() => {
      window.removeEventListener('focus', askAgainOnReturn)
      document.removeEventListener('visibilitychange', askAgainOnReturn)
    })

    // Only called where a face is shown, which needs the member's pair (canBeWrittenTo, onMap).
    const member = () => props.member as Member

    /** The wallet's map, on this member. */
    const mapPage = () =>
      '/matching/karte' +
      `?with=${encodeURIComponent(String(member().gradidoID))}` +
      `&community=${encodeURIComponent(String(member().communityUuid))}`

    /**
     * The conversation with this member, in the contact window of the wallet: its contacts page
     * reads the two off the address, and opens it for a contact (frontend/src/pages/Contacts.vue).
     */
    const chatPage = () =>
      '/contacts' +
      `?with=${encodeURIComponent(String(member().gradidoID))}` +
      `&community=${encodeURIComponent(String(member().communityUuid))}`

    /**
     * The wallet's send form, with this member as the recipient: its route names the two. On the
     * tab "E-Mail senden" (SEND_FORM_EMAIL). And scrolled to the form (SEND_FORM_ANCHOR) -- in a
     * window of this height the page begins with the moderator's own accounts, and the form with
     * the member in it stood below the fold.
     */
    const sendPage = () =>
      '/send' +
      `/${encodeURIComponent(String(member().communityUuid))}` +
      `/${encodeURIComponent(String(member().gradidoID))}` +
      SEND_FORM_EMAIL +
      SEND_FORM_ANCHOR

    /**
     * The three faces: the name the specs and the measurements know each by, what it is called for
     * this member, and the page of the wallet it opens.
     */
    const FACES: Record<'map' | 'chat' | 'send', Face> = {
      map: {
        test: 'member-map-pin',
        label: () => t('goTo.memberMap', { name: props.name }),
        page: mapPage,
      },
      chat: {
        test: 'member-chat-bubble',
        label: () => t('goTo.memberChat', { name: props.name }),
        page: chatPage,
      },
      send: {
        test: 'member-send-arrow',
        label: () => t('goTo.memberSend', { name: props.name }),
        page: sendPage,
      },
    }
    const pinLabel = computed(() => FACES.map.label())
    // The way to write to them: the bubble or the arrow. None while the server is asked (the room).
    const face = computed(() =>
      reach.value === 'chat' || reach.value === 'send' ? FACES[reach.value] : null,
    )
    const label = computed(() => face.value?.label() ?? '')

    /**
     * The wallet's page with the page of this interface the press was made on, as the router
     * names it (`admin=/creation-confirm`): the wallet keeps it for its way back, the bar
     * "Zurück zum Admin" and the menu entry "Admin" (frontend/src/utils/adminWayBack.js), and the
     * sign-in leads there (router/guards.ts). In an installed app on a phone the window can be
     * the app's only one, where nothing else led back (Bernd, 25.10.2026). Before the anchor,
     * where a query belongs.
     */
    const withWayBack = (page: string) => {
      const { pathname, search } = window.location
      const here = pathname.startsWith(ROUTER_BASE)
        ? `/${pathname.slice(ROUTER_BASE.length)}`
        : pathname
      const [path, anchor] = page.split('#')
      const back = `admin=${encodeURIComponent(here + search)}`
      return `${path}${path.includes('?') ? '&' : '?'}${back}${anchor === undefined ? '' : `#${anchor}`}`
    }

    const openInWallet = (page: string, blockedText: string) => {
      const address =
        handOverAddress(CONFIG.WALLET_AUTH_URL, store.token) +
        '&redirect=' +
        encodeURIComponent(withWayBack(page))
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

    // One line for the two: a cell too narrow for the name and both buttons breaks ahead of the
    // pin, never between the pin and what stands behind it (measured in the member search with
    // a name of 20 characters: the arrow stood alone on a line of its own).
    return () => (
      <span class={classes.memberWalletLinks}>
        {/* Finding them on the map: the pin of a member who stands there. The row says so, the
            pin waits for no answer. */}
        {onMap.value ? (
          <button
            type='button'
            class={classes.memberWalletLink}
            data-test={FACES.map.test}
            title={pinLabel.value}
            aria-label={pinLabel.value}
            onClick={() => openInWallet(mapPage(), t('goTo.memberMapBlocked'))}
          >
            <IBiGeoAltFill aria-hidden='true' />
          </button>
        ) : null}
        {/* Writing to them: one button for the bubble and the arrow, behind the pin where there
            is one. Where the arrow becomes the bubble -- the moderator comes back from the
            wallet's window, where a first booking made a contact of the member --, it stays the
            same element: a keyboard that stood on it stands on it still. */}
        {face.value ? (
          <button
            type='button'
            class={classes.memberWalletLink}
            data-test={face.value.test}
            title={label.value}
            aria-label={label.value}
            onClick={() =>
              face.value && openInWallet(face.value.page(), t('goTo.memberMapBlocked'))
            }
          >
            {face.value === FACES.chat ? (
              <IMdiChatOutline aria-hidden='true' />
            ) : (
              <IBiSend aria-hidden='true' />
            )}
          </button>
        ) : reach.value === 'wait' ? (
          // The room of the bubble or the arrow, kept free while the server is asked which of the
          // two it is -- three seconds at the most: what comes a moment later moves nothing in
          // the row.
          <span
            class={classes.memberWalletLink}
            data-test='member-wallet-link-wait'
            aria-hidden='true'
          />
        ) : null}
      </span>
    )
  },
})
