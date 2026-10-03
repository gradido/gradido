<template>
  <div class="component-nabvar">
    <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="light-dark">
      <!-- Coin and community name are one link home: the name says where the moderator is,
           the wordmark it replaces only said "Gradido" a second time. -->
      <BNavbarBrand class="navbar-home" to="/" data-test="navbar-home">
        <img src="../../public/img/gdd-coin.png" class="navbar-coin" alt="" />
        <span class="navbar-community">{{ communityName }}</span>
      </BNavbarBrand>

      <BNavbarToggle
        :label="$t('navbar.menu')"
        aria-controls="nav-collapse"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        data-test="navbar-menu-opener"
        @click="menuOpen = !menuOpen"
      />

      <BCollapse id="nav-collapse" v-model="menuOpen" is-nav>
        <BNavbarNav @click="closeAfterChoice">
          <BNavItem :active="isActive('user')" to="/user">
            {{ $t('navbar.user_search') }}
          </BNavItem>
          <BNavItem
            :active="isActive('creation-confirm')"
            class="bg-color-creation"
            to="/creation-confirm"
          >
            {{ $t('creation') }}
            <BBadge v-show="openCreations > 0" variant="danger">
              {{ openCreations }}
            </BBadge>
          </BNavItem>
          <!-- A moderator sees one of the five settings pages, and may only look there: it
               stands in the bar itself rather than alone in a menu. -->
          <BNavItem
            v-if="!isAdmin"
            to="/contribution-links"
            :active="isActive('contribution-links')"
          >
            {{ $t('navbar.automaticContributions') }}
          </BNavItem>

          <template v-for="group in groups" :key="group.name">
            <!-- Wide: one menu per group. -->
            <BNavItemDropdown
              class="d-none d-lg-block"
              :text="group.label"
              :offset="MENU_OFFSET"
              :toggle-class="{ active: group.active }"
              :data-test="`navbar-group-${group.name}`"
            >
              <BDropdownItem
                v-for="entry in group.entries"
                :key="entry.label"
                :to="entry.to"
                :href="entry.href"
                :target="entry.href ? '_blank' : undefined"
                :active="entry.active"
                :title="entry.title"
              >
                {{ entry.label }}
                <IBiBoxArrowUpRight v-if="entry.href" class="navbar-external" aria-hidden="true" />
              </BDropdownItem>
            </BNavItemDropdown>
            <!-- Narrow: the opened list is the menu already, so a group is a heading above
                 its pages and every page is one tap away. -->
            <li class="navbar-group-heading d-lg-none">{{ group.label }}</li>
            <BNavItem
              v-for="entry in group.entries"
              :key="`${group.name}-${entry.label}`"
              class="navbar-group-entry d-lg-none"
              :to="entry.to"
              :href="entry.href"
              :target="entry.href ? '_blank' : undefined"
              :active="entry.active"
              :title="entry.title"
            >
              {{ entry.label }}
              <IBiBoxArrowUpRight v-if="entry.href" class="navbar-external" aria-hidden="true" />
            </BNavItem>
          </template>
        </BNavbarNav>
      </BCollapse>

      <!-- Outside the collapse, so the moderator's own menu stays in the bar on a phone. -->
      <BNavbarNav class="navbar-account">
        <BNavItemDropdown
          placement="bottom-end"
          :offset="ACCOUNT_MENU_OFFSET"
          :aria-label="account.name"
          data-test="navbar-account"
        >
          <template #button-content>
            <MemberAvatar :size="NAV_AVATAR_SIZE" :zoomable="false" v-bind="account.face" />
          </template>
          <li class="navbar-account-head" role="presentation">
            <div class="navbar-account-name">{{ account.name }}</div>
            <div class="navbar-account-role">{{ account.role }}</div>
          </li>
          <BDropdownDivider />
          <BDropdownItem data-test="navbar-wallet" @click="handleWallet">
            {{ $t('navbar.my-account') }}
          </BDropdownItem>
          <BDropdownItem data-test="navbar-logout" @click="handleLogout">
            {{ $t('navbar.logout') }}
          </BDropdownItem>
        </BNavItemDropdown>
      </BNavbarNav>
    </BNavbar>
  </div>
</template>
<script setup>
import CONFIG from '../config'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { logout } from '../graphql/logout'
import {
  BNavbar,
  BCollapse,
  BNavbarNav,
  BNavItem,
  BNavItemDropdown,
  BNavbarBrand,
  BBadge,
  BNavbarToggle,
  BDropdownItem,
  BDropdownDivider,
  vBColorMode,
} from 'bootstrap-vue-next'
import { useRoute } from 'vue-router'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { NAV_AVATAR_SIZE } from '@/constants'
import { avatarLettering } from '@/utils/avatarLettering'

const HELP_URL = 'https://gradido.net/coin/moderators-tutorial/'

