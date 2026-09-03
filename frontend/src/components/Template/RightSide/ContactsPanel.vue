<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="contacts-panel" data-test="contacts-panel">
    <!-- ⛔ The column's name, for a screen reader only. The switch above carries it on
         screen, but a group of pressed buttons is not a heading: the "next heading" jump
         has nothing to land on, so the column had no title to navigate to.

         ⚠️ It is not a heading that was lost here -- the markup this replaced was
         `<BCol class="h3">`, and `h3` is a Bootstrap STYLING class on a div
         (`tag: { default: 'div' }`), so the jump never found it either. This adds what was
         never there, rather than restoring something. (coderabbit, PR #3837.)

         ⚠️ `visually-hidden` is Bootstrap's own and ships in the stylesheet (verified in
         the built CSS); it clips the element instead of hiding it, so the text stays
         readable to assistive technology. `d-none` would take it away from that too. -->
    <h2 class="visually-hidden">{{ $t('rightSide.contacts') }}</h2>

    <BFormInput
      v-model="searchInput"
      type="search"
      size="sm"
      :placeholder="$t('contacts.search')"
      class="mb-3"
      data-test="contacts-panel-search"
    />

    <div v-if="!shownSlot.loaded" class="text-center py-3" data-test="contacts-panel-loading">
      <BSpinner small />
    </div>

    <!-- A failed request is not an empty list: "no contacts yet" would tell a member with a
         hundred of them that they have none. -->
    <div v-else-if="shownSlot.failed" class="small text-muted" data-test="contacts-panel-error">
      {{ $t('contacts.notReachable') }}
    </div>

    <!-- ⛔ Two different nothings, and the column says which. Searching is done on the
         SERVER here (twenty rows would be the wrong set to search), so an unmatched word
         comes back as an empty page and used to be reported as "you have no contacts yet". -->
    <div
      v-else-if="searching && !rows.length"
      class="small text-muted"
      data-test="contacts-panel-no-match"
    >
      {{ $t('contacts.count', 0) }}
    </div>
    <div v-else-if="!rows.length" class="small text-muted" data-test="contacts-panel-empty">
      {{ $t('contacts.empty') }}
    </div>

    <template v-else>
      <!-- Favourites first, then the newest, with the search box above both (L §8.14).
           While a word is being searched there is one flat list of matches instead: the
           question then is "where is this person", not "who is near me". -->
      <div v-if="favorites.length" data-test="contacts-panel-favorites">
        <div class="contacts-panel-label">{{ $t('contacts.favorites') }}</div>
        <contact-tiles :rows="favorites" @open="open" />
      </div>

      <div v-if="listed.length" data-test="contacts-panel-recent">
        <div class="contacts-panel-label">
          {{ searching ? $t('contacts.matches') : $t('contacts.recent') }}
        </div>
        <!-- ⛔ The avatar and the heart stand OUTSIDE the button, exactly as ContactRow has
             them. A zoomable avatar renders its own button and stops the click, and the
             heart renders one too: nested inside the row button they made the row's
             accessible name the sum of three controls, and the face swallowed the tap that
             was meant to open the window -- but only for members who had a portrait. -->
        <div
          v-for="row in listed"
          :key="row.key"
          class="contacts-panel-row"
          :data-test="`contacts-panel-row-${row.contact.user.gradidoID}`"
        >
          <app-avatar :size="36" :color="'#fff'" v-bind="row.avatar" />
          <button
            type="button"
            class="contacts-panel-open"
            :data-test="`contacts-panel-open-${row.contact.user.gradidoID}`"
            @click="open(row.contact)"
          >
            <span class="contacts-panel-who">
              <span class="contacts-panel-who-name">
                <name
                  :linked-user="row.contact.user"
                  :with-community="false"
                  :linked="false"
                  font-color="text-dark"
                />
              </span>
              <span v-if="row.contact.user.communityName" class="contacts-panel-who-community">
                {{ row.contact.user.communityName }}
              </span>
            </span>
            <span class="contacts-panel-date">
              {{ $d(new Date(row.contact.lastAt), 'short') }}
            </span>
          </button>
          <favorite-heart :member="row.contact.user" />
        </div>
      </div>
    </template>

    <!-- ⛔ OUTSIDE every state, because it is the way out of all of them. It used to sit in
         the content branch, so the loading, failed, empty and no-match states offered no
         route to the full list at all -- which is the very defect the phone strip was
         carved out to fix, left standing in the column beside it. -->
    <router-link to="/contacts" class="contacts-panel-alllink" data-test="contacts-panel-count">
      {{ allContactsLabel }}
    </router-link>

    <contact-window v-model="windowOpen" :contact="selected" />
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useApolloClient } from '@vue/apollo-composable'
import { BFormInput, BSpinner } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ContactTiles from '@/components/Contacts/ContactTiles.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import Name from '@/components/TransactionRows/Name'
import { contactDisplay } from '@/components/Contacts/contactDisplay'
import { contactsPanelState, searchContactsPanel } from '@/composables/useContactsPanel'
import { useContactsPanelHost } from '@/composables/useContactsPanelHost'
import { useContactWindow } from '@/composables/useContactWindow'
import { isFavorite } from '@/composables/useFavorites'
import { CONTACTS_PANEL_ROWS } from '@/constants'

