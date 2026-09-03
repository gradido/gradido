<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="contacts-strip" data-test="contacts-strip">
    <div class="contacts-strip-label">{{ $t('contacts.favorites') }}</div>

    <div v-if="!page.loaded" class="text-center py-2" data-test="contacts-strip-loading">
      <BSpinner small />
    </div>

    <!-- A failed request is not an empty list. -->
    <div v-else-if="page.failed" class="small text-muted" data-test="contacts-strip-error">
      {{ $t('contacts.notReachable') }}
    </div>

    <!-- ⛔ Every state answered here, not by falling through. The strip used to be the
         column minus its column-only parts, and a member with contacts but no favourites
         therefore got a completely empty box over the send form -- with no route to the
         full list either, because the tile lived inside the favourites branch. Each
         posture declares its own four states now: loading, failed, empty, content. -->
    <template v-else>
      <div v-if="!favorites.length" class="small text-muted mb-2" data-test="contacts-strip-empty">
        {{ page.count === 0 ? $t('contacts.empty') : $t('contacts.noFavorites') }}
      </div>
      <!-- The tiles stand even with nobody in them: the trailing tile is the only way from
           here to the full list. -->
      <contact-tiles :rows="favorites" with-all-link @open="open" />
    </template>

    <contact-window v-model="windowOpen" :contact="selected" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { BSpinner } from 'bootstrap-vue-next'
import ContactTiles from '@/components/Contacts/ContactTiles.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import { contactDisplay } from '@/components/Contacts/contactDisplay'
import { contactsPanelState } from '@/composables/useContactsPanel'
import { useContactsPanelHost } from '@/composables/useContactsPanelHost'
import { useContactWindow } from '@/composables/useContactWindow'
import { isFavorite } from '@/composables/useFavorites'

/**
 * The favourites over the send form on a phone (BAU-11).
 *
 * A shortcut into the field right beneath it: tap a face, the contact window opens, and
 * "Gradido senden" fills the form in. The full list has its own page behind the menu, and
 * the tile at the end of the row leads there.
 *
 * ⛔ Reads the unfiltered page, never the search result. The column's search box does not
 * exist here, so a strip fed by the search would show a filtered handful after a rotation,
 * with nothing on screen to say why or to clear it.
 */
const { client: apolloClient } = useApolloClient()
const page = computed(() => contactsPanelState.page)

/**
 * ⛔ Read through the composable, not the `favorite` flag the server sent with the row: a
 * heart given in the contact window has to move the person into this row at once, without
 * a refetch.
 */
const hearted = computed(() => page.value.rows.filter((contact) => isFavorite(contact.user)))
// ⛔ No zoom bindings: the tile is itself a button, and a zoomable avatar renders one too.
const favorites = computed(() => hearted.value.map((contact) => contactDisplay(contact)))

const membersOnScreen = computed(() => hearted.value.map(({ user }) => user))

useContactsPanelHost(apolloClient, membersOnScreen)

const { windowOpen, selected, open } = useContactWindow()
</script>

<style lang="scss" scoped>
.contacts-strip-label {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color, #6c757d);
  font-weight: 600;
  margin-bottom: 0.35rem;
}
</style>