// How far below its button a menu opens, in px: the distance to the lower edge of the bar,
// so the menu hangs from the bar and does not lie across it. The entries are 40 high and
// the moderator's button 44, in a bar that is 60.
const MENU_OFFSET = 10
const ACCOUNT_MENU_OFFSET = 8

const store = useStore()
const route = useRoute()
const { t } = useI18n()

const openCreations = computed(() => store.state.openCreations)

const communityName = CONFIG.COMMUNITY_NAME

// Entries whose pages create or change things only an administrator may touch. Menu
// visibility is a convenience; the route guard and the backend rights are the boundary.
const isAdmin = computed(() => store.state.moderator?.role === 'ADMIN')

const currentRouteName = computed(() => {
  return route.name
})

const isActive = (tabRoute) => {
  return tabRoute === currentRouteName.value
}

const page = (name, to, label, title) => ({ to, label, title, active: isActive(name) })

// The second level. Both shapes of the bar are drawn from this one list, so a page cannot
// be in the wide menu and missing from the narrow one.
const groups = computed(() => {
  const information = [
    ...(isAdmin.value ? [page('federation', '/federation', t('navbar.instances'))] : []),
    page('statistic', '/statistic', t('navbar.statistic')),
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

const roleName = (role) => {
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
  const moderator = store.state.moderator
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
const closeAfterChoice = (event) => {
  if (event.target.closest('a')) menuOpen.value = false
}

const { mutate: executeLogout } = useMutation(logout)

const handleLogout = async () => {
  window.location.assign(CONFIG.WALLET_LOGIN_URL)
  // window.location = CONFIG.WALLET_LOGIN_URL
  await store.dispatch('logout')
  await executeLogout()
}

const handleWallet = () => {
  window.location = CONFIG.WALLET_AUTH_URL + store.state.token
  store.dispatch('logout') // logout without redirect
}
</script>

<style lang="scss">
.bg-light-dark {
  background-color: #343a40;
}

/* The elements below are drawn by the library's components, which a scoped block does not
   reach. The root class keeps the rules to this bar and puts them above Bootstrap's own. */
.component-nabvar {
  .navbar-home {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    min-width: 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .navbar-coin {
    flex: none;
    width: 2rem;
    height: 2rem;
  }

  /* The name gives way first when the bar runs out of room. */
  .navbar-community {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navbar-nav .nav-link {
    white-space: nowrap;
  }

  /* Bootstrap's ring is a quarter-opaque blue, which on this dark bar is next to nothing
     (1.2 : 1), and inside a menu the focus is only the hover tint. A keyboard needs to see
     where it stands. */
  .navbar-home:focus-visible,
  .nav-link:focus-visible,
  .dropdown-item:focus-visible {
    outline: 2px solid var(--bs-white);
    outline-offset: -2px;
    box-shadow: none;
  }

  .navbar-external {
    margin-left: 0.25rem;
    font-size: 0.875em;
    vertical-align: -0.0625em;
  }

  /* The menus hang in the bar's own dark scheme. The page chosen is marked the way the bar
     marks it: white on a lighter ground, not Bootstrap's blue. */
  .dropdown-menu {
    --bs-dropdown-link-active-bg: var(--bs-gray-700);
    --bs-dropdown-link-active-color: var(--bs-white);
  }

  .navbar-account .nav-link {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.5rem;
  }

  .navbar-account-head {
    max-width: 18rem;
    padding: 0.25rem 1rem 0.375rem;
  }

  .navbar-account-name {
    overflow: hidden;
    font-weight: 500;
    color: var(--bs-emphasis-color);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navbar-account-role {
    font-size: 0.875rem;
    color: var(--bs-secondary-color);

    &::first-letter {
      text-transform: uppercase;
    }
  }

  @media (width >= 992px) {
    .navbar-home {
      flex: 0 1 auto;
      margin-right: 0.5rem;

      /* The line stands after the name: it parts where one is from where one can go. */
      &::after {
        flex: none;
        width: 1px;
        height: 1.25rem;
        margin-left: 0.5rem;
        content: '';
        background-color: rgb(255 255 255 / 25%);
      }
    }
  }

  @media (width < 992px) {
    /* One row: name, the moderator's menu, the opener. The entries open below it. */
    .navbar-home {
      flex: 1 1 0;
      margin-right: 0.75rem;
    }

    .navbar-account {
      order: 1;
    }

    .navbar-toggler {
      order: 2;
      min-height: 2.75rem;
      margin-left: 0.25rem;
    }

    .navbar-collapse {
      order: 3;
    }

    /* 44 px for a finger. */
    .navbar-collapse .nav-link,
    .navbar-account .dropdown-item {
      padding-top: 0.625rem;
      padding-bottom: 0.625rem;
    }

    .navbar-group-heading {
      padding: 0.75rem 0 0.25rem;
      font-size: 0.8125rem;
      color: rgb(255 255 255 / 60%);
    }

    .navbar-group-entry .nav-link {
      padding-left: 1rem;
    }
  }
}
</style>
