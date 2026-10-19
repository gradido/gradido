<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The frame of the tile below it (ShowFriendsTile), so the two read as one family --
       py-3 and not p-3 for the reason given there. -->
  <div v-if="stage" class="mb-3 py-3 matching-tile" :data-test="TESTS[stage]">
    <!-- The tile's name, with the icon and the word of the menu entry: "the map" alone can be
         a postcard or a playing card in German, and a newcomer could not tell that the map on
         the overview and "Matching" in the menu are one thing (Bernd, 11.10.2026). Built like
         the label of the community's card in the page head (CommunityMember.vue): no
         variant, or the badge's own text colour beats the gradient's white. -->
    <BBadge
      variant=""
      class="matching-tile-label bg-gradido-gradient"
      data-test="matching-tile-label"
    >
      <i-tabler-heart-handshake aria-hidden="true" />
      <span>{{ $t('navigation.matching') }}</span>
    </BBadge>
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3 matching-tile-box">
      <!-- 1. Not on the map: the invitation onto it. -->
      <template v-if="stage === MAP">
        <!-- With the number the heading counts and the question follows it; without, the
             question is the heading (Bernd, 11.10.2026). Which of the two is decided before
             the tile is painted and never after -- see `count` below. -->
        <template v-if="saysCount">
          <div class="h3 mb-1 matching-tile-heading" data-test="map-invitation-heading">
            {{ $t('matching.invitation.titleCount', { n: $n(count) }, count) }}
          </div>
          <div data-test="map-invitation-question">
            {{ $t('matching.invitation.question') }}
          </div>
        </template>
        <div v-else class="h3 matching-tile-heading" data-test="map-invitation-heading">
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
      </template>

      <!-- 2. On the map, and nothing entered yet: what the map cannot know by itself. -->
      <template v-else-if="stage === FIRST">
        <div class="h3 matching-tile-heading" data-test="matching-entries-heading">
          {{ $t('matching.invitation.entriesTitle') }}
        </div>
        <div class="my-3 small" data-test="matching-entries-text">
          {{ $t('matching.invitation.entriesText') }}
        </div>
        <div class="text-lg-end">
          <BButton variant="gradido" :to="NEW_MATCHING_ENTRY" data-test="matching-entries-go">
            {{ $t('matching.invitation.entriesGo') }}
          </BButton>
        </div>
      </template>

      <!-- 3. One or two entries: a quiet line, the shape "show it to your friends" takes once
           it is no longer news. With the third entry it goes. -->
      <router-link
        v-else
        :to="NEW_MATCHING_ENTRY"
        class="text-decoration-none"
        data-test="matching-more-go"
      >
        {{ $t('matching.invitation.entriesMore') }}
        <IMdiChevronRight class="ms-1" />
      </router-link>
    </BContainer>
  </div>
</template>

<script setup>
/**
 * Matching on the overview: one tile that walks a newcomer in, a step at a time.
 *
 * The overview is where a member lands after the first creation, and nothing there led to
 * matching: its only sign was the window behind "find on the map", for somebody who had
 * already gone looking. So the invitation stands where a newcomer stands -- a tile that
 * waits, not a fourth window on the first login (Bernd, 11.10.2026).
 *
 * ## The steps (Bernd, 11.10.2026)
 *
 * 1. **Not on the map** -- the invitation onto it, opening with how many people are there.
 * 2. **On the map, no entry yet** -- "who suits you?": what they look for, what they give,
 *    what they love. The map alone knows where somebody lives, not who suits them.
 * 3. **One or two entries** -- a quiet line offering one more.
 * 4. **Three entries** -- nothing. The invitation names three things, and whoever has three
 *    entries has arrived (`ENTRIES_TO_ARRIVE`); matching stays in the menu.
 *
 * ⛔ Which step it is, is settled BEFORE the tile is painted and does not change while the
 * overview stands. The steps differ in height, and a tile that changed under a finger would
 * move its own button and every tile below it. So what the store knows -- who is signed in,
 * and whether they are on the map -- is read once, when the tile is set up; and what only
 * the server knows -- the number on the map, the member's entries -- the overview hands in
 * as props it decided once (useMapMemberCount, useOwnMatchingEntries). The one thing that
 * is followed is the member leaving: signed out, the tile goes.
 */