/**
 * The contacts beside the page, on the three routes that carry a switchable column
 * (BAU-10a, KF-009).
 *
 * The phone's posture is a component of its own (`ContactsStrip`), because they were one
 * component with a `variant` prop and the strip was defined by subtraction -- so a state
 * this column handles had no counterpart there. What the two still share they share through
 * `useContactsPanelHost` and `useContactWindow` rather than by copy.
 */
const { t } = useI18n()
const { client: apolloClient } = useApolloClient()

const searching = computed(() => contactsPanelState.search !== '')
/** Which of the module's two slots this column is showing: the page, or the matches. */
const shownSlot = computed(() =>
  searching.value ? contactsPanelState.matches : contactsPanelState.page,
)
const rows = computed(() => shownSlot.value.rows)

const searchInput = ref(contactsPanelState.search)

/**
 * Debounced, so a query does not go out on every keystroke -- the pattern the contribution
 * lists use, at their interval.
 *
 * ⛔ Cleared on unmount. A flick of the switch above throws this column away, and a timer
 * that outlived it would search for a word nobody can see any more.
 */
let searchTimer = null
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchContactsPanel(apolloClient, value)
  }, 400)
})
onUnmounted(() => {
  clearTimeout(searchTimer)
})

/** The contacts with a heart -- none while a word is being searched. */
const hearted = computed(() =>
  searching.value ? [] : rows.value.filter((contact) => isFavorite(contact.user)),
)

/** What stands under the heading: the newest non-favourites, or the matches. */
const shownRows = computed(() =>
  (searching.value ? rows.value : rows.value.filter((contact) => !isFavorite(contact.user))).slice(
    0,
    CONTACTS_PANEL_ROWS,
  ),
)

/**
 * ⛔ The tiles get a face WITHOUT the zoom bindings, the list rows get one with them, and
 * the difference is structural rather than a preference. A zoomable avatar renders its own
 * button and stops the click, so inside the tile -- which is itself a button -- it
 * swallowed the tap meant for the contact window, and only for members who had a portrait.
 * In the list the avatar stands outside the button, so it can open the picture without
 * taking anything away.
 */
const favorites = computed(() => hearted.value.map((contact) => contactDisplay(contact)))
const listed = computed(() =>
  shownRows.value.map((contact) => contactDisplay(contact, { zoomable: true })),
)

/**
 * The members this column is drawing, in drawing order: the tiles stand above the list.
 *
 * ⛔ Built from the rows and the hearts, and from NOTHING that reads the avatar store --
 * see the note in `useContactsPanelHost`. `contactDisplay` reads that store, so the
 * decorated lists above must not be the watch source.
 */
const membersOnScreen = computed(() =>
  [...hearted.value, ...shownRows.value].map(({ user }) => user),
)

useContactsPanelHost(apolloClient, membersOnScreen)

/**
 * `contacts.all` plus the number and an arrow, as ONE string: the brackets and the arrow
 * are punctuation, and loose in the template they are raw text the i18n lint reports.
 *
 * ⛔ A number only where there is one to state. The server's `count` is the number of
 * MATCHES while a word is being searched -- a member with 137 contacts who typed "an" was
 * shown a count of 2 over a link that leads to all 137 -- and it is 0 before the first
 * answer arrives, which would say something false about a list nobody has read yet.
 */
const allContactsLabel = computed(() => {
  const page = contactsPanelState.page
  const known = !searching.value && page.loaded && !page.failed
  return known ? `${t('contacts.all')} (${page.count}) →` : `${t('contacts.all')} →`
})

const { windowOpen, selected, open } = useContactWindow()
</script>

<style lang="scss" scoped>
.contacts-panel-label {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color, #6c757d);
  font-weight: 600;
  margin: 0.75rem 0 0.35rem;
}

.contacts-panel-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  padding: 0.4rem 0;
}

.contacts-panel-row:last-of-type {
  border-bottom: 0;
}

/* A button that looks like the block of text it wraps: no chrome, left aligned, and its
   colour named -- a bare button does NOT inherit `color` from Bootstrap's reboot, so
   without this the name would be painted in the browser's default button colour. */
.contacts-panel-open {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  color: var(--bs-body-color);
}

.contacts-panel-who {
  flex: 1;
  min-width: 0;
  display: block;
}

.contacts-panel-who-name {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
}

.contacts-panel-who-community {
  display: block;
  font-size: 0.72rem;
  color: var(--bs-secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contacts-panel-date {
  font-size: 0.72rem;
  color: var(--bs-secondary-color, #6c757d);
  white-space: nowrap;
}

.contacts-panel-alllink {
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.85rem;
}
</style>
