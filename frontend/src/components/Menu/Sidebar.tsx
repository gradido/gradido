// AI-GENERATED — not an architecture reference
import { BImg, BNav, BNavItem } from 'bootstrap-vue-next'
import {
  type ComponentPublicInstance,
  computed,
  defineComponent,
  nextTick,
  onMounted,
  type Ref,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { chatUnreadConversations } from '@/composables/useChatUpdates'
import { contributionsInProgress } from '@/composables/useContributionsInProgress'
import {
  supportTicketsInProgress,
  supportTicketsUnfinished,
} from '@/composables/useSupportTicketsMenu'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import IBiSend from '~icons/bi/send'
import IBiShieldCheck from '~icons/bi/shield-check'
import IFaHome from '~icons/fa/home'
import IHumbleiconsLogout from '~icons/humbleicons/logout'
import IIonLayersSharp from '~icons/ion/layers-sharp'
import IMdiChatOutline from '~icons/mdi/chat-outline'
import IMdiHelpCircle from '~icons/mdi/help-circle'
import IMdiInformation from '~icons/mdi/information'
import IMdiPeopleGroup from '~icons/mdi/people-group'
import IMdiSettings from '~icons/mdi/settings'
import ITablerHeartHandshake from '~icons/tabler/heart-handshake'
import classes from './Sidebar.module.scss'

// Same asset the navbar uses, well under its 200px: down here it is a mark, not
// a masthead.
const logo = '/img/brand/gradido-logo.png'

type NavRef = Ref<ComponentPublicInstance | null>

export const Sidebar = defineComponent({
  name: 'Sidebar',
  props: {
    shadow: { type: Boolean, default: true },
    // Set by routes that hide the navbar — see DashboardLayout's bareChrome.
    showLogo: { type: Boolean, default: false },
  },
  emits: ['closeSidebar', 'admin', 'logout'],
  setup(props, { emit }) {
    // Read once: the flag is baked in at build time, it cannot change while the app runs.
    const matchingActive = CONFIG.MATCHING_ACTIVE

    const { t } = useI18n()
    const route = useRoute()
    const store = useWalletStore()
    const contributionsLink: NavRef = ref(null)
    const matchingLink: NavRef = ref(null)
    const supportLink: NavRef = ref(null)

    /** "Support" or "Information" in the menu (K5, SUA-024 point 1 b). */
    const supportInMenu = computed(
      () => store.supportTicketsActive !== false || supportTicketsUnfinished.value > 0,
    )

    /**
     * The figure on the mark: the number up to 99, then "99+". The menu is narrow, and past that
     * the exact figure tells nobody anything the sentence for screen readers does not say.
     */
    const chatUnreadFigure = computed(() =>
      chatUnreadConversations.value > 99 ? '99+' : String(chatUnreadConversations.value),
    )
    const supportBadgeFigure = computed(() =>
      supportTicketsInProgress.value > 99 ? '99+' : String(supportTicketsInProgress.value),
    )
    const creationBadgeFigure = computed(() =>
      contributionsInProgress.value > 99 ? '99+' : String(contributionsInProgress.value),
    )

    const transactionClass = computed(() => {
      if (route.path === '/gdt') {
        return 'mb-3 active-route'
      }
      return 'mb-3'
    })

    // BNavItem lights active-route only on an exact route match. Three items span more
    // than one route — contributions its sub-pages, matching its tabs and the map
    // (/matching redirects to /matching/entries, the map is /matching/karte), the support its
    // tabs (/support redirects to one of them) — so their own link element is lit by hand from
    // the path, on a route change and on first mount alike (a fresh load has no change to react
    // to), and when "Support" takes the place of "Information" or gives it back.
    function setLinkActive(navRef: NavRef, on: boolean) {
      const link = navRef.value?.$el?.children?.[0]
      if (!link) {
        return
      }
      link.classList.toggle('active-route', on)
      link.classList.toggle('router-link-exact-active', on)
    }

    function syncNavActive() {
      setLinkActive(contributionsLink, route.path.includes('contributions'))
      setLinkActive(matchingLink, route.path.startsWith('/matching'))
      // by the route's record, not the address as it was typed: vue-router takes /Support/Write too
      setLinkActive(
        supportLink,
        route.matched.some((record) => record.path.startsWith('/support')),
      )
    }

    // the entry that comes is drawn after this tick, and has had no route change to react to
    watch(supportInMenu, () => nextTick(syncNavActive))

    watch(
      () => route.path,
      () => {
        syncNavActive()
        emit('closeSidebar')
      },
    )

    onMounted(syncNavActive)

    return () => (
      <div id='component-sidebar' class={classes.sidebar}>
        <div
          id='side-menu'
          class={['gradido-border-radius pt-2 bg-white', props.shadow ? 'app-box-shadow' : '']}
        >
          <div class='mb-3 mt-3'>
            {/* In three pairs (Bernd, E-031): what one has -- the overview and the transactions
                behind it; what one does -- creating before sending, as in Gradido the creating
                comes before the giving; and the people -- matching finds them, the chat keeps
                them. */}
            <BNav vertical class='w-200'>
              <BNavItem to='/overview' class='mb-3' activeClass='active-route'>
                <div class='sidebar-menu-item-wrapper'>
                  <IFaHome class='svg-icon' />
                  <span class='ms-2'>{t('navigation.overview')}</span>
                </div>
              </BNavItem>
              <BNavItem
                to='/transactions'
                class={transactionClass.value}
                activeClass='active-route'
              >
                <div class='sidebar-menu-item-wrapper'>
                  <IIonLayersSharp class='svg-icon' />
                  <span class='ms-2'>{t('navigation.transactions')}</span>
                </div>
              </BNavItem>
              {/* ES-021: a project account does not create, so the whole area is gone from the
                  menu. `!== false`, not a truthy check: null is "not known" -- a store persisted
                  before the field existed, or the moment right after a login -- and for
                  not-known the answer is the one every existing account has: a person. */}
              {store.creationAllowed !== false ? (
                <BNavItem
                  ref={contributionsLink}
                  to='/contributions'
                  class='mb-3'
                  activeClass='active-route'
                  data-test='creation-menu'
                >
                  {/* The mark counts the member's contributions with a question back from the
                      moderation, as the support's counts its requests (Bernd, 16.11.2026): in the form
                      of the chat's mark and on the corner of the symbol for the same reason. */}
                  <div class='sidebar-menu-item-wrapper chat-menu-item'>
                    <span class='chat-menu-icon'>
                      <IMdiPeopleGroup class='svg-icon' data-test='creation-menu-icon' />
                      {contributionsInProgress.value > 0 ? (
                        <span
                          class='chat-unread-badge'
                          aria-hidden='true'
                          data-test='creation-badge'
                        >
                          {creationBadgeFigure.value}
                        </span>
                      ) : null}
                    </span>
                    <span class='ms-2 chat-menu-label'>{t('creation')}</span>
                    {contributionsInProgress.value > 0 ? (
                      <span class='visually-hidden' data-test='creation-badge-label'>
                        {t(
                          'contribution.badge',
                          { n: contributionsInProgress.value },
                          contributionsInProgress.value,
                        )}
                      </span>
                    ) : null}
                  </div>
                </BNavItem>
              ) : null}
              <BNavItem to='/send' class='mb-3' activeClass='active-route'>
                <div class='sidebar-menu-item-wrapper'>
                  <IBiSend class='svg-icon' />
                  <span class='ms-2'>{t('navigation.send')}</span>
                </div>
              </BNavItem>
              {matchingActive ? (
                <BNavItem ref={matchingLink} to='/matching' class='mb-3' activeClass='active-route'>
                  <div class='sidebar-menu-item-wrapper'>
                    <ITablerHeartHandshake class='svg-icon' />
                    <span class='ms-2'>{t('navigation.matching')}</span>
                  </div>
                </BNavItem>
              ) : null}
              {/* The chat, last, beside matching: with the chat the list is people more than
                  bookings (E-031, which moved it from under the transactions, KF-008). The page
                  keeps its address and its heading ("contacts & chat"); the entry is called by the
                  word one looks for, with the speech bubble the thread itself shows when it is
                  empty (Bernd, 04.10.2026). "Contacten en chat" in bold did not fit the card.

                  The gold mark: how many CONVERSATIONS hold something unread -- not messages
                  (E-017), from the chat's beat (useChatUpdates) -- only from 1.

                  ⛔ On the corner of the symbol, not to the right of the word. Measured in the
                  probe: at the desk the menu card is 180 px wide and the words take 103-130 px of
                  the 125 px it has for them, so a mark beside the word was cut off at the card's
                  edge in every language, and the column cannot grow (at 1025 px it is 175 px wide).
                  On the symbol it needs no width at all -- the phone's opener carries its dot the
                  same way.

                  The figure is for the eye; a screen reader hears the sentence after the word, as
                  part of the link, and not the bare figure. */}
              <BNavItem to='/contacts' class='mb-3' activeClass='active-route'>
                <div class='sidebar-menu-item-wrapper chat-menu-item'>
                  <span class='chat-menu-icon'>
                    <IMdiChatOutline class='svg-icon' data-test='chat-menu-icon' />
                    {chatUnreadConversations.value > 0 ? (
                      <span
                        class='chat-unread-badge'
                        aria-hidden='true'
                        data-test='chat-unread-badge'
                      >
                        {chatUnreadFigure.value}
                      </span>
                    ) : null}
                  </span>
                  <span class='ms-2 chat-menu-label'>{t('navigation.contacts')}</span>
                  {chatUnreadConversations.value > 0 ? (
                    <span class='visually-hidden' data-test='chat-unread-badge-label'>
                      {t(
                        'chatThread.unreadBadge',
                        { n: chatUnreadConversations.value },
                        chatUnreadConversations.value,
                      )}
                    </span>
                  ) : null}
                </div>
              </BNavItem>
            </BNav>
            <hr class='m-3' />
            <BNav vertical class='w-100'>
              {/* "Support" in the place of "Information" (Support-Anfragen K5, SUA-009), with the
                  question mark in a circle: while the community lets its members file requests --
                  not known reads as on --, and while the member has a request not closed, also with
                  the switch off (SUA-024, 1 b). The page "Information" is the third tab of it.
                  ⚠️ To /support: its redirect picks the tab ("Meine Anfragen" for a question back
                  or with the switch off, else "Schreiben"), and syncNavActive lights it on every
                  address under it.

                  The mark counts the member's requests with a question back (SUA-017), in the form
                  of the chat's mark and on the corner of the symbol for the same reason. */}
              {supportInMenu.value ? (
                <BNavItem
                  ref={supportLink}
                  to='/support'
                  class='mb-3'
                  activeClass='active-route'
                  data-test='support-menu'
                >
                  <div class='sidebar-menu-item-wrapper chat-menu-item'>
                    <span class='chat-menu-icon'>
                      <IMdiHelpCircle class='svg-icon' data-test='support-menu-icon' />
                      {supportTicketsInProgress.value > 0 ? (
                        <span
                          class='chat-unread-badge'
                          aria-hidden='true'
                          data-test='support-badge'
                        >
                          {supportBadgeFigure.value}
                        </span>
                      ) : null}
                    </span>
                    <span class='ms-2 chat-menu-label'>{t('navigation.support')}</span>
                    {supportTicketsInProgress.value > 0 ? (
                      <span class='visually-hidden' data-test='support-badge-label'>
                        {t(
                          'support.badge',
                          { n: supportTicketsInProgress.value },
                          supportTicketsInProgress.value,
                        )}
                      </span>
                    ) : null}
                  </div>
                </BNavItem>
              ) : (
                <BNavItem to='/information' class='mb-3' activeClass='active-route'>
                  <div class='sidebar-menu-item-wrapper'>
                    <IMdiInformation class='svg-icon' />
                    <span class='ms-2'>{t('info')}</span>
                  </div>
                </BNavItem>
              )}
              <BNavItem
                to='/settings'
                class='mb-3 d-block'
                activeClass='active-route'
                data-test='settings-menu'
              >
                {/* ⛔ The badge that used to hang here said "Neue Einstellungen" and MEANT "you have
                    no user name yet" -- two different things, and the second one has been solved
                    elsewhere since Nutzername/NU-005: the window at first login asks for it. A hint
                    that says something other than what it means is worse than none. (Bernd, 26.08.2026) */}
                <div class='sidebar-menu-item-wrapper'>
                  <div>
                    <IMdiSettings class='svg-icon' />
                    <span class='ms-2'>{t('navigation.settings')}</span>
                  </div>
                </div>
              </BNavItem>
              {store.role ? (
                <BNavItem
                  class='mb-3 text-light'
                  activeClass='active-route'
                  onClick={() => emit('admin')}
                >
                  <div class='sidebar-menu-item-wrapper'>
                    {/* `svg-icon` like every symbol of this menu: without it the shield took the
                        colour of the entry's TEXT -- white on dark, near-black on light -- and stood
                        out as the one lit symbol in the list, although this entry can never be the
                        open one: it leaves for the admin interface. (Bernd, 08.10.2026) */}
                    <IBiShieldCheck class='svg-icon' data-test='admin-menu-icon' />
                    <span class='ms-2'>{t('navigation.admin_area')}</span>
                  </div>
                </BNavItem>
              ) : null}
              <BNavItem
                class='fw-bold'
                activeClass='active-route'
                data-test='logout-menu'
                onClick={() => emit('logout')}
              >
                <div class='sidebar-menu-item-wrapper'>
                  <IHumbleiconsLogout class='svg-icon logout-icon' />
                  <span class='ms-2 logout-text'>{t('navigation.logout')}</span>
                </div>
              </BNavItem>
            </BNav>
          </div>
        </div>

        {/* The logo lives in the navbar. A route that hides the navbar would take
            the logo down with it, so the menu takes it in — below the items, where
            it does not compete with the first thing you read. */}
        {props.showLogo ? (
          <RouterLink to='/overview' class='sidebar-logo d-none d-lg-block'>
            <BImg src={logo} width='144' alt='Logo' />
          </RouterLink>
        ) : null}
      </div>
    )
  },
})
