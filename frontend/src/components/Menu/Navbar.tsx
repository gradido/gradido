// AI-GENERATED — not an architecture reference
import { BImg, BNavbar, BNavbarBrand, BNavbarNav } from 'bootstrap-vue-next'
import {
  type ComponentPublicInstance,
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import '@/assets/fonts/afacad/afacad.css'
import { AvatarButton } from '@/components/Avatar/AvatarButton'
import { GradidoAddressCopy } from '@/components/GradidoAddressCopy'
import { QuickCodeIcon } from '@/components/Menu/QuickCodeIcon'
// How many conversations hold something unread, from the chat's beat -- for the dot.
import { chatUnreadConversations } from '@/composables/useChatUpdates'
import { contributionsInProgress } from '@/composables/useContributionsInProgress'
import {
  moderationCreationsWaiting,
  moderationSupportTicketsWaiting,
} from '@/composables/useModerationWaiting'
import { supportTicketsInProgress } from '@/composables/useSupportTicketsMenu'
import CONFIG from '@/config'
import { useWalletStore } from '@/store/useWalletStore'
import { avatarLettering } from '@/utils/avatarLettering'
import { memberAlias } from '@/utils/gradidoAddress'
import { inLogoFace } from '@/utils/logoFace'
import IMdiCalculator from '~icons/mdi/calculator'
import IMdiQrcodeScan from '~icons/mdi/qrcode-scan'
import IMdiSettings from '~icons/mdi/settings'
import './Navbar.scss'
import classes from './Navbar.module.scss'

export const Navbar = defineComponent({
  name: 'Navbar',
  props: {
    balance: { type: Number, required: true },
    /** Whether the phone's menu (MobileSidebar) is open -- the layout keeps it. */
    menuOpen: { type: Boolean, default: false },
  },
  emits: ['toggle-menu'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useWalletStore()

    // A project account does not create (ES-021): its menu has no "Schöpfen" and the page leads
    // home, so a question back to one of its contributions -- left from before the switch -- lights
    // no dot it could follow. `!== false` as the menu reads it: not known is a person.
    const creationQuestions = computed(() =>
      store.creationAllowed !== false ? contributionsInProgress.value : 0,
    )

    // What waits for the moderation ("Meine Gruppen" MG3), the two numbers at "Admin" in the menu
    // behind the opener. Only where that menu shows "Admin" (a role, as the Sidebar asks): a figure
    // on the opener must lead to the same figure in the menu.
    const moderationCreations = computed(() => (store.role ? moderationCreationsWaiting.value : 0))
    const moderationSupportTickets = computed(() =>
      store.role ? moderationSupportTicketsWaiting.value : 0,
    )
    const figure = (n: number) => (n > 99 ? '99+' : String(n))
    const moderationCreationsSentence = computed(() =>
      t('navigation.adminCreations', { n: moderationCreations.value }, moderationCreations.value),
    )
    const moderationSupportSentence = computed(() =>
      t(
        'navigation.adminSupportTickets',
        { n: moderationSupportTickets.value },
        moderationSupportTickets.value,
      ),
    )

    const root = ref<HTMLElement | null>(null)
    const home = ref<ComponentPublicInstance | null>(null)

    const coin = '/img/brand/gradido-coin.png'
    const communityName = CONFIG.COMMUNITY_NAME
    // Where coin and name end, from the left edge of the bar, in px. 0 where they do not
    // stand (the phone) or nothing lays out.
    const brandEnd = ref(0)
    const sheet = '/img/template/Blaetter.png'

    // A name with a letter the wordmark's typeface lacks is set in the page's font, whole.
    const communityInLogoFace = computed(() => inLogoFace(communityName))
    const username = computed(() => {
      // The circle's letters are the first two of the user name, here as on the printed
      // card, on the cheque and in every other member's lists (Bernd, 17.09.2026): a card
      // handed to somebody must not show two letters that the member's circle in their
      // wallet does not. The colour keeps hashing the real initials (AS-010), so a new user
      // name changes the letters and not the colour. The name beside the circle stays the
      // member's own.
      const { letters, colorSeed } = avatarLettering({
        alias: store.username,
        firstName: store.firstName,
        lastName: store.lastName,
      })
      return {
        username: `${store.firstName} ${store.lastName}`,
        initials: letters,
        colorSeed,
      }
    })
    const alias = computed(() => {
      // gradidoID, not gradidoId -- the store spells it with a capital D, and the other
      // spelling once put the word "undefined" in front of every member without a user
      // name. It is worth naming at each call site; nothing catches it.
      return memberAlias(store.username, store.gradidoID)
    })

    const measureBrand = () => {
      const homeElement: HTMLElement | undefined = home.value?.$el
      if (!homeElement || !root.value) {
        return
      }
      const { right, width } = homeElement.getBoundingClientRect()
      brandEnd.value = width > 0 ? Math.round(right - root.value.getBoundingClientRect().left) : 0
    }

    let brandObserver: ResizeObserver | undefined
    onMounted(() => {
      // The name's width is the community's, and it changes once more when its typeface has
      // come: the observer reports both, and the phone's `display: none` as a width of 0.
      if (typeof ResizeObserver === 'undefined') {
        return
      }
      brandObserver = new ResizeObserver(() => measureBrand())
      brandObserver.observe(home.value?.$el)
    })
    onBeforeUnmount(() => {
      brandObserver?.disconnect()
    })

    return () => (
      <div ref={root} class={['navbar-component', classes['navbar-component']]}>
        <div class='navbar-element'>
          <BNavbar toggleable='lg' class='pe-4'>
            <BNavbarBrand>
              {/* The coin and the community's name, one link home. The wordmark this replaces
                  said "Gradido" on every server alike; the name says which community the member
                  is in. The coin is the logo's own, cut from it and as large as it stood there,
                  and the name takes the wordmark's height, green and typeface. Only here: the pages
                  without a session keep the whole logo. (Bernd, 05.10.2026) */}
              <RouterLink
                ref={home}
                to='/overview'
                class='navbar-home mt-lg--2 mt-3 mb-3 d-none d-lg-flex zindex10'
                data-test='navbar-home'
              >
                <img class='navbar-coin' src={coin} alt='' />
                <span
                  class={[
                    'navbar-community',
                    { 'navbar-community-plain': !communityInLogoFace.value },
                  ]}
                  data-test='navbar-community'
                >
                  {communityName}
                </span>
              </RouterLink>
              {/* The four till tools sit ABOVE the menu opener, deliberately small and
                  unmarked: tools for those who run a till, not headline features. Whoever
                  needs them knows where they live. Scan left of the calculator, because
                  scanning is the more general act. (Bernd, 20./21.08.2026)

                  ⛔ Two by two, NOT four in a row. Four 44px targets need 176px, and the
                  block opposite -- avatar, name and the Gradido address at 27 characters --
                  takes about 195px of a 375px phone. There is room for three. The second row
                  costs no height either: the brand block grows to about 128px and the block
                  opposite is already about 130px tall.

                  The rows mean something: reading a code above, showing one below. */}
              <div class='d-block d-lg-none'>
                <div class='navbar-quick-row'>
                  <RouterLink
                    to='/scan'
                    aria-label={t('navigation.scanner')}
                    data-test='navbar-scanner'
                  >
                    <IMdiQrcodeScan />
                  </RouterLink>
                  <RouterLink
                    to='/calculator'
                    aria-label={t('navigation.calculator')}
                    data-test='navbar-calculator'
                  >
                    <IMdiCalculator />
                  </RouterLink>
                  <RouterLink
                    to='/my-thank-you-card'
                    aria-label={t('pageTitle.my-thank-you-card')}
                    data-test='navbar-my-thank-you-card'
                  >
                    <QuickCodeIcon direction='out' />
                  </RouterLink>
                  <RouterLink
                    to='/my-gradido-card'
                    aria-label={t('pageTitle.my-gradido-card')}
                    data-test='navbar-my-gradido-card'
                  >
                    <QuickCodeIcon direction='in' />
                  </RouterLink>
                </div>
                {/* The menu opener, and on it a gold dot while conversations hold something unread
                    -- a dot and not a figure: the opener is a symbol, and the figure is in the menu
                    behind it (Sidebar). Laid over the symbol's corner, so nothing moves when it
                    comes and goes. For screen readers a line of text instead.

                    A button, not a div: a div took the click but no Tab, no Enter and no name,
                    so the whole menu of a phone was out of a keyboard's reach. Its name is the
                    hidden word "Menu", then the dot's line where there is one.

                    ⛔ Open or shut is the layout's (DashboardLayout keeps it, MobileSidebar
                    follows it), not v-b-toggle's. The directive (bootstrap-vue-next 0.26.8)
                    sets aria-expanded only on the element that was clicked, so a menu closed by
                    the dark area beside it or by one of its entries left this button saying
                    "expanded" -- harmless on the div, read out on a button. */}
                <button
                  type='button'
                  class='navbar-menu-opener'
                  aria-controls='sidebar-mobile'
                  aria-expanded={props.menuOpen ? 'true' : 'false'}
                  data-test='navbar-menu-opener'
                  onClick={() => emit('toggle-menu')}
                >
                  <span class='visually-hidden'>{t('navigation.menu')}</span>
                  <span class='navbar-toggler-icon h2'>
                    {/* one dot for all three: something unread in the chat, a question back to one
                        of the member's support requests (K5) or to one of their contributions
                        (Bernd, 16.11.2026) -- the lines beside it say which */}
                    {chatUnreadConversations.value > 0 ||
                    supportTicketsInProgress.value > 0 ||
                    creationQuestions.value > 0 ? (
                      <span
                        class='chat-unread-dot'
                        aria-hidden='true'
                        data-test='chat-unread-dot'
                      />
                    ) : null}
                    {/* Below the lines, what waits for the moderation: the creations at the left,
                        the support requests at the right (Bernd, 24.11.2026). Figures, unlike the
                        dot: they are the same two numbers as at "Admin" behind the opener, in the
                        same form, and each place says what is counted. Under the bottom line and
                        not on it, so the three lines stay whole and the symbol stays a menu. */}
                    {moderationCreations.value > 0 ? (
                      <span
                        class='navbar-moderation-mark navbar-moderation-mark-creations'
                        aria-hidden='true'
                        title={moderationCreationsSentence.value}
                        data-test='navbar-moderation-creations'
                      >
                        {figure(moderationCreations.value)}
                      </span>
                    ) : null}
                    {moderationSupportTickets.value > 0 ? (
                      <span
                        class='navbar-moderation-mark navbar-moderation-mark-support'
                        aria-hidden='true'
                        title={moderationSupportSentence.value}
                        data-test='navbar-moderation-support'
                      >
                        {figure(moderationSupportTickets.value)}
                      </span>
                    ) : null}
                  </span>
                  {chatUnreadConversations.value > 0 ? (
                    <span class='visually-hidden' data-test='chat-unread-dot-label'>
                      {t('chatThread.unreadDot')}
                    </span>
                  ) : null}
                  {supportTicketsInProgress.value > 0 ? (
                    <span class='visually-hidden' data-test='support-dot-label'>
                      {t('support.dot')}
                    </span>
                  ) : null}
                  {creationQuestions.value > 0 ? (
                    <span class='visually-hidden' data-test='creation-dot-label'>
                      {t('contribution.dot')}
                    </span>
                  ) : null}
                  {/* With a full stop each: two hidden sentences in a row are otherwise read as one. */}
                  {moderationCreations.value > 0 ? (
                    <span class='visually-hidden' data-test='navbar-moderation-creations-label'>
                      {`${moderationCreationsSentence.value}.`}
                    </span>
                  ) : null}
                  {moderationSupportTickets.value > 0 ? (
                    <span class='visually-hidden' data-test='navbar-moderation-support-label'>
                      {`${moderationSupportSentence.value}.`}
                    </span>
                  ) : null}
                </button>
              </div>
            </BNavbarBrand>

            {/* The leaves begin where the name ends, in the windows where they stand at the left
                (see .sheet-img): a name is as long as its community calls itself, and on the
                leaves' green its own green cannot be read. */}
            <BImg
              class='sheet-img position-absolute zindex-1'
              src={sheet}
              style={{ '--brand-end': `${brandEnd.value}px` }}
              data-test='navbar-leaves'
            />

            <BNavbarNav class='ms-auto' {...{ right: '' }}>
              <div class=''>
                <div class='d-flex flex-column align-items-end text-end'>
                  {/* The avatar opens the picture tool; the settings link moved to the name
                      below it. That name already carried the link colouring but was not a
                      link at all, so the move turns a decoy into a function. */}
                  <div class='ms-auto'>
                    <AvatarButton
                      class='vue3-avatar'
                      name={username.value.username}
                      initials={username.value.initials}
                      colorSeed={username.value.colorSeed}
                      color='#fff'
                      size={61}
                    />
                  </div>
                  {/* ⭐ The cog is INSIDE the link, not a second one beside it. The name has
                      led to the settings for a while and nobody could tell — a wheel behind it
                      says where it goes (Bernd, 06.09.). Two anchors on one target would be
                      two stations for a keyboard and two announcements for a screen reader,
                      for one destination; `aria-hidden` on the wheel keeps it decoration and
                      leaves the name as the whole label. */}
                  <RouterLink
                    to='/settings'
                    class='navbar-like-link navbar-settings-link mt-3'
                    data-test='navbar-item-username'
                  >
                    <span>{username.value.username}</span>
                    <IMdiSettings
                      class='navbar-settings-cog'
                      aria-hidden='true'
                      data-test='navbar-item-settings-cog'
                    />
                  </RouterLink>
                  {/* One line for everybody. There used to be two blocks, and the one for
                      members without a user name showed the address inside the settings link,
                      with no way to copy it. That distinction is on its way out anyway -- the
                      user name is becoming compulsory -- and until then the Gradido ID stands
                      in, which resolves just as well. */}
                  <div
                    class='small navbar-like-link pointer mt-1'
                    data-test='navbar-item-gradido-address'
                  >
                    {/* The control itself moved into its own component when the public profile
                        page became the second place that shows the address. It is a button and
                        not an anchor: an anchor without a target is in no tab order, so the
                        address was unreachable for anybody working without a mouse. */}
                    <GradidoAddressCopy alias={alias.value} />
                  </div>
                </div>
              </div>
            </BNavbarNav>
          </BNavbar>
          {/* <div class="alert-box">
          <b-alert show dismissible variant="light" class="nav-alert text-dark">
            <small>{{ $t('1000thanks') }}</small>
          </b-alert>
        </div> */}
        </div>
      </div>
    )
  },
})