import { computed } from 'vue'
import { useWalletStore } from '@/store/useWalletStore'
import { BBadge, BButton, BContainer } from 'bootstrap-vue-next'
import { ENTRIES_TO_ARRIVE, NEW_MATCHING_ENTRY } from '@/utils/newMatchingEntry'
import { invitedOntoTheMap, SHOW_ME_ON_THE_MAP, standsOnTheMap } from '@/utils/showMeOnTheMap'

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
  /**
   * How many matching entries the member has, or null where nobody could say. Decided once
   * by the overview as well (composables/useOwnMatchingEntries).
   */
  entries: { type: Number, default: null },
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

const MAP = 'map'
const FIRST = 'first'
const MORE = 'more'
// The first step keeps the mark it has had since it was the whole tile.
const TESTS = {
  [MAP]: 'map-invitation-tile',
  [FIRST]: 'matching-entries-tile',
  [MORE]: 'matching-more-tile',
}

const store = useWalletStore()

/**
 * Whom the tile is for, read ONCE.
 *
 * ⛔ Not followed afterwards, although the store can change while the overview stands: the
 * home tab commits what it saved when the server's answer is in (pages/Matching.vue), and a
 * member who has gone on to the overview by then would see "who suits you?" turn into the
 * invitation onto the map under their finger -- or the invitation vanish, and the tiles
 * below jump up. What was painted stays for this visit; the next one decides anew.
 */
const member = store.gradidoID
const invited = invitedOntoTheMap(store)
const onTheMap = standsOnTheMap(store)

const stage = computed(() => {
  // The one thing followed live. Signing out empties the store while the overview still
  // stands, and whoever was painted a tile is no longer there to read it.
  if (store.gradidoID !== member) return null
  if (invited) return MAP
  // A wallet without matching.
  if (!onTheMap) return null
  // ⛔ Not known is not "none": the tile that says "your first entry" must not meet a member
  // who has made five, on the one visit their list did not answer in time. And only a number
  // of entries is one -- whole, and not below none.
  if (!Number.isSafeInteger(props.entries) || props.entries < 0) return null
  if (props.entries === 0) return FIRST
  // With three the member has arrived (utils/newMatchingEntry).
  return props.entries < ENTRIES_TO_ARRIVE ? MORE : null
})
const saysCount = computed(
  () => Number.isSafeInteger(props.count) && props.count >= FEWEST_TO_COUNT,
)
</script>

<style lang="scss" scoped>
/* The label stands on the tile's top edge, like "community" on the card above. With the icon
   at the size it has in the menu (Bernd's choice among four, 11.10.2026) it is 34px high, and
   the cards above stand only 16px away: 16px of it above the edge would touch them. So the
   tile stands 12px lower than it did, and its first line 12px further in. */
.matching-tile {
  position: relative;
  margin-top: 0.75rem;
}

.matching-tile-label {
  position: absolute;
  top: -1rem;
  left: 50%;
  z-index: 1;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.3rem 1.1rem 0.3rem 0.9rem;
  border-radius: 1rem;
  transform: translateX(-50%);
}

.matching-tile-label svg {
  width: 1.5rem;
  height: 1.5rem;
}

.matching-tile-box {
  padding-top: 2.25rem !important;
}

/* With the number the heading is long enough to wrap on a phone. Balanced, it breaks into
   lines of like length instead of a full line and one word left over - "12,345 people on the
   Gradido / map" at 320px, measured in the built wallet. A browser that does not know the
   property wraps as before.

   The same for a button whose label takes two lines on a narrow phone (see below): "Meinen
   ersten / Eintrag machen" at 320px, and not "Meinen ersten Eintrag / machen". */
.matching-tile-heading,
.matching-tile :deep(.btn-gradido) {
  text-wrap: balance;
}

/* The house button stands 50px in from each side, and the two buttons of this tile carry long
   labels: "show me on the map" is 217px of text in German and "make my first entry" 259px,
   so they want 317px and 359px. The tile has less than that on a phone, and the label broke
   in two, one word alone on the second line - at 360px, a common phone width. With 1rem at
   each side both stay on one line down to 360px in all ten languages (measured in the built
   wallet; the Dutch and the Greek label for the first entry were shortened to get there). At
   320px four languages take two lines for each of the two, at 270px nearly all do - balanced
   then (above), and inside the tile either way.

   On the root of this component and :deep, because the button is the library's element. */
@media (width < 400px) {
  .matching-tile :deep(.btn-gradido) {
    padding-right: 1rem !important;
    padding-left: 1rem !important;
  }
}
</style>
