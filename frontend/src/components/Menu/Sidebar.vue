<template>
  <div id="component-sidebar">
    <div
      id="side-menu"
      ref="sideMenu"
      class="gradido-border-radius pt-2 bg-white"
      :class="shadow ? 'app-box-shadow' : ''"
    >
      <div class="mb-3 mt-3">
        <!-- In three pairs (Bernd, E-031): what one has -- the overview and the transactions
             behind it; what one does -- creating before sending, as in Gradido the creating
             comes before the giving; and the people -- matching finds them, "contacts & chat"
             keeps them. -->
        <BNav vertical class="w-200">
          <BNavItem to="/overview" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-fa-home class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.overview') }}</span>
            </div>
          </BNavItem>
          <BNavItem to="/transactions" :class="transactionClass" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-ion-layers-sharp class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.transactions') }}</span>
            </div>
          </BNavItem>
          <!-- ES-021: a project account does not create, so the whole area is gone from the
               menu. `!== false`, not a truthy check: null is "not known" -- a store persisted
               before the field existed, or the moment right after a login -- and for
               not-known the answer is the one every existing account has: a person. -->
          <BNavItem
            v-if="$store.state.creationAllowed !== false"
            ref="contributionsLink"
            to="/contributions"
            class="mb-3"
            active-class="active-route"
            data-test="creation-menu"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-people-group class="svg-icon" />
              <span class="ms-2">{{ $t('creation') }}</span>
            </div>
          </BNavItem>
          <BNavItem to="/send" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <IBiSend class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.send') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            v-if="matchingActive"
            ref="matchingLink"
            to="/matching"
            class="mb-3"
            active-class="active-route"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-tabler-heart-handshake class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.matching') }}</span>
            </div>
          </BNavItem>
          <!-- "Contacts & chat", last, beside matching: with the chat the list is people more
               than bookings (E-031, which moved it from under the transactions, KF-008). The
               page keeps its address; the entry changed its name and did not get a neighbour.

               The gold mark: how many CONVERSATIONS hold something unread -- not messages
               (E-017), from the chat's beat (useChatUpdates) -- only from 1.

               ⛔ On the corner of the symbol, not to the right of the word. Measured in the
               probe: at the desk the menu card is 180 px wide and the words take 103-130 px of
               the 125 px it has for them, so a mark beside the word was cut off at the card's
               edge in every language, and the column cannot grow (at 1025 px it is 175 px wide).
               On the symbol it needs no width at all -- the phone's opener carries its dot the
               same way.

               The figure is for the eye; a screen reader hears the sentence after the word, as
               part of the link, and not the bare figure. -->
          <BNavItem to="/contacts" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper chat-menu-item">
              <span class="chat-menu-icon">
                <i-mdi-account-box-outline class="svg-icon" />
                <span
                  v-if="chatUnreadConversations > 0"
                  class="chat-unread-badge"
                  aria-hidden="true"
                  data-test="chat-unread-badge"
                >
                  {{ chatUnreadFigure }}
                </span>
              </span>
              <span class="ms-2 chat-menu-label">{{ $t('navigation.contacts') }}</span>
              <span
                v-if="chatUnreadConversations > 0"
                class="visually-hidden"
                data-test="chat-unread-badge-label"
              >
                {{
                  $t(
                    'chatThread.unreadBadge',
                    { n: chatUnreadConversations },
                    chatUnreadConversations,
                  )
                }}
              </span>
            </div>
          </BNavItem>
        </BNav>
        <hr class="m-3" />
        <BNav vertical class="w-100">
          <BNavItem to="/information" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-information class="svg-icon" />
              <span class="ms-2">{{ $t('info') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings"
            class="mb-3 d-block"
            active-class="active-route"
            data-test="settings-menu"
          >
            <!-- ⛔ The badge that used to hang here said "Neue Einstellungen" and MEANT "you have
                 no user name yet" -- two different things, and the second one has been solved
                 elsewhere since Nutzername/NU-005: the window at first login asks for it. A hint
                 that says something other than what it means is worse than none. (Bernd, 26.08.2026) -->
            <div class="sidebar-menu-item-wrapper">
              <div>
                <i-mdi-settings class="svg-icon" />
                <span class="ms-2">{{ $t('navigation.settings') }}</span>
              </div>
            </div>
          </BNavItem>
          <BNavItem
            v-if="$store.state.role"
            class="mb-3 text-light"
            active-class="active-route"
            @click="$emit('admin')"
          >
            <div class="sidebar-menu-item-wrapper">
              <IBiShieldCheck />
              <span class="ms-2">
                {{ $t('navigation.admin_area') }}
              </span>
            </div>
          </BNavItem>
          <BNavItem
            class="fw-bold"
            active-class="active-route"
            data-test="logout-menu"
            @click="$emit('logout')"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-humbleicons-logout class="svg-icon logout-icon" />
              <span class="ms-2 logout-text">{{ $t('navigation.logout') }}</span>
            </div>
          </BNavItem>
        </BNav>
      </div>
    </div>

    <!-- The logo lives in the navbar. A route that hides the navbar would take
         the logo down with it, so the menu takes it in — below the items, where
         it does not compete with the first thing you read. -->
    <router-link v-if="showLogo" to="/overview" class="sidebar-logo d-none d-lg-block">
      <BImg :src="logo" width="144" alt="Logo" />
    </router-link>
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { ref, watch, computed, onMounted } from 'vue'
import CONFIG from '@/config'
import { chatUnreadConversations } from '@/composables/useChatUpdates'

// Read once: the flag is baked in at build time, it cannot change while the app runs.
const matchingActive = CONFIG.MATCHING_ACTIVE

const props = defineProps({
  shadow: { type: Boolean, default: true },
  // Set by routes that hide the navbar — see DashboardLayout's bareChrome.
  showLogo: { type: Boolean, default: false },
})

// Same asset the navbar uses, well under its 200px: down here it is a mark, not
// a masthead.
const logo = '/img/brand/gradido-logo.png'

const emit = defineEmits(['closeSidebar'])

const route = useRoute()
const contributionsLink = ref(null)
const matchingLink = ref(null)

/**
 * The figure on the mark: the number up to 99, then "99+". The menu is narrow, and past that
 * the exact figure tells nobody anything the sentence for screen readers does not say.
 */
const chatUnreadFigure = computed(() =>
  chatUnreadConversations.value > 99 ? '99+' : String(chatUnreadConversations.value),
)

const transactionClass = computed(() => {
  if (route.path === '/gdt') {
    return 'mb-3 active-route'
  }
  return 'mb-3'
})

// BNavItem lights active-route only on an exact route match. Two items span more
// than one route — contributions its sub-pages, matching its tabs and the map
// (/matching redirects to /matching/entries, the map is /matching/karte) — so their
// own link element is lit by hand from the path, on a route change and on first
// mount alike (a fresh load has no change to react to).
function setLinkActive(navRef, on) {
  const link = navRef.value?.$el?.children?.[0]
  if (!link) return
  link.classList.toggle('active-route', on)
  link.classList.toggle('router-link-exact-active', on)
}

function syncNavActive() {
  setLinkActive(contributionsLink, route.path.includes('contributions'))
  setLinkActive(matchingLink, route.path.startsWith('/matching'))
}

watch(
  () => route.path,
  () => {
    syncNavActive()
    emit('closeSidebar')
  },
)

onMounted(syncNavActive)
</script>
<style scoped>
.sidebar-logo {
  display: block;
  margin-top: 1.5rem;
  padding-left: 0.5rem;
}

:deep(.nav-item > a) {
  color: rgb(56 56 56) !important;
  border-left: 4px transparent solid;
  display: block;
}

:deep(.active-route) {
  display: block;
  font-weight: bold;
  color: rgb(2 2 1);
  border-left-color: rgb(219 129 19) !important;
}

:deep(.nav-link) {
  padding: 0;
}

.logout-text,
.logout-icon {
  color: #cd5556;
}

.sidebar-menu-item-wrapper {
  padding: 4px 12px;
}

/* Symbol and word in one row, and the word on one line. ⛔ A row and not a line of text: in a
   line the longest word, "Contacten en chat", dropped whole under its symbol (measured in the
   probe). In the row it runs into the entry's right padding and ends 7 px inside the 180 px card
   at the desk; every other word has more room, and the drawer (220 px) has plenty. */
.chat-menu-item {
  display: flex;
  align-items: center;
}

.chat-menu-label {
  white-space: nowrap;
}

/* The symbol and its mark: the mark hangs on the symbol's corner and takes no room in the row,
   so nothing moves when it comes and goes. */
.chat-menu-icon {
  position: relative;
  display: inline-flex;
}

/* Gold B with white figures, the gold of the chat's send buttons (E-032 point 5); round for one
   figure, a pill for "99+", which grows to the left over the symbol and not into the word. A
   ring in the colour of the menu card keeps it off the symbol's lines. */
.chat-unread-badge {
  position: absolute;
  top: -0.5rem;
  right: -0.4rem;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.28rem;
  border-radius: 0.525rem;
  background: #c08935;
  box-shadow: 0 0 0 2px var(--surface, #fff);
  color: #fff;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.05rem;
  text-align: center;
  white-space: nowrap;
}

.svg-icon {
  filter: brightness(1) invert(0);
}

.active-route .svg-icon {
  filter: brightness(0) invert(0);
}

#component-sidebar {
  min-width: 200px;
}

@media screen and (width >= 1025px) {
  #side-menu {
    max-width: 180px;
  }

  #component-sidebar {
    min-width: 180px;
  }
}

/*
@media screen and (min-width: 1075px) {
  #side-menu {
    max-width: 200px;
  }
  #component-sidebar {
    min-width: 200px;
  }
}
@media screen and (max-width: 1108px) {
  #side-menu {
    max-width: 100%;
  }
  #component-sidebar {
    max-width: 100%;
  }
} */
</style>
