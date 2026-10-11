<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The frame of the tile above it (ShowFriendsTile), so the two read as one family --
       py-3 and not p-3 for the reason given there. -->
  <div v-if="invited" class="mb-3 py-3 map-invitation-tile" data-test="map-invitation-tile">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3" data-test="map-invitation-heading">
        {{ $t('matching.invitation.title') }}
      </div>
      <div class="my-3 small" data-test="map-invitation-text">
        {{ $t('matching.invitation.text') }}
      </div>
      <div class="text-lg-end">
        <!-- The label says what the tap does, because the tap is the member's yes: the home
             tab opens with "findable" switched on (pages/Matching.vue). Nothing is saved
             there until they have picked a home and pressed save. -->
        <BButton variant="gradido" :to="SHOW_ME_ON_THE_MAP" data-test="map-invitation-go">
          {{ $t('matching.invitation.go') }}
        </BButton>
      </div>
    </BContainer>
  </div>
</template>

<script setup>
/**
 * The invitation onto the map, on the overview.
 *
 * The overview is where a member lands after the first creation, and until now nothing
 * there led to the map: the only sign of it was the window behind "find on the map", for
 * somebody who had already gone looking. This is the same invitation where a newcomer
 * stands -- a tile that waits, not a fourth window on the first login (Bernd, 11.10.2026).
 *
 * Shown to a member who is not on the map, by the one rule that says who is: a position
 * AND the permission to be found (`mayFind`). It reads the store, which the login fills, so
 * the tile is there with the first paint or not at all.
 */
import { computed } from 'vue'
import { useStore } from 'vuex'
import { BButton, BContainer } from 'bootstrap-vue-next'
import CONFIG from '@/config'
import { mayFind } from '@/utils/matchingPosition'
import { SHOW_ME_ON_THE_MAP } from '@/utils/showMeOnTheMap'

const store = useStore()

// The matching routes exist only where matching is switched on, and routes.js reads the
// switch the same way; a tile that led to a page this wallet does not have would be an
// invitation to a 404.
const invited = computed(() => Boolean(CONFIG.MATCHING_ACTIVE) && !mayFind(store.state))
</script>

<style lang="scss" scoped>
/* The house button stands 50px in from each side, and "show me on the map" is a long label:
   217px of text in German, the longest of the ten languages, so the button wants 317px. The
   tile has that from 377px of screen upwards. Below it the label broke in two, one word
   alone on the second line - at 360px, a common phone width, in four languages. With 1rem
   at each side it stays on one line down to 360px in all ten, and down to 320px in six
   (measured in the built wallet). English, Spanish, Italian and Portuguese say "make me
   visible on the map", which is longer than the German, and take two lines at 320px; at
   270px every language does. It stays inside the tile either way.

   On the root of this component and :deep, because the button is the library's element. */
@media (width < 400px) {
  .map-invitation-tile :deep(.btn-gradido) {
    padding-right: 1rem !important;
    padding-left: 1rem !important;
  }
}
</style>
