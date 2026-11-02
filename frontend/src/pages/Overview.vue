<template>
  <div class="overview">
    <!-- Held back for the thank-yous received, on every opening (useThanksArrivals), and where
         the matching tile waits for an answer this device has never heard -- how many people
         stand on the map, for a member who is not on it (useMapMemberCount), or how many
         entries a member has who is (useOwnMatchingEntries) -- and then for one round trip at
         most, each. The tiles come together, so none of them moves another. -->
    <BCol v-if="settled" data-test="overview-tiles">
      <!-- Above everything, while a thank-you received in the last seven days has no reaction
           yet: the most personal news the overview can have, and a rare one (W3). Which ones
           it shows is settled before it is painted; without one, nothing stands here. -->
      <BRow v-if="thanks.length">
        <thanks-arrival-tile :thanks="thanks" />
      </BRow>
      <!-- Then, for as long as it applies: the way into matching, a step at a time -- onto the
           map first, and this is where a member lands after the first creation; then the first
           entries. It decides for itself whether it shows, and what it is, is settled before it
           is painted -- nothing below it moves later. -->
      <BRow>
        <matching-tile :count="count" :entries="entries" />
      </BRow>
      <!-- Always: showing Gradido to somebody needs no service switched on, and the tile
           below hangs on HumHub. (The old GMS member search had a tile here too; the matching
           took its place.) -->
      <BRow>
        <show-friends-tile />
      </BRow>
      <div v-if="isHumhubActive">
        <BRow>
          <card-circles />
        </BRow>
      </div>
    </BCol>
  </div>
</template>
<script setup>
import { computed } from 'vue'
// import CommunityNews from '@/components/Overview/CommunityNews'
import CardCircles from '@/components/Overview/CardCircles'
import MatchingTile from '@/components/Overview/MatchingTile'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import ThanksArrivalTile from '@/components/Overview/ThanksArrivalTile'
import { useMapMemberCount } from '@/composables/useMapMemberCount'
import { useOwnMatchingEntries } from '@/composables/useOwnMatchingEntries'
import { useThanksArrivals } from '@/composables/useThanksArrivals'
import CONFIG from '@/config'

const isHumhubActive = computed(() => CONFIG.HUMHUB_ACTIVE === true)

// The thank-yous received are asked about on every opening. Of the two matching questions
// never both: one is for a member who is not on the map, the other for one who is. Whatever is
// asked, the tiles wait for it together -- the questions go out at once, so the waits do not
// add up.
const { settled: thanksSettled, thanks } = useThanksArrivals()
const { settled: countSettled, count } = useMapMemberCount()
const { settled: entriesSettled, entries } = useOwnMatchingEntries()
const settled = computed(() => thanksSettled.value && countSettled.value && entriesSettled.value)
</script>
