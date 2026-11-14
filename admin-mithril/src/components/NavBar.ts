// AI-GENERATED — not an architecture reference
import coinImage from '@admin/../public/img/gdd-coin.png'
import '@admin/components/NavBar.scss'
import { CONFIG } from '@admin/config'
import { NAV_AVATAR_SIZE } from '@admin/constants'
import { logout as logoutMutation } from '@admin/graphql/logout'
import { handOverAddress, sharesOrigin } from '@admin/utils/authToken'
import { avatarLettering } from '@admin/utils/avatarLettering'
import { redirectTo } from '@admin/utils/redirect'
import m, { type Children, type ClassComponent } from 'mithril'
import { Dropdown } from '@/components/bootstrap/Dropdown'
import { icon } from '@/components/icon'
import { MemberAvatar } from '@/components/MemberAvatar'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore, logout } from '@/store/admin.store'
import { type ThemeMode, themeMode, writeThemeMode } from '@/theme'
import externalIcon from '~icons/bi/box-arrow-up-right'

const HELP_URL = 'https://gradido.net/coin/moderators-tutorial/'

// How far below its button a menu opens: down to the lower edge of the bar, so the menu hangs
// from the bar instead of lying across it. The entries are 40 high and the face 44, the bar 60.
const MENU_OFFSET = 10
const ACCOUNT_MENU_OFFSET = 8

// `after` stands behind the label: the count of a page
type Entry = { label: string; to?: string; href?: string; title?: string; after?: Children }

const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'userRole.selectRoles.admin',
  MODERATOR: 'userRole.selectRoles.moderator',
  MODERATOR_AI: 'userRole.selectRoles.moderatorAi',
}

const THEMES: { mode: ThemeMode; key: string }[] = [
  { mode: 'system', key: 'navbar.theme.system' },
  { mode: 'light', key: 'navbar.theme.light' },
  { mode: 'dark', key: 'navbar.theme.dark' },
]

// the path of the page open, without its query
const currentPath = () => m.route.get().split('?')[0]

/**
 * A link to a page of the admin, or to a site outside of it (in a new tab, marked so): `link` is
 * the element the bar draws it as, `nav-link` in the bar, `dropdown-item` in a menu.
 */
const entryLink = (link: string, { label, to, href, title, after }: Entry, extra: object = {}) => {
  const active = to === currentPath() ? 'active' : ''
  const content = [
    label,
    ' ',
    href ? icon(externalIcon, { class: 'navbar-external', 'aria-hidden': 'true' }) : after,
  ]
  return to
    ? m(m.route.Link, { href: to, class: `${link} ${active}`, title, ...extra }, content)
    : m('a', { href, class: link, target: '_blank', rel: 'noopener', title, ...extra }, content)
}

const navItem = (entry: Entry, itemClass = '') =>
  m('li.nav-item', { class: itemClass }, entryLink('nav-link', entry))

/** The bar above every page: where the moderator can go, and who they are. */
export class NavBar implements ClassComponent {
  // below the breakpoint the entries are a list that covers the page
  private menuOpen = false

  private async signOut() {
    redirectTo(CONFIG.WALLET_LOGIN_URL)
    logout()
    await graphqlRequest(logoutMutation)
  }

  private toWallet() {
    redirectTo(handOverAddress(CONFIG.WALLET_AUTH_URL, adminStore.token))
    // On another origin (development) the token went along in the address, and this admin signs
    // out as it always did; on one origin both apps hold the one token, which has to stay.
    if (!sharesOrigin(CONFIG.WALLET_AUTH_URL)) {
      logout()
    }
  }

  private accountMenu() {
    const moderator = adminStore.moderator
    const { letters, colorSeed, colorIndex } = avatarLettering(moderator)
    const name =
      [moderator?.firstName, moderator?.lastName].filter(Boolean).join(' ') ||
      moderator?.alias ||
      ''
    const role = moderator?.role && ROLE_NAMES[moderator.role]
    const menuItem = (attrs: object, label: string) =>
      m(
        'li',
        { role: 'presentation' },
        m('button.dropdown-item', { type: 'button', ...attrs }, label),
      )
    const divider = m(
      'li',
      { role: 'presentation' },
      m('hr.dropdown-divider', { role: 'separator' }),
    )

    // Outside the collapse, so that the moderator's own menu stays in the bar on a phone.
    return m(
      'ul.navbar-nav.navbar-account',
      m(
        'li.nav-item.dropdown',
        { 'data-test': 'navbar-account' },
        m(
          Dropdown,
          {
            label: name,
            end: true,
            offset: ACCOUNT_MENU_OFFSET,
            toggle: m(MemberAvatar, {
              size: NAV_AVATAR_SIZE,
              initials: letters,
              colorSeed,
              colorIndex,
              src: moderator?.avatar ? `data:image/jpeg;base64,${moderator.avatar}` : '',
            }),
          },
          [
            m('li.navbar-account-head', { role: 'presentation' }, [
              m('.navbar-account-name', name),
              m('.navbar-account-role', role ? t(role) : ''),
            ]),
            divider,
            m('li', { role: 'presentation' }, m('h6.dropdown-header', t('navbar.appearance'))),
            THEMES.map(({ mode, key }) =>
              menuItem(
                {
                  class: themeMode() === mode ? 'active' : '',
                  role: 'menuitemradio',
                  'aria-checked': String(themeMode() === mode),
                  'data-test': `navbar-theme-${mode}`,
                  onclick: () => writeThemeMode(mode),
                },
                t(key),
              ),
            ),
            divider,
            menuItem(
              { role: 'menuitem', 'data-test': 'navbar-wallet', onclick: () => this.toWallet() },
              t('navbar.my-account'),
            ),
            menuItem(
              { role: 'menuitem', 'data-test': 'navbar-logout', onclick: () => this.signOut() },
              t('navbar.logout'),
            ),
          ],
        ),
      ),
    )
  }

