<template>
  <div class="overview">
    <!-- Held back only for a member the invitation is for, on a device that has never heard
         how many people stand on the map, and then for one round trip at most
         (useMapMemberCount). The tiles come together, so none of them moves another. -->
    <BCol v-if="settled" data-test="overview-tiles">
      <!-- Above everything, for as long as it applies: the member is not on the map yet, and
           this is where they land after the first creation. It decides for itself whether it
           shows, and what it says is settled before it is painted -- nothing below it moves
           later. -->
      <BRow>
        <map-invitation-tile :count="count" />
      </BRow>
      <!-- Always: showing Gradido to somebody needs no service switched on, and the two tiles
           below hang on HumHub and the old GMS search, which are on their way out. -->
      <BRow>
        <show-friends-tile />
      </BRow>
      <div v-if="isHumhubActive">
        <BRow>
          <card-circles />
        </BRow>
      </div>
      <div v-if="isGmsActive">
        <BRow>
          <card-user-search />
        </BRow>
      </div>
    </BCol>
  </div>
</template>
<script setup>
import { computed } from 'vue'
// import CommunityNews from '@/components/Overview/CommunityNews'
import CardCircles from '@/components/Overview/CardCircles'
import CardUserSearch from '@/components/Overview/CardUserSearch'
import MapInvitationTile from '@/components/Overview/MapInvitationTile'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import { useMapMemberCount } from '@/composables/useMapMemberCount'
import CONFIG from '@/config'

const isGmsActive = computed(() => CONFIG.GMS_LEGACY_ACTIVE === true)
const isHumhubActive = computed(() => CONFIG.HUMHUB_ACTIVE === true)

const { settled, count } = useMapMemberCount()
</script>
