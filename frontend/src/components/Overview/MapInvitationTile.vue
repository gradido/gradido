<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The frame of the tile above it (ShowFriendsTile), so the two read as one family --
       py-3 and not p-3 for the reason given there. -->
  <div v-if="invited" class="mb-3 py-3 map-invitation-tile" data-test="map-invitation-tile">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <!-- With the number the heading counts and the question follows it; without, the
           question is the heading (Bernd, 11.10.2026). Which of the two is decided before
           the tile is painted and never after -- see `count` below. -->
      <template v-if="saysCount">
        <div class="h3 mb-1 map-invitation-heading" data-test="map-invitation-heading">
          {{ $t('matching.invitation.titleCount', { n: $n(count) }, count) }}
        </div>
        <div data-test="map-invitation-question">
          {{ $t('matching.invitation.question') }}
        </div>
      </template>
      <div v-else class="h3 map-invitation-heading" data-test="map-invitation-heading">
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
 * Shown to a member who is not on the map (`invitedOntoTheMap`). It reads the store, which
 * the login fills, so the tile is there with the first paint or not at all.
 */
import { computed } from 'vue'
import { useStore } from 'vuex'
import { BButton, BContainer } from 'bootstrap-vue-next'
import { invitedOntoTheMap, SHOW_ME_ON_THE_MAP } from '@/utils/showMeOnTheMap'

const props = defineProps({
  /**
   * How many people stand on the map across every community, or null where nobody could
   * say -- a server without a number, or no answer in time.
   *
   * ⛔ Handed in by the overview, which decides it once, before this tile is painted, and
   * never changes it afterwards (composables/useMapMemberCount). The heading with the number
   * is a line taller than the one without; a number arriving later would push the button
   * below it down under a finger.
   */
  count: { type: Number, default: null },
})

/**
 * From how many people on the heading counts them. Below two there is nobody to ask "who of
 * them" about, and the question stands alone as before.
 *
 * Deliberately not a bigger threshold: the number is the whole network's, over 770 where it
 * is read today, and a test network with a few dozen should show what it has. One line to
 * turn, should a small number ever read as a reason to stay away.
 */
const FEWEST_TO_COUNT = 2

const store = useStore()

const invited = computed(() => invitedOntoTheMap(store.state))
const saysCount = computed(
  () => Number.isSafeInteger(props.count) && props.count >= FEWEST_TO_COUNT,
)
</script>

<style lang="scss" scoped>
/* With the number the heading is long enough to wrap on a phone. Balanced, it breaks into
   lines of like length instead of a full line and one word left over - "12,345 people on the
   Gradido / map" at 320px, measured in the built wallet. A browser that does not know the
   property wraps as before. */
.map-invitation-heading {
  text-wrap: balance;
}

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