  view() {
    // Entries that create or change what only an administrator may touch. The menu only keeps
    // them out of sight: the route guard and the backend's rights are the boundary.
    const isAdmin = adminStore.moderator?.role === 'ADMIN'
    const openCreations = adminStore.openCreations
    // The second level. Both shapes of the bar are drawn from this one list, so that a page
    // cannot be in the wide menu and missing from the narrow one.
    const groups = [
      {
        name: 'information',
        label: t('navbar.information'),
        entries: [
          ...(isAdmin ? [{ to: '/federation', label: t('navbar.instances') }] : []),
          { to: '/statistic', label: t('navbar.statistic') },
          { href: HELP_URL, label: t('help.help') },
        ],
      },
      ...(isAdmin
        ? [
            {
              name: 'settings',
              label: t('navbar.settings'),
              entries: [
                { to: '/contribution-links', label: t('navbar.automaticContributions') },
                {
                  to: '/projectBranding',
                  label: t('navbar.projectBranding'),
                  title: t('navbar.projectBrandingTooltip'),
                },
                { to: '/creation-groups', label: t('navbar.creationGroups') },
                { to: '/creaSettings', label: t('navbar.crea') },
                { to: '/chat', label: t('navbar.chat') },
              ],
            },
          ]
        : []),
    ]

    return m(
      '.component-nabvar.wrapper-nav',
      m(
        'nav.navbar.bg-light-dark.navbar-expand-lg',
        { 'data-bs-theme': 'dark' },
        m('.container-fluid', [
          // Coin and community name are one link home: the name says where the moderator is.
          m(
            m.route.Link,
            { href: '/', class: 'navbar-brand navbar-home', 'data-test': 'navbar-home' },
            [
              m('img.navbar-coin', { src: coinImage, alt: '' }),
              m('span.navbar-community', CONFIG.COMMUNITY_NAME),
            ],
          ),
          m(
            'button.navbar-toggler',
            {
              type: 'button',
              'aria-label': t('navbar.menu'),
              'aria-controls': 'nav-collapse',
              'aria-expanded': String(this.menuOpen),
              'data-test': 'navbar-menu-opener',
              onclick: () => {
                this.menuOpen = !this.menuOpen
              },
            },
            m('span.navbar-toggler-icon'),
          ),
          m(
            '#nav-collapse.collapse.navbar-collapse',
            { class: this.menuOpen ? 'show' : '' },
            m(
              'ul.navbar-nav',
              {
                // A choice closes the list, also that of the page already open.
                onclick: (event: MouseEvent) => {
                  if ((event.target as Element).closest('a')) {
                    this.menuOpen = false
                  }
                },
              },
              [
                navItem({ to: '/user', label: t('navbar.user_search') }),
                navItem(
                  {
                    to: '/creation-confirm',
                    label: t('creation'),
                    after: openCreations > 0 ? m('span.badge.text-bg-danger', openCreations) : null,
                  },
                  'bg-color-creation',
                ),
                // the requests of the moderator's groups (Support-Anfragen K2); the count of the
                // open ones comes with K3
                navItem({ to: '/support', label: t('navbar.support') }),
                // A moderator sees one of the settings pages, and may only look there: it stands
                // in the bar itself rather than alone in a menu.
                isAdmin
                  ? null
                  : navItem({
                      to: '/contribution-links',
                      label: t('navbar.automaticContributions'),
                    }),
                groups.map((group) => [
                  // wide: one menu per group
                  m(
                    'li.nav-item.dropdown.d-none.d-lg-block',
                    { 'data-test': `navbar-group-${group.name}` },
                    m(
                      Dropdown,
                      {
                        toggle: group.label,
                        toggleClass: group.entries.some(({ to }) => to === currentPath())
                          ? 'btn-link nav-link active'
                          : 'btn-link nav-link',
                        offset: MENU_OFFSET,
                      },
                      group.entries.map((entry) =>
                        m(
                          'li',
                          { role: 'presentation' },
                          entryLink('dropdown-item', entry, { role: 'menuitem' }),
                        ),
                      ),
                    ),
                  ),
                  // narrow: the open list is the menu already, a group is a heading above its pages
                  m('li.navbar-group-heading.d-lg-none', group.label),
                  group.entries.map((entry) => navItem(entry, 'navbar-group-entry d-lg-none')),
                ]),
              ],
            ),
          ),
          this.accountMenu(),
        ]),
      ),
    )
  }
}
