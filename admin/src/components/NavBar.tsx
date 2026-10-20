// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import {
  BBadge,
  BCollapse,
  BDropdownDivider,
  BDropdownItem,
  BNavbar,
  BNavbarBrand,
  BNavbarNav,
  BNavbarToggle,
  BNavItem,
  BNavItemDropdown,
  type ColorVariant,
  vBColorMode,
} from 'bootstrap-vue-next'
import { computed, defineComponent, Fragment, ref, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { MemberAvatar } from '@/components/MemberAvatar'
import { NAV_AVATAR_SIZE } from '@/constants'
import { useAdminStore } from '@/store/useAdminStore'
import { handOverAddress, sharesOrigin } from '@/utils/authToken'
import { avatarLettering } from '@/utils/avatarLettering'
import { redirectTo } from '@/utils/redirect'
import IBiBoxArrowUpRight from '~icons/bi/box-arrow-up-right'
import coinImage from '../../public/img/gdd-coin.png'
import { CONFIG } from '../config'
import { logout } from '../graphql/logout'
// Not a module: the rules reach into what the library's components draw.
import './NavBar.scss'

const HELP_URL = 'https://gradido.net/coin/moderators-tutorial/'

// How far below its button a menu opens, in px: the distance to the lower edge of the bar,
// so the menu hangs from the bar and does not lie across it. The entries are 40 high and
// the moderator's button 44, in a bar that is 60.
const MENU_OFFSET = 10
const ACCOUNT_MENU_OFFSET = 8

// What NavBar reads of the signed-in moderator. The store starts it as null and does not
// say more, so the shape is named here.
type Moderator = {
  firstName?: string
  lastName?: string
  alias?: string
  role?: string
  avatar?: string
} | null

type MenuEntry = { to?: string; href?: string; label: string; title?: string; active: boolean }

export const NavBar = defineComponent({
  name: 'NavBar',
  setup() {
    const store = useAdminStore()
    const route = useRoute()
    const { t } = useI18n()

    const openCreations = computed(() => store.openCreations)

    const communityName = CONFIG.COMMUNITY_NAME

    // Entries whose pages create or change things only an administrator may touch. Menu
    // visibility is a convenience; the route guard and the backend rights are the boundary.
    const isAdmin = computed(() => (store.moderator as Moderator)?.role === 'ADMIN')

    const currentRouteName = computed(() => {
      return route.name
    })

    const isActive = (tabRoute: string) => {
      return tabRoute === currentRouteName.value
    }

    const page = (name: string, to: string, label: string, title?: string): MenuEntry => ({
      to,
      label,
      title,
      active: isActive(name),
    })

    // The second level. Both shapes of the bar are drawn from this one list, so a page cannot
    // be in the wide menu and missing from the narrow one.
    const groups = computed(() => {
      const information: MenuEntry[] = [
        ...(isAdmin.value ? [page('federation', '/federation', t('navbar.instances'))] : []),
        { href: HELP_URL, label: t('help.help'), active: false },
      ]
      const settings = [
        page('contribution-links', '/contribution-links', t('navbar.automaticContributions')),
        page(
          'projectBranding',
          '/projectBranding',
          t('navbar.projectBranding'),
          t('navbar.projectBrandingTooltip'),
        ),
        page('creation-groups', '/creation-groups', t('navbar.creationGroups')),
        page('creaSettings', '/creaSettings', t('navbar.crea')),
        page('chat', '/chat', t('navbar.chat')),
      ]
      return [
        { name: 'information', label: t('navbar.information'), entries: information },
        ...(isAdmin.value
          ? [{ name: 'settings', label: t('navbar.settings'), entries: settings }]
          : []),
      ].map((group) => ({ ...group, active: group.entries.some((entry) => entry.active) }))
    })

    const roleName = (role?: string) => {
      switch (role) {
        case 'ADMIN':
          return t('userRole.selectRoles.admin')
        case 'MODERATOR':
          return t('userRole.selectRoles.moderator')
        case 'MODERATOR_AI':
          return t('userRole.selectRoles.moderatorAi')
        default:
          return ''
      }
    }

    // Who is signed in. The picture comes with verifyLogin and is the moderator's own, so it
    // shows whatever their switch for other members says; without one the circle takes the
    // letters and the colour every other circle of this member has.
    const account = computed(() => {
      const moderator = store.moderator as Moderator
      const { letters, colorSeed, colorIndex } = avatarLettering(moderator)
      return {
        name:
          [moderator?.firstName, moderator?.lastName].filter(Boolean).join(' ') ||
          moderator?.alias ||
          '',
        role: roleName(moderator?.role),
        face: {
          initials: letters,
          colorSeed,
          colorIndex,
          src: moderator?.avatar ? `data:image/jpeg;base64,${moderator.avatar}` : '',
        },
      }
    })

    // Below the breakpoint the entries are a list that covers the page. A choice closes it,
    // also the choice of the page that is already open, which changes no route.
    const menuOpen = ref(false)
    const closeAfterChoice = (event: MouseEvent) => {
      if ((event.target as Element).closest('a')) {
        menuOpen.value = false
      }
    }

    const { mutate: executeLogout } = useMutation(logout)

    const handleLogout = async () => {
      redirectTo(CONFIG.WALLET_LOGIN_URL)
      store.logout()
      await executeLogout()
    }

    const handleWallet = () => {
      redirectTo(handOverAddress(CONFIG.WALLET_AUTH_URL, store.token))
      // Signed out only where the wallet is on another origin (development), as it always was:
      // there the token went along in the address. On one origin both apps hold the one token
      // (utils/authToken.ts), and signing out here would sign the wallet out as well.
      if (!sharesOrigin(CONFIG.WALLET_AUTH_URL)) {
        store.logout() // logout without redirect
      }
    }

    const external = (entry: MenuEntry) =>
      entry.href ? <IBiBoxArrowUpRight class='navbar-external' aria-hidden='true' /> : null

    return () => (
      <div class='component-nabvar'>
        {withDirectives(
          <BNavbar
            toggleable='lg'
            // 'light-dark' is no Bootstrap variant: NavBar.scss styles .bg-light-dark itself.
            variant={'light-dark' as string as ColorVariant}
          >
            {/* Coin and community name are one link home: the name says where the moderator is,
                the wordmark it replaces only said "Gradido" a second time. */}
            <BNavbarBrand class='navbar-home' to='/' data-test='navbar-home'>
              <img src={coinImage} class='navbar-coin' alt='' />
              <span class='navbar-community'>{communityName}</span>
            </BNavbarBrand>

            <BNavbarToggle
              label={t('navbar.menu')}
              aria-controls='nav-collapse'
              aria-expanded={menuOpen.value ? 'true' : 'false'}
              data-test='navbar-menu-opener'
              onClick={() => {
                menuOpen.value = !menuOpen.value
              }}
            />

            <BCollapse id='nav-collapse' v-model={menuOpen.value} isNav>
              <BNavbarNav onClick={closeAfterChoice}>
                <BNavItem active={isActive('user')} to='/user'>
                  {t('navbar.user_search')}
                </BNavItem>
                <BNavItem
                  active={isActive('creation-confirm')}
                  class='bg-color-creation'
                  to='/creation-confirm'
                >
                  {t('creation')}{' '}
                  <BBadge v-show={openCreations.value > 0} variant='danger'>
                    {openCreations.value}
                  </BBadge>
                </BNavItem>
                {/* A moderator sees one of the five settings pages, and may only look there: it
                    stands in the bar itself rather than alone in a menu. */}
                {!isAdmin.value ? (
                  <BNavItem to='/contribution-links' active={isActive('contribution-links')}>
                    {t('navbar.automaticContributions')}
                  </BNavItem>
                ) : null}

                {groups.value.map((group) => (
                  <Fragment key={group.name}>
                    {/* Wide: one menu per group. */}
                    <BNavItemDropdown
                      class='d-none d-lg-block'
                      text={group.label}
                      offset={MENU_OFFSET}
                      toggleClass={{ active: group.active }}
                      data-test={`navbar-group-${group.name}`}
                    >
                      {group.entries.map((entry) => (
                        <BDropdownItem
                          key={entry.label}
                          to={entry.to}
                          href={entry.href}
                          target={entry.href ? '_blank' : undefined}
                          active={entry.active}
                          title={entry.title}
                        >
                          {entry.label} {external(entry)}
                        </BDropdownItem>
                      ))}
                    </BNavItemDropdown>
                    {/* Narrow: the opened list is the menu already, so a group is a heading above
                        its pages and every page is one tap away. */}
                    <li class='navbar-group-heading d-lg-none'>{group.label}</li>
                    {group.entries.map((entry) => (
                      <BNavItem
                        key={`${group.name}-${entry.label}`}
                        class='navbar-group-entry d-lg-none'
                        to={entry.to}
                        href={entry.href}
                        target={entry.href ? '_blank' : undefined}
                        active={entry.active}
                        title={entry.title}
                      >
                        {entry.label} {external(entry)}
                      </BNavItem>
                    ))}
                  </Fragment>
                ))}
              </BNavbarNav>
            </BCollapse>

            {/* Outside the collapse, so the moderator's own menu stays in the bar on a phone. */}
            <BNavbarNav class='navbar-account'>
              <BNavItemDropdown
                placement='bottom-end'
                offset={ACCOUNT_MENU_OFFSET}
                aria-label={account.value.name}
                data-test='navbar-account'
              >
                {{
                  'button-content': () => (
                    // v-bind after the explicit props, as in the template: the face wins.
                    <MemberAvatar size={NAV_AVATAR_SIZE} zoomable={false} {...account.value.face} />
                  ),
                  default: () => (
                    <>
                      <li class='navbar-account-head' role='presentation'>
                        <div class='navbar-account-name'>{account.value.name}</div>
                        <div class='navbar-account-role'>{account.value.role}</div>
                      </li>
                      <BDropdownDivider />
                      <BDropdownItem data-test='navbar-wallet' onClick={handleWallet}>
                        {t('navbar.my-account')}
                      </BDropdownItem>
                      <BDropdownItem data-test='navbar-logout' onClick={handleLogout}>
                        {t('navbar.logout')}
                      </BDropdownItem>
                    </>
                  ),
                }}
              </BNavItemDropdown>
            </BNavbarNav>
          </BNavbar>,
          [[vBColorMode, 'dark']],
        )}
      </div>
    )
  },
})
